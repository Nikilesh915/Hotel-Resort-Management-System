import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Calendar, Hotel, AlertCircle, CheckCircle2, Clock, XCircle, ArrowRight, Loader2, RefreshCw } from 'lucide-react';

export const MyBookings = () => {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [selectedRes, setSelectedRes] = useState(null);
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('Change of travel schedule');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelResult, setCancelResult] = useState(null);

  const fetchMyBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/reservations/my');
      setReservations(res.data.data);
    } catch (err) {
      console.error('Failed to load reservations:', err);
      setError(err.formattedMessage || 'Failed to fetch personal reservations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBookings();
  }, []);

  const openCancelModal = (res) => {
    setSelectedRes(res);
    setCancelResult(null);
    setCancelModal(true);
  };

  const executeCancellation = async () => {
    if (!selectedRes) return;
    setCancelLoading(true);
    try {
      const res = await api.post(`/reservations/${selectedRes.reservation_id}/cancel`, {
        reason: cancelReason
      });
      setCancelResult(res.data.data);
      fetchMyBookings();
    } catch (err) {
      alert(err.formattedMessage || 'Cancellation failed');
    } finally {
      setCancelLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full">CONFIRMED</span>;
      case 'PENDING':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-1 rounded-full">PENDING PAYMENT</span>;
      case 'CHECKED_IN':
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2.5 py-1 rounded-full">CHECKED IN</span>;
      case 'CHECKED_OUT':
        return <span className="bg-gray-100 text-gray-700 text-[10px] font-bold px-2.5 py-1 rounded-full">CHECKED OUT</span>;
      case 'CANCELLED':
        return <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2.5 py-1 rounded-full">CANCELLED</span>;
      case 'REFUNDED':
        return <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2.5 py-1 rounded-full">REFUNDED</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 text-[10px] font-bold px-2.5 py-1 rounded-full">{status}</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-900">My Bookings & Reservations</h1>
          <p className="text-xs text-gray-500 mt-1">Manage current stays, view payment receipts, and execute policy-based cancellations.</p>
        </div>
        <button
          onClick={fetchMyBookings}
          className="p-2 text-gray-500 hover:text-teal-600 hover:bg-gray-100 rounded-lg transition"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center space-x-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-16 flex justify-center text-teal-600">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : reservations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-4 shadow-sm">
          <Hotel className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-lg font-bold text-gray-900">No Reservations Found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            You don't have any bookings yet. Search for rooms to make your first reservation.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.map(res => (
            <div
              key={res.reservation_id}
              className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-gray-700">{res.reservation_number}</span>
                  {getStatusBadge(res.status)}
                </div>

                <h3 className="text-base font-bold text-gray-900">
                  Room {res.room_id} • Property: {res.property_id}
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-gray-500">
                  <div>
                    <span className="text-gray-400 block text-[10px]">Check-In</span>
                    <span className="font-semibold text-gray-800">{res.check_in_date?.split('T')[0]} (14:00)</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Check-Out</span>
                    <span className="font-semibold text-gray-800">{res.check_out_date?.split('T')[0]} (11:00)</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Policy</span>
                    <span className="font-semibold text-teal-700">{res.cancellation_policy}</span>
                  </div>
                </div>
              </div>

              <div className="flex md:flex-col items-end justify-between w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-gray-100 space-y-2">
                <div className="text-right">
                  <span className="text-xs text-gray-400 block">Total Amount</span>
                  <span className="text-xl font-black text-gray-900">₹{res.total_amount?.toLocaleString()}</span>
                </div>

                <div className="flex space-x-2">
                  {res.status === 'PENDING' && (
                    <a
                      href={`/payment/${res.reservation_id}`}
                      className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition shadow-sm"
                    >
                      Pay Now
                    </a>
                  )}

                  {['PENDING', 'CONFIRMED'].includes(res.status) && (
                    <button
                      onClick={() => openCancelModal(res)}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs px-3.5 py-1.5 rounded-lg border border-rose-200 transition"
                    >
                      Cancel Booking
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancellation Modal */}
      {cancelModal && selectedRes && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-gray-100">
            <h2 className="text-lg font-black text-gray-900">Cancel Reservation</h2>

            {cancelResult ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs space-y-2">
                  <p className="font-bold flex items-center space-x-1.5 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Cancellation Successful</span>
                  </p>
                  <p>{cancelResult.message}</p>
                  {cancelResult.refund && (
                    <div className="pt-2 border-t border-emerald-200 text-left space-y-1">
                      <p>Original Amount: ₹{cancelResult.refund.original_amount?.toLocaleString()}</p>
                      <p>Cancellation Fee: ₹{cancelResult.refund.cancellation_fee?.toLocaleString()}</p>
                      <p className="font-bold text-emerald-900">
                        Refund Issued: ₹{cancelResult.refund.refund_amount?.toLocaleString()}
                      </p>
                      <p className="font-mono text-[10px]">Reference: {cancelResult.refund.refund_reference}</p>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setCancelModal(false)}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <p className="text-gray-600">
                  Are you sure you want to cancel booking <span className="font-bold font-mono">{selectedRes.reservation_number}</span>?
                </p>

                <div className="bg-gray-50 p-4 rounded-xl space-y-2 border border-gray-200">
                  <div className="flex justify-between font-bold">
                    <span>Applied Policy:</span>
                    <span className="text-teal-700">{selectedRes.cancellation_policy}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Paid Amount:</span>
                    <span>₹{selectedRes.total_amount?.toLocaleString()}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 pt-1 border-t border-gray-200">
                    Refund amount will be automatically computed server-side based on the property cancellation policy and remaining check-in countdown.
                  </p>
                </div>

                <div>
                  <label className="block text-gray-500 font-medium mb-1">Cancellation Reason</label>
                  <textarea
                    rows={2}
                    value={cancelReason}
                    onChange={e => setCancelReason(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    onClick={() => setCancelModal(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs"
                  >
                    Keep Booking
                  </button>
                  <button
                    onClick={executeCancellation}
                    disabled={cancelLoading}
                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1.5 disabled:opacity-50"
                  >
                    {cancelLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>Confirm Cancellation</span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
