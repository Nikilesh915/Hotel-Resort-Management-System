import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Guest } from '../models/Guest.js';
import { Property } from '../models/Property.js';
import { RoomType } from '../models/RoomType.js';
import { Room } from '../models/Room.js';
import { RoomPricing } from '../models/RoomPricing.js';
import { Reservation } from '../models/Reservation.js';
import { RoomDailyAllocation } from '../models/RoomDailyAllocation.js';
import { Coupon } from '../models/Coupon.js';
import { CouponRedemption } from '../models/CouponRedemption.js';
import { Payment } from '../models/Payment.js';
import { Refund } from '../models/Refund.js';
import { AuditLog } from '../models/AuditLog.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const seedDatabase = async () => {
  console.log('--- Starting Database Seeding ---');
  const mockDataPath = path.resolve(__dirname, '../../../mock_data.json');
  
  if (!fs.existsSync(mockDataPath)) {
    throw new Error(`mock_data.json not found at ${mockDataPath}`);
  }

  const rawData = fs.readFileSync(mockDataPath, 'utf-8');
  const mockData = JSON.parse(rawData);

  // Default password hash for imported users: 'Password123!'
  const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

  // Clear existing collections
  await Promise.all([
    User.deleteMany({}),
    Guest.deleteMany({}),
    Property.deleteMany({}),
    RoomType.deleteMany({}),
    Room.deleteMany({}),
    RoomPricing.deleteMany({}),
    Reservation.deleteMany({}),
    RoomDailyAllocation.deleteMany({}),
    Coupon.deleteMany({}),
    CouponRedemption.deleteMany({}),
    Payment.deleteMany({}),
    Refund.deleteMany({}),
    AuditLog.deleteMany({})
  ]);

  console.log('Cleared existing collections.');

  // 1. Seed Users
  const usersWithHash = mockData.users.map(u => ({
    ...u,
    password_hash: defaultPasswordHash
  }));
  await User.insertMany(usersWithHash);
  console.log(`Seeded ${usersWithHash.length} users.`);

  // 2. Seed Guests
  await Guest.insertMany(mockData.guests);
  console.log(`Seeded ${mockData.guests.length} guests.`);

  // 3. Seed Properties
  await Property.insertMany(mockData.properties);
  console.log(`Seeded ${mockData.properties.length} properties.`);

  // 4. Seed Room Types
  await RoomType.insertMany(mockData.room_types);
  console.log(`Seeded ${mockData.room_types.length} room types.`);

  // 5. Seed Rooms
  await Room.insertMany(mockData.rooms);
  console.log(`Seeded ${mockData.rooms.length} rooms.`);

  // 6. Seed Room Pricing
  await RoomPricing.insertMany(mockData.room_pricing);
  console.log(`Seeded ${mockData.room_pricing.length} pricing rules.`);

  // 7. Seed Reservations
  await Reservation.insertMany(mockData.reservations);
  console.log(`Seeded ${mockData.reservations.length} reservations.`);

  // 8. Generate Room Daily Allocations for active reservations
  const allocations = [];
  for (const res of mockData.reservations) {
    if (['PENDING', 'CONFIRMED', 'CHECKED_IN'].includes(res.status)) {
      const checkIn = new Date(res.check_in_date);
      const checkOut = new Date(res.check_out_date);
      
      const current = new Date(checkIn);
      current.setUTCHours(0, 0, 0, 0);
      const end = new Date(checkOut);
      end.setUTCHours(0, 0, 0, 0);

      while (current < end) {
        allocations.push({
          room_id: res.room_id,
          date: current.toISOString().split('T')[0],
          reservation_id: res.reservation_id,
          status: 'ALLOCATED'
        });
        current.setUTCDate(current.getUTCDate() + 1);
      }
    }
  }
  if (allocations.length > 0) {
    await RoomDailyAllocation.insertMany(allocations);
    console.log(`Created ${allocations.length} room daily allocations.`);
  }

  // 9. Seed Coupons
  const couponsWithUsage = mockData.coupons.map(c => {
    const redemptions = mockData.coupon_redemptions.filter(r => r.coupon_id === c.coupon_id && r.status === 'SUCCESS');
    return {
      ...c,
      current_usage_count: redemptions.length
    };
  });
  await Coupon.insertMany(couponsWithUsage);
  console.log(`Seeded ${couponsWithUsage.length} coupons.`);

  // 10. Seed Coupon Redemptions
  await CouponRedemption.insertMany(mockData.coupon_redemptions);
  console.log(`Seeded ${mockData.coupon_redemptions.length} coupon redemptions.`);

  // 11. Seed Payments
  await Payment.insertMany(mockData.payments);
  console.log(`Seeded ${mockData.payments.length} payments.`);

  // 12. Seed Refunds
  await Refund.insertMany(mockData.refunds);
  console.log(`Seeded ${mockData.refunds.length} refunds.`);

  // 13. Seed Audit Logs
  await AuditLog.insertMany(mockData.audit_logs);
  console.log(`Seeded ${mockData.audit_logs.length} audit logs.`);

  console.log('--- Database Seeding Complete ---');
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  connectDB()
    .then(async () => {
      await seedDatabase();
      await disconnectDB();
      process.exit(0);
    })
    .catch(err => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}
