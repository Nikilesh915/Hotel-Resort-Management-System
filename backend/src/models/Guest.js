import mongoose from 'mongoose';
import { USER_STATUS } from '../config/constants.js';

const guestSchema = new mongoose.Schema(
  {
    guest_id: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    user_id: {
      type: String,
      ref: 'User',
      required: true,
      unique: true
    },
    guest_number: {
      type: String,
      required: true,
      unique: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.ACTIVE
    },
    created_at: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: false }
);

export const Guest = mongoose.model('Guest', guestSchema);

