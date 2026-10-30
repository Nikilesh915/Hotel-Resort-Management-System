import { Reservation } from '../models/Reservation.js';
import { Property } from '../models/Property.js';
import { Room } from '../models/Room.js';
import { Guest } from '../models/Guest.js';
import { Payment } from '../models/Payment.js';
import { Refund } from '../models/Refund.js';
import { createReservation, updateReservationStatus } from '../services/reservationService.js';
import { cancelReservation } from '../services/refundService.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors.js';

export const handleCreateReservation = async (req, res, next) => {
  try {
    const {
      property_id,
      room_id,
      check_in_date,
      check_out_date,
      guests_count,
      coupon_code,
      cancellation_policy
    } = req.body;

    // Determine target guest_id
    let guest_id = req.user.guest_id;
    if (['ADMIN', 'PROPERTY_MANAGER'].includes(req.user.role) && req.body.guest_id) {
      guest_id = req.body.guest_id;
    }

    if (!guest_id) {
      // Find or create guest for this user
      const guest = await Guest.findOne({ user_id: req.user.user_id });
      if (!guest) {
        throw new BadRequestError('Guest profile not found for authenticated user', 'GUEST_PROFILE_MISSING');
      }
      guest_id = guest.guest_id;
    }

    const reservation = await createReservation({
      guest_id,
      user_id: req.user.user_id,
      property_id,
      room_id,
      check_in_date,
      check_out_date,
      guests_count: Number(guests_count),
      coupon_code,
      cancellation_policy: cancellation_policy || 'FLEXIBLE'
    });

    res.status(201).json({
      success: true,
      data: reservation,
      message: 'Reservation created successfully (status: PENDING)'
    });
  } catch (error) {
    next(error);
  }
};

export const getMyReservations = async (req, res, next) => {
  try {
    if (!req.user.guest_id) {
      const guest = await Guest.findOne({ user_id: req.user.user_id });
      if (!guest) return res.status(200).json({ success: true, data: [] });
      req.user.guest_id = guest.guest_id;
    }

    const { status } = req.query;
    const filter = { guest_id: req.user.guest_id };
    if (status) filter.status = status;

    const reservations = await Reservation.find(filter).sort({ created_at: -1 });
    res.status(200).json({ success: true, data: reservations });
  } catch (error) {
    next(error);
  }
};

export const getReservationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reservation = await Reservation.findOne({
      $or: [{ reservation_id: id }, { reservation_number: id }]
    });

    if (!reservation) {
      throw new NotFoundError(`Reservation '${id}' not found`, 'RESERVATION_NOT_FOUND');
    }

    // IDOR Protection: Guests can only access their own reservation
    if (req.user.role === 'GUEST') {
      if (!req.user.guest_id || reservation.guest_id !== req.user.guest_id) {
        // Return 404 to avoid ID enumeration
        throw new NotFoundError(`Reservation '${id}' not found`, 'RESERVATION_NOT_FOUND');
      }
    } else if (req.user.role === 'PROPERTY_MANAGER') {
      const property = await Property.findOne({ property_id: reservation.property_id });
      if (property && property.manager_user_id !== req.user.user_id) {
        throw new ForbiddenError('You do not manage the property for this reservation', 'FORBIDDEN');
      }
    }

    const [payment, refund, room, property, guest] = await Promise.all([
      Payment.findOne({ reservation_id: reservation.reservation_id }),
      Refund.findOne({ reservation_id: reservation.reservation_id }),
      Room.findOne({ room_id: reservation.room_id }),
      Property.findOne({ property_id: reservation.property_id }),
      Guest.findOne({ guest_id: reservation.guest_id })
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...reservation.toObject(),
        payment,
        refund,
        room,
        property,
        guest
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAllReservations = async (req, res, next) => {
  try {
    const { status, property_id, start_date, end_date } = req.query;
    const filter = {};

    if (req.user.role === 'PROPERTY_MANAGER') {
      const managedProperties = await Property.find({ manager_user_id: req.user.user_id });
      const propIds = managedProperties.map(p => p.property_id);
      filter.property_id = { $in: propIds };
    } else if (property_id) {
      filter.property_id = property_id;
    }

    if (status) filter.status = status;
    if (start_date && end_date) {
      filter.check_in_date = { $gte: new Date(start_date), $lte: new Date(end_date) };
    }

    const reservations = await Reservation.find(filter).sort({ created_at: -1 });
    res.status(200).json({ success: true, data: reservations });
  } catch (error) {
    next(error);
  }
};

export const handleUpdateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const reservation = await updateReservationStatus({
      reservation_id: id,
      new_status: status,
      user_id: req.user.user_id
    });

    res.status(200).json({
      success: true,
      data: reservation,
      message: `Reservation status updated to ${status}`
    });
  } catch (error) {
    next(error);
  }
};

export const handleCancelReservation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason, idempotency_key } = req.body;

    const guest_id = req.user.role === 'GUEST' ? req.user.guest_id : null;

    const result = await cancelReservation({
      reservation_id: id,
      guest_id,
      user_id: req.user.user_id,
      reason,
      idempotency_key
    });

    res.status(200).json({
      success: true,
      data: result,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};
