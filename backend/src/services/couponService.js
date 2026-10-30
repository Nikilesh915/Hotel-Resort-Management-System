import { Coupon } from '../models/Coupon.js';
import { CouponRedemption } from '../models/CouponRedemption.js';
import { BadRequestError, NotFoundError } from '../utils/errors.js';

export const validateCoupon = async ({ code, property_id, booking_amount, guest_id = null }) => {
  const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });
  if (!coupon) {
    throw new NotFoundError(`Coupon '${code}' not found`, 'COUPON_NOT_FOUND');
  }

  const now = new Date();
  if (coupon.status !== 'ACTIVE') {
    throw new BadRequestError(`Coupon '${coupon.code}' is ${coupon.status.toLowerCase()}`, 'COUPON_INACTIVE');
  }
  if (now < new Date(coupon.valid_from) || now > new Date(coupon.valid_until)) {
    throw new BadRequestError(`Coupon '${coupon.code}' has expired or is not yet active`, 'COUPON_EXPIRED');
  }
  if (coupon.applicable_property_id && coupon.applicable_property_id !== property_id) {
    throw new BadRequestError(`Coupon '${coupon.code}' is not valid for this property`, 'COUPON_PROPERTY_MISMATCH');
  }
  if (booking_amount < coupon.minimum_booking_amount) {
    throw new BadRequestError(
      `Booking amount (₹${booking_amount}) is less than the required minimum (₹${coupon.minimum_booking_amount})`,
      'COUPON_MINIMUM_NOT_MET'
    );
  }
  if (coupon.current_usage_count >= coupon.usage_limit) {
    throw new BadRequestError(`Coupon '${coupon.code}' has reached its maximum global usage limit`, 'COUPON_LIMIT_EXCEEDED');
  }

  if (guest_id) {
    const redemptions = await CouponRedemption.countDocuments({
      coupon_id: coupon.coupon_id,
      guest_id,
      status: 'SUCCESS'
    });
    if (redemptions >= coupon.per_customer_limit) {
      throw new BadRequestError(
        `You have already redeemed coupon '${coupon.code}' the maximum allowed times (${coupon.per_customer_limit})`,
        'COUPON_CUSTOMER_LIMIT_REACHED'
      );
    }
  }

  let discount_amount = 0;
  if (coupon.discount_type === 'PERCENTAGE') {
    discount_amount = Math.min((booking_amount * coupon.discount_value) / 100, coupon.maximum_discount);
  } else {
    discount_amount = Math.min(coupon.discount_value, coupon.maximum_discount);
  }

  discount_amount = Math.min(discount_amount, booking_amount);

  return {
    coupon_id: coupon.coupon_id,
    code: coupon.code,
    discount_type: coupon.discount_type,
    discount_value: coupon.discount_value,
    discount_amount: Math.round(discount_amount * 100) / 100,
    maximum_discount: coupon.maximum_discount,
    minimum_booking_amount: coupon.minimum_booking_amount
  };
};
