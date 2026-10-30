# REST API Documentation: Hotel, Resort & Property Reservation Management Platform

## Base URL
`/api`

## Standard Response Format
```json
// Success Response
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}

// Error Response
{
  "success": false,
  "error": {
    "code": "ROOM_UNAVAILABLE",
    "message": "Selected room is no longer available for the requested dates"
  }
}
```

---

## 1. Authentication APIs

### `POST /api/auth/register`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "Password123!",
    "phone": "+91-9876543210",
    "address": "123 Main St, Mumbai"
  }
  ```
- **Response**: `201 Created` with JWT token, user object, and linked guest object.

### `POST /api/auth/login`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "email": "guest1@example.com",
    "password": "Password123!"
  }
  ```
- **Response**: `200 OK` with JWT token and user role.

### `GET /api/auth/me`
- **Access**: Authenticated (`Bearer <token>`)
- **Response**: Current user profile with guest details.

---

## 2. Properties & Rooms APIs

### `GET /api/properties`
- **Access**: Public
- **Query Params**: `city`, `property_type`, `status`
- **Response**: List of active properties.

### `GET /api/properties/:id`
- **Access**: Public
- **Response**: Property details including room types and amenities.

### `POST /api/properties`
- **Access**: `ADMIN`
- **Request Body**: Property details (`name`, `property_code`, `property_type`, `city`, `address`, `manager_user_id`).

### `GET /api/properties/:id/rooms`
- **Access**: Public / Authenticated
- **Response**: Physical rooms for the property.

### `PUT /api/rooms/:id/status`
- **Access**: `ADMIN`, `PROPERTY_MANAGER`
- **Request Body**: `{ "status": "AVAILABLE" | "MAINTENANCE" | "INACTIVE" }`

---

## 3. Search & Pricing APIs

### `GET /api/search/availability`
- **Access**: Public
- **Query Params**:
  - `property_id` (optional)
  - `city` (optional)
  - `check_in_date` (ISO string)
  - `check_out_date` (ISO string)
  - `guests_count` (integer)
- **Response**: List of available rooms with estimated calculated price breakdown.

### `POST /api/pricing/quote`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "room_id": "ROOM-101",
    "check_in_date": "2024-09-20T14:00:00Z",
    "check_out_date": "2024-09-25T11:00:00Z",
    "guests_count": 2,
    "coupon_code": "SAVE20"
  }
  ```
- **Response**:
  ```json
  {
    "nights": 5,
    "base_amount": 15000.00,
    "discount_amount": 3000.00,
    "tax_amount": 1440.00,
    "service_fee": 500.00,
    "total_amount": 13940.00
  }
  ```

---

## 4. Reservation APIs

### `POST /api/reservations`
- **Access**: `GUEST`, `ADMIN`
- **Request Body**:
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
- **Response**: `201 Created` with reservation record (status: `PENDING`).
- **Errors**: `409 Conflict` (room already booked for dates), `400 Bad Request` (invalid dates/coupon).

### `GET /api/reservations/my`
- **Access**: `GUEST`
- **Response**: Array of reservations created by authenticated guest.

### `GET /api/reservations/:id`
- **Access**: Authenticated (Owner, Assigned Manager, or Admin)
- **Response**: Full reservation details with payment and refund history.
- **Errors**: `404 Not Found` if requested by non-owner guest.

### `PUT /api/reservations/:id/status`
- **Access**: `ADMIN`, `PROPERTY_MANAGER`
- **Request Body**: `{ "status": "CHECKED_IN" | "CHECKED_OUT" }`
- **Errors**: `400 Bad Request` if transition is invalid according to state machine.

---

## 5. Payment & Refund APIs

### `POST /api/payments`
- **Access**: `GUEST`, `ADMIN`
- **Request Body**:
  ```json
  {
    "reservation_id": "RES-001",
    "payment_method": "CARD",
    "idempotency_key": "idem-pay-uuid-1234"
  }
  ```
- **Response**: `200 OK` with payment transaction details; transitions reservation to `CONFIRMED`.
- **Errors**: `400 Bad Request` if reservation already paid; returns cached payment if `idempotency_key` is replayed.

### `POST /api/reservations/:id/cancel`
- **Access**: Authenticated (Owner Guest or Admin)
- **Request Body**:
  ```json
  {
    "reason": "Change of travel plans"
  }
  ```
- **Response**: `200 OK` with refund summary: `original_amount`, `cancellation_fee`, `refund_amount`. Transitions reservation to `CANCELLED` or `REFUNDED`.

---

## 6. Admin & Reporting APIs

### `GET /api/admin/dashboard/stats`
- **Access**: `ADMIN`, `PROPERTY_MANAGER`
- **Response**: Aggregated statistics:
  ```json
  {
    "total_revenue": 114440.00,
    "active_bookings": 3,
    "occupancy_rate": 60.0,
    "cancellation_rate": 20.0
  }
  ```

### `GET /api/admin/audit-logs`
- **Access**: `ADMIN`
- **Query Params**: `entity_type`, `action`, `limit`, `skip`
- **Response**: Immutable system audit logs.

