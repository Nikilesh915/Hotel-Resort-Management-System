# Engineering & Agent Guidelines: Hotel Reservation Platform

## 1. Prime Directive
Never weaken or bypass concurrency control, price calculation integrity, or role authorization. Every critical business rule must be enforced by the Node.js/Express backend and verified against the database.

## 2. Invariants
- **No Client Price Calculation**: Never trust amounts received in request bodies. Always recalculate base rates, seasonal adjustments, weekend rates, taxes, discounts, and totals from database records.
- **Double-Booking Prevention**: Every reservation booking must acquire date allocation slots in `room_daily_allocations` inside a session transaction. If duplicate key error occurs, roll back and return HTTP 409.
- **State Machine Rules**: Only valid transitions are allowed. A terminal state cannot be altered.
- **Idempotent Operations**: Payments and refunds must check `idempotency_key` before executing debit/credit logic.
- **IDOR Protection**: Guests can only view and manage their own resources. The query must always include `guest_id: req.user.guest_id`.

## 3. Technology Stack & Coding Conventions
- **Backend**: Node.js (v18+), Express.js, Mongoose.
- **Frontend**: React 18+, Vite, Tailwind CSS, React Router v6, Axios.
- **Module Format**: ES Modules (`"type": "module"`).
- **Error Handling**: Use centralized error handling with custom error classes (`NotFoundError`, `BadRequestError`, `UnauthorizedError`, `ConflictError`).
