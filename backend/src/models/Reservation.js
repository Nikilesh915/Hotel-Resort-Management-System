import mongoose from 'mongoose';
import { RESERVATION_STATUS, CANCELLATION_POLICIES } from '../config/constants.js';

const reservationSchema = new mongoose.Schema(
  {
    reservation_id: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    reservation_number: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    guest_id: {
      type: String,
      ref: 'Guest',
      required: true,
      index: true
    },
    property_id: {
      type: String,
      ref: 'Property',
      required: true,
      index: true
    },
    room_id: {
      type: String,
      ref: 'Room',
      required: true,
      index: true
    },
    check_in_date: {
      type: Date,
      required: true
    },
    check_out_date: {
      type: Date,
      required: true
    },
    guests_count: {
      type: Number,
      required: true,
      min: 1
    },
    base_amount: {
      type: Number,
      required: true,
      min: 0
    },
    discount_amount: {
      type: Number,
      default: 0.00,
      min: 0
    },
    tax_amount: {
      type: Number,
      required: true,
      min: 0
    },
    service_fee: {
      type: Number,
      required: true,
      min: 0
    },
    total_amount: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: Object.values(RESERVATION_STATUS),
      default: RESERVATION_STATUS.PENDING,
      index: true
    },
    cancellation_policy: {
      type: String,
      enum: Object.values(CANCELLATION_POLICIES),
      default: CANCELLATION_POLICIES.FLEXIBLE
    },
    created_at: {
      type: Date,
      default: Date.now
    },
    updated_at: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

reservationSchema.index({ room_id: 1, status: 1, check_in_date: 1, check_out_date: 1 });

export const Reservation = mongoose.model('Reservation', reservationSchema);

