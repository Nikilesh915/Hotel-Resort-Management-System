import { Room } from '../models/Room.js';
import { RoomType } from '../models/RoomType.js';
import { Property } from '../models/Property.js';
import { Reservation } from '../models/Reservation.js';
import { calculateReservationPrice } from '../services/pricingService.js';
import { BadRequestError } from '../utils/errors.js';

export const searchAvailableRooms = async (req, res, next) => {
  try {
    const { city, property_id, check_in_date, check_out_date, guests_count = 1 } = req.query;

    if (!check_in_date || !check_out_date) {
      throw new BadRequestError('check_in_date and check_out_date are required query parameters', 'MISSING_DATES');
    }

    const checkIn = new Date(check_in_date);
    const checkOut = new Date(check_out_date);

    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      throw new BadRequestError('Invalid date format for check-in or check-out', 'INVALID_DATES');
    }

    if (checkOut <= checkIn) {
      throw new BadRequestError('Check-out date must be strictly after check-in date', 'INVALID_DATE_RANGE');
    }

    // 1. Find properties matching criteria
    const propertyFilter = { status: 'ACTIVE' };
    if (property_id) propertyFilter.property_id = property_id;
    if (city) propertyFilter.city = new RegExp(city, 'i');

    const matchingProperties = await Property.find(propertyFilter);
    const propertyIds = matchingProperties.map(p => p.property_id);

    // 2. Find eligible active rooms in these properties
    const rooms = await Room.find({
      property_id: { $in: propertyIds },
      status: 'AVAILABLE',
      max_guests: { $gte: Number(guests_count) }
    });

    const roomIds = rooms.map(r => r.room_id);

    // 3. Find rooms with overlapping active reservations
    // Formula: existing.check_in < req.check_out AND existing.check_out > req.check_in
    const conflictingReservations = await Reservation.find({
      room_id: { $in: roomIds },
      status: { $in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
      $and: [
        { check_in_date: { $lt: checkOut } },
        { check_out_date: { $gt: checkIn } }
      ]
    });

    const bookedRoomIds = new Set(conflictingReservations.map(c => c.room_id));

    // 4. Filter available rooms
    const availableRooms = rooms.filter(r => !bookedRoomIds.has(r.room_id));

    // 5. Attach RoomType details & calculate price estimate
    const roomTypeIds = [...new Set(availableRooms.map(r => r.room_type_id))];
    const roomTypes = await RoomType.find({ room_type_id: { $in: roomTypeIds } });
    const roomTypeMap = new Map(roomTypes.map(rt => [rt.room_type_id, rt]));
    const propertyMap = new Map(matchingProperties.map(p => [p.property_id, p]));

    const results = await Promise.all(
      availableRooms.map(async room => {
        const rt = roomTypeMap.get(room.room_type_id);
        const prop = propertyMap.get(room.property_id);
        let quote = null;
        try {
          quote = await calculateReservationPrice({
            room_id: room.room_id,
            check_in_date,
            check_out_date,
            guests_count: Number(guests_count)
          });
        } catch (e) {
          quote = { base_amount: rt ? rt.base_price_per_night : 0, total_amount: 0 };
        }

        return {
          room_id: room.room_id,
          room_number: room.room_number,
          floor: room.floor,
          max_guests: room.max_guests,
          property: {
            property_id: prop?.property_id,
            name: prop?.name,
            city: prop?.city,
            state: prop?.state,
            property_type: prop?.property_type
          },
          room_type: {
            room_type_id: rt?.room_type_id,
            name: rt?.name,
            description: rt?.description,
            base_price_per_night: rt?.base_price_per_night
          },
          pricing_estimate: quote
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        total_available: results.length,
        check_in_date,
        check_out_date,
        guests_count: Number(guests_count),
        rooms: results
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getPricingQuote = async (req, res, next) => {
  try {
    const { room_id, check_in_date, check_out_date, guests_count = 1, coupon_code } = req.body;
    if (!room_id || !check_in_date || !check_out_date) {
      throw new BadRequestError('room_id, check_in_date, and check_out_date are required', 'MISSING_FIELDS');
    }

    const guest_id = req.user?.guest_id || null;

    const quote = await calculateReservationPrice({
      room_id,
      check_in_date,
      check_out_date,
      guests_count: Number(guests_count),
      coupon_code,
      guest_id
    });

    res.status(200).json({ success: true, data: quote });
  } catch (error) {
    next(error);
  }
};

