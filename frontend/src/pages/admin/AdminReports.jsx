import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { TrendingUp, Building2, Calendar, IndianRupee, Loader2, RefreshCw, BarChart3, PieChart } from 'lucide-react';

export const AdminReports = () => {
  const [reportsData, setReportsData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/reports');
      setReportsData(res.data.data);
    } catch (err) {
      console.error('Failed to load operational reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Operational & Financial Reports</h1>
          <p className="text-xs text-gray-500 mt-1">
            Comprehensive audit reports covering property occupancy, financial margins, cancellation ratios, and inventory yields.
          </p>
        </div>

        <button
          onClick={fetchReports}
          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
          title="Refresh Reports"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center text-blue-600">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : reportsData ? (
        <>
          {/* Section 1: Property Occupancy & Financial Yield Report */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm space-y-4 p-6">
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-black text-gray-900">Property Occupancy & Financial Yield</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-400 uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="p-3">Property</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Total Rooms</th>
                    <th className="p-3">Active Bookings</th>
                    <th className="p-3">Occupancy %</th>
                    <th className="p-3">Gross Revenue</th>
                    <th className="p-3">Refunds Issued</th>
                    <th className="p-3 text-right">Net Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reportsData.property_reports?.map(p => (
                    <tr key={p.property_id} className="hover:bg-gray-50/50">
                      <td className="p-3">
                        <span className="font-bold text-gray-900 block">{p.name}</span>
                        <span className="text-[10px] text-gray-400">{p.city}</span>
                      </td>
                      <td className="p-3">
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold">
                          {p.property_type}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-gray-800">{p.inventory.total_rooms} Rooms</td>
                      <td className="p-3 text-blue-600 font-bold">{p.reservations.active} Active</td>
                      <td className="p-3 font-black text-gray-900">{p.reservations.occupancy_rate}</td>
                      <td className="p-3">₹{p.financials.gross_revenue?.toLocaleString()}</td>
                      <td className="p-3 text-rose-600">₹{p.financials.total_refunded?.toLocaleString()}</td>
                      <td className="p-3 text-right font-black text-emerald-600 text-sm">
                        ₹{p.financials.net_revenue?.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Reservation Lifecycle Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-sm">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-gray-900">Reservation Volume by Status</h3>
              </div>

              <div className="space-y-3">
                {reportsData.status_distribution?.map(item => (
                  <div key={item._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl text-xs">
                    <span className="font-bold text-gray-800">{item._id}</span>
                    <div className="text-right">
                      <span className="font-black text-blue-600 text-sm block">{item.count} Bookings</span>
                      <span className="text-[10px] text-gray-400">₹{item.total_volume?.toLocaleString()} Volume</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: Cancellation Policy & Retention Analysis */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-sm">
              <div className="flex items-center space-x-2">
                <IndianRupee className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-gray-900">Cancellation & Refund Economics</h3>
              </div>

              <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Processed Refund Transactions:</span>
                  <span className="font-black text-gray-900">{reportsData.cancellations_summary?.total_refunds_processed}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Money Returned to Guests:</span>
                  <span className="font-black text-purple-700">₹{reportsData.cancellations_summary?.total_refunded_amount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center border-t border-purple-200 pt-2">
                  <span className="text-gray-700 font-bold">Cancellation Fees Retained by Hotel:</span>
                  <span className="font-black text-emerald-600 text-sm">₹{reportsData.cancellations_summary?.total_cancellation_fees_retained?.toLocaleString()}</span>
                </div>
              </div>

              <p className="text-[11px] text-gray-400 leading-relaxed">
                Refund amounts are automatically computed based on the reservation's cancellation tier (Flexible, Moderate, Strict) and hours remaining prior to check-in.
              </p>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

