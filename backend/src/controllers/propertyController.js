import { Property } from '../models/Property.js';
import { RoomType } from '../models/RoomType.js';
import { Room } from '../models/Room.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';

export const getProperties = async (req, res, next) => {
  try {
    const { city, property_type, status } = req.query;
    const filter = {};

    // For public/guest, only show ACTIVE
    if (!req.user || req.user.role === 'GUEST') {
      filter.status = 'ACTIVE';
    } else if (status) {
      filter.status = status;
    }

    if (city) {
      filter.city = new RegExp(city, 'i');
    }
    if (property_type) {
      filter.property_type = property_type;
    }

    const properties = await Property.find(filter).sort({ name: 1 });
    res.status(200).json({ success: true, data: properties });
  } catch (error) {
    next(error);
  }
};

export const getPropertyById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const property = await Property.findOne({
      $or: [{ property_id: id }, { property_code: id }]
    });

    if (!property) {
      throw new NotFoundError(`Property '${id}' not found`, 'PROPERTY_NOT_FOUND');
    }

    const roomTypes = await RoomType.find({ property_id: property.property_id, status: 'ACTIVE' });
    const rooms = await Room.find({ property_id: property.property_id, status: 'AVAILABLE' });

    res.status(200).json({
      success: true,
      data: {
        ...property.toObject(),
        room_types: roomTypes,
        available_rooms_count: rooms.length
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createProperty = async (req, res, next) => {
  try {
    const { property_code, name, property_type, address, city, state, country, manager_user_id } = req.body;
    if (!property_code || !name || !property_type || !address || !city) {
      throw new BadRequestError('Required property details missing', 'MISSING_FIELDS');
    }

    const existing = await Property.findOne({ property_code });
    if (existing) {
      throw new BadRequestError(`Property code '${property_code}' already exists`, 'CODE_EXISTS');
    }

    const count = await Property.countDocuments();
    const property_id = `PROP-${String(count + 1).padStart(3, '0')}`;

    const property = await Property.create({
      property_id,
      property_code,
      name,
      property_type,
      address,
      city,
      state: state || '',
      country: country || 'India',
      manager_user_id: manager_user_id || req.user.user_id,
      status: 'ACTIVE'
    });

    res.status(201).json({ success: true, data: property, message: 'Property created successfully' });
  } catch (error) {
    next(error);
  }
};

export const updateProperty = async (req, res, next) => {
  try {
    const { id } = req.params;
    const property = await Property.findOne({ property_id: id });
    if (!property) {
      throw new NotFoundError(`Property '${id}' not found`, 'PROPERTY_NOT_FOUND');
    }

    // Role check: Admin or assigned manager
    if (req.user.role === 'PROPERTY_MANAGER' && property.manager_user_id !== req.user.user_id) {
      throw new BadRequestError('You are not authorized to update this property', 'UNAUTHORIZED_PROPERTY_UPDATE');
    }

    const allowedUpdates = ['name', 'address', 'city', 'state', 'country', 'status', 'manager_user_id'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        property[field] = req.body[field];
      }
    });

    await property.save();
    res.status(200).json({ success: true, data: property, message: 'Property updated successfully' });
  } catch (error) {
    next(error);
  }
};
