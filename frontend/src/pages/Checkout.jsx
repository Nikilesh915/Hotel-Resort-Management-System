import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Calendar, Users, Tag, AlertCircle, ArrowRight, Loader2, Hotel } from 'lucide-react';

export const Checkout = () => {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, guest } = useAuth();

  const checkIn = searchParams.get('check_in_date');
  const checkOut = searchParams.get('check_out_date');
  const guestsCount = Number(searchParams.get('guests_count')) || 2;
  const propertyId = searchParams.get('property_id');

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [quote, setQuote] = useState(null);
  const [loadingQuote, setLoadingQuote] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [couponError, setCouponError] = useState(null);
  const [cancellationPolicy, setCancellationPolicy] = useState('FLEXIBLE');

  const fetchQuote = async (couponToApply = appliedCoupon) => {
    setLoadingQuote(true);
    setCouponError(null);
    try {
      const res = await api.post('/pricing/quote', {
        room_id: roomId,
        check_in_date: checkIn,
        check_out_date: checkOut,
        guests_count: guestsCount,
        coupon_code: couponToApply || undefined
      });
      setQuote(res.data.data);
      if (couponToApply) {
        setAppliedCoupon(couponToApply);
      }
    } catch (err) {
      if (couponToApply) {
        setCouponError(err.formattedMessage || 'Coupon not applicable');
      } else {
        setError(err.formattedMessage || 'Failed to calculate room pricing quote');
      }
    } finally {
      setLoadingQuote(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search));
      return;
    }
    fetchQuote();
  }, [user]);

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    fetchQuote(couponCode.trim().toUpperCase());
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon('');
    setCouponCode('');
    fetchQuote('');
  };

  const handleCreateReservation = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.post('/reservations', {
        property_id: propertyId,
        room_id: roomId,
        check_in_date: checkIn,
        check_out_date: checkOut,
        guests_count: guestsCount,
        coupon_code: appliedCoupon || undefined,
        cancellation_policy: cancellationPolicy
      });

      const reservation = res.data.data;
      navigate(`/payment/${reservation.reservation_id}`);
    } catch (err) {
      console.error('Reservation submission error:', err);
      if (err.errorCode === 'ROOM_ALREADY_RESERVED' || err.response?.status === 409) {
        setError('Double-Booking Conflict: Another guest has just reserved this room for the requested dates. Please choose another available room.');
      } else {
        setError(err.formattedMessage || 'Failed to create reservation');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!checkIn || !checkOut) {
    return (
      <div className="max-w-xl mx-auto my-20 p-8 bg-white border border-gray-200 rounded-2xl text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-gray-900">Missing Booking Parameters</h2>
        <p className="text-sm text-gray-500">Please choose your dates from the search page before booking.</p>
        <button
          onClick={() => navigate('/search')}
          className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs px-4 py-2 rounded-lg"
        >
          Go to Search
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Review & Confirm Reservation</h1>
        <p className="text-xs text-gray-500 mt-1">Review verified server-calculated pricing, apply eligible promo codes, and complete booking.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start space-x-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Reservation Error</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Guest & Policy Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Reservation Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 flex items-center space-x-2">
              <Hotel className="w-4 h-4 text-teal-600" />
              <span>Stay Details</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl text-xs">
              <div>
                <span className="text-gray-400 block font-medium">Room</span>
                <span className="font-bold text-gray-900">{roomId}</span>
              </div>
              <div>
                <span className="text-gray-400 block font-medium">Check-In</span>
                <span className="font-bold text-gray-900">{checkIn?.split('T')[0]} (14:00)</span>
              </div>
              <div>
                <span className="text-gray-400 block font-medium">Check-Out</span>
                <span className="font-bold text-gray-900">{checkOut?.split('T')[0]} (11:00)</span>
              </div>
              <div>
                <span className="text-gray-400 block font-medium">Guests</span>
                <span className="font-bold text-gray-900">{guestsCount} Guests</span>
              </div>
            </div>
          </div>

          {/* Guest Information */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-sm">
            <h2 className="text-base font-bold text-gray-900">Guest Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-gray-500 font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  disabled
                  value={user?.name || ''}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-700 font-semibold"
                />
              </div>
              <div>
                <label className="block text-gray-500 font-medium mb-1">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-700 font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Cancellation Policy Selector */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-sm">
            <h2 className="text-base font-bold text-gray-900">Cancellation Policy</h2>
            <div className="space-y-3">
              {[
                {
                  id: 'FLEXIBLE',
                  title: 'Flexible Policy (Recommended)',
                  desc: 'Full 100% refund up to 24 hours prior to check-in. 10% fee if cancelled within 24 hours.'
                },
                {
                  id: 'MODERATE',
                  title: 'Moderate Policy',
                  desc: 'Full refund up to 5 days prior; 50% refund between 2 and 5 days; non-refundable under 48 hours.'
                },
                {
                  id: 'STRICT',
                  title: 'Strict Policy',
                  desc: '10% cancellation fee deducted up to 7 days before check-in; non-refundable within 7 days.'
                }
              ].map(pol => (
                <label
                  key={pol.id}
                  className={`flex items-start space-x-3 p-3.5 rounded-xl border cursor-pointer transition ${
                    cancellationPolicy === pol.id
                      ? 'border-teal-600 bg-teal-50/40'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="policy"
                    value={pol.id}
                    checked={cancellationPolicy === pol.id}
                    onChange={() => setCancellationPolicy(pol.id)}
                    className="mt-1 text-teal-600 focus:ring-teal-500"
                  />
                  <div className="text-xs">
                    <p className="font-bold text-gray-900">{pol.title}</p>
                    <p className="text-gray-500 mt-0.5">{pol.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Server-Calculated Price Summary & Coupon */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6 shadow-sm sticky top-24">
            <h2 className="text-base font-bold text-gray-900">Price Breakdown</h2>

            {loadingQuote ? (
              <div className="py-8 flex justify-center items-center text-teal-600">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : quote ? (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Base Room Rate ({quote.nights} nights)</span>
                  <span className="font-semibold text-gray-900">₹{quote.base_amount.toLocaleString()}</span>
                </div>

                {quote.discount_amount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Coupon Discount ({appliedCoupon})</span>
                    <span>-₹{quote.discount_amount.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between text-gray-600">
                  <span>GST Taxes (12%)</span>
                  <span className="font-semibold text-gray-900">₹{quote.tax_amount.toLocaleString()}</span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>Standard Service Fee</span>
                  <span className="font-semibold text-gray-900">₹{quote.service_fee.toLocaleString()}</span>
                </div>

                <div className="pt-3 border-t border-gray-200 flex justify-between items-center text-sm font-black text-gray-900">
                  <span>Total Payable</span>
                  <span className="text-xl text-teal-700">₹{quote.total_amount.toLocaleString()}</span>
                </div>
              </div>
            ) : null}

            {/* Coupon Box */}
            <div className="pt-4 border-t border-gray-100 space-y-3">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center space-x-1">
                <Tag className="w-3.5 h-3.5 text-teal-600" />
                <span>Promo Coupon</span>
              </label>

              {appliedCoupon ? (
                <div className="flex justify-between items-center bg-teal-50 border border-teal-200 text-teal-800 px-3 py-2 rounded-lg text-xs font-bold">
                  <span>Code '{appliedCoupon}' Applied!</span>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-red-500 hover:text-red-700 underline text-[11px] font-medium"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="e.g. SAVE20"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-1 text-xs border border-gray-200 rounded-lg p-2 font-mono uppercase focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-2 rounded-lg transition"
                  >
                    Apply
                  </button>
                </form>
              )}

              {couponError && (
                <p className="text-[11px] text-red-600 font-medium">{couponError}</p>
              )}
            </div>

            {/* Reserve Button */}
            <button
              onClick={handleCreateReservation}
              disabled={submitting || loadingQuote}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-50 text-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Locking Inventory...</span>
                </>
              ) : (
                <>
                  <span>Confirm & Proceed to Payment</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center space-x-1.5 text-[11px] text-gray-400">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>Guaranteed double-booking prevention barrier</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
