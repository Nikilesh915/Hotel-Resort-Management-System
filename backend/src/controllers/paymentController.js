import { Payment } from '../models/Payment.js';
import { processPayment } from '../services/paymentService.js';
import { BadRequestError, NotFoundError } from '../utils/errors.js';

export const handlePayment = async (req, res, next) => {
  try {
    const { reservation_id, payment_method = 'CARD', idempotency_key } = req.body;
    if (!reservation_id || !idempotency_key) {
      throw new BadRequestError('reservation_id and idempotency_key are required', 'MISSING_FIELDS');
    }

    const guest_id = req.user.role === 'GUEST' ? req.user.guest_id : null;

    const result = await processPayment({
      reservation_id,
      guest_id,
      user_id: req.user.user_id,
      payment_method,
      idempotency_key
    });

    res.status(result.is_idempotent_replay ? 200 : 201).json({
      success: true,
      data: result.payment,
      is_idempotent_replay: result.is_idempotent_replay,
      message: result.is_idempotent_replay
        ? 'Duplicate payment request detected; returned existing transaction'
        : 'Payment processed successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getPaymentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findOne({
      $or: [{ payment_id: id }, { payment_reference: id }]
    });

    if (!payment) {
      throw new NotFoundError(`Payment '${id}' not found`, 'PAYMENT_NOT_FOUND');
    }

    // IDOR protection
    if (req.user.role === 'GUEST' && payment.guest_id !== req.user.guest_id) {
      throw new NotFoundError(`Payment '${id}' not found`, 'PAYMENT_NOT_FOUND');
    }

    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};

export const getAllPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find().sort({ created_at: -1 });
    res.status(200).json({ success: true, data: payments });
  } catch (error) {
    next(error);
  }
};
