import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { BedDouble, Plus, AlertCircle, Loader2, CheckCircle2, Wrench } from 'lucide-react';

export const AdminRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [properties, setProperties] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState('PROP-001');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    room_number: '',
    floor: 1,
    room_type_id: 'RTYP-001',
    max_guests: 2
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [propRes, typeRes] = await Promise.all([
        api.get('/properties'),
        api.get('/rooms/types')
      ]);
      setProperties(propRes.data.data);
      setRoomTypes(typeRes.data.data);
      if (propRes.data.data.length > 0 && !selectedProperty) {
        setSelectedProperty(propRes.data.data[0].property_id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRooms = async (propId) => {
    if (!propId) return;
    setLoading(true);
    try {
      const res = await api.get(`/rooms/property/${propId}`);
      setRooms(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedProperty) {
      fetchRooms(selectedProperty);
    }
  }, [selectedProperty]);

  const toggleStatus = async (room) => {
    const newStatus = room.status === 'AVAILABLE' ? 'MAINTENANCE' : 'AVAILABLE';
    try {
      await api.put(`/rooms/${room.room_id}/status`, { status: newStatus });
      fetchRooms(selectedProperty);
    } catch (err) {
      alert(err.formattedMessage || 'Failed to toggle room status');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.post('/rooms', {
        ...formData,
        property_id: selectedProperty
      });
      setModalOpen(false);
      setFormData({ room_number: '', floor: 1, room_type_id: 'RTYP-001', max_guests: 2 });
      fetchRooms(selectedProperty);
    } catch (err) {
      setError(err.formattedMessage || 'Failed to create room');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Room Inventory & Maintenance</h1>
          <p className="text-xs text-gray-500 mt-1">Manage physical room units and toggle maintenance availability.</p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedProperty}
            onChange={e => setSelectedProperty(e.target.value)}
            className="border border-gray-200 rounded-xl p-2.5 text-xs font-semibold focus:ring-1 focus:ring-teal-500 focus:outline-none"
          >
            {properties.map(p => (
              <option key={p.property_id} value={p.property_id}>
                {p.name} ({p.city})
              </option>
            ))}
          </select>

          <button
            onClick={() => setModalOpen(true)}
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition flex items-center space-x-1.5 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Physical Room</span>
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
                <th className="p-4">Room ID</th>
                <th className="p-4">Room Number</th>
                <th className="p-4">Floor</th>
                <th className="p-4">Room Type</th>
                <th className="p-4">Max Capacity</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rooms.map(r => (
                <tr key={r.room_id} className="hover:bg-gray-50/50">
                  <td className="p-4 font-mono font-bold text-gray-900">{r.room_id}</td>
                  <td className="p-4 font-bold text-gray-900">Room {r.room_number}</td>
                  <td className="p-4">Floor {r.floor}</td>
                  <td className="p-4 font-mono text-gray-500">{r.room_type_id}</td>
                  <td className="p-4">{r.max_guests} Guests</td>
                  <td className="p-4">
                    {r.status === 'AVAILABLE' ? (
                      <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded text-[10px] font-bold">
                        AVAILABLE
                      </span>
                    ) : (
                      <span className="bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded text-[10px] font-bold flex items-center space-x-1 w-max">
                        <Wrench className="w-3 h-3" />
                        <span>{r.status}</span>
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => toggleStatus(r)}
                      className={`text-xs font-bold px-3 py-1 rounded-lg transition border ${
                        r.status === 'AVAILABLE'
                          ? 'border-amber-300 text-amber-700 hover:bg-amber-50'
                          : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                      }`}
                    >
                      {r.status === 'AVAILABLE' ? 'Mark Maintenance' : 'Mark Available'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Room Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h2 className="text-lg font-black text-gray-900">Add Room to Property</h2>
            {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs">{error}</div>}
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-500 mb-1">Room Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 105"
                  value={formData.room_number}
                  onChange={e => setFormData({ ...formData, room_number: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg p-2 font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-500 mb-1">Floor</label>
                  <input
                    type="number"
                    required
                    value={formData.floor}
                    onChange={e => setFormData({ ...formData, floor: Number(e.target.value) })}
                    className="w-full border border-gray-200 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Max Capacity</label>
                  <input
                    type="number"
                    required
                    value={formData.max_guests}
                    onChange={e => setFormData({ ...formData, max_guests: Number(e.target.value) })}
                    className="w-full border border-gray-200 rounded-lg p-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-500 mb-1">Room Type</label>
                <select
                  value={formData.room_type_id}
                  onChange={e => setFormData({ ...formData, room_type_id: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg p-2"
                >
                  {roomTypes
                    .filter(rt => rt.property_id === selectedProperty)
                    .map(rt => (
                      <option key={rt.room_type_id} value={rt.room_type_id}>
                        {rt.name} (Base ₹{rt.base_price_per_night})
                      </option>
                    ))}
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
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 rounded-xl"
                >
                  Create Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
