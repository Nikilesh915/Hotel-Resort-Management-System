# GrandStay — Hotel & Property Reservation Management Platform

A full-stack hotel and property reservation management platform built with the **MERN Stack** (MongoDB, Express.js, React, Node.js) and Tailwind CSS.

---

## Pre-Seeded Demo Accounts

All accounts use password: `Password123!`

| Role | Email | Password | Access Scope |
|---|---|---|---|
| **Super Admin** | `admin@example.com` | `Password123!` | All Properties Platform-wide |
| **Property Manager (Mumbai)** | `manager1@example.com` | `Password123!` | Grand Mumbai Hotel (`PROP-001`) only |
| **Property Manager (Goa)** | `manager2@example.com` | `Password123!` | Sunset Goa Resort (`PROP-002`) only |
| **Guest 1** | `guest1@example.com` | `Password123!` | Guest Bookings & Checkout |
| **Guest 2** | `guest2@example.com` | `Password123!` | Guest Bookings & Checkout |

---

## Complete Setup Instructions

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher

---

### Step 1: Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Install backend dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the `backend/` directory:
   ```env
   PORT=5000
   NODE_ENV=development
   JWT_SECRET=super_secret_jwt_key_hotel_platform_2026
   AUTO_SEED=true

   # Optional: Provide an external MongoDB URI.
   # If left commented out, an embedded MongoDB Replica Set runs in-memory automatically.
   # MONGODB_URI=mongodb://localhost:27017/hotel_reservation
   ```

4. **Seed Database (Automatic or Manual)**:
   * **Automatic**: The backend automatically seeds initial data from `mock_data.json` on startup when `AUTO_SEED=true` or when using in-memory MongoDB.
   * **Manual**:
     ```bash
     npm run seed
     ```

5. **Start Backend Server**:
   ```bash
   npm run dev
   ```
   *The backend runs at `http://localhost:5000`.*

---

### Step 2: Frontend Setup

1. **Open a new terminal and navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install frontend dependencies**:
   ```bash
   npm install
   ```

3. **Start Frontend Dev Server**:
   ```bash
   npm run dev
   ```
   *The frontend runs at `http://localhost:3000`.*

---

### Step 3: Production Build (Single-Port Serving)

To serve both frontend and backend from a single port (`http://localhost:5000`):

1. **Build Frontend**:
   ```bash
   cd frontend
   npm run build
   ```

2. **Start Backend**:
   ```bash
   cd ../backend
   npm start
   ```

3. **Access Application**:
   Open `http://localhost:5000` in your browser.

---

## Project Structure

```
├── Readme.md                    # Setup instructions & project structure
├── mock_data.json               # Seed dataset (Properties, Rooms, Pricing, Users)
│
├── backend/                     # Express.js REST API
│   ├── package.json
│   ├── .env                     # Backend environment configuration
│   ├── src/
│   │   ├── app.js               # Express application configuration
│   │   ├── server.js            # Server entrypoint & auto-seeder
│   │   ├── config/              # MongoDB connection & in-memory replica set
│   │   ├── controllers/         # Request handlers (auth, room, pricing, coupon, etc.)
│   │   ├── middleware/          # JWT auth, RBAC & centralized error handler
│   │   ├── models/              # Mongoose schemas (Room, Reservation, Allocation, etc.)
│   │   ├── routes/              # Express API route modules
│   │   ├── scripts/             # Database seeder (seed.js)
│   │   ├── services/            # Core business logic (pricing, allocation transactions)
│   │   └── utils/               # AppError and custom error classes
│   └── tests/                   # Challenge test suites
│
└── frontend/                    # React 18 + Vite SPA
    ├── package.json
    ├── vite.config.js           # Build settings & API proxy
    ├── tailwind.config.js       # Styling configuration
    ├── dist/                    # Compiled production build
    │   ├── index.html
    │   └── assets/
    │       ├── grandstay-app.js
    │       └── grandstay-styles.css
    └── src/
        ├── api/                 # Axios HTTP client with auth interceptor
        ├── components/          # Navbar, Footer, ProtectedRoute
        ├── context/             # AuthContext (JWT session state)
        ├── routes/              # AppRoutes & role-based route guards
        └── pages/
            ├── Home.jsx         # Guest landing page
            ├── Search.jsx       # Room search & availability filter
            ├── Checkout.jsx     # Pricing quote & coupon checkout
            ├── Payment.jsx      # Idempotent payment processing
            ├── MyBookings.jsx   # Guest reservations & cancellation
            ├── Login.jsx        # Login with quick 1-click demo accounts
            ├── Register.jsx     # Guest registration
            └── admin/           # Administrative portal:
                ├── AdminDashboard.jsx    # Overview metrics & module links
                ├── AdminProperties.jsx   # Property management
                ├── AdminRooms.jsx        # Room inventory, types & date blocking
                ├── AdminPricing.jsx      # Base, weekend & seasonal rates
                ├── AdminReservations.jsx # Reservation roster & check-in/out
                ├── AdminRefunds.jsx      # Refund & penalty ledger
                ├── AdminCoupons.jsx      # Coupon management & deletion
                └── AdminReports.jsx      # Operational reports & analytics
```
