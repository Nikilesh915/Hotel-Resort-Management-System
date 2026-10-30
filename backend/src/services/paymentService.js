import { Payment } from '../models/Payment.js';
import { Reservation } from '../models/Reservation.js';
import { AuditLog } from '../models/AuditLog.js';
import { BadRequestError, NotFoundError } from '../utils/errors.js';

export const processPayment = async ({
  reservation_id,
  guest_id,
  user_id,
  payment_method,
  idempotency_key
}) => {
  if (!idempotency_key) {
    throw new BadRequestError('Idempotency key is required for payment processing', 'IDEMPOTENCY_KEY_REQUIRED');
  }

  // 1. Idempotency Check: Return existing payment if duplicate key encountered
  const existingPayment = await Payment.findOne({ idempotency_key });
  if (existingPayment) {
    return {
      payment: existingPayment,
      is_idempotent_replay: true
    };
  }

  // 2. Fetch Reservation
  const reservation = await Reservation.findOne({ reservation_id });
  if (!reservation) {
    throw new NotFoundError(`Reservation '${reservation_id}' not found`, 'RESERVATION_NOT_FOUND');
  }

  // Verify ownership if guest
  if (guest_id && reservation.guest_id !== guest_id) {
    throw new NotFoundError(`Reservation '${reservation_id}' not found`, 'RESERVATION_NOT_FOUND');
  }

  // 3. State verification: Can only pay for PENDING reservations
  if (reservation.status !== 'PENDING') {
    throw new BadRequestError(
      `Cannot process payment for reservation with status '${reservation.status}'`,
      'INVALID_RESERVATION_STATUS'
    );
  }

  // Check if a successful payment already exists for this reservation
  const priorPayment = await Payment.findOne({ reservation_id, status: 'SUCCESS' });
  if (priorPayment) {
    throw new BadRequestError('A successful payment has already been completed for this reservation', 'ALREADY_PAID');
  }

  // Generate Payment ID & Reference
  const paymentCount = await Payment.countDocuments();
  const payment_id = `PAY-${String(paymentCount + 1).padStart(3, '0')}`;
  const payment_reference = `TXN-${Date.now().toString().slice(-9)}`;

  const payment = await Payment.create({
    payment_id,
    payment_reference,
    reservation_id,
    guest_id: reservation.guest_id,
    amount: reservation.total_amount,
    currency: 'INR',
    payment_method,
    status: 'SUCCESS',
    idempotency_key,
    paid_at: new Date()
  });

  // Transition Reservation: PENDING -> CONFIRMED
  reservation.status = 'CONFIRMED';
  reservation.updated_at = new Date();
  await reservation.save();

  // Create Audit Log
  const auditCount = await AuditLog.countDocuments();
  await AuditLog.create({
    audit_id: `AUD-${String(auditCount + 1).padStart(3, '0')}`,
    user_id,
    action: 'PAYMENT_CREATED',
    entity_type: 'PAYMENT',
    entity_id: payment_id,
    metadata: {
      reservation_id,
      amount: payment.amount,
      status: 'SUCCESS'
    }
  });

  return {
    payment,
    is_idempotent_replay: false
  };
};

