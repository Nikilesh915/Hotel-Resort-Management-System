import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Tag, Plus, Edit2, History, AlertCircle, Loader2, Trash2 } from 'lucide-react';

export const AdminCoupons = () => {
  const { user } = useAuth();
  const [coupons, setCoupons] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);

  // Redemptions History Modal
  const [redemptionsModalOpen, setRedemptionsModalOpen] = useState(false);
  const [selectedCouponCode, setSelectedCouponCode] = useState('');
  const [redemptions, setRedemptions] = useState([]);
  const [redemptionsLoading, setRedemptionsLoading] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'PERCENTAGE',
    discount_value: 20,
    maximum_discount: 5000,
    minimum_booking_amount: 10000,
    usage_limit: 100,
    per_customer_limit: 1,
    valid_from: '2026-01-01',
    valid_until: '2027-12-31',
    applicable_property_id: '',
    status: 'ACTIVE'
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [couponRes, propRes] = await Promise.all([
        api.get('/coupons'),
        api.get('/properties')
      ]);
      setCoupons(couponRes.data.data);
      setProperties(propRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingCoupon(null);
    const defaultProp = properties.length === 1 ? properties[0].property_id : '';
    setFormData({
      code: '',
      discount_type: 'PERCENTAGE',
      discount_value: 20,
      maximum_discount: 5000,
      minimum_booking_amount: 10000,
      usage_limit: 100,
      per_customer_limit: 1,
      valid_from: '2026-01-01',
      valid_until: '2027-12-31',
      applicable_property_id: defaultProp,
      status: 'ACTIVE'
    });
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (c) => {
    setEditingCoupon(c);
    setFormData({
      code: c.code,
      discount_type: c.discount_type,
      discount_value: c.discount_value,
      maximum_discount: c.maximum_discount,
      minimum_booking_amount: c.minimum_booking_amount,
      usage_limit: c.usage_limit,
      per_customer_limit: c.per_customer_limit,
      valid_from: c.valid_from?.split('T')[0] || '2026-01-01',
      valid_until: c.valid_until?.split('T')[0] || '2027-12-31',
      applicable_property_id: c.applicable_property_id || '',
      status: c.status || 'ACTIVE'
    });
    setError(null);
    setModalOpen(true);
  };

  const toggleStatus = async (coupon) => {
    const newStatus = coupon.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    try {
      await api.put(`/coupons/${coupon.coupon_id}/status`, { status: newStatus });
      fetchData();
    } catch (err) {
      alert(err.formattedMessage || 'Failed to update coupon status');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        ...formData,
        applicable_property_id: formData.applicable_property_id || null,
        valid_from: `${formData.valid_from}T00:00:00Z`,
        valid_until: `${formData.valid_until}T23:59:59Z`
      };

      if (editingCoupon) {
        await api.put(`/coupons/${editingCoupon.coupon_id}`, payload);
      } else {
        await api.post('/coupons', payload);
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      setError(err.formattedMessage || 'Failed to save coupon');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (coupon) => {
    if (!window.confirm(`Are you sure you want to permanently delete coupon "${coupon.code}" (${coupon.coupon_id})?`)) {
      return;
    }
    try {
      await api.delete(`/coupons/${coupon.coupon_id}`);
      fetchData();
    } catch (err) {
      alert(err.formattedMessage || 'Failed to delete coupon');
    }
  };

  const openRedemptionsModal = async (coupon) => {
    setSelectedCouponCode(coupon.code);
    setRedemptionsModalOpen(true);
    setRedemptionsLoading(true);
    try {
      const res = await api.get(`/coupons/redemptions?coupon_id=${coupon.coupon_id}`);
      setRedemptions(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setRedemptionsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Promo Coupons & Campaigns</h1>
          <p className="text-xs text-gray-500 mt-1">Manage discount thresholds, usage caps, property restrictions, and redemption logs.</p>
        </div>

        <button
          onClick={openCreateModal}
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
                <th className="p-4">Scope</th>
                <th className="p-4">Min Booking</th>
                <th className="p-4">Max Cap</th>
                <th className="p-4">Usage (Used / Limit)</th>
                <th className="p-4">Valid Until</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {coupons.map(c => {
                const prop = properties.find(p => p.property_id === c.applicable_property_id);
                return (
                  <tr key={c.coupon_id} className="hover:bg-gray-50/50">
                    <td className="p-4 font-mono font-bold text-gray-900">{c.code}</td>
                    <td className="p-4 font-bold text-blue-700">
                      {c.discount_type === 'PERCENTAGE' ? `${c.discount_value}%` : `₹${c.discount_value}`}
                    </td>
                    <td className="p-4">
                      {c.applicable_property_id ? (
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-100">
                          {prop?.name || c.applicable_property_id}
                        </span>
                      ) : (
                        <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-100">
                          All Properties
                        </span>
                      )}
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
                    <td className="p-4 text-right space-x-1.5">
                      <button
                        onClick={() => openRedemptionsModal(c)}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        title="View Redemptions"
                      >
                        <History className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(c)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit Coupon"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {user?.role === 'ADMIN' && (
                        <button
                          onClick={() => handleDelete(c)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete Coupon"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => toggleStatus(c)}
                        className={`text-[10px] font-bold px-2 py-1 rounded transition border ${
                          c.status === 'ACTIVE'
                            ? 'border-rose-200 text-rose-700 hover:bg-rose-50'
                            : 'border-blue-200 text-blue-700 hover:bg-blue-50'
                        }`}
                      >
                        {c.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Coupon Modal (Create / Edit) */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-xs">
            <h2 className="text-base font-black text-gray-900">
              {editingCoupon ? `Edit Coupon ${editingCoupon.code}` : 'Create Promo Coupon'}
            </h2>
            {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs">{error}</div>}
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-gray-500 mb-1">Coupon Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MONSOON25"
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full border border-gray-200 rounded-lg p-2 font-mono uppercase font-bold"
                  disabled={!!editingCoupon}
                />
              </div>

              <div>
                <label className="block text-gray-500 mb-1">Applicable Property Scope</label>
                <select
                  value={formData.applicable_property_id}
                  onChange={e => setFormData({ ...formData, applicable_property_id: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg p-2"
                >
                  {user?.role === 'ADMIN' && (
                    <option value="">All Properties (Global Platform Coupon)</option>
                  )}
                  {properties.map(p => (
                    <option key={p.property_id} value={p.property_id}>
                      {p.name} ({p.city})
                    </option>
                  ))}
                </select>
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
                    <option value="FIXED">FIXED AMOUNT (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Discount Value</label>
                  <input
                    type="number"
                    required
                    value={formData.discount_value}
                    onChange={e => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                    className="w-full border border-gray-200 rounded-lg p-2 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-500 mb-1">Max Discount Cap (₹)</label>
                  <input
                    type="number"
                    required
                    value={formData.maximum_discount}
                    onChange={e => setFormData({ ...formData, maximum_discount: Number(e.target.value) })}
                    className="w-full border border-gray-200 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Min Booking Amt (₹)</label>
                  <input
                    type="number"
                    required
                    value={formData.minimum_booking_amount}
                    onChange={e => setFormData({ ...formData, minimum_booking_amount: Number(e.target.value) })}
                    className="w-full border border-gray-200 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-500 mb-1">Global Usage Limit</label>
                  <input
                    type="number"
                    required
                    value={formData.usage_limit}
                    onChange={e => setFormData({ ...formData, usage_limit: Number(e.target.value) })}
                    className="w-full border border-gray-200 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Per Guest Limit</label>
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
                    className="w-full border border-gray-200 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Valid Until</label>
                  <input
                    type="date"
                    required
                    value={formData.valid_until}
                    onChange={e => setFormData({ ...formData, valid_until: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg p-2 font-mono"
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
                  {submitting ? 'Saving...' : editingCoupon ? 'Save Changes' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Redemptions History Modal */}
      {redemptionsModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-xs max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h2 className="text-base font-black text-gray-900">
                  Redemption History: {selectedCouponCode}
                </h2>
                <p className="text-gray-400 text-[10px]">Audit customer uses and prevent coupon over-allocation.</p>
              </div>
              <button
                onClick={() => setRedemptionsModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {redemptionsLoading ? (
              <div className="py-10 flex justify-center text-blue-600">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : redemptions.length === 0 ? (
              <p className="text-gray-400 italic py-6 text-center">No guests have redeemed this coupon yet.</p>
            ) : (
              <div className="space-y-2">
                {redemptions.map(r => (
                  <div key={r.redemption_id} className="p-3 bg-gray-50 rounded-xl flex justify-between items-center">
                    <div>
                      <span className="font-bold text-gray-900 block font-mono">{r.reservation_id}</span>
                      <span className="text-[10px] text-gray-400">Guest: {r.guest_id}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-emerald-600 block">₹{r.discount_amount} Off</span>
                      <span className="text-[10px] text-gray-400">{new Date(r.redeemed_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setRedemptionsModalOpen(false)}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2 rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
