import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { Search, MapPin, Calendar, Users, Hotel, AlertCircle, ArrowRight } from 'lucide-react';

export const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const future = new Date();
  future.setDate(future.getDate() + 4);

  const initialCheckIn = searchParams.get('check_in_date')
    ? searchParams.get('check_in_date').split('T')[0]
    : tomorrow.toISOString().split('T')[0];

  const initialCheckOut = searchParams.get('check_out_date')
    ? searchParams.get('check_out_date').split('T')[0]
    : future.toISOString().split('T')[0];

  const [city, setCity] = useState(searchParams.get('city') || '');
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [guests, setGuests] = useState(Number(searchParams.get('guests_count')) || 2);

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRooms = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        check_in_date: `${checkIn}T14:00:00Z`,
        check_out_date: `${checkOut}T11:00:00Z`,
        guests_count: guests,
        ...(city ? { city } : {})
      };

      const res = await api.get('/search/availability', { params });
      setRooms(res.data.data.rooms || []);
    } catch (err) {
      console.error('Search failed:', err);
      setError(err.formattedMessage || 'Failed to search available rooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRooms();
  };

  const handleBookRoom = (room) => {
    const params = new URLSearchParams({
      check_in_date: `${checkIn}T14:00:00Z`,
      check_out_date: `${checkOut}T11:00:00Z`,
      guests_count: guests,
      property_id: room.property.property_id
    });
    navigate(`/checkout/${room.room_id}?${params.toString()}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Search Header Form - Trivago Style Clean White Box */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>City / Destination</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Mumbai, Goa"
              value={city}
              onChange={e => setCity(e.target.value)}
              className="w-full text-xs font-semibold border border-gray-200 rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Check-In</span>
            </label>
            <input
              type="date"
              required
              value={checkIn}
              onChange={e => setCheckIn(e.target.value)}
              className="w-full text-xs font-semibold border border-gray-200 rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Check-Out</span>
            </label>
            <input
              type="date"
              required
              value={checkOut}
              onChange={e => setCheckOut(e.target.value)}
              className="w-full text-xs font-semibold border border-gray-200 rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center space-x-1">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>Guests</span>
            </label>
            <select
              value={guests}
              onChange={e => setGuests(Number(e.target.value))}
              className="w-full text-xs font-semibold border border-gray-200 rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              <option value={1}>1 Guest</option>
              <option value={2}>2 Guests</option>
              <option value={3}>3 Guests</option>
              <option value={4}>4 Guests</option>
            </select>
          </div>

          <div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg shadow-sm transition flex items-center justify-center space-x-2 text-xs"
            >
              <Search className="w-4 h-4" />
              <span>Search Deals</span>
            </button>
          </div>
        </form>
      </div>

      {/* Results Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-gray-900">
            Available Rooms ({rooms.length})
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Dates: <span className="font-semibold text-gray-800">{checkIn}</span> to <span className="font-semibold text-gray-800">{checkOut}</span> • Verified Real-time Rates
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center space-x-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(n => (
            <div key={n} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm animate-pulse flex justify-between items-center">
              <div className="space-y-3 w-1/2">
                <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-100 rounded w-2/3"></div>
                <div className="h-4 bg-gray-100 rounded w-1/4"></div>
              </div>
              <div className="h-10 bg-gray-200 rounded w-32"></div>
            </div>
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-4 shadow-sm">
          <Hotel className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-lg font-bold text-gray-900">No rooms available for these dates</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            All rooms at this destination are currently reserved or undergoing maintenance for the selected date range. Try adjusting your dates.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {rooms.map(room => (
            <div
              key={room.room_id}
              className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center space-x-2">
                  <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-0.5 rounded uppercase border border-blue-100">
                    {room.room_type?.name}
                  </span>
                  <span className="text-xs text-gray-400 font-mono">
                    Room {room.room_number} (Floor {room.floor})
                  </span>
                </div>

                <h3 className="text-lg font-bold text-gray-900">
                  {room.property?.name}
                </h3>

                <p className="text-xs text-gray-500 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  <span>{room.property?.city}, {room.property?.state}</span>
                </p>

                <p className="text-xs text-gray-600">
                  {room.room_type?.description || 'Comfortable stay with air conditioning and premium amenities.'}
                </p>

                <div className="flex items-center space-x-4 pt-1 text-xs text-gray-500">
                  <span className="flex items-center space-x-1">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    <span>Max {room.max_guests} Guests</span>
                  </span>
                  <span>• Free WiFi</span>
                  <span>• 11:00 AM Checkout</span>
                </div>
              </div>

              <div className="flex md:flex-col items-end justify-between w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-gray-100 space-y-2">
                <div className="text-right">
                  <p className="text-[11px] text-gray-400 uppercase font-semibold">Total estimated stay</p>
                  <p className="text-2xl font-black text-gray-900">
                    ₹{room.pricing_estimate?.total_amount?.toLocaleString() || room.room_type?.base_price_per_night?.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-blue-600 font-bold">
                    ₹{room.room_type?.base_price_per_night?.toLocaleString()} / night base
                  </p>
                </div>

                <button
                  onClick={() => handleBookRoom(room)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm transition flex items-center space-x-1.5"
                >
                  <span>Select & Book</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
