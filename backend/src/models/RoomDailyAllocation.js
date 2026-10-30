import mongoose from 'mongoose';

const roomDailyAllocationSchema = new mongoose.Schema(
  {
    room_id: {
      type: String,
      ref: 'Room',
      required: true,
      index: true
    },
    date: {
      type: String, // Format: 'YYYY-MM-DD'
      required: true
    },
    reservation_id: {
      type: String,
      ref: 'Reservation',
      required: true
    },
    status: {
      type: String,
      enum: ['ALLOCATED', 'BLOCKED'],
      default: 'ALLOCATED'
    }
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

// Compound Unique Index: Makes double-booking physically impossible at the database engine level
roomDailyAllocationSchema.index({ room_id: 1, date: 1 }, { unique: true });

export const RoomDailyAllocation = mongoose.model('RoomDailyAllocation', roomDailyAllocationSchema);

