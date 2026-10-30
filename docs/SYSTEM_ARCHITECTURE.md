# System Architecture: Hotel, Resort & Property Reservation Management Platform

## 1. High-Level Architecture
The platform is designed on a 3-tier MERN stack architecture:

```
[ Frontend: React.js + Vite + Tailwind CSS ]
                   |
             HTTPS / REST API (JSON) + JWT Bearer Auth
                   v
[ Backend: Node.js + Express.js Modular Architecture ]
    ├── Auth & RBAC Middleware
    ├── Concurrency Control Engine
    ├── Pricing Engine
    ├── State Machine Engine
    ├── Coupon Validation Service
    └── Idempotent Payment/Refund Service
                   |
             Mongoose ODM (with Replica Set Session Support)
                   v
[ Database: MongoDB with Multi-Document Transactions ]
    ├── Collections matching mock_data.json
    └── room_daily_allocations (Compound Unique Index: room_id + date)
```

## 2. Concurrency Control & Double-Booking Barrier

### Problem
When concurrent requests arrive at the same instant for the same physical room on overlapping dates, standard read-check-write logic fails due to race conditions.

### Architectural Solution
1. **Atomic Inventory Allocator (`room_daily_allocations`)**:
   - For every night of a reservation, an allocation document `{ room_id, date: 'YYYY-MM-DD', reservation_id }` is created.
   - The collection enforces a unique compound index:
     ```javascript
     { room_id: 1, date: 1 } -> UNIQUE
     ```
2. **MongoDB Transaction Session**:
   - The booking service runs inside a multi-document session with `readConcern: 'snapshot'` and `writeConcern: 'majority'`.
   - Concurrent bookings attempting to reserve the same room on the same date will collide on the unique index.
   - MongoDB throws an `E11000 Duplicate Key Error`.
   - The losing transaction rolls back immediately and returns HTTP 409 Conflict.
   - The winning transaction commits both the daily allocations and the reservation document.

## 3. Server-Side Financial Engine
Client requests to create a reservation only supply:
```json
{
  "property_id": "PROP-001",
  "room_id": "ROOM-101",
  "check_in_date": "2024-09-20T14:00:00Z",
  "check_out_date": "2024-09-25T11:00:00Z",
  "guests_count": 2,
  "coupon_code": "SAVE20"
}
```
The server pipeline executes:
1. `N = diffInDays(check_in_date, check_out_date)`
2. For each day, look up applicable `RoomPricing` records:
   `SEASONAL` > `WEEKEND` > `BASE`.
3. Compute `base_amount = sum(daily_rates)`.
4. Validate and apply `coupon_code` if present:
   `discount_amount = min(base_amount * (discount_value / 100), maximum_discount)`.
5. Compute tax: `tax_amount = round((base_amount - discount_amount) * 0.12)`.
6. Add service fee: `service_fee = 500`.
7. Compute `total_amount = base_amount - discount_amount + tax_amount + service_fee`.

## 4. Idempotency & Payment Safety
- Payment submissions require `idempotency_key`.
- Unique index on `payments.idempotency_key` rejects duplicate submissions.
- Duplicate requests return the previously settled transaction record without re-charging.

## 5. Security Architecture
- Passwords hashed with bcrypt (salt rounds = 10).
- Stateless JWT authentication via HTTP Authorization Header (`Bearer <token>`).
- Role-based authorization middleware enforcing least-privilege access.
- In-depth query scoping to prevent Insecure Direct Object References (IDOR).

