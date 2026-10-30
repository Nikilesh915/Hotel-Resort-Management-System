import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, User, LogOut, Calendar, Shield, Hotel, Sparkles } from 'lucide-react';

export const Navbar = () => {
  const { user, guest, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-2 text-brand-600 font-bold text-xl tracking-tight">
              <Hotel className="w-7 h-7 text-teal-600" />
              <span>Grand<span className="text-gray-900">Stay</span></span>
            </Link>
            <span className="hidden sm:inline-block bg-teal-50 text-teal-700 text-xs px-2.5 py-0.5 rounded-full font-medium border border-teal-100">
              Resort & Property
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              to="/search"
              className="text-gray-600 hover:text-teal-600 font-medium text-sm transition"
            >
              Browse Rooms
            </Link>

            {user ? (
              <div className="flex items-center space-x-3">
                {user.role === 'GUEST' && (
                  <Link
                    to="/my-bookings"
                    className="flex items-center space-x-1.5 text-gray-700 hover:text-teal-600 text-sm font-medium bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 transition"
                  >
                    <Calendar className="w-4 h-4 text-teal-600" />
                    <span>My Bookings</span>
                  </Link>
                )}

                {['ADMIN', 'PROPERTY_MANAGER'].includes(user.role) && (
                  <Link
                    to="/admin"
                    className="flex items-center space-x-1.5 text-white bg-slate-900 hover:bg-slate-800 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition"
                  >
                    <Shield className="w-3.5 h-3.5 text-teal-400" />
                    <span>{user.role === 'ADMIN' ? 'Super Admin' : 'Manager Portal'}</span>
                  </Link>
                )}

                <div className="flex items-center space-x-2 pl-2 border-l border-gray-200">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-bold text-gray-900 leading-tight">{user.name}</p>
                    <p className="text-[10px] text-gray-500 font-medium">{user.role}</p>
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
                  className="text-gray-700 hover:text-gray-900 font-medium text-sm px-3 py-1.5 rounded-lg transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm px-4 py-2 rounded-lg shadow-sm transition"
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
