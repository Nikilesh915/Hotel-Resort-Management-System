import mongoose from 'mongoose';

const couponRedemptionSchema = new mongoose.Schema(
  {
    redemption_id: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    coupon_id: {
      type: String,
      ref: 'Coupon',
      required: true,
      index: true
    },
    reservation_id: {
      type: String,
      ref: 'Reservation',
      required: true,
      unique: true
    },
    guest_id: {
      type: String,
      ref: 'Guest',
      required: true,
      index: true
    },
    discount_amount: {
      type: Number,
      required: true,
      min: 0
    },
    redeemed_at: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'CANCELLED'],
      default: 'SUCCESS'
    }
  },
  { timestamps: false }
);

couponRedemptionSchema.index({ coupon_id: 1, guest_id: 1 });

export const CouponRedemption = mongoose.model('CouponRedemption', couponRedemptionSchema);
