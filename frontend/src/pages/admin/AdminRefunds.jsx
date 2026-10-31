import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { IndianRupee, ShieldAlert, Loader2, RefreshCw, CheckCircle2 } from 'lucide-react';

export const AdminRefunds = () => {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRefunds = async () => {
    setLoading(true);
    try {
      const res = await api.get('/refunds/all');
      setRefunds(res.data.data);
    } catch (err) {
      console.error('Failed to load refunds:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, []);

  const totalRefunded = refunds.reduce((acc, r) => acc + (r.refund_amount || 0), 0);
  const totalFees = refunds.reduce((acc, r) => acc + (r.cancellation_fee || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Cancellation & Refund Ledger</h1>
          <p className="text-xs text-gray-500 mt-1">
            Audit automatic server-side refund calculations, cancellation penalties, and transaction references.
          </p>
        </div>

        <button
          onClick={fetchRefunds}
          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Refunds Issued</span>
          <p className="text-2xl font-black text-purple-700">₹{totalRefunded.toLocaleString()}</p>
          <p className="text-[11px] text-gray-400">{refunds.length} successful refund transactions</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Cancellation Fees Retained</span>
          <p className="text-2xl font-black text-emerald-600">₹{totalFees.toLocaleString()}</p>
          <p className="text-[11px] text-gray-400">Retained revenue via cancellation policy</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Integrity Guarantee</span>
          <p className="text-sm font-bold text-gray-800 flex items-center space-x-1.5 mt-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Server-side Idempotency</span>
          </p>
          <p className="text-[11px] text-gray-400">Zero duplicate refunds or modified guest fees</p>
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
                <th className="p-4">Refund Ref #</th>
                <th className="p-4">Reservation</th>
                <th className="p-4">Guest</th>
                <th className="p-4">Cancellation Fee</th>
                <th className="p-4">Refund Amount</th>
                <th className="p-4">Processed Date</th>
                <th className="p-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {refunds.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400 italic">
                    No cancellation refunds have been processed yet.
                  </td>
                </tr>
              ) : (
                refunds.map(r => (
                  <tr key={r.refund_id} className="hover:bg-gray-50/50">
                    <td className="p-4 font-mono font-bold text-gray-900">{r.refund_reference}</td>
                    <td className="p-4 font-mono font-bold text-blue-600">{r.reservation_id}</td>
                    <td className="p-4 font-mono text-gray-500">{r.guest_id}</td>
                    <td className="p-4 font-semibold text-rose-600">
                      ₹{r.cancellation_fee?.toLocaleString()}
                    </td>
                    <td className="p-4 font-black text-gray-900 text-sm">
                      ₹{r.refund_amount?.toLocaleString()}
                    </td>
                    <td className="p-4 text-gray-500">
                      {new Date(r.refunded_at).toLocaleString()}
                    </td>
                    <td className="p-4 text-right">
                      <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2.5 py-0.5 rounded">
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

