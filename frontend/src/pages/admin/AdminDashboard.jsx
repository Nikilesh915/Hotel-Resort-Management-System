import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  Building2,
  BedDouble,
  CalendarCheck,
  Tag,
  TrendingUp,
  Users,
  IndianRupee,
  Loader2,
  Sparkles,
  Receipt,
  BarChart3
} from 'lucide-react';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard/stats')
      .then(res => setStats(res.data.data))
      .catch(err => console.error('Failed to load dashboard stats:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">
            {user?.role === 'ADMIN' ? 'Super Admin Dashboard' : 'Property Manager Portal'}
          </h1>
          <p className="text-xs text-gray-500 mt-1">Real-time inventory occupancy, financial transactions, and reservation analytics.</p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/admin/reports"
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-sm transition flex items-center space-x-1.5"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>View Full Reports</span>
          </Link>
          <span className="bg-blue-50 text-blue-700 font-mono text-xs font-bold px-3 py-1.5 rounded-lg border border-blue-200">
            Role: {user?.role}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center text-blue-600">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : stats ? (
        <>
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-gray-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Net Revenue</span>
                <IndianRupee className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-gray-900">
                ₹{stats.financials.net_revenue?.toLocaleString()}
              </p>
              <p className="text-[11px] text-gray-400">
                Gross: ₹{stats.financials.gross_revenue?.toLocaleString()} (Refunded: ₹{stats.financials.total_refunded?.toLocaleString()})
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-gray-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Occupancy Rate</span>
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-black text-blue-600">
                {stats.kpis.occupancy_rate}
              </p>
              <p className="text-[11px] text-gray-400">
                {stats.reservations.active} occupied / {stats.inventory.total_rooms} total rooms
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-gray-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Active Bookings</span>
                <CalendarCheck className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-black text-gray-900">
                {stats.reservations.confirmed + stats.reservations.checked_in}
              </p>
              <p className="text-[11px] text-gray-400">
                {stats.reservations.confirmed} confirmed • {stats.reservations.checked_in} in-house
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-gray-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Cancellation Rate</span>
                <Users className="w-4 h-4 text-rose-600" />
              </div>
              <p className="text-2xl font-black text-gray-900">
                {stats.reservations.cancellation_rate}
              </p>
              <p className="text-[11px] text-gray-400">
                {stats.reservations.cancelled + stats.reservations.refunded} cancellations
              </p>
            </div>
          </div>

          {/* Quick Management Navigation Grid */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Administrative Modules</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <Link
                to="/admin/properties"
                className="bg-white p-5 rounded-2xl border border-gray-200 hover:border-blue-500 hover:shadow-md transition space-y-2.5 group"
              >
                <Building2 className="w-6 h-6 text-blue-600 group-hover:scale-110 transition" />
                <h3 className="text-sm font-bold text-gray-900">Properties</h3>
                <p className="text-xs text-gray-500">Catalog properties, modify details, and assign managers.</p>
              </Link>

              <Link
                to="/admin/rooms"
                className="bg-white p-5 rounded-2xl border border-gray-200 hover:border-blue-500 hover:shadow-md transition space-y-2.5 group"
              >
                <BedDouble className="w-6 h-6 text-blue-600 group-hover:scale-110 transition" />
                <h3 className="text-sm font-bold text-gray-900">Rooms & Availability</h3>
                <p className="text-xs text-gray-500">Configure rooms, room types, and block availability dates.</p>
              </Link>

              <Link
                to="/admin/pricing"
                className="bg-white p-5 rounded-2xl border border-gray-200 hover:border-blue-500 hover:shadow-md transition space-y-2.5 group"
              >
                <IndianRupee className="w-6 h-6 text-emerald-600 group-hover:scale-110 transition" />
                <h3 className="text-sm font-bold text-gray-900">Pricing & Seasonal Rates</h3>
                <p className="text-xs text-gray-500">Set base pricing, seasonal holiday spikes, and weekend rates.</p>
              </Link>

              <Link
                to="/admin/reservations"
                className="bg-white p-5 rounded-2xl border border-gray-200 hover:border-blue-500 hover:shadow-md transition space-y-2.5 group"
              >
                <CalendarCheck className="w-6 h-6 text-blue-600 group-hover:scale-110 transition" />
                <h3 className="text-sm font-bold text-gray-900">Master Reservations</h3>
                <p className="text-xs text-gray-500">Execute check-ins, check-outs, and review guest bookings.</p>
              </Link>

              <Link
                to="/admin/refunds"
                className="bg-white p-5 rounded-2xl border border-gray-200 hover:border-blue-500 hover:shadow-md transition space-y-2.5 group"
              >
                <Receipt className="w-6 h-6 text-purple-600 group-hover:scale-110 transition" />
                <h3 className="text-sm font-bold text-gray-900">Cancellations & Refunds</h3>
                <p className="text-xs text-gray-500">Audit refunds, policy penalties, and payment references.</p>
              </Link>

              <Link
                to="/admin/coupons"
                className="bg-white p-5 rounded-2xl border border-gray-200 hover:border-blue-500 hover:shadow-md transition space-y-2.5 group"
              >
                <Tag className="w-6 h-6 text-amber-600 group-hover:scale-110 transition" />
                <h3 className="text-sm font-bold text-gray-900">Promo Coupons</h3>
                <p className="text-xs text-gray-500">Manage promotional codes, discounts, and customer limits.</p>
              </Link>

              <Link
                to="/admin/reports"
                className="bg-white p-5 rounded-2xl border border-gray-200 hover:border-blue-500 hover:shadow-md transition space-y-2.5 group"
              >
                <BarChart3 className="w-6 h-6 text-indigo-600 group-hover:scale-110 transition" />
                <h3 className="text-sm font-bold text-gray-900">Operational Reports</h3>
                <p className="text-xs text-gray-500">Audit occupancy yield, status volume, and revenue metrics.</p>
              </Link>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
