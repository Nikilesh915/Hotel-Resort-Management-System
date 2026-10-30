import { Coupon } from '../models/Coupon.js';
import { validateCoupon } from '../services/couponService.js';
import { BadRequestError, NotFoundError } from '../utils/errors.js';

export const getCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ valid_until: -1 });
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
      applicable_property_id: applicable_property_id || null,
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
