import { Room } from '../models/Room.js';
import { RoomType } from '../models/RoomType.js';
import { Property } from '../models/Property.js';
import { AuditLog } from '../models/AuditLog.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';

export const getRoomsByProperty = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
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

    const roomType = await RoomType.findOne({ room_type_id, property_id });
    if (!roomType) {
      throw new NotFoundError(`Room type '${room_type_id}' does not belong to property '${property_id}'`, 'INVALID_ROOM_TYPE');
    }

    const existing = await Room.findOne({ property_id, room_number: String(room_number).trim() });
    if (existing) {
      throw new BadRequestError(`Room number '${room_number}' already exists in this property`, 'DUPLICATE_ROOM_NUMBER');
    }

    const count = await Room.countDocuments();
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
    const filter = property_id ? { property_id } : {};
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
