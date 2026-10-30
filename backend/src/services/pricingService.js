import { Room } from '../models/Room.js';
import { RoomType } from '../models/RoomType.js';
import { RoomPricing } from '../models/RoomPricing.js';
import { Coupon } from '../models/Coupon.js';
import { CouponRedemption } from '../models/CouponRedemption.js';
import { BadRequestError, NotFoundError } from '../utils/errors.js';

export const calculateReservationPrice = async ({
  room_id,
  check_in_date,
  check_out_date,
  guests_count,
  coupon_code = null,
  guest_id = null
}) => {
  const checkIn = new Date(check_in_date);
  const checkOut = new Date(check_out_date);

  if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
    throw new BadRequestError('Invalid check-in or check-out date', 'INVALID_DATES');
  }

  // Calculate nights
  const checkInMidnight = new Date(checkIn);
  checkInMidnight.setUTCHours(0, 0, 0, 0);
  const checkOutMidnight = new Date(checkOut);
  checkOutMidnight.setUTCHours(0, 0, 0, 0);

  const diffTime = checkOutMidnight.getTime() - checkInMidnight.getTime();
  const nights = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (nights < 1) {
    throw new BadRequestError('Check-out date must be at least 1 day after check-in date', 'INVALID_DURATION');
  }

  // Fetch Room & RoomType
  const room = await Room.findOne({ room_id });
  if (!room) {
    throw new NotFoundError(`Room ${room_id} not found`, 'ROOM_NOT_FOUND');
  }

  const roomType = await RoomType.findOne({ room_type_id: room.room_type_id });
  if (!roomType) {
    throw new NotFoundError(`Room type ${room.room_type_id} not found`, 'ROOM_TYPE_NOT_FOUND');
  }

  if (guests_count > roomType.max_guests) {
    throw new BadRequestError(`Guest count (${guests_count}) exceeds room maximum capacity (${roomType.max_guests})`, 'CAPACITY_EXCEEDED');
  }

  // Fetch all active pricing rules for this room type
  const pricingRules = await RoomPricing.find({
    room_type_id: roomType.room_type_id,
    status: 'ACTIVE'
  });

  // Calculate base amount per night
  let base_amount = 0;
  const nightlyBreakdown = [];

  const currentDay = new Date(checkInMidnight);
  for (let i = 0; i < nights; i++) {
    const dayDate = new Date(currentDay);
    const dayOfWeek = dayDate.getUTCDay(); // 0 = Sun, 5 = Fri, 6 = Sat
    const isWeekend = (dayOfWeek === 5 || dayOfWeek === 6);

    // Filter pricing rules covering this day
    const matchingRules = pricingRules.filter(rule => {
      const start = new Date(rule.start_date);
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(rule.end_date);
      end.setUTCHours(23, 59, 59, 999);
      return dayDate >= start && dayDate <= end;
    });

    let nightPrice = roomType.base_price_per_night;
    let appliedRuleType = 'ROOM_TYPE_BASE';

    // Hierarchy: SEASONAL > WEEKEND > BASE
    const seasonalRule = matchingRules.find(r => r.pricing_type === 'SEASONAL');
    const weekendRule = matchingRules.find(r => r.pricing_type === 'WEEKEND');
    const baseRule = matchingRules.find(r => r.pricing_type === 'BASE');

    if (seasonalRule) {
      nightPrice = seasonalRule.price_per_night;
      appliedRuleType = 'SEASONAL';
    } else if (isWeekend && weekendRule) {
      nightPrice = weekendRule.price_per_night;
      appliedRuleType = 'WEEKEND';
    } else if (baseRule) {
      nightPrice = baseRule.price_per_night;
      appliedRuleType = 'BASE_OVERRIDE';
    }

    base_amount += nightPrice;
    nightlyBreakdown.push({
      date: dayDate.toISOString().split('T')[0],
      price: nightPrice,
      pricing_type: appliedRuleType
    });

    currentDay.setUTCDate(currentDay.getUTCDate() + 1);
  }

  // Fixed service fee
  const service_fee = 500.00;

  // Coupon validation & discount computation
  let discount_amount = 0.00;
  let appliedCoupon = null;

  if (coupon_code) {
    const coupon = await Coupon.findOne({ code: coupon_code.toUpperCase().trim() });

    if (!coupon) {
      throw new BadRequestError(`Coupon '${coupon_code}' does not exist`, 'COUPON_NOT_FOUND');
    }

    if (coupon.status === 'EXPIRED') {
      throw new BadRequestError(`Coupon '${coupon.code}' has expired`, 'COUPON_EXPIRED');
    }

    if (coupon.status !== 'ACTIVE') {
      throw new BadRequestError(`Coupon '${coupon.code}' is disabled or inactive`, 'COUPON_INACTIVE');
    }

    const bookingDate = new Date(check_in_date);
    if (bookingDate < new Date(coupon.valid_from) || bookingDate > new Date(coupon.valid_until)) {
      throw new BadRequestError(`Coupon '${coupon.code}' is not valid for the requested dates`, 'COUPON_EXPIRED');
    }

    if (coupon.applicable_property_id && coupon.applicable_property_id !== room.property_id) {
      throw new BadRequestError(`Coupon '${coupon.code}' is not valid for this property`, 'COUPON_PROPERTY_MISMATCH');
    }

    if (base_amount < coupon.minimum_booking_amount) {
      throw new BadRequestError(
        `Booking base amount (₹${base_amount}) does not meet coupon minimum of ₹${coupon.minimum_booking_amount}`,
        'COUPON_MINIMUM_NOT_MET'
      );
    }

    if (coupon.current_usage_count >= coupon.usage_limit) {
      throw new BadRequestError(`Coupon '${coupon.code}' has reached its maximum global usage limit`, 'COUPON_LIMIT_EXCEEDED');
    }

    if (guest_id) {
      const guestRedemptions = await CouponRedemption.countDocuments({
        coupon_id: coupon.coupon_id,
        guest_id,
        status: 'SUCCESS'
      });
      if (guestRedemptions >= coupon.per_customer_limit) {
        throw new BadRequestError(
          `You have already reached the redemption limit (${coupon.per_customer_limit}) for coupon '${coupon.code}'`,
          'COUPON_CUSTOMER_LIMIT_REACHED'
        );
      }
    }

    if (coupon.discount_type === 'PERCENTAGE') {
      discount_amount = (base_amount * coupon.discount_value) / 100;
      discount_amount = Math.min(discount_amount, coupon.maximum_discount);
    } else if (coupon.discount_type === 'FIXED') {
      discount_amount = Math.min(coupon.discount_value, coupon.maximum_discount);
      discount_amount = Math.min(discount_amount, base_amount);
    }

    discount_amount = Math.round(discount_amount * 100) / 100;
    appliedCoupon = coupon;
  }

  // Tax calculation (12% GST on net base amount)
  const taxable_amount = Math.max(0, base_amount - discount_amount);
  const tax_amount = Math.round(taxable_amount * 0.12 * 100) / 100;

  // Final Total Amount
  const total_amount = Math.round((taxable_amount + tax_amount + service_fee) * 100) / 100;

  return {
    nights,
    base_amount,
    discount_amount,
    tax_amount,
    service_fee,
    total_amount,
    nightly_breakdown: nightlyBreakdown,
    applied_coupon: appliedCoupon ? {
      coupon_id: appliedCoupon.coupon_id,
      code: appliedCoupon.code,
      discount_amount
    } : null,
    room: {
      room_id: room.room_id,
      room_number: room.room_number,
      property_id: room.property_id,
      room_type_name: roomType.name
    }
  };
};
