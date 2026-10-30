import mongoose from 'mongoose';
import { DISCOUNT_TYPES, USER_STATUS } from '../config/constants.js';

const couponSchema = new mongoose.Schema(
  {
    coupon_id: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    discount_type: {
      type: String,
      enum: Object.values(DISCOUNT_TYPES),
      required: true
    },
    discount_value: {
      type: Number,
      required: true,
      min: 0
    },
    maximum_discount: {
      type: Number,
      required: true,
      min: 0
    },
    minimum_booking_amount: {
      type: Number,
      required: true,
      min: 0
    },
    usage_limit: {
      type: Number,
      required: true,
      min: 1
    },
    current_usage_count: {
      type: Number,
      default: 0,
      min: 0
    },
    per_customer_limit: {
      type: Number,
      default: 1,
      min: 1
    },
    valid_from: {
      type: Date,
      required: true
    },
    valid_until: {
      type: Date,
      required: true
    },
    applicable_property_id: {
      type: String,
      ref: 'Property',
      default: null
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'EXPIRED', 'DISABLED'],
      default: 'ACTIVE'
    }
  },
  { timestamps: false }
);

export const Coupon = mongoose.model('Coupon', couponSchema);
