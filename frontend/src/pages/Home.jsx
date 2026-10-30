import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { Search, MapPin, Calendar, Users, Shield, Award, Sparkles, ArrowRight, Hotel } from 'lucide-react';

export const Home = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [city, setCity] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);

  useEffect(() => {
    // Default search dates: tomorrow to +4 days
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const future = new Date();
    future.setDate(future.getDate() + 4);

    setCheckIn(tomorrow.toISOString().split('T')[0]);
    setCheckOut(future.toISOString().split('T')[0]);

    // Fetch active properties
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
    <div className="space-y-16">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white py-20 px-4 sm:px-6 lg:px-8 rounded-b-3xl shadow-xl overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#14b8a6_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center space-x-2 bg-teal-500/10 border border-teal-500/20 text-teal-300 px-3.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Guaranteed ACID Transaction Concurrency & Dynamic Rates</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Reserve Premier Hotels, Resorts & Luxury Stays
          </h1>
          
          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto font-normal">
            Experience seamless property booking with guaranteed zero double-bookings, instant verified coupons, and transparent policy-based refunds.
          </p>

          {/* Search Box */}
          <form
            onSubmit={handleSearch}
            className="bg-white text-gray-900 p-4 sm:p-5 rounded-2xl shadow-2xl grid grid-cols-1 sm:grid-cols-4 gap-4 text-left border border-gray-100"
          >
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-teal-600" />
                <span>Destination</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Mumbai, Goa"
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full text-sm font-medium border-0 focus:ring-0 p-1 text-gray-800 placeholder-gray-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-teal-600" />
                <span>Check-In</span>
              </label>
              <input
                type="date"
                required
                value={checkIn}
                onChange={e => setCheckIn(e.target.value)}
                className="w-full text-sm font-medium border-0 focus:ring-0 p-1 text-gray-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-teal-600" />
                <span>Check-Out</span>
              </label>
              <input
                type="date"
                required
                value={checkOut}
                onChange={e => setCheckOut(e.target.value)}
                className="w-full text-sm font-medium border-0 focus:ring-0 p-1 text-gray-800 focus:outline-none"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center space-x-2"
              >
                <Search className="w-4 h-4" />
                <span>Search Rooms</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Featured Properties */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Featured Destinations & Properties</h2>
            <p className="text-gray-500 text-sm mt-1">Explore top-rated luxury hotels and beachfront resorts supported on the platform.</p>
          </div>
          <button
            onClick={() => navigate('/search')}
            className="text-teal-600 hover:text-teal-700 font-semibold text-sm flex items-center space-x-1"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {properties.map(prop => (
            <div
              key={prop.property_id}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="inline-block bg-teal-50 text-teal-700 text-xs font-semibold px-2.5 py-1 rounded-md uppercase tracking-wider mb-2">
                      {prop.property_type}
                    </span>
                    <h3 className="text-xl font-bold text-gray-900">{prop.name}</h3>
                    <p className="text-gray-500 text-sm flex items-center space-x-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      <span>{prop.address}, {prop.city}, {prop.state}</span>
                    </p>
                  </div>
                  <span className="bg-gray-100 text-gray-700 font-mono text-xs px-2 py-1 rounded">
                    {prop.property_code}
                  </span>
                </div>

                <p className="text-sm text-gray-600">
                  Full concierge services, high-speed WiFi, complimentary breakfast, and scenic ocean and city views.
                </p>
              </div>

              <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-between items-center">
                <span className="text-xs text-gray-500 font-medium">Status: <span className="text-teal-600 font-bold">Active</span></span>
                <button
                  onClick={() => navigate(`/search?city=${prop.city}`)}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
                >
                  Explore Rooms in {prop.city}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Promo Offers Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-teal-600 to-emerald-600 rounded-2xl text-white p-8 shadow-lg flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-2">
            <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Special Promotion
            </span>
            <h3 className="text-2xl font-bold">Use Promo Code: SAVE20</h3>
            <p className="text-teal-100 text-sm max-w-xl">
              Enjoy 20% off bookings over ₹10,000 (up to ₹5,000 discount). Or use code <span className="font-bold underline">FLAT1500</span> for instant ₹1,500 off at Grand Mumbai Hotel!
            </p>
          </div>
          <button
            onClick={() => navigate('/search')}
            className="bg-white text-teal-800 hover:bg-teal-50 font-bold px-6 py-3 rounded-xl shadow-md transition whitespace-nowrap"
          >
            Book With Coupon
          </button>
        </div>
      </div>
    </div>
  );
};
