import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { BedDouble, Plus, AlertCircle, Loader2, Wrench, Layers, Calendar, Edit2, ShieldAlert, Check } from 'lucide-react';

export const AdminRooms = () => {
  const [activeTab, setActiveTab] = useState('ROOMS'); // 'ROOMS' | 'TYPES' | 'AVAILABILITY'
  const [rooms, setRooms] = useState([]);
  const [properties, setProperties] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState('');
  const [loading, setLoading] = useState(true);

  // Room modal
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [roomForm, setRoomForm] = useState({
    room_number: '',
    floor: 1,
    room_type_id: '',
    max_guests: 2,
    status: 'AVAILABLE'
  });

  // Room Type modal
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [typeForm, setTypeForm] = useState({
    name: '',
    description: '',
    max_guests: 2,
    base_price_per_night: 5000,
    status: 'ACTIVE'
  });

  // Availability & Blocking modal
  const [availabilityModalOpen, setAvailabilityModalOpen] = useState(false);
  const [selectedRoomForAvailability, setSelectedRoomForAvailability] = useState(null);
  const [allocations, setAllocations] = useState([]);
  const [blockDatesInput, setBlockDatesInput] = useState('');
  const [blockReason, setBlockReason] = useState('Scheduled Maintenance');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fetchPropertiesAndTypes = async () => {
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
    fetchPropertiesAndTypes();
  }, []);

  useEffect(() => {
    if (selectedProperty) {
      fetchRooms(selectedProperty);
    }
  }, [selectedProperty]);

  // Room Actions
  const openCreateRoomModal = () => {
    setEditingRoom(null);
    const availableTypes = roomTypes.filter(rt => rt.property_id === selectedProperty);
    setRoomForm({
      room_number: '',
      floor: 1,
      room_type_id: availableTypes.length > 0 ? availableTypes[0].room_type_id : '',
      max_guests: 2,
      status: 'AVAILABLE'
    });
    setError(null);
    setRoomModalOpen(true);
  };

  const openEditRoomModal = (room) => {
    setEditingRoom(room);
    setRoomForm({
      room_number: room.room_number,
      floor: room.floor,
      room_type_id: room.room_type_id,
      max_guests: room.max_guests,
      status: room.status
    });
    setError(null);
    setRoomModalOpen(true);
  };

  const handleSaveRoom = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (editingRoom) {
        await api.put(`/rooms/${editingRoom.room_id}`, roomForm);
      } else {
        await api.post('/rooms', {
          ...roomForm,
          property_id: selectedProperty
        });
      }
      setRoomModalOpen(false);
      fetchRooms(selectedProperty);
    } catch (err) {
      setError(err.formattedMessage || 'Failed to save room');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleRoomStatus = async (room) => {
    const newStatus = room.status === 'AVAILABLE' ? 'MAINTENANCE' : 'AVAILABLE';
    try {
      await api.put(`/rooms/${room.room_id}/status`, { status: newStatus });
      fetchRooms(selectedProperty);
    } catch (err) {
      alert(err.formattedMessage || 'Failed to toggle room status');
    }
  };

  // Room Type Actions
  const openCreateTypeModal = () => {
    setEditingType(null);
    setTypeForm({
      name: '',
      description: '',
      max_guests: 2,
      base_price_per_night: 5000,
      status: 'ACTIVE'
    });
    setError(null);
    setTypeModalOpen(true);
  };

  const openEditTypeModal = (type) => {
    setEditingType(type);
    setTypeForm({
      name: type.name,
      description: type.description || '',
      max_guests: type.max_guests,
      base_price_per_night: type.base_price_per_night,
      status: type.status || 'ACTIVE'
    });
    setError(null);
    setTypeModalOpen(true);
  };

  const handleSaveType = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (editingType) {
        await api.put(`/rooms/types/${editingType.room_type_id}`, typeForm);
      } else {
        await api.post('/rooms/types', {
          ...typeForm,
          property_id: selectedProperty
        });
      }
      setTypeModalOpen(false);
      const res = await api.get('/rooms/types');
      setRoomTypes(res.data.data);
    } catch (err) {
      setError(err.formattedMessage || 'Failed to save room type');
    } finally {
      setSubmitting(false);
    }
  };

  // Availability & Date Blocking
  const openAvailabilityModal = async (room) => {
    setSelectedRoomForAvailability(room);
    setError(null);
    setBlockDatesInput('');
    setAvailabilityModalOpen(true);
    try {
      const res = await api.get(`/rooms/${room.room_id}/availability`);
      setAllocations(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBlockDates = async () => {
    if (!blockDatesInput.trim()) return;
    const dates = blockDatesInput.split(',').map(d => d.trim()).filter(Boolean);
    setSubmitting(true);
    setError(null);
    try {
      await api.post(`/rooms/${selectedRoomForAvailability.room_id}/block-dates`, {
        dates,
        reason: blockReason
      });
      setBlockDatesInput('');
      const res = await api.get(`/rooms/${selectedRoomForAvailability.room_id}/availability`);
      setAllocations(res.data.data);
    } catch (err) {
      setError(err.formattedMessage || 'Failed to block dates');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnblockDate = async (date) => {
    try {
      await api.post(`/rooms/${selectedRoomForAvailability.room_id}/unblock-dates`, {
        dates: [date]
      });
      const res = await api.get(`/rooms/${selectedRoomForAvailability.room_id}/availability`);
      setAllocations(res.data.data);
    } catch (err) {
      alert(err.formattedMessage || 'Failed to unblock date');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header & Property Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Rooms & Inventory Management</h1>
          <p className="text-xs text-gray-500 mt-1">Configure physical rooms, room categories, and enforce date availability blocks.</p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedProperty}
            onChange={e => setSelectedProperty(e.target.value)}
            className="border border-gray-200 rounded-xl p-2.5 text-xs font-semibold focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            {properties.map(p => (
              <option key={p.property_id} value={p.property_id}>
                {p.name} ({p.city})
              </option>
            ))}
          </select>

          {activeTab === 'ROOMS' && (
            <button
              onClick={openCreateRoomModal}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition flex items-center space-x-1.5 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Add Physical Room</span>
            </button>
          )}

          {activeTab === 'TYPES' && (
            <button
              onClick={openCreateTypeModal}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition flex items-center space-x-1.5 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Add Room Type</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 space-x-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('ROOMS')}
          className={`pb-3 flex items-center space-x-1.5 border-b-2 transition ${
            activeTab === 'ROOMS' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <BedDouble className="w-4 h-4" />
          <span>Physical Rooms ({rooms.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('TYPES')}
          className={`pb-3 flex items-center space-x-1.5 border-b-2 transition ${
            activeTab === 'TYPES' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Room Types ({roomTypes.filter(rt => rt.property_id === selectedProperty).length})</span>
        </button>
      </div>

      {/* TAB 1: PHYSICAL ROOMS */}
      {activeTab === 'ROOMS' && (
        loading ? (
          <div className="py-20 flex justify-center text-blue-600">
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
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rooms.map(r => (
                  <tr key={r.room_id} className="hover:bg-gray-50/50">
                    <td className="p-4 font-mono font-bold text-gray-900">{r.room_id}</td>
                    <td className="p-4 font-bold text-gray-900">Room {r.room_number}</td>
                    <td className="p-4">Floor {r.floor}</td>
                    <td className="p-4 font-mono text-gray-500">
                      {roomTypes.find(rt => rt.room_type_id === r.room_type_id)?.name || r.room_type_id}
                    </td>
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
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => openAvailabilityModal(r)}
                        className="text-xs font-bold px-2.5 py-1 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 transition"
                        title="Manage Availability & Blocks"
                      >
                        Availability
                      </button>
                      <button
                        onClick={() => openEditRoomModal(r)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit Room"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => toggleRoomStatus(r)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg transition border ${
                          r.status === 'AVAILABLE'
                            ? 'border-amber-300 text-amber-700 hover:bg-amber-50'
                            : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        {r.status === 'AVAILABLE' ? 'Set Maintenance' : 'Set Available'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* TAB 2: ROOM TYPES */}
      {activeTab === 'TYPES' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-400 uppercase font-semibold text-[10px]">
              <tr>
                <th className="p-4">Type ID</th>
                <th className="p-4">Category Name</th>
                <th className="p-4">Base Price / Night</th>
                <th className="p-4">Max Guests</th>
                <th className="p-4">Description</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {roomTypes
                .filter(rt => rt.property_id === selectedProperty)
                .map(rt => (
                  <tr key={rt.room_type_id} className="hover:bg-gray-50/50">
                    <td className="p-4 font-mono font-bold text-gray-900">{rt.room_type_id}</td>
                    <td className="p-4 font-bold text-gray-900">{rt.name}</td>
                    <td className="p-4 font-black text-gray-900">₹{rt.base_price_per_night?.toLocaleString()}</td>
                    <td className="p-4">{rt.max_guests} Guests</td>
                    <td className="p-4 text-gray-500 max-w-xs truncate">{rt.description || '—'}</td>
                    <td className="p-4">
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                        {rt.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => openEditTypeModal(rt)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit Room Type"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Room Modal (Create / Edit) */}
      {roomModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h2 className="text-lg font-black text-gray-900">
              {editingRoom ? `Edit Room ${editingRoom.room_number}` : 'Add Physical Room'}
            </h2>
            {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs">{error}</div>}
            <form onSubmit={handleSaveRoom} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-500 mb-1">Room Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 105"
                  value={roomForm.room_number}
                  onChange={e => setRoomForm({ ...roomForm, room_number: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg p-2 font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-500 mb-1">Floor</label>
                  <input
                    type="number"
                    required
                    value={roomForm.floor}
                    onChange={e => setRoomForm({ ...roomForm, floor: Number(e.target.value) })}
                    className="w-full border border-gray-200 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Max Capacity</label>
                  <input
                    type="number"
                    required
                    value={roomForm.max_guests}
                    onChange={e => setRoomForm({ ...roomForm, max_guests: Number(e.target.value) })}
                    className="w-full border border-gray-200 rounded-lg p-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-500 mb-1">Room Type</label>
                <select
                  value={roomForm.room_type_id}
                  onChange={e => setRoomForm({ ...roomForm, room_type_id: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg p-2 font-semibold"
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
              <div>
                <label className="block text-gray-500 mb-1">Status</label>
                <select
                  value={roomForm.status}
                  onChange={e => setRoomForm({ ...roomForm, status: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg p-2"
                >
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRoomModalOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow-sm"
                >
                  {submitting ? 'Saving...' : editingRoom ? 'Save Changes' : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Room Type Modal (Create / Edit) */}
      {typeModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h2 className="text-lg font-black text-gray-900">
              {editingType ? `Edit Category ${editingType.name}` : 'Add Room Category / Type'}
            </h2>
            {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs">{error}</div>}
            <form onSubmit={handleSaveType} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-500 mb-1">Type Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Deluxe Ocean View Suite"
                  value={typeForm.name}
                  onChange={e => setTypeForm({ ...typeForm, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg p-2 font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-500 mb-1">Base Price / Night (₹)</label>
                  <input
                    type="number"
                    required
                    value={typeForm.base_price_per_night}
                    onChange={e => setTypeForm({ ...typeForm, base_price_per_night: Number(e.target.value) })}
                    className="w-full border border-gray-200 rounded-lg p-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Max Guests</label>
                  <input
                    type="number"
                    required
                    value={typeForm.max_guests}
                    onChange={e => setTypeForm({ ...typeForm, max_guests: Number(e.target.value) })}
                    className="w-full border border-gray-200 rounded-lg p-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-500 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="e.g. King-size bed, balcony with direct sea view, luxury toiletries"
                  value={typeForm.description}
                  onChange={e => setTypeForm({ ...typeForm, description: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block text-gray-500 mb-1">Status</label>
                <select
                  value={typeForm.status}
                  onChange={e => setTypeForm({ ...typeForm, status: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg p-2"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTypeModalOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow-sm"
                >
                  {submitting ? 'Saving...' : editingType ? 'Save Changes' : 'Create Room Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Room Availability & Date Blocking Modal */}
      {availabilityModalOpen && selectedRoomForAvailability && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-black text-gray-900">
                  Manage Availability: Room {selectedRoomForAvailability.room_number}
                </h2>
                <p className="text-xs text-gray-400">View booked slots and manually block/unblock dates for offline maintenance.</p>
              </div>
              <button
                onClick={() => setAvailabilityModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs">{error}</div>}

            {/* Block dates tool */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-3 text-xs">
              <span className="font-bold text-gray-800 block">Block Specific Dates</span>
              <div>
                <label className="block text-gray-500 mb-1">Dates (comma-separated YYYY-MM-DD):</label>
                <input
                  type="text"
                  placeholder="e.g. 2026-11-10, 2026-11-11"
                  value={blockDatesInput}
                  onChange={e => setBlockDatesInput(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 font-mono text-xs"
                />
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Reason (e.g. Renovation)"
                  value={blockReason}
                  onChange={e => setBlockReason(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-lg p-2 text-xs"
                />
                <button
                  type="button"
                  onClick={handleBlockDates}
                  disabled={submitting || !blockDatesInput.trim()}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-lg transition"
                >
                  Block
                </button>
              </div>
            </div>

            {/* Existing Allocations List */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-gray-700 block">Current Allocations & Blocks ({allocations.length})</span>
              {allocations.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-2">No active bookings or date blocks recorded for this room.</p>
              ) : (
                <div className="max-h-56 overflow-y-auto space-y-1.5 border border-gray-100 rounded-xl p-2">
                  {allocations.map(a => (
                    <div key={a.date} className="flex justify-between items-center bg-gray-50 p-2.5 rounded-lg text-xs">
                      <div>
                        <span className="font-mono font-bold text-gray-800 mr-2">{a.date}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          a.status === 'BLOCKED' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {a.status}
                        </span>
                        <span className="text-[10px] text-gray-400 ml-2 font-mono">{a.reservation_id}</span>
                      </div>
                      {a.status === 'BLOCKED' && (
                        <button
                          onClick={() => handleUnblockDate(a.date)}
                          className="text-[10px] text-rose-600 font-bold hover:underline"
                        >
                          Unblock
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setAvailabilityModalOpen(false)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
