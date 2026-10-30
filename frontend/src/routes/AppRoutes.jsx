import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home } from '../pages/Home';
import { SearchPage } from '../pages/Search';
import { Checkout } from '../pages/Checkout';
import { PaymentPage } from '../pages/Payment';
import { MyBookings } from '../pages/MyBookings';
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { AdminProperties } from '../pages/admin/AdminProperties';
import { AdminRooms } from '../pages/admin/AdminRooms';
import { AdminReservations } from '../pages/admin/AdminReservations';
import { AdminCoupons } from '../pages/admin/AdminCoupons';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Guest Protected Routes */}
      <Route
        path="/checkout/:roomId"
        element={
          <ProtectedRoute allowedRoles={['GUEST', 'ADMIN']}>
            <Checkout />
          </ProtectedRoute>
        }
      />
      <Route
        path="/payment/:reservationId"
        element={
          <ProtectedRoute allowedRoles={['GUEST', 'ADMIN']}>
            <PaymentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-bookings"
        element={
          <ProtectedRoute allowedRoles={['GUEST']}>
            <MyBookings />
          </ProtectedRoute>
        }
      />

      {/* Admin / Manager Protected Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'PROPERTY_MANAGER']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/properties"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'PROPERTY_MANAGER']}>
            <AdminProperties />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/rooms"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'PROPERTY_MANAGER']}>
            <AdminRooms />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reservations"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'PROPERTY_MANAGER']}>
            <AdminReservations />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/coupons"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminCoupons />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

