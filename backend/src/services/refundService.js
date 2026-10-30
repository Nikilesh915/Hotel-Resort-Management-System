import { Reservation } from '../models/Reservation.js';
import { Payment } from '../models/Payment.js';
import { Refund } from '../models/Refund.js';
import { RoomDailyAllocation } from '../models/RoomDailyAllocation.js';
import { AuditLog } from '../models/AuditLog.js';
import { BadRequestError, NotFoundError } from '../utils/errors.js';

export const calculateCancellationFee = (reservation, now = new Date()) => {
  const checkIn = new Date(reservation.check_in_date);
  const diffHours = (checkIn.getTime() - now.getTime()) / (1000 * 60 * 60);

  const policy = reservation.cancellation_policy || 'FLEXIBLE';
  const totalAmount = reservation.total_amount;

  let feePercentage = 0;

  if (policy === 'FLEXIBLE') {
    if (diffHours >= 24) {
      feePercentage = 0; // 100% refund
    } else {
      feePercentage = 10; // 10% fee, 90% refund
    }
  } else if (policy === 'MODERATE') {
    if (diffHours >= 120) {
      feePercentage = 0; // 100% refund
    } else if (diffHours >= 48) {
      feePercentage = 50; // 50% refund
    } else {
      feePercentage = 100; // No refund
    }
  } else if (policy === 'STRICT') {
    if (diffHours >= 168) {
      feePercentage = 10; // 10% fee, 90% refund
    } else {
      feePercentage = 100; // No refund
    }
  }

  const cancellation_fee = Math.round((totalAmount * feePercentage) / 100 * 100) / 100;
  const refund_amount = Math.round((totalAmount - cancellation_fee) * 100) / 100;

  return {
    original_amount: totalAmount,
    cancellation_fee,
    refund_amount,
    policy,
    hours_to_checkin: Math.round(diffHours * 10) / 10
  };
};

export const cancelReservation = async ({
  reservation_id,
  guest_id,
  user_id,
  reason = 'Guest requested cancellation',
  idempotency_key = null
}) => {
  const reservation = await Reservation.findOne({ reservation_id });
  if (!reservation) {
    throw new NotFoundError(`Reservation '${reservation_id}' not found`, 'RESERVATION_NOT_FOUND');
  }

  // Verify resource ownership if guest
  if (guest_id && reservation.guest_id !== guest_id) {
    throw new NotFoundError(`Reservation '${reservation_id}' not found`, 'RESERVATION_NOT_FOUND');
  }

  // Verify state
  if (['CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'REFUNDED'].includes(reservation.status)) {
    throw new BadRequestError(
      `Cannot cancel reservation with status '${reservation.status}'`,
      'CANNOT_CANCEL_RESERVATION'
    );
  }

  // Release inventory allocations immediately
  await RoomDailyAllocation.deleteMany({ reservation_id });

  // If PENDING (unpaid), simple cancellation
  if (reservation.status === 'PENDING') {
    reservation.status = 'CANCELLED';
    reservation.updated_at = new Date();
    await reservation.save();

    const auditCount = await AuditLog.countDocuments();
    await AuditLog.create({
      audit_id: `AUD-${String(auditCount + 1).padStart(3, '0')}`,
      user_id,
      action: 'RESERVATION_CANCELLED',
      entity_type: 'RESERVATION',
      entity_id: reservation_id,
      metadata: { reason, refund_issued: false }
    });

    return {
      reservation,
      refund: null,
      message: 'Reservation cancelled successfully. No payment had been processed.'
    };
  }

  // If CONFIRMED (paid), compute refund & process
  const payment = await Payment.findOne({ reservation_id, status: 'SUCCESS' });
  if (!payment) {
    reservation.status = 'CANCELLED';
    await reservation.save();
    return {
      reservation,
      refund: null,
      message: 'Reservation cancelled. No payment found.'
    };
  }

  // Idempotency check if key supplied
  const refundIdemKey = idempotency_key || `idem-refund-${reservation_id}`;
  const existingRefund = await Refund.findOne({
    $or: [
      { idempotency_key: refundIdemKey },
      { reservation_id }
    ]
  });

  if (existingRefund) {
    return {
      reservation,
      refund: existingRefund,
      is_idempotent_replay: true
    };
  }

  const calculation = calculateCancellationFee(reservation);

  const refundCount = await Refund.countDocuments();
  const refund_id = `REF-${String(refundCount + 1).padStart(3, '0')}`;
  const refund_reference = `RFD-${Date.now().toString().slice(-9)}`;

  const refund = await Refund.create({
    refund_id,
    refund_reference,
    reservation_id,
    payment_id: payment.payment_id,
    guest_id: reservation.guest_id,
    original_amount: calculation.original_amount,
    cancellation_fee: calculation.cancellation_fee,
    refund_amount: calculation.refund_amount,
    reason,
    status: 'SUCCESS',
    idempotency_key: refundIdemKey,
    refunded_at: new Date()
  });

  // Update payment status
  payment.status = 'REFUNDED';
  await payment.save();

  // Update reservation status: REFUNDED
  reservation.status = 'REFUNDED';
  reservation.updated_at = new Date();
  await reservation.save();

  // Audit Log
  const auditCount = await AuditLog.countDocuments();
  await AuditLog.create({
    audit_id: `AUD-${String(auditCount + 1).padStart(3, '0')}`,
    user_id,
    action: 'REFUND_CREATED',
    entity_type: 'REFUND',
    entity_id: refund_id,
    metadata: {
      reservation_id,
      refund_amount: calculation.refund_amount,
      cancellation_fee: calculation.cancellation_fee
    }
  });

  return {
    reservation,
    refund,
    is_idempotent_replay: false,
    message: 'Reservation cancelled and refund processed successfully.'
  };
};

