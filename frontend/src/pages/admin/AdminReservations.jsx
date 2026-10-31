import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { CalendarCheck, AlertCircle, Loader2, RefreshCw, Eye, XCircle, CheckCircle, Clock } from 'lucide-react';

export const AdminReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Details Modal
  const [selectedRes, setSelectedRes] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Cancel Modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancellingResId, setCancellingResId] = useState(null);
  const [cancelReason, setCancelReason] = useState('Hotel Administrative Cancellation');
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

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

  const openDetailsModal = async (id) => {
    setDetailsLoading(true);
    try {
      const res = await api.get(`/reservations/${id}`);
      setSelectedRes(res.data.data);
    } catch (err) {
      alert(err.formattedMessage || 'Failed to fetch reservation details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const openCancelModal = (resId) => {
    setCancellingResId(resId);
    setCancelReason('Hotel Administrative Cancellation');
    setCancelModalOpen(true);
  };

  const handleExecuteCancel = async () => {
    setCancelSubmitting(true);
    try {
      const res = await api.post(`/reservations/${cancellingResId}/cancel`, {
        reason: cancelReason,
        idempotency_key: `ADMIN-CANCEL-${cancellingResId}-${Date.now()}`
      });
      alert(res.data.message || 'Reservation cancelled successfully');
      setCancelModalOpen(false);
      fetchReservations();
    } catch (err) {
      alert(err.formattedMessage || 'Failed to cancel reservation');
    } finally {
      setCancelSubmitting(false);
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
          <h1 className="text-2xl font-black text-gray-900">Master Reservation & Cancellation Roster</h1>
          <p className="text-xs text-gray-500 mt-1">
            Enforce valid state transitions (Confirm, Check-In, Check-Out, Cancel) and audit stay financials.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-xl p-2.5 text-xs font-semibold focus:ring-1 focus:ring-blue-500 focus:outline-none"
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
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
            title="Refresh Roster"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center text-blue-600">
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
                    <button
                      onClick={() => openDetailsModal(r.reservation_id)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="View Full Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {r.status === 'CONFIRMED' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(r.reservation_id, 'CHECKED_IN')}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] px-2.5 py-1 rounded-md transition shadow-sm"
                        >
                          Check-In
                        </button>
                        <button
                          onClick={() => openCancelModal(r.reservation_id)}
                          className="border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-[11px] px-2 py-1 rounded-md transition"
                        >
                          Cancel
                        </button>
                      </>
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
                      <>
                        <button
                          onClick={() => handleUpdateStatus(r.reservation_id, 'CONFIRMED')}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] px-2.5 py-1 rounded-md transition"
                        >
                          Force Confirm
                        </button>
                        <button
                          onClick={() => openCancelModal(r.reservation_id)}
                          className="border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-[11px] px-2 py-1 rounded-md transition"
                        >
                          Cancel
                        </button>
                      </>
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

      {/* Reservation Details Modal */}
      {selectedRes && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h2 className="text-base font-black text-gray-900">
                  Reservation {selectedRes.reservation_number}
                </h2>
                <p className="text-gray-400 font-mono text-[10px]">{selectedRes.reservation_id}</p>
              </div>
              <button
                onClick={() => setSelectedRes(null)}
                className="text-gray-400 hover:text-gray-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Guest Info */}
            <div className="p-3 bg-gray-50 rounded-xl space-y-1">
              <span className="font-bold text-gray-700 block">Guest Information</span>
              <p className="text-gray-900 font-bold">{selectedRes.guest?.full_name || selectedRes.guest_id}</p>
              <p className="text-gray-500">Email: {selectedRes.guest?.email || '—'}</p>
              <p className="text-gray-500">Phone: {selectedRes.guest?.phone_number || '—'}</p>
            </div>

            {/* Stay & Room Info */}
            <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-xl">
              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Property</span>
                <span className="font-bold text-gray-900">{selectedRes.property?.name || selectedRes.property_id}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Room Unit</span>
                <span className="font-bold text-gray-900">Room {selectedRes.room?.room_number || selectedRes.room_id}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Check-in</span>
                <span className="font-medium text-gray-800">{selectedRes.check_in_date?.split('T')[0]}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Check-out</span>
                <span className="font-medium text-gray-800">{selectedRes.check_out_date?.split('T')[0]}</span>
              </div>
            </div>

            {/* Financial Breakdown */}
            <div className="p-3 bg-gray-50 rounded-xl space-y-1.5">
              <span className="font-bold text-gray-700 block">Financial Breakdown (Server Calculated)</span>
              <div className="flex justify-between text-gray-600">
                <span>Base Room Amount:</span>
                <span>₹{selectedRes.base_amount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Taxes & GST:</span>
                <span>₹{selectedRes.tax_amount?.toLocaleString()}</span>
              </div>
              {selectedRes.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Coupon Discount ({selectedRes.coupon_code}):</span>
                  <span>-₹{selectedRes.discount_amount?.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-900 font-black text-sm border-t pt-1.5">
                <span>Total Reservation Amount:</span>
                <span>₹{selectedRes.total_amount?.toLocaleString()}</span>
              </div>
            </div>

            {/* Payment & Refund Status */}
            {selectedRes.payment && (
              <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl space-y-1">
                <span className="font-bold text-blue-900 block">Payment Record</span>
                <p className="text-gray-700">Reference: <span className="font-mono font-bold">{selectedRes.payment.payment_reference}</span></p>
                <p className="text-gray-700">Method: {selectedRes.payment.payment_method} | Status: <span className="font-bold text-emerald-700">{selectedRes.payment.status}</span></p>
              </div>
            )}

            {selectedRes.refund && (
              <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl space-y-1">
                <span className="font-bold text-purple-900 block">Refund Record</span>
                <p className="text-gray-700">Reference: <span className="font-mono font-bold">{selectedRes.refund.refund_reference}</span></p>
                <p className="text-gray-700">Amount Refunded: <span className="font-black text-purple-800">₹{selectedRes.refund.refund_amount?.toLocaleString()}</span> (Fee Retained: ₹{selectedRes.refund.cancellation_fee})</p>
                <p className="text-gray-500 text-[10px]">Processed at: {new Date(selectedRes.refund.refunded_at).toLocaleString()}</p>
              </div>
            )}

            <button
              onClick={() => setSelectedRes(null)}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2 rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Administrative Cancel Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-xs">
            <h2 className="text-base font-black text-gray-900">Cancel Reservation</h2>
            <p className="text-gray-500">
              The cancellation policy rules and refund calculation will be strictly enforced by the server. Inventory dates will be released immediately.
            </p>
            <div>
              <label className="block text-gray-500 mb-1">Cancellation Reason</label>
              <textarea
                rows={2}
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-2"
              />
            </div>
            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl"
              >
                Abort
              </button>
              <button
                type="button"
                onClick={handleExecuteCancel}
                disabled={cancelSubmitting}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl shadow-sm"
              >
                {cancelSubmitting ? 'Processing...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
