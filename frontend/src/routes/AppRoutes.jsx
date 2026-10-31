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
import { AdminPricing } from '../pages/admin/AdminPricing';
import { AdminRefunds } from '../pages/admin/AdminRefunds';
import { AdminReports } from '../pages/admin/AdminReports';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const fallback = ['ADMIN', 'PROPERTY_MANAGER'].includes(user.role) ? '/admin' : '/';
    return <Navigate to={fallback} replace />;
  }

  return children;
};

export const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) return null;

  const isAdminOrManager = user && ['ADMIN', 'PROPERTY_MANAGER'].includes(user.role);

  return (
    <Routes>
      {/* Home Page: Automatically routes administrators to their Admin / Manager Portal */}
      <Route
        path="/"
        element={isAdminOrManager ? <Navigate to="/admin" replace /> : <Home />}
      />

      {/* Search Stays: Only accessible to guests/public; administrators are redirected to /admin */}
      <Route
        path="/search"
        element={isAdminOrManager ? <Navigate to="/admin" replace /> : <SearchPage />}
      />

      <Route
        path="/login"
        element={isAdminOrManager ? <Navigate to="/admin" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={isAdminOrManager ? <Navigate to="/admin" replace /> : <Register />}
      />

      {/* Guest Protected Routes */}
      <Route
        path="/checkout/:roomId"
        element={
          <ProtectedRoute allowedRoles={['GUEST']}>
            <Checkout />
          </ProtectedRoute>
        }
      />
      <Route
        path="/payment/:reservationId"
        element={
          <ProtectedRoute allowedRoles={['GUEST']}>
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
          <ProtectedRoute allowedRoles={['ADMIN', 'PROPERTY_MANAGER']}>
            <AdminCoupons />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/pricing"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'PROPERTY_MANAGER']}>
            <AdminPricing />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/refunds"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'PROPERTY_MANAGER']}>
            <AdminRefunds />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'PROPERTY_MANAGER']}>
            <AdminReports />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to={isAdminOrManager ? "/admin" : "/"} replace />} />
    </Routes>
  );
};
