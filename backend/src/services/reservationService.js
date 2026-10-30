import mongoose from 'mongoose';
import { Reservation } from '../models/Reservation.js';
import { Room } from '../models/Room.js';
import { RoomDailyAllocation } from '../models/RoomDailyAllocation.js';
import { Coupon } from '../models/Coupon.js';
import { CouponRedemption } from '../models/CouponRedemption.js';
import { AuditLog } from '../models/AuditLog.js';
import { calculateReservationPrice } from './pricingService.js';
import { BadRequestError, ConflictError, NotFoundError } from '../utils/errors.js';

export const VALID_STATUS_TRANSITIONS = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['CHECKED_IN', 'CANCELLED', 'REFUND_PENDING'],
  CHECKED_IN: ['CHECKED_OUT'],
  REFUND_PENDING: ['REFUNDED'],
  CHECKED_OUT: [],
  CANCELLED: [],
  REFUNDED: []
};

export const createReservation = async ({
  guest_id,
  user_id,
  property_id,
  room_id,
  check_in_date,
  check_out_date,
  guests_count,
  coupon_code = null,
  cancellation_policy = 'FLEXIBLE'
}) => {
  const checkIn = new Date(check_in_date);
  const checkOut = new Date(check_out_date);

  if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
    throw new BadRequestError('Invalid check-in or check-out date', 'INVALID_DATES');
  }

  if (checkOut <= checkIn) {
    throw new BadRequestError('Check-out date must be strictly after check-in date', 'INVALID_DATE_RANGE');
  }

  // 1. Verify Room Exists, belongs to Property, and is bookable
  const room = await Room.findOne({ room_id });
  if (!room) {
    throw new NotFoundError(`Room '${room_id}' not found`, 'ROOM_NOT_FOUND');
  }
  if (room.property_id !== property_id) {
    throw new BadRequestError(`Room '${room_id}' does not belong to property '${property_id}'`, 'PROPERTY_MISMATCH');
  }
  if (room.status !== 'AVAILABLE') {
    throw new BadRequestError(`Room '${room_id}' is currently ${room.status.toLowerCase()} and cannot be reserved`, 'ROOM_NOT_AVAILABLE');
  }

  // 2. Compute trusted server-side price
  const pricing = await calculateReservationPrice({
    room_id,
    check_in_date,
    check_out_date,
    guests_count,
    coupon_code,
    guest_id
  });

  // 3. Generate daily dates array for physical slot lock
  const current = new Date(checkIn);
  current.setUTCHours(0, 0, 0, 0);
  const end = new Date(checkOut);
  end.setUTCHours(0, 0, 0, 0);

  const dailyDates = [];
  while (current < end) {
    dailyDates.push(current.toISOString().split('T')[0]);
    current.setUTCDate(current.getUTCDate() + 1);
  }

  // Generate unique IDs without race condition risk
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const reservation_id = `RES-${Date.now().toString().slice(-6)}-${randomSuffix}`;
  const reservation_number = `RES-${new Date().getFullYear().toString().slice(-2)}-${randomSuffix}`;

  // Start Transaction if replica set is available
  let session = null;
  let isTransactionActive = false;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
    isTransactionActive = true;
  } catch (err) {
    session = null;
  }

  try {
    const opts = session ? { session } : {};

    // 4. Overlap Query: Check existing active reservations
    const conflictingReservation = await Reservation.findOne({
      room_id,
      status: { $in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
      $and: [
        { check_in_date: { $lt: checkOut } },
        { check_out_date: { $gt: checkIn } }
      ]
    }, null, opts);

    if (conflictingReservation) {
      throw new ConflictError('Selected room is already reserved for the requested dates', 'ROOM_ALREADY_RESERVED');
    }

    // 5. Atomic Daily Allocation Insertion (Guarantees ACID concurrency barrier via unique index)
    const allocations = dailyDates.map(d => ({
      room_id,
      date: d,
      reservation_id,
      status: 'ALLOCATED'
    }));

    try {
      await RoomDailyAllocation.insertMany(allocations, opts);
    } catch (allocError) {
      if (
        allocError.code === 11000 ||
        allocError.code === 112 ||
        allocError.name === 'MongoServerError' ||
        allocError.message?.includes('WriteConflict') ||
        allocError.message?.includes('duplicate key')
      ) {
        throw new ConflictError('Selected room is already reserved for the requested dates', 'ROOM_ALREADY_RESERVED');
      }
      throw allocError;
    }

    // 6. Handle Coupon Atomic Increment & Redemption
    if (pricing.applied_coupon) {
      const couponUpdate = await Coupon.findOneAndUpdate(
        {
          coupon_id: pricing.applied_coupon.coupon_id,
          status: 'ACTIVE',
          $expr: { $lt: ['$current_usage_count', '$usage_limit'] }
        },
        { $inc: { current_usage_count: 1 } },
        { ...opts, new: true }
      );

      if (!couponUpdate) {
        throw new BadRequestError('Coupon limit was exceeded by a concurrent request', 'COUPON_LIMIT_EXCEEDED');
      }

      const redemption_id = `RED-${Date.now().toString().slice(-6)}-${randomSuffix}`;

      await CouponRedemption.create([{
        redemption_id,
        coupon_id: pricing.applied_coupon.coupon_id,
        reservation_id,
        guest_id,
        discount_amount: pricing.discount_amount,
        status: 'SUCCESS'
      }], opts);
    }

    // 7. Create Reservation
    const [reservation] = await Reservation.create([{
      reservation_id,
      reservation_number,
      guest_id,
      property_id,
      room_id,
      check_in_date: checkIn,
      check_out_date: checkOut,
      guests_count,
      base_amount: pricing.base_amount,
      discount_amount: pricing.discount_amount,
      tax_amount: pricing.tax_amount,
      service_fee: pricing.service_fee,
      total_amount: pricing.total_amount,
      status: 'PENDING',
      cancellation_policy
    }], opts);

    // 8. Create Audit Log
    const audit_id = `AUD-${Date.now().toString().slice(-6)}-${randomSuffix}`;
    await AuditLog.create([{
      audit_id,
      user_id,
      action: 'RESERVATION_CREATED',
      entity_type: 'RESERVATION',
      entity_id: reservation_id,
      metadata: {
        room_id,
        property_id,
        check_in_date,
        check_out_date,
        total_amount: pricing.total_amount
      }
    }], opts);

    if (isTransactionActive) {
      await session.commitTransaction();
    }

    return reservation;
  } catch (error) {
    if (isTransactionActive) {
      try {
        await session.abortTransaction();
      } catch (e) {
        // Ignore transaction already aborted error
      }
    } else {
      await RoomDailyAllocation.deleteMany({ reservation_id });
    }

    // Catch concurrency conflicts surfacing at commit time
    if (
      error.code === 11000 ||
      error.code === 112 ||
      error.hasErrorLabel?.('TransientTransactionError') ||
      error.message?.includes('WriteConflict') ||
      error.message?.includes('duplicate key')
    ) {
      throw new ConflictError('Selected room is already reserved for the requested dates', 'ROOM_ALREADY_RESERVED');
    }

    throw error;
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

export const updateReservationStatus = async ({ reservation_id, new_status, user_id }) => {
  const reservation = await Reservation.findOne({ reservation_id });
  if (!reservation) {
    throw new NotFoundError(`Reservation '${reservation_id}' not found`, 'RESERVATION_NOT_FOUND');
  }

  const allowedNextStates = VALID_STATUS_TRANSITIONS[reservation.status] || [];
  if (!allowedNextStates.includes(new_status)) {
    throw new BadRequestError(
      `Invalid state transition: Cannot change status from '${reservation.status}' to '${new_status}'`,
      'INVALID_STATE_TRANSITION'
    );
  }

  reservation.status = new_status;
  await reservation.save();

  // If moved to terminal or cancelled, free allocations
  if (['CANCELLED', 'REFUNDED'].includes(new_status)) {
    await RoomDailyAllocation.deleteMany({ reservation_id });
  }

  // Audit Log
  const audit_id = `AUD-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
  await AuditLog.create({
    audit_id,
    user_id,
    action: 'RESERVATION_STATUS_CHANGED',
    entity_type: 'RESERVATION',
    entity_id: reservation_id,
    metadata: {
      from: reservation.status,
      to: new_status
    }
  });

  return reservation;
};
