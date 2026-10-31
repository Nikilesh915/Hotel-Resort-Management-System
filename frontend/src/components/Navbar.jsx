import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, User, LogOut, Calendar, Shield, Hotel } from 'lucide-react';

export const Navbar = () => {
  const { user, guest, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdminOrManager = user && ['ADMIN', 'PROPERTY_MANAGER'].includes(user.role);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-3">
            <Link
              to={isAdminOrManager ? '/admin' : '/'}
              className="flex items-center space-x-2 text-blue-600 font-black text-2xl tracking-tight"
            >
              <Hotel className="w-7 h-7 text-blue-600" />
              <span>Grand<span className="text-gray-900">Stay</span></span>
            </Link>
            <span className="hidden sm:inline-block bg-blue-50 text-blue-700 text-xs px-2.5 py-0.5 rounded-full font-bold border border-blue-100">
              Hotels & Resorts
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Search Stays: Visible only for Guests and unauthenticated visitors */}
            {!isAdminOrManager && (
              <Link
                to="/search"
                className="text-gray-700 hover:text-blue-600 font-bold text-xs sm:text-sm transition"
              >
                Search Stays
              </Link>
            )}

            {/* Administrator / Property Manager Navigation */}
            {isAdminOrManager && (
              <div className="hidden md:flex items-center space-x-3 text-xs font-semibold text-gray-600">
                <Link to="/admin" className="hover:text-blue-600 transition">Dashboard</Link>
                <Link to="/admin/properties" className="hover:text-blue-600 transition">Properties</Link>
                <Link to="/admin/rooms" className="hover:text-blue-600 transition">Rooms</Link>
                <Link to="/admin/pricing" className="hover:text-blue-600 transition">Pricing</Link>
                <Link to="/admin/reservations" className="hover:text-blue-600 transition">Reservations</Link>
                <Link to="/admin/refunds" className="hover:text-blue-600 transition">Refunds</Link>
                <Link to="/admin/coupons" className="hover:text-blue-600 transition">Coupons</Link>
                <Link to="/admin/reports" className="hover:text-blue-600 transition">Reports</Link>
              </div>
            )}

            {user ? (
              <div className="flex items-center space-x-3">
                {user.role === 'GUEST' && (
                  <Link
                    to="/my-bookings"
                    className="flex items-center space-x-1.5 text-gray-700 hover:text-blue-600 text-xs font-bold bg-blue-50/60 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition"
                  >
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>My Bookings</span>
                  </Link>
                )}

                {isAdminOrManager && (
                  <Link
                    to="/admin"
                    className="flex items-center space-x-1.5 text-white bg-blue-600 hover:bg-blue-700 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition"
                  >
                    <Shield className="w-3.5 h-3.5 text-white" />
                    <span>{user.role === 'ADMIN' ? 'Super Admin' : 'Manager Portal'}</span>
                  </Link>
                )}

                <div className="flex items-center space-x-2 pl-2 border-l border-gray-200">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-bold text-gray-900 leading-tight">{user.name}</p>
                    <p className="text-[10px] text-blue-600 font-bold uppercase">{user.role}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    title="Logout"
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600 font-bold text-xs sm:text-sm px-3 py-1.5 rounded-lg transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-lg shadow-sm transition"
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
