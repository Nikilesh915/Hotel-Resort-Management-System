import { Coupon } from '../models/Coupon.js';
import { CouponRedemption } from '../models/CouponRedemption.js';
import { Property } from '../models/Property.js';
import { Reservation } from '../models/Reservation.js';
import { validateCoupon } from '../services/couponService.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/errors.js';

export const getCoupons = async (req, res, next) => {
  try {
    let filter = {};
    if (req.user && req.user.role === 'PROPERTY_MANAGER') {
      const managedProps = await Property.find({ manager_user_id: req.user.user_id });
      const propIds = managedProps.map(p => p.property_id);
      filter = {
        $or: [
          { applicable_property_id: null },
          { applicable_property_id: { $in: propIds } }
        ]
      };
    }

    const coupons = await Coupon.find(filter).sort({ valid_until: -1 });
    res.status(200).json({ success: true, data: coupons });
  } catch (error) {
    next(error);
  }
};

export const createCoupon = async (req, res, next) => {
  try {
    const {
      code,
      discount_type,
      discount_value,
      maximum_discount,
      minimum_booking_amount,
      usage_limit,
      per_customer_limit,
      valid_from,
      valid_until,
      applicable_property_id
    } = req.body;

    if (!code || !discount_type || !discount_value || !valid_from || !valid_until) {
      throw new BadRequestError('Required coupon fields missing', 'MISSING_FIELDS');
    }

    let finalPropertyId = applicable_property_id || null;

    if (req.user && req.user.role === 'PROPERTY_MANAGER') {
      const managedProps = await Property.find({ manager_user_id: req.user.user_id });
      const propIds = managedProps.map(p => p.property_id);
      if (!finalPropertyId || !propIds.includes(finalPropertyId)) {
        throw new ForbiddenError(
          'Property Managers must assign coupons to their own managed property',
          'FORBIDDEN'
        );
      }
    }

    const cleanCode = code.toUpperCase().trim();
    const existing = await Coupon.findOne({ code: cleanCode });
    if (existing) {
      throw new BadRequestError(`Coupon with code '${cleanCode}' already exists`, 'COUPON_EXISTS');
    }

    const count = await Coupon.countDocuments();
    const coupon_id = `CPN-${String(count + 1).padStart(3, '0')}`;

    const coupon = await Coupon.create({
      coupon_id,
      code: cleanCode,
      discount_type,
      discount_value: Number(discount_value),
      maximum_discount: Number(maximum_discount || discount_value),
      minimum_booking_amount: Number(minimum_booking_amount || 0),
      usage_limit: Number(usage_limit || 100),
      per_customer_limit: Number(per_customer_limit || 1),
      valid_from: new Date(valid_from),
      valid_until: new Date(valid_until),
      applicable_property_id: finalPropertyId,
      status: 'ACTIVE'
    });

    res.status(201).json({ success: true, data: coupon, message: 'Coupon created successfully' });
  } catch (error) {
    next(error);
  }
};

export const updateCouponStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['ACTIVE', 'EXPIRED', 'DISABLED'].includes(status)) {
      throw new BadRequestError(`Invalid coupon status '${status}'`, 'INVALID_STATUS');
    }

    const coupon = await Coupon.findOne({ coupon_id: id });
    if (!coupon) {
      throw new NotFoundError(`Coupon '${id}' not found`, 'COUPON_NOT_FOUND');
    }

    if (req.user && req.user.role === 'PROPERTY_MANAGER') {
      const managedProps = await Property.find({ manager_user_id: req.user.user_id });
      const propIds = managedProps.map(p => p.property_id);
      if (!coupon.applicable_property_id || !propIds.includes(coupon.applicable_property_id)) {
        throw new ForbiddenError('You can only modify coupons for your own managed property', 'FORBIDDEN');
      }
    }

    coupon.status = status;
    await coupon.save();

    res.status(200).json({ success: true, data: coupon, message: `Coupon status updated to ${status}` });
  } catch (error) {
    next(error);
  }
};

export const handleValidateCoupon = async (req, res, next) => {
  try {
    const { code, property_id, booking_amount } = req.body;
    if (!code || !booking_amount) {
      throw new BadRequestError('Coupon code and booking_amount are required', 'MISSING_FIELDS');
    }

    const guest_id = req.user?.guest_id || null;
    const result = await validateCoupon({
      code,
      property_id,
      booking_amount: Number(booking_amount),
      guest_id
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const updateCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findOne({ coupon_id: id });
    if (!coupon) {
      throw new NotFoundError(`Coupon '${id}' not found`, 'COUPON_NOT_FOUND');
    }

    if (req.user && req.user.role === 'PROPERTY_MANAGER') {
      const managedProps = await Property.find({ manager_user_id: req.user.user_id });
      const propIds = managedProps.map(p => p.property_id);
      if (!coupon.applicable_property_id || !propIds.includes(coupon.applicable_property_id)) {
        throw new ForbiddenError('You can only modify coupons for your own managed property', 'FORBIDDEN');
      }
    }

    const {
      discount_type,
      discount_value,
      maximum_discount,
      minimum_booking_amount,
      usage_limit,
      per_customer_limit,
      valid_from,
      valid_until,
      applicable_property_id,
      status
    } = req.body;

    if (discount_type) coupon.discount_type = discount_type;
    if (discount_value !== undefined) coupon.discount_value = Number(discount_value);
    if (maximum_discount !== undefined) coupon.maximum_discount = Number(maximum_discount);
    if (minimum_booking_amount !== undefined) coupon.minimum_booking_amount = Number(minimum_booking_amount);
    if (usage_limit !== undefined) coupon.usage_limit = Number(usage_limit);
    if (per_customer_limit !== undefined) coupon.per_customer_limit = Number(per_customer_limit);
    if (valid_from) coupon.valid_from = new Date(valid_from);
    if (valid_until) coupon.valid_until = new Date(valid_until);
    if (applicable_property_id !== undefined) coupon.applicable_property_id = applicable_property_id || null;
    if (status) coupon.status = status;

    await coupon.save();
    res.status(200).json({ success: true, data: coupon, message: 'Coupon updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const deleteCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findOne({ coupon_id: id });
    if (!coupon) {
      throw new NotFoundError(`Coupon '${id}' not found`, 'COUPON_NOT_FOUND');
    }

    if (req.user && req.user.role === 'PROPERTY_MANAGER') {
      const managedProps = await Property.find({ manager_user_id: req.user.user_id });
      const propIds = managedProps.map(p => p.property_id);
      if (!coupon.applicable_property_id || !propIds.includes(coupon.applicable_property_id)) {
        throw new ForbiddenError('You can only delete coupons for your own managed property', 'FORBIDDEN');
      }
    }

    await Coupon.deleteOne({ coupon_id: id });
    res.status(200).json({ success: true, message: `Coupon '${id}' deleted successfully` });
  } catch (error) {
    next(error);
  }
};

export const getCouponRedemptions = async (req, res, next) => {
  try {
    const { coupon_id } = req.query;
    let filter = coupon_id ? { coupon_id } : {};

    if (req.user && req.user.role === 'PROPERTY_MANAGER') {
      const managedProps = await Property.find({ manager_user_id: req.user.user_id });
      const propIds = managedProps.map(p => p.property_id);
      const reservations = await Reservation.find({ property_id: { $in: propIds } }, 'reservation_id');
      const resIds = reservations.map(r => r.reservation_id);
      filter.reservation_id = { $in: resIds };
    }

    const redemptions = await CouponRedemption.find(filter).sort({ redeemed_at: -1 });
    res.status(200).json({ success: true, data: redemptions });
  } catch (error) {
    next(error);
  }
};
