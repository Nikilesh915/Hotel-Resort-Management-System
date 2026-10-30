import mongoose from 'mongoose';
import { PROPERTY_TYPES, USER_STATUS } from '../config/constants.js';

const propertySchema = new mongoose.Schema(
  {
    property_id: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    property_code: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    property_type: {
      type: String,
      enum: Object.values(PROPERTY_TYPES),
      required: true
    },
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true,
      index: true
    },
    state: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.ACTIVE
    },
    manager_user_id: {
      type: String,
      ref: 'User',
      required: true
    },
    created_at: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: false }
);

export const Property = mongoose.model('Property', propertySchema);
