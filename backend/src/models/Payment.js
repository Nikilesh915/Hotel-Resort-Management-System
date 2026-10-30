import mongoose from 'mongoose';
import { PAYMENT_METHODS, PAYMENT_STATUS } from '../config/constants.js';

const paymentSchema = new mongoose.Schema(
  {
    payment_id: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    payment_reference: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    reservation_id: {
      type: String,
      ref: 'Reservation',
      required: true,
      index: true
    },
    guest_id: {
      type: String,
      ref: 'Guest',
      required: true,
      index: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR'
    },
    payment_method: {
      type: String,
      enum: Object.values(PAYMENT_METHODS),
      required: true
    },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING
    },
    idempotency_key: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    paid_at: {
      type: Date,
      default: null
    },
    created_at: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: false }
);

export const Payment = mongoose.model('Payment', paymentSchema);

