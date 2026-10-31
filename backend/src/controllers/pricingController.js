import { RoomPricing } from '../models/RoomPricing.js';
import { RoomType } from '../models/RoomType.js';
import { Property } from '../models/Property.js';
import { PRICING_TYPES, USER_STATUS } from '../config/constants.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/errors.js';

export const getAllPricingRules = async (req, res, next) => {
  try {
    const { room_type_id, pricing_type, status } = req.query;
    const filter = {};

    if (req.user && req.user.role === 'PROPERTY_MANAGER') {
      const managedProps = await Property.find({ manager_user_id: req.user.user_id });
      const propIds = managedProps.map(p => p.property_id);
      const managedTypes = await RoomType.find({ property_id: { $in: propIds } });
      const managedTypeIds = managedTypes.map(rt => rt.room_type_id);

      if (room_type_id) {
        if (!managedTypeIds.includes(room_type_id)) {
          return res.status(200).json({ success: true, data: [] });
        }
        filter.room_type_id = room_type_id;
      } else {
        filter.room_type_id = { $in: managedTypeIds };
      }
    } else if (room_type_id) {
      filter.room_type_id = room_type_id;
    }

    if (pricing_type) filter.pricing_type = pricing_type;
    if (status) filter.status = status;

    const rules = await RoomPricing.find(filter).sort({ start_date: 1 });
    res.status(200).json({ success: true, data: rules });
  } catch (error) {
    next(error);
  }
};

export const createPricingRule = async (req, res, next) => {
  try {
    const { room_type_id, start_date, end_date, price_per_night, pricing_type, status } = req.body;

    if (!room_type_id || !start_date || !end_date || price_per_night === undefined) {
      throw new BadRequestError('Required pricing rule fields are missing', 'MISSING_FIELDS');
    }

    const roomType = await RoomType.findOne({ room_type_id });
    if (!roomType) {
      throw new NotFoundError(`Room type '${room_type_id}' not found`, 'ROOM_TYPE_NOT_FOUND');
    }

    if (req.user && req.user.role === 'PROPERTY_MANAGER') {
      const property = await Property.findOne({ property_id: roomType.property_id });
      if (property?.manager_user_id !== req.user.user_id) {
        throw new ForbiddenError('You do not manage the property for this room type', 'FORBIDDEN');
      }
    }

    const start = new Date(start_date);
    const end = new Date(end_date);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestError('Invalid start or end date', 'INVALID_DATES');
    }

    if (start > end) {
      throw new BadRequestError('Start date must be before or equal to end date', 'INVALID_DATE_RANGE');
    }

    if (Number(price_per_night) < 0) {
      throw new BadRequestError('Price per night must be non-negative', 'INVALID_PRICE');
    }

    const count = await RoomPricing.countDocuments();
    const pricing_id = `PRC-${String(count + 1).padStart(3, '0')}`;

    const rule = await RoomPricing.create({
      pricing_id,
      room_type_id,
      start_date: start,
      end_date: end,
      price_per_night: Number(price_per_night),
      pricing_type: pricing_type || PRICING_TYPES.BASE,
      status: status || USER_STATUS.ACTIVE
    });

    res.status(201).json({
      success: true,
      data: rule,
      message: 'Pricing rule created successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const updatePricingRule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const rule = await RoomPricing.findOne({ pricing_id: id });
    if (!rule) {
      throw new NotFoundError(`Pricing rule '${id}' not found`, 'PRICING_RULE_NOT_FOUND');
    }

    if (req.user && req.user.role === 'PROPERTY_MANAGER') {
      const roomType = await RoomType.findOne({ room_type_id: rule.room_type_id });
      const property = await Property.findOne({ property_id: roomType?.property_id });
      if (property?.manager_user_id !== req.user.user_id) {
        throw new ForbiddenError('You do not manage the property for this pricing rule', 'FORBIDDEN');
      }
    }

    const { start_date, end_date, price_per_night, pricing_type, status } = req.body;

    if (start_date) {
      const start = new Date(start_date);
      if (isNaN(start.getTime())) throw new BadRequestError('Invalid start date');
      rule.start_date = start;
    }

    if (end_date) {
      const end = new Date(end_date);
      if (isNaN(end.getTime())) throw new BadRequestError('Invalid end date');
      rule.end_date = end;
    }

    if (rule.start_date > rule.end_date) {
      throw new BadRequestError('Start date must be before or equal to end date', 'INVALID_DATE_RANGE');
    }

    if (price_per_night !== undefined) {
      if (Number(price_per_night) < 0) throw new BadRequestError('Price per night must be non-negative');
      rule.price_per_night = Number(price_per_night);
    }

    if (pricing_type) {
      if (!Object.values(PRICING_TYPES).includes(pricing_type)) {
        throw new BadRequestError(`Invalid pricing type '${pricing_type}'`);
      }
      rule.pricing_type = pricing_type;
    }

    if (status) {
      if (!Object.values(USER_STATUS).includes(status)) {
        throw new BadRequestError(`Invalid status '${status}'`);
      }
      rule.status = status;
    }

    await rule.save();

    res.status(200).json({
      success: true,
      data: rule,
      message: 'Pricing rule updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const deletePricingRule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const rule = await RoomPricing.findOne({ pricing_id: id });
    if (!rule) {
      throw new NotFoundError(`Pricing rule '${id}' not found`, 'PRICING_RULE_NOT_FOUND');
    }

    if (req.user && req.user.role === 'PROPERTY_MANAGER') {
      const roomType = await RoomType.findOne({ room_type_id: rule.room_type_id });
      const property = await Property.findOne({ property_id: roomType?.property_id });
      if (property?.manager_user_id !== req.user.user_id) {
        throw new ForbiddenError('You do not manage the property for this pricing rule', 'FORBIDDEN');
      }
    }

    await RoomPricing.deleteOne({ pricing_id: id });

    res.status(200).json({
      success: true,
      data: rule,
      message: 'Pricing rule deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
