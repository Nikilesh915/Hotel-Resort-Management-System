import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Tag, Plus, AlertCircle, Loader2 } from 'lucide-react';

export const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'PERCENTAGE',
    discount_value: 20,
    maximum_discount: 5000,
    minimum_booking_amount: 10000,
    usage_limit: 100,
    per_customer_limit: 1,
    valid_from: '2024-01-01',
    valid_until: '2028-12-31'
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await api.get('/coupons');
      setCoupons(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const toggleStatus = async (coupon) => {
    const newStatus = coupon.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    try {
      await api.put(`/coupons/${coupon.coupon_id}/status`, { status: newStatus });
      fetchCoupons();
    } catch (err) {
      alert(err.formattedMessage || 'Failed to update coupon status');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.post('/coupons', {
        ...formData,
        valid_from: `${formData.valid_from}T00:00:00Z`,
        valid_until: `${formData.valid_until}T23:59:59Z`
      });
      setModalOpen(false);
      setFormData({
        code: '',
        discount_type: 'PERCENTAGE',
        discount_value: 20,
        maximum_discount: 5000,
        minimum_booking_amount: 10000,
        usage_limit: 100,
        per_customer_limit: 1,
        valid_from: '2024-01-01',
        valid_until: '2028-12-31'
      });
      fetchCoupons();
    } catch (err) {
      setError(err.formattedMessage || 'Failed to create coupon');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Promo Coupons & Campaigns</h1>
          <p className="text-xs text-gray-500 mt-1">Manage discount thresholds, usage caps, and expiration bounds.</p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Create Coupon</span>
        </button>
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
                <th className="p-4">Code</th>
                <th className="p-4">Discount</th>
                <th className="p-4">Min Booking</th>
                <th className="p-4">Max Cap</th>
                <th className="p-4">Usage (Used / Limit)</th>
                <th className="p-4">Valid Until</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {coupons.map(c => (
                <tr key={c.coupon_id} className="hover:bg-gray-50/50">
                  <td className="p-4 font-mono font-bold text-gray-900">{c.code}</td>
                  <td className="p-4 font-bold text-blue-700">
                    {c.discount_type === 'PERCENTAGE' ? `${c.discount_value}%` : `₹${c.discount_value}`}
                  </td>
                  <td className="p-4">₹{c.minimum_booking_amount?.toLocaleString()}</td>
                  <td className="p-4">₹{c.maximum_discount?.toLocaleString()}</td>
                  <td className="p-4 font-mono">
                    <span className="font-bold text-gray-900">{c.current_usage_count}</span> / {c.usage_limit}
                  </td>
                  <td className="p-4 text-gray-500">{c.valid_until?.split('T')[0]}</td>
                  <td className="p-4">
                    {c.status === 'ACTIVE' ? (
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                        ACTIVE
                      </span>
                    ) : (
                      <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded text-[10px] font-bold">
                        {c.status}
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => toggleStatus(c)}
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition ${
                        c.status === 'ACTIVE'
                          ? 'border-rose-200 text-rose-700 hover:bg-rose-50'
                          : 'border-blue-200 text-blue-700 hover:bg-blue-50'
                      }`}
                    >
                      {c.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Coupon Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h2 className="text-lg font-black text-gray-900">Create New Coupon</h2>
            {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs">{error}</div>}
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-500 mb-1">Coupon Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SUMMER30"
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full border border-gray-200 rounded-lg p-2 font-mono uppercase font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-500 mb-1">Discount Type</label>
                  <select
                    value={formData.discount_type}
                    onChange={e => setFormData({ ...formData, discount_type: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg p-2"
                  >
                    <option value="PERCENTAGE">PERCENTAGE (%)</option>
                    <option value="FIXED">FIXED (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Discount Value</label>
                  <input
                    type="number"
                    required
                    value={formData.discount_value}
                    onChange={e => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                    className="w-full border border-gray-200 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-500 mb-1">Min Booking (₹)</label>
                  <input
                    type="number"
                    required
                    value={formData.minimum_booking_amount}
                    onChange={e => setFormData({ ...formData, minimum_booking_amount: Number(e.target.value) })}
                    className="w-full border border-gray-200 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Max Cap (₹)</label>
                  <input
                    type="number"
                    required
                    value={formData.maximum_discount}
                    onChange={e => setFormData({ ...formData, maximum_discount: Number(e.target.value) })}
                    className="w-full border border-gray-200 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-500 mb-1">Usage Limit</label>
                  <input
                    type="number"
                    required
                    value={formData.usage_limit}
                    onChange={e => setFormData({ ...formData, usage_limit: Number(e.target.value) })}
                    className="w-full border border-gray-200 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Per Customer</label>
                  <input
                    type="number"
                    required
                    value={formData.per_customer_limit}
                    onChange={e => setFormData({ ...formData, per_customer_limit: Number(e.target.value) })}
                    className="w-full border border-gray-200 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-500 mb-1">Valid From</label>
                  <input
                    type="date"
                    required
                    value={formData.valid_from}
                    onChange={e => setFormData({ ...formData, valid_from: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Valid Until</label>
                  <input
                    type="date"
                    required
                    value={formData.valid_until}
                    onChange={e => setFormData({ ...formData, valid_until: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow-sm"
                >
                  Create Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
