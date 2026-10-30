import mongoose from 'mongoose';
import { REFUND_STATUS } from '../config/constants.js';

const refundSchema = new mongoose.Schema(
  {
    refund_id: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    refund_reference: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    reservation_id: {
      type: String,
      ref: 'Reservation',
      required: true,
      unique: true
    },
    payment_id: {
      type: String,
      ref: 'Payment',
      required: true
    },
    guest_id: {
      type: String,
      ref: 'Guest',
      required: true
    },
    original_amount: {
      type: Number,
      required: true,
      min: 0
    },
    cancellation_fee: {
      type: Number,
      required: true,
      min: 0
    },
    refund_amount: {
      type: Number,
      required: true,
      min: 0
    },
    reason: {
      type: String,
      default: 'Guest requested cancellation'
    },
    status: {
      type: String,
      enum: Object.values(REFUND_STATUS),
      default: REFUND_STATUS.SUCCESS
    },
    idempotency_key: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    refunded_at: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: false }
);

export const Refund = mongoose.model('Refund', refundSchema);
