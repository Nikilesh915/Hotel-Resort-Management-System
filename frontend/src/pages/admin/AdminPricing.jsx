import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { IndianRupee, Plus, Edit2, Trash2, Calendar, Loader2, Sparkles } from 'lucide-react';

export const AdminPricing = () => {
  const { user } = useAuth();
  const [pricingRules, setPricingRules] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  const [formData, setFormData] = useState({
    room_type_id: '',
    start_date: '',
    end_date: '',
    price_per_night: 6000,
    pricing_type: 'SEASONAL',
    status: 'ACTIVE'
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pricingRes, typeRes, propRes] = await Promise.all([
        api.get('/pricing'),
        api.get('/rooms/types'),
        api.get('/properties')
      ]);
      setPricingRules(pricingRes.data.data);
      setRoomTypes(typeRes.data.data);
      setProperties(propRes.data.data);
      if (typeRes.data.data.length > 0 && !formData.room_type_id) {
        setFormData(prev => ({ ...prev, room_type_id: typeRes.data.data[0].room_type_id }));
      }
    } catch (err) {
      console.error('Failed to load pricing data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingRule(null);
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setFormData({
      room_type_id: roomTypes.length > 0 ? roomTypes[0].room_type_id : '',
      start_date: today,
      end_date: nextMonth,
      price_per_night: 7500,
      pricing_type: 'SEASONAL',
      status: 'ACTIVE'
    });
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (rule) => {
    setEditingRule(rule);
    setFormData({
      room_type_id: rule.room_type_id,
      start_date: rule.start_date?.split('T')[0] || '',
      end_date: rule.end_date?.split('T')[0] || '',
      price_per_night: rule.price_per_night,
      pricing_type: rule.pricing_type,
      status: rule.status || 'ACTIVE'
    });
    setError(null);
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (editingRule) {
        await api.put(`/pricing/${editingRule.pricing_id}`, formData);
      } else {
        await api.post('/pricing', formData);
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      setError(err.formattedMessage || 'Failed to save pricing rule');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (pricing_id) => {
    if (!window.confirm(`Are you sure you want to remove pricing rule ${pricing_id}?`)) return;
    try {
      await api.delete(`/pricing/${pricing_id}`);
      fetchData();
    } catch (err) {
      alert(err.formattedMessage || 'Failed to delete pricing rule');
    }
  };

  // Filter rules
  const filteredRules = selectedProperty
    ? pricingRules.filter(r => {
        const rt = roomTypes.find(t => t.room_type_id === r.room_type_id);
        return rt && rt.property_id === selectedProperty;
      })
    : pricingRules;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Pricing & Seasonal Rates</h1>
          <p className="text-xs text-gray-500 mt-1">
            Configure dynamic pricing tiers, seasonal spikes, weekend premiums, and base overrides.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedProperty}
            onChange={e => setSelectedProperty(e.target.value)}
            className="border border-gray-200 rounded-xl p-2.5 text-xs font-semibold focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">All Properties</option>
            {properties.map(p => (
              <option key={p.property_id} value={p.property_id}>
                {p.name}
              </option>
            ))}
          </select>

          <button
            onClick={openCreateModal}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition flex items-center space-x-1.5 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Pricing Rule</span>
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
                <th className="p-4">Rule ID</th>
                <th className="p-4">Room Type / Property</th>
                <th className="p-4">Tier Type</th>
                <th className="p-4">Date Bounds</th>
                <th className="p-4">Nightly Rate</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRules.map(r => {
                const rt = roomTypes.find(t => t.room_type_id === r.room_type_id);
                const prop = rt ? properties.find(p => p.property_id === rt.property_id) : null;
                return (
                  <tr key={r.pricing_id} className="hover:bg-gray-50/50">
                    <td className="p-4 font-mono font-bold text-gray-900">{r.pricing_id}</td>
                    <td className="p-4">
                      <span className="font-bold text-gray-900 block">{rt?.name || r.room_type_id}</span>
                      <span className="text-[10px] text-gray-400">{prop?.name || '—'}</span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.pricing_type === 'SEASONAL'
                          ? 'bg-purple-100 text-purple-800'
                          : r.pricing_type === 'WEEKEND'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {r.pricing_type}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="block font-medium text-gray-800">{r.start_date?.split('T')[0]}</span>
                      <span className="text-[10px] text-gray-400">until {r.end_date?.split('T')[0]}</span>
                    </td>
                    <td className="p-4 font-black text-gray-900 text-sm">₹{r.price_per_night?.toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {r.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(r)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit Rule"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {user?.role === 'ADMIN' && (
                        <button
                          onClick={() => handleDelete(r.pricing_id)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete Rule"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pricing Rule Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h2 className="text-lg font-black text-gray-900">
              {editingRule ? `Edit Pricing Rule ${editingRule.pricing_id}` : 'Create Pricing Rule'}
            </h2>
            {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs">{error}</div>}
            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-500 mb-1">Room Type</label>
                <select
                  value={formData.room_type_id}
                  onChange={e => setFormData({ ...formData, room_type_id: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg p-2 font-bold"
                  disabled={!!editingRule}
                >
                  {roomTypes.map(rt => {
                    const prop = properties.find(p => p.property_id === rt.property_id);
                    return (
                      <option key={rt.room_type_id} value={rt.room_type_id}>
                        {rt.name} ({prop?.name || rt.property_id})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-gray-500 mb-1">Pricing Tier / Type</label>
                <select
                  value={formData.pricing_type}
                  onChange={e => setFormData({ ...formData, pricing_type: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg p-2 font-semibold"
                >
                  <option value="SEASONAL">SEASONAL (Peak Holiday / Festival)</option>
                  <option value="WEEKEND">WEEKEND (Fri - Sat Premium)</option>
                  <option value="BASE">BASE OVERRIDE</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-500 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={formData.end_date}
                    onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-500 mb-1">Price Per Night (₹)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.price_per_night}
                  onChange={e => setFormData({ ...formData, price_per_night: Number(e.target.value) })}
                  className="w-full border border-gray-200 rounded-lg p-2 font-black text-sm"
                />
              </div>

              <div>
                <label className="block text-gray-500 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg p-2"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
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
                  {submitting ? 'Saving...' : editingRule ? 'Save Changes' : 'Create Pricing Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

