import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Building2, Plus, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

export const AdminProperties = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    property_code: '',
    name: '',
    property_type: 'HOTEL',
    address: '',
    city: '',
    state: '',
    country: 'India'
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const res = await api.get('/properties');
      setProperties(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.post('/properties', formData);
      setModalOpen(false);
      setFormData({
        property_code: '',
        name: '',
        property_type: 'HOTEL',
        address: '',
        city: '',
        state: '',
        country: 'India'
      });
      fetchProperties();
    } catch (err) {
      setError(err.formattedMessage || 'Failed to create property');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Property Catalog</h1>
          <p className="text-xs text-gray-500 mt-1">Manage active hotel, resort, and vacation properties.</p>
        </div>

        {user?.role === 'ADMIN' && (
          <button
            onClick={() => setModalOpen(true)}
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Property</span>
          </button>
        )}
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
                <th className="p-4">Code</th>
                <th className="p-4">Property Name</th>
                <th className="p-4">Type</th>
                <th className="p-4">Location</th>
                <th className="p-4">Manager User</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {properties.map(p => (
                <tr key={p.property_id} className="hover:bg-gray-50/50">
                  <td className="p-4 font-mono font-bold text-gray-900">{p.property_code}</td>
                  <td className="p-4 font-bold text-gray-900">{p.name}</td>
                  <td className="p-4">
                    <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[10px] font-bold">
                      {p.property_type}
                    </span>
                  </td>
                  <td className="p-4">{p.city}, {p.state}</td>
                  <td className="p-4 font-mono text-gray-500">{p.manager_user_id}</td>
                  <td className="p-4">
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Property Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h2 className="text-lg font-black text-gray-900">Add New Property</h2>
            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs">{error}</div>
            )}
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-500 mb-1">Property Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HOTEL-DEL"
                  value={formData.property_code}
                  onChange={e => setFormData({ ...formData, property_code: e.target.value.toUpperCase() })}
                  className="w-full border border-gray-200 rounded-lg p-2 font-mono uppercase"
                />
              </div>
              <div>
                <label className="block text-gray-500 mb-1">Property Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grand Delhi Hotel"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block text-gray-500 mb-1">Property Type</label>
                <select
                  value={formData.property_type}
                  onChange={e => setFormData({ ...formData, property_type: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg p-2"
                >
                  <option value="HOTEL">HOTEL</option>
                  <option value="RESORT">RESORT</option>
                  <option value="VILLA">VILLA</option>
                  <option value="APARTMENT">APARTMENT</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-500 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={e => setFormData({ ...formData, state: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg p-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-500 mb-1">Address</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg p-2"
                />
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
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 rounded-xl"
                >
                  Create Property
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
