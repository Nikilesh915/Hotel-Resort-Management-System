# Project Requirements: Hotel, Resort & Property Reservation Management Platform

## 1. Overview
The platform provides reservation management for properties (Hotels, Resorts, Villas). Guests can search available rooms, inspect pricing, apply promo coupons, complete bookings, manage their reservations, and process cancellations and refunds. Hotel administrators can manage properties, room types, physical rooms, seasonal/weekend pricing, reservations, coupons, and view operational reports.

## 2. Core Entities & Dataset Requirements
The platform must support and faithfully preserve the entities and relationships defined in `mock_data.json`:
- **Users**: Admin, Property Managers, and Guests.
- **Guests**: Detailed guest profile linked to User accounts (1:1).
- **Properties**: Physical hotel and resort establishments.
- **Room Types**: Categorization of rooms with capacity and base night pricing.
- **Rooms**: Physical inventory with room numbers and status (`AVAILABLE`, `MAINTENANCE`, `INACTIVE`).
- **Room Pricing**: Pricing rules with seasonal and weekend overrides.
- **Reservations**: Booking records with dates, guest count, calculated financials, and lifecycle status.
- **Coupons & Redemptions**: Promotional discount rules and usage tracking.
- **Payments**: Financial transactions with idempotency keys and statuses.
- **Refunds**: Policy-driven refund disbursements with idempotency verification.
- **Audit Logs**: Immutable log entries for system actions.

## 3. User Roles & Capabilities

### 3.1 Guests
- Register an account and log in via JWT authentication.
- Search properties by city, dates, and guest capacity.
- View available rooms with dynamic pricing breakdown.
- Apply eligible coupons with validation of discount value and eligibility.
- Make reservations with transaction-safe concurrency protection.
- View personal booking history and reservation details.
- Cancel eligible reservations in accordance with property cancellation policies.
- View receipts for payments and refunds.

### 3.2 Hotel Administrators & Property Managers
- Manage properties (Create, Update, Deactivate).
- Manage room types and set base prices and maximum guest capacities.
- Manage physical room inventory and toggle maintenance status.
- Configure seasonal and weekend pricing rules.
- View master reservation rosters with filtering across properties and dates.
- Execute valid state transitions (`CONFIRMED` -> `CHECKED_IN` -> `CHECKED_OUT`).
- Process cancellations and approve/view refunds.
- Create and manage promo coupons (limits, discounts, expiration).
- View operational reports: Occupancy rate, RevPAR, total revenue, cancellation rate.

## 4. The Eight Technical Challenges & Strict Rules

1. **Double-Booking Prevention**:
   - The same physical room must never be reserved by two guests for overlapping dates under any concurrent load.
   - Enforced server-side via MongoDB multi-document transactions and an atomic daily allocation table with a unique compound index `{ room_id: 1, date: 1 }`.
2. **Date-Range Overlap Detection**:
   - Overlap condition: `existing.check_in < new.check_out AND existing.check_out > new.check_in`.
   - Adjacent bookings (check-out 11:00 AM vs check-in 14:00 PM on the same date) are explicitly permitted.
   - Cancelled and refunded reservations do not block room inventory.
3. **Price Manipulation Prevention**:
   - All financial amounts (`base_amount`, `tax_amount`, `service_fee`, `total_amount`) are computed exclusively server-side.
   - Any client-submitted financial amounts in request payloads are strictly ignored and stripped.
4. **Coupon Abuse Prevention**:
   - Expiration dates, minimum booking amounts, property restrictions, global usage limits, and per-customer limits are strictly validated.
   - Coupon redemptions are atomically incremented within the booking transaction.
5. **Reservation State Machine**:
   - Enforce linear lifecycle: `PENDING` -> `CONFIRMED` -> `CHECKED_IN` -> `CHECKED_OUT`.
   - Cancellation transitions: `PENDING` -> `CANCELLED`, or `CONFIRMED` -> `CANCELLED` / `REFUND_PENDING` -> `REFUNDED`.
   - Invalid transitions (e.g. `CHECKED_OUT` -> `CONFIRMED`, checking in a cancelled booking) are rejected.
6. **Duplicate Payment & Idempotency**:
   - Every payment request must supply an `idempotency_key`.
   - Replayed requests with the same key return the original payment record without charging twice.
7. **Cancellation & Refund Integrity**:
   - Cancellation fees and refunds are calculated server-side based on the property cancellation policy (`FLEXIBLE`, `MODERATE`, `STRICT`) and time remaining until check-in.
   - Duplicate refunds are strictly prevented via unique reservation constraints.
8. **Unauthorized Reservation & IDOR Protection**:
   - Guests cannot view, update, or cancel reservations belonging to other guests.
   - Property managers are scoped to their assigned properties.
   - Guests cannot modify room inventory or pricing.
