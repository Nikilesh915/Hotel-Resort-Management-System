import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { Search, MapPin, Calendar, Users, Shield, ArrowRight, Hotel, Sparkles } from 'lucide-react';

export const Home = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [city, setCity] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);

  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const future = new Date();
    future.setDate(future.getDate() + 4);

    setCheckIn(tomorrow.toISOString().split('T')[0]);
    setCheckOut(future.toISOString().split('T')[0]);

    api.get('/properties')
      .then(res => setProperties(res.data.data))
      .catch(err => console.error('Failed to load properties:', err));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams({
      check_in_date: `${checkIn}T14:00:00Z`,
      check_out_date: `${checkOut}T11:00:00Z`,
      guests_count: guests,
      ...(city ? { city } : {})
    });
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="space-y-14 pb-12">
      {/* Hero Section - Trivago Inspired Clean White & Blue */}
      <div className="relative bg-gradient-to-b from-blue-50 via-white to-gray-50 py-16 px-4 sm:px-6 lg:px-8 border-b border-blue-100/60 shadow-sm">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight leading-tight">
            Find the right hotel, resort & property stay.
          </h1>
          
          <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto font-normal">
            Search top destinations, compare verified real-time room pricing, apply eligible promo coupons, and reserve instantly.
          </p>

          {/* Trivago Style Search Box */}
          <form
            onSubmit={handleSearch}
            className="bg-white text-gray-900 p-3 sm:p-4 rounded-2xl shadow-xl grid grid-cols-1 sm:grid-cols-4 gap-3 text-left border border-gray-200 mt-6"
          >
            <div className="border-b sm:border-b-0 sm:border-r border-gray-200 pb-3 sm:pb-0 sm:pr-3">
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1 flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>Destination</span>
              </label>
              <input
                type="text"
                placeholder="Where are you going?"
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full text-sm font-semibold border-0 focus:ring-0 p-1 text-gray-900 placeholder-gray-400 focus:outline-none"
              />
            </div>

            <div className="border-b sm:border-b-0 sm:border-r border-gray-200 pb-3 sm:pb-0 sm:px-3">
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Check-In</span>
              </label>
              <input
                type="date"
                required
                value={checkIn}
                onChange={e => setCheckIn(e.target.value)}
                className="w-full text-sm font-semibold border-0 focus:ring-0 p-1 text-gray-900 focus:outline-none"
              />
            </div>

            <div className="border-b sm:border-b-0 sm:border-r border-gray-200 pb-3 sm:pb-0 sm:px-3">
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Check-Out</span>
              </label>
              <input
                type="date"
                required
                value={checkOut}
                onChange={e => setCheckOut(e.target.value)}
                className="w-full text-sm font-semibold border-0 focus:ring-0 p-1 text-gray-900 focus:outline-none"
              />
            </div>

            <div className="flex items-center sm:pl-3">
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-md transition flex items-center justify-center space-x-2 text-sm"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Featured Properties Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Featured Properties & Hotels</h2>
            <p className="text-gray-500 text-xs sm:text-sm mt-1">Explore verified beachfront resorts and luxury city hotels.</p>
          </div>
          <button
            onClick={() => navigate('/search')}
            className="text-blue-600 hover:text-blue-700 font-bold text-sm flex items-center space-x-1"
          >
            <span>View All Rooms</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {properties.map(prop => (
            <div
              key={prop.property_id}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="inline-block bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider mb-2 border border-blue-100">
                      {prop.property_type}
                    </span>
                    <h3 className="text-xl font-bold text-gray-900">{prop.name}</h3>
                    <p className="text-gray-500 text-xs flex items-center space-x-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      <span>{prop.address}, {prop.city}, {prop.state}</span>
                    </p>
                  </div>
                  <span className="bg-gray-100 text-gray-700 font-mono text-xs px-2.5 py-1 rounded font-bold">
                    {prop.property_code}
                  </span>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed">
                  Prime location with ocean and city skyline views, daily housekeeping, 24/7 concierge, and premium air-conditioned suites.
                </p>
              </div>

              <div className="bg-gray-50/80 px-6 py-4 border-t border-gray-100 flex justify-between items-center">
                <span className="text-xs text-gray-500 font-medium">
                  Status: <span className="text-blue-600 font-bold">Active & Bookable</span>
                </span>
                <button
                  onClick={() => navigate(`/search?city=${prop.city}`)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition"
                >
                  View Deals in {prop.city}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Promo Deals Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-2xl text-white p-8 shadow-lg flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-2">
            <span className="bg-white/20 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Exclusive Promo Offer
            </span>
            <h3 className="text-2xl font-bold">Save 20% on Your Stay with Code: SAVE20</h3>
            <p className="text-blue-100 text-xs sm:text-sm max-w-xl">
              Enjoy 20% discount on bookings over ₹10,000 (up to ₹5,000 off). Or use code <span className="font-bold underline text-white">FLAT1500</span> for instant ₹1,500 off at Grand Mumbai Hotel!
            </p>
          </div>
          <button
            onClick={() => navigate('/search')}
            className="bg-white text-blue-800 hover:bg-blue-50 font-bold px-6 py-3 rounded-xl shadow-md transition whitespace-nowrap text-sm"
          >
            Apply Promo Code
          </button>
        </div>
      </div>
    </div>
  );
};
