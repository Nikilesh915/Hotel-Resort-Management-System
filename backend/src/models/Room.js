import mongoose from 'mongoose';
import { ROOM_STATUS } from '../config/constants.js';

const roomSchema = new mongoose.Schema(
  {
    room_id: {
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
    room_type_id: {
      type: String,
      ref: 'RoomType',
      required: true,
      index: true
    },
    room_number: {
      type: String,
      required: true,
      trim: true
    },
    floor: {
      type: Number,
      required: true
    },
    max_guests: {
      type: Number,
      required: true,
      min: 1
    },
    status: {
      type: String,
      enum: Object.values(ROOM_STATUS),
      default: ROOM_STATUS.AVAILABLE
    }
  },
  { timestamps: false }
);

roomSchema.index({ property_id: 1, room_number: 1 }, { unique: true });

export const Room = mongoose.model('Room', roomSchema);

