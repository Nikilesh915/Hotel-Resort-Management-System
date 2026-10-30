import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { CalendarCheck, AlertCircle, Loader2, CheckCircle2, RefreshCw } from 'lucide-react';

export const AdminReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reservations/all', {
        params: statusFilter ? { status: statusFilter } : {}
      });
      setReservations(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [statusFilter]);

  const handleUpdateStatus = async (reservation_id, new_status) => {
    try {
      await api.put(`/reservations/${reservation_id}/status`, { status: new_status });
      fetchReservations();
    } catch (err) {
      alert(err.formattedMessage || 'State transition failed');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">CONFIRMED</span>;
      case 'PENDING':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">PENDING</span>;
      case 'CHECKED_IN':
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded">CHECKED IN</span>;
      case 'CHECKED_OUT':
        return <span className="bg-gray-100 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded">CHECKED OUT</span>;
      case 'CANCELLED':
        return <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded">CANCELLED</span>;
      case 'REFUNDED':
        return <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded">REFUNDED</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 text-[10px] font-bold px-2 py-0.5 rounded">{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Master Reservation Roster</h1>
          <p className="text-xs text-gray-500 mt-1">Enforce valid state transitions (Confirm, Check-In, Check-Out) across hotel rooms.</p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-xl p-2.5 text-xs font-semibold focus:ring-1 focus:ring-teal-500 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="CHECKED_IN">CHECKED_IN</option>
            <option value="CHECKED_OUT">CHECKED_OUT</option>
            <option value="PENDING">PENDING</option>
            <option value="CANCELLED">CANCELLED</option>
            <option value="REFUNDED">REFUNDED</option>
          </select>

          <button
            onClick={fetchReservations}
            className="p-2 text-gray-500 hover:text-teal-600 hover:bg-gray-100 rounded-lg transition"
            title="Refresh Roster"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center text-teal-600">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-400 uppercase font-semibold text-[10px]">
              <tr>
                <th className="p-4">Res #</th>
                <th className="p-4">Guest</th>
                <th className="p-4">Room & Property</th>
                <th className="p-4">Stay Dates</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Lifecycle Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reservations.map(r => (
                <tr key={r.reservation_id} className="hover:bg-gray-50/50">
                  <td className="p-4 font-mono font-bold text-gray-900">{r.reservation_number}</td>
                  <td className="p-4 font-mono text-gray-600">{r.guest_id}</td>
                  <td className="p-4">
                    <span className="font-bold text-gray-900 block">{r.room_id}</span>
                    <span className="text-[10px] text-gray-400 font-mono">{r.property_id}</span>
                  </td>
                  <td className="p-4">
                    <span className="block font-medium text-gray-800">{r.check_in_date?.split('T')[0]}</span>
                    <span className="text-[10px] text-gray-400">to {r.check_out_date?.split('T')[0]}</span>
                  </td>
                  <td className="p-4 font-bold text-gray-900">₹{r.total_amount?.toLocaleString()}</td>
                  <td className="p-4">{getStatusBadge(r.status)}</td>
                  <td className="p-4 text-right space-x-1.5">
                    {r.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleUpdateStatus(r.reservation_id, 'CHECKED_IN')}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] px-2.5 py-1 rounded-md transition"
                      >
                        Check-In
                      </button>
                    )}
                    {r.status === 'CHECKED_IN' && (
                      <button
                        onClick={() => handleUpdateStatus(r.reservation_id, 'CHECKED_OUT')}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] px-2.5 py-1 rounded-md transition"
                      >
                        Check-Out
                      </button>
                    )}
                    {['PENDING'].includes(r.status) && (
                      <button
                        onClick={() => handleUpdateStatus(r.reservation_id, 'CONFIRMED')}
                        className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] px-2.5 py-1 rounded-md transition"
                      >
                        Force Confirm
                      </button>
                    )}
                    {['CHECKED_OUT', 'CANCELLED', 'REFUNDED'].includes(r.status) && (
                      <span className="text-[10px] text-gray-400 italic">Terminal State</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
