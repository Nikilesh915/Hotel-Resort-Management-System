import mongoose from 'mongoose';
import { USER_STATUS } from '../config/constants.js';

const roomTypeSchema = new mongoose.Schema(
  {
    room_type_id: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    property_id: {
      type: String,
      ref: 'Property',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    max_guests: {
      type: Number,
      required: true,
      min: 1
    },
    base_price_per_night: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.ACTIVE
    }
  },
  { timestamps: false }
);

export const RoomType = mongoose.model('RoomType', roomTypeSchema);
