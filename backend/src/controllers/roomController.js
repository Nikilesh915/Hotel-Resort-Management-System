import { Room } from '../models/Room.js';
import { RoomType } from '../models/RoomType.js';
import { Property } from '../models/Property.js';
import { RoomDailyAllocation } from '../models/RoomDailyAllocation.js';
import { AuditLog } from '../models/AuditLog.js';
import { NotFoundError, BadRequestError, ConflictError, ForbiddenError } from '../utils/errors.js';

export const getRoomsByProperty = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const property = await Property.findOne({ property_id: propertyId });
    if (!property) {
      throw new NotFoundError(`Property '${propertyId}' not found`, 'PROPERTY_NOT_FOUND');
    }

    if (req.user && req.user.role === 'PROPERTY_MANAGER' && property.manager_user_id !== req.user.user_id) {
      throw new ForbiddenError('You do not manage this property', 'FORBIDDEN');
    }

    const filter = { property_id: propertyId };

    // Guests only see AVAILABLE rooms
    if (!req.user || req.user.role === 'GUEST') {
      filter.status = 'AVAILABLE';
    }

    const rooms = await Room.find(filter).sort({ room_number: 1 });
    res.status(200).json({ success: true, data: rooms });
  } catch (error) {
    next(error);
  }
};

export const createRoom = async (req, res, next) => {
  try {
    const { property_id, room_type_id, room_number, floor, max_guests } = req.body;
    if (!property_id || !room_type_id || !room_number || floor === undefined) {
      throw new BadRequestError('Required room parameters missing', 'MISSING_FIELDS');
    }

    const property = await Property.findOne({ property_id });
    if (!property) {
      throw new NotFoundError(`Property '${property_id}' not found`, 'PROPERTY_NOT_FOUND');
    }

    if (req.user && req.user.role === 'PROPERTY_MANAGER' && property.manager_user_id !== req.user.user_id) {
      throw new ForbiddenError('You do not manage this property', 'FORBIDDEN');
    }

    const roomType = await RoomType.findOne({ room_type_id, property_id });
    if (!roomType) {
      throw new NotFoundError(`Room type '${room_type_id}' does not belong to property '${property_id}'`, 'INVALID_ROOM_TYPE');
    }

    const existing = await Room.findOne({ property_id, room_number: String(room_number).trim() });
    if (existing) {
      throw new BadRequestError(`Room number '${room_number}' already exists in this property`, 'DUPLICATE_ROOM_NUMBER');
    }

    const room_id = `ROOM-${room_number}`;

    const room = await Room.create({
      room_id,
      property_id,
      room_type_id,
      room_number: String(room_number).trim(),
      floor: Number(floor),
      max_guests: max_guests || roomType.max_guests,
      status: 'AVAILABLE'
    });

    res.status(201).json({ success: true, data: room, message: 'Room created successfully' });
  } catch (error) {
    next(error);
  }
};

export const updateRoomStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['AVAILABLE', 'MAINTENANCE', 'INACTIVE'].includes(status)) {
      throw new BadRequestError(`Invalid status '${status}'`, 'INVALID_ROOM_STATUS');
    }

    const room = await Room.findOne({ room_id: id });
    if (!room) {
      throw new NotFoundError(`Room '${id}' not found`, 'ROOM_NOT_FOUND');
    }

    const property = await Property.findOne({ property_id: room.property_id });
    if (req.user && req.user.role === 'PROPERTY_MANAGER' && property?.manager_user_id !== req.user.user_id) {
      throw new ForbiddenError('You do not manage the property for this room', 'FORBIDDEN');
    }

    const oldStatus = room.status;
    room.status = status;
    await room.save();

    // Audit Log
    const auditCount = await AuditLog.countDocuments();
    await AuditLog.create({
      audit_id: `AUD-${String(auditCount + 1).padStart(3, '0')}`,
      user_id: req.user.user_id,
      action: 'ROOM_STATUS_CHANGED',
      entity_type: 'ROOM',
      entity_id: room.room_id,
      metadata: { from: oldStatus, to: status }
    });

    res.status(200).json({ success: true, data: room, message: `Room status updated to ${status}` });
  } catch (error) {
    next(error);
  }
};

export const getRoomTypes = async (req, res, next) => {
  try {
    const { property_id } = req.query;
    const filter = {};

    if (req.user && req.user.role === 'PROPERTY_MANAGER') {
      const managedProps = await Property.find({ manager_user_id: req.user.user_id });
      const propIds = managedProps.map(p => p.property_id);
      if (property_id) {
        if (!propIds.includes(property_id)) {
          throw new ForbiddenError('You do not manage this property', 'FORBIDDEN');
        }
        filter.property_id = property_id;
      } else {
        filter.property_id = { $in: propIds };
      }
    } else if (property_id) {
      filter.property_id = property_id;
    }

    const roomTypes = await RoomType.find(filter);
    res.status(200).json({ success: true, data: roomTypes });
  } catch (error) {
    next(error);
  }
};

export const createRoomType = async (req, res, next) => {
  try {
    const { property_id, name, description, max_guests, base_price_per_night } = req.body;
    if (!property_id || !name || !max_guests || !base_price_per_night) {
      throw new BadRequestError('Required room type fields missing', 'MISSING_FIELDS');
    }

    const property = await Property.findOne({ property_id });
    if (!property) {
      throw new NotFoundError(`Property '${property_id}' not found`, 'PROPERTY_NOT_FOUND');
    }

    if (req.user && req.user.role === 'PROPERTY_MANAGER' && property.manager_user_id !== req.user.user_id) {
      throw new ForbiddenError('You do not manage this property', 'FORBIDDEN');
    }

    const count = await RoomType.countDocuments();
    const room_type_id = `RTYP-${String(count + 1).padStart(3, '0')}`;

    const roomType = await RoomType.create({
      room_type_id,
      property_id,
      name,
      description: description || '',
      max_guests: Number(max_guests),
      base_price_per_night: Number(base_price_per_night),
      status: 'ACTIVE'
    });

    res.status(201).json({ success: true, data: roomType, message: 'Room type created successfully' });
  } catch (error) {
    next(error);
  }
};

export const updateRoomType = async (req, res, next) => {
  try {
    const { id } = req.params;
    const roomType = await RoomType.findOne({ room_type_id: id });
    if (!roomType) {
      throw new NotFoundError(`Room type '${id}' not found`, 'ROOM_TYPE_NOT_FOUND');
    }

    const property = await Property.findOne({ property_id: roomType.property_id });
    if (req.user && req.user.role === 'PROPERTY_MANAGER' && property?.manager_user_id !== req.user.user_id) {
      throw new ForbiddenError('You do not manage the property for this room type', 'FORBIDDEN');
    }

    const { name, description, max_guests, base_price_per_night, status } = req.body;
    if (name) roomType.name = name;
    if (description !== undefined) roomType.description = description;
    if (max_guests) roomType.max_guests = Number(max_guests);
    if (base_price_per_night !== undefined) roomType.base_price_per_night = Number(base_price_per_night);
    if (status) roomType.status = status;

    await roomType.save();
    res.status(200).json({ success: true, data: roomType, message: 'Room type updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const updateRoom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const room = await Room.findOne({ room_id: id });
    if (!room) {
      throw new NotFoundError(`Room '${id}' not found`, 'ROOM_NOT_FOUND');
    }

    const property = await Property.findOne({ property_id: room.property_id });
    if (req.user && req.user.role === 'PROPERTY_MANAGER' && property?.manager_user_id !== req.user.user_id) {
      throw new ForbiddenError('You do not manage the property for this room', 'FORBIDDEN');
    }

    const { room_number, floor, room_type_id, max_guests, status } = req.body;
    if (room_number) room.room_number = String(room_number).trim();
    if (floor !== undefined) room.floor = Number(floor);
    if (room_type_id) {
      const roomType = await RoomType.findOne({ room_type_id });
      if (!roomType) throw new NotFoundError('Invalid room type');
      room.room_type_id = room_type_id;
    }
    if (max_guests !== undefined) room.max_guests = Number(max_guests);
    if (status) room.status = status;

    await room.save();
    res.status(200).json({ success: true, data: room, message: 'Room updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const getRoomAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const room = await Room.findOne({ room_id: id });
    if (!room) {
      throw new NotFoundError(`Room '${id}' not found`, 'ROOM_NOT_FOUND');
    }

    const property = await Property.findOne({ property_id: room.property_id });
    if (req.user && req.user.role === 'PROPERTY_MANAGER' && property?.manager_user_id !== req.user.user_id) {
      throw new ForbiddenError('You do not manage the property for this room', 'FORBIDDEN');
    }

    const { start_date, end_date } = req.query;
    const filter = { room_id: id };
    if (start_date && end_date) {
      filter.date = { $gte: start_date, $lte: end_date };
    }

    const allocations = await RoomDailyAllocation.find(filter).sort({ date: 1 });
    res.status(200).json({ success: true, data: allocations });
  } catch (error) {
    next(error);
  }
};

export const blockRoomDates = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { dates, reason = 'Maintenance block' } = req.body;

    if (!Array.isArray(dates) || dates.length === 0) {
      throw new BadRequestError('Dates array is required', 'MISSING_DATES');
    }

    const room = await Room.findOne({ room_id: id });
    if (!room) {
      throw new NotFoundError(`Room '${id}' not found`, 'ROOM_NOT_FOUND');
    }

    const property = await Property.findOne({ property_id: room.property_id });
    if (req.user && req.user.role === 'PROPERTY_MANAGER' && property?.manager_user_id !== req.user.user_id) {
      throw new ForbiddenError('You do not manage the property for this room', 'FORBIDDEN');
    }

    // Check for existing active bookings
    const activeAllocations = await RoomDailyAllocation.find({
      room_id: id,
      date: { $in: dates },
      status: 'ALLOCATED'
    });

    if (activeAllocations.length > 0) {
      const conflictingDates = activeAllocations.map(a => a.date).join(', ');
      throw new ConflictError(
        `Cannot block room. Active guest reservation exists on: ${conflictingDates}`,
        'DATES_ALREADY_RESERVED'
      );
    }

    // Insert or update BLOCKED slots
    const operations = dates.map(date => ({
      updateOne: {
        filter: { room_id: id, date },
        update: {
          $set: {
            room_id: id,
            date,
            reservation_id: `BLOCK-${req.user.user_id}`,
            status: 'BLOCKED'
          }
        },
        upsert: true
      }
    }));

    await RoomDailyAllocation.bulkWrite(operations);

    // Audit log
    const auditCount = await AuditLog.countDocuments();
    await AuditLog.create({
      audit_id: `AUD-${String(auditCount + 1).padStart(3, '0')}`,
      user_id: req.user.user_id,
      action: 'ROOM_DATES_BLOCKED',
      entity_type: 'ROOM',
      entity_id: id,
      metadata: { dates, reason }
    });

    res.status(200).json({
      success: true,
      message: `Successfully blocked ${dates.length} dates for room ${id}`
    });
  } catch (error) {
    next(error);
  }
};

export const unblockRoomDates = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { dates } = req.body;

    if (!Array.isArray(dates) || dates.length === 0) {
      throw new BadRequestError('Dates array is required', 'MISSING_DATES');
    }

    const room = await Room.findOne({ room_id: id });
    if (!room) {
      throw new NotFoundError(`Room '${id}' not found`, 'ROOM_NOT_FOUND');
    }

    const property = await Property.findOne({ property_id: room.property_id });
    if (req.user && req.user.role === 'PROPERTY_MANAGER' && property?.manager_user_id !== req.user.user_id) {
      throw new ForbiddenError('You do not manage the property for this room', 'FORBIDDEN');
    }

    const result = await RoomDailyAllocation.deleteMany({
      room_id: id,
      date: { $in: dates },
      status: 'BLOCKED'
    });

    res.status(200).json({
      success: true,
      deletedCount: result.deletedCount,
      message: `Unblocked ${result.deletedCount} dates for room ${id}`
    });
  } catch (error) {
    next(error);
  }
};
