import mongoose from 'mongoose';
import { PRICING_TYPES, USER_STATUS } from '../config/constants.js';

const roomPricingSchema = new mongoose.Schema(
  {
    pricing_id: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    room_type_id: {
      type: String,
      ref: 'RoomType',
      required: true,
      index: true
    },
    start_date: {
      type: Date,
      required: true
    },
    end_date: {
      type: Date,
      required: true
    },
    price_per_night: {
      type: Number,
      required: true,
      min: 0
    },
    pricing_type: {
      type: String,
      enum: Object.values(PRICING_TYPES),
      default: PRICING_TYPES.BASE
    },
    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.ACTIVE
    }
  },
  { timestamps: false }
);

roomPricingSchema.index({ room_type_id: 1, start_date: 1, end_date: 1 });

export const RoomPricing = mongoose.model('RoomPricing', roomPricingSchema);

