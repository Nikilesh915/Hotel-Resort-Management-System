# Database Schema: Hotel, Resort & Property Reservation Management Platform

## Collections Overview

| Collection | Description | Primary Key / Unique Constraints |
| :--- | :--- | :--- |
| `users` | User accounts for auth | `user_id` (unique), `email` (unique) |
| `guests` | Guest profile details | `guest_id` (unique), `guest_number` (unique), `user_id` (unique) |
| `properties` | Hotel & resort properties | `property_id` (unique), `property_code` (unique) |
| `room_types` | Room categories per property | `room_type_id` (unique) |
| `rooms` | Physical room inventory | `room_id` (unique), `{ property_id, room_number }` (unique) |
| `room_pricing` | Base, seasonal, weekend pricing | `pricing_id` (unique), `{ room_type_id, start_date, end_date }` |
| `reservations` | Guest booking records | `reservation_id` (unique), `reservation_number` (unique) |
| `room_daily_allocations` | Concurrency lock slots | `{ room_id, date }` (unique compound index) |
| `coupons` | Promo coupons | `coupon_id` (unique), `code` (unique) |
| `coupon_redemptions` | Coupon usage history | `redemption_id` (unique), `reservation_id` (unique) |
| `payments` | Monetary transactions | `payment_id` (unique), `payment_reference` (unique), `idempotency_key` (unique) |
| `refunds` | Refund records | `refund_id` (unique), `refund_reference` (unique), `reservation_id` (unique) |
| `audit_logs` | System audit trail | `audit_id` (unique) |

---

## Detailed Data Dictionary

### 1. `users`
```javascript
{
  user_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password_hash: { type: String, required: true },
  role: { type: String, enum: ['ADMIN', 'PROPERTY_MANAGER', 'GUEST'], default: 'GUEST' },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}
```

### 2. `guests`
```javascript
{
  guest_id: { type: String, required: true, unique: true },
  user_id: { type: String, ref: 'User', required: true, unique: true },
  guest_number: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  created_at: { type: Date, default: Date.now }
}
```

### 3. `properties`
```javascript
{
  property_id: { type: String, required: true, unique: true },
  property_code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  property_type: { type: String, enum: ['HOTEL', 'RESORT', 'VILLA', 'APARTMENT'], required: true },
  address: { type: String, required: true },
  city: { type: String, required: true, index: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  manager_user_id: { type: String, ref: 'User', required: true },
  created_at: { type: Date, default: Date.now }
}
```

### 4. `room_types`
```javascript
{
  room_type_id: { type: String, required: true, unique: true },
  property_id: { type: String, ref: 'Property', required: true, index: true },
  name: { type: String, required: true },
  description: { type: String },
  max_guests: { type: Number, required: true, min: 1 },
  base_price_per_night: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' }
}
```

### 5. `rooms`
```javascript
{
  room_id: { type: String, required: true, unique: true },
  property_id: { type: String, ref: 'Property', required: true, index: true },
  room_type_id: { type: String, ref: 'RoomType', required: true, index: true },
  room_number: { type: String, required: true },
  floor: { type: Number, required: true },
  max_guests: { type: Number, required: true },
  status: { type: String, enum: ['AVAILABLE', 'MAINTENANCE', 'INACTIVE'], default: 'AVAILABLE' }
}
// Compound unique index: { property_id: 1, room_number: 1 }
```

### 6. `room_pricing`
```javascript
{
  pricing_id: { type: String, required: true, unique: true },
  room_type_id: { type: String, ref: 'RoomType', required: true, index: true },
  start_date: { type: Date, required: true },
  end_date: { type: Date, required: true },
  price_per_night: { type: Number, required: true, min: 0 },
  pricing_type: { type: String, enum: ['BASE', 'SEASONAL', 'WEEKEND'], default: 'BASE' },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' }
}
```

### 7. `reservations`
```javascript
{
  reservation_id: { type: String, required: true, unique: true },
  reservation_number: { type: String, required: true, unique: true },
  guest_id: { type: String, ref: 'Guest', required: true, index: true },
  property_id: { type: String, ref: 'Property', required: true, index: true },
  room_id: { type: String, ref: 'Room', required: true, index: true },
  check_in_date: { type: Date, required: true },
  check_out_date: { type: Date, required: true },
  guests_count: { type: Number, required: true, min: 1 },
  base_amount: { type: Number, required: true },
  discount_amount: { type: Number, default: 0.00 },
  tax_amount: { type: Number, required: true },
  service_fee: { type: Number, required: true },
  total_amount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'REFUND_PENDING', 'REFUNDED'],
    default: 'PENDING',
    index: true
  },
  cancellation_policy: { type: String, enum: ['FLEXIBLE', 'MODERATE', 'STRICT'], default: 'FLEXIBLE' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}
```

### 8. `room_daily_allocations` (Physical Concurrency Lock)
```javascript
{
  room_id: { type: String, ref: 'Room', required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  reservation_id: { type: String, ref: 'Reservation', required: true },
  status: { type: String, enum: ['ALLOCATED', 'BLOCKED'], default: 'ALLOCATED' }
}
// Unique compound index: { room_id: 1, date: 1 } -> Enforces physical impossibility of double booking
```

### 9. `coupons`
```javascript
{
  coupon_id: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true, uppercase: true },
  discount_type: { type: String, enum: ['PERCENTAGE', 'FIXED'], required: true },
  discount_value: { type: Number, required: true },
  maximum_discount: { type: Number, required: true },
  minimum_booking_amount: { type: Number, required: true },
  usage_limit: { type: Number, required: true },
  current_usage_count: { type: Number, default: 0 },
  per_customer_limit: { type: Number, default: 1 },
  valid_from: { type: Date, required: true },
  valid_until: { type: Date, required: true },
  applicable_property_id: { type: String, ref: 'Property', default: null },
  status: { type: String, enum: ['ACTIVE', 'EXPIRED', 'DISABLED'], default: 'ACTIVE' }
}
```

### 10. `payments`
```javascript
{
  payment_id: { type: String, required: true, unique: true },
  payment_reference: { type: String, required: true, unique: true },
  reservation_id: { type: String, ref: 'Reservation', required: true, index: true },
  guest_id: { type: String, ref: 'Guest', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  payment_method: { type: String, enum: ['CARD', 'UPI', 'NET_BANKING'], required: true },
  status: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'], required: true },
  idempotency_key: { type: String, required: true, unique: true },
  paid_at: { type: Date, default: null },
  created_at: { type: Date, default: Date.now }
}
```

### 11. `refunds`
```javascript
{
  refund_id: { type: String, required: true, unique: true },
  refund_reference: { type: String, required: true, unique: true },
  reservation_id: { type: String, ref: 'Reservation', required: true, unique: true },
  payment_id: { type: String, ref: 'Payment', required: true },
  guest_id: { type: String, ref: 'Guest', required: true },
  original_amount: { type: Number, required: true },
  cancellation_fee: { type: Number, required: true },
  refund_amount: { type: Number, required: true },
  reason: { type: String },
  status: { type: String, enum: ['SUCCESS', 'PENDING', 'FAILED'], default: 'SUCCESS' },
  idempotency_key: { type: String, required: true, unique: true },
  refunded_at: { type: Date, default: Date.now }
}
```

### 12. `audit_logs`
```javascript
{
  audit_id: { type: String, required: true, unique: true },
  user_id: { type: String, required: true, index: true },
  action: { type: String, required: true },
  entity_type: { type: String, enum: ['RESERVATION', 'PAYMENT', 'REFUND', 'PROPERTY', 'ROOM', 'COUPON'] },
  entity_id: { type: String, required: true, index: true },
  metadata: { type: mongoose.Schema.Types.Mixed },
  created_at: { type: Date, default: Date.now }
}
```
