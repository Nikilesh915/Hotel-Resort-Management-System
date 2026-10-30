import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { CreditCard, Smartphone, Building, CheckCircle2, AlertCircle, Loader2, ShieldCheck, ArrowRight } from 'lucide-react';

export const PaymentPage = () => {
  const { reservationId } = useParams();
  const navigate = useNavigate();

  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successPayment, setSuccessPayment] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('CARD');

  // Idempotency Key unique to this checkout session
  const [idempotencyKey] = useState(`idem-pay-${reservationId}-${Date.now()}`);

  useEffect(() => {
    const fetchReservation = async () => {
      try {
        const res = await api.get(`/reservations/${reservationId}`);
        setReservation(res.data.data);
        if (res.data.data.status === 'CONFIRMED' && res.data.data.payment) {
          setSuccessPayment(res.data.data.payment);
        }
      } catch (err) {
        console.error('Failed to load reservation:', err);
        setError(err.formattedMessage || 'Failed to load reservation details');
      } finally {
        setLoading(false);
      }
    };
    fetchReservation();
  }, [reservationId]);

  const handlePay = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.post('/payments', {
        reservation_id: reservationId,
        payment_method: paymentMethod,
        idempotency_key: idempotencyKey
      });

      setSuccessPayment(res.data.data);
    } catch (err) {
      console.error('Payment failed:', err);
      setError(err.formattedMessage || 'Payment processing failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-blue-600">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (successPayment) {
    return (
      <div className="max-w-xl mx-auto my-16 bg-white border border-gray-200 rounded-3xl p-8 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto shadow-inner border border-blue-100">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-gray-900">Payment Confirmed!</h1>
          <p className="text-xs text-gray-500">
            Your booking is fully locked and confirmed in the hotel reservation roster.
          </p>
        </div>

        <div className="bg-blue-50/40 rounded-2xl p-5 border border-blue-100 text-left text-xs space-y-2.5">
          <div className="flex justify-between">
            <span className="text-gray-500">Reservation Number:</span>
            <span className="font-mono font-bold text-gray-900">{reservation?.reservation_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Transaction Reference:</span>
            <span className="font-mono font-bold text-blue-700">{successPayment.payment_reference}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Total Paid Amount:</span>
            <span className="font-bold text-gray-900">₹{successPayment.amount?.toLocaleString()} {successPayment.currency}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Payment Method:</span>
            <span className="font-bold text-gray-900">{successPayment.payment_method}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Payment Status:</span>
            <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
              {successPayment.status}
            </span>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => navigate('/my-bookings')}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-xs transition shadow-sm"
          >
            View in My Bookings
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-xl text-xs transition"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Complete Payment</h1>
        <p className="text-xs text-gray-500 mt-1">
          Idempotent payment gateway for reservation <span className="font-mono font-bold text-gray-700">{reservationId}</span>
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center space-x-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Reservation Summary */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-sm">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Amount Due</h2>
        <div className="flex justify-between items-baseline">
          <div>
            <p className="text-xs text-gray-500">Room: {reservation?.room_id} ({reservation?.property?.name})</p>
            <p className="text-xs text-gray-500">
              {reservation?.check_in_date?.split('T')[0]} to {reservation?.check_out_date?.split('T')[0]}
            </p>
          </div>
          <span className="text-3xl font-black text-blue-700">
            ₹{reservation?.total_amount?.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Payment Method Selector */}
      <form onSubmit={handlePay} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6 shadow-sm">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Select Payment Method</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'CARD', label: 'Credit/Debit Card', icon: CreditCard },
            { id: 'UPI', label: 'UPI / QR', icon: Smartphone },
            { id: 'NET_BANKING', label: 'Net Banking', icon: Building }
          ].map(m => {
            const Icon = m.icon;
            return (
              <label
                key={m.id}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border cursor-pointer text-center space-y-2 transition ${
                  paymentMethod === m.id
                    ? 'border-blue-600 bg-blue-50/50 text-blue-900 shadow-sm'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={m.id}
                  checked={paymentMethod === m.id}
                  onChange={() => setPaymentMethod(m.id)}
                  className="sr-only"
                />
                <Icon className={`w-6 h-6 ${paymentMethod === m.id ? 'text-blue-600' : 'text-gray-400'}`} />
                <span className="text-xs font-bold">{m.label}</span>
              </label>
            );
          })}
        </div>

        {paymentMethod === 'CARD' && (
          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Card Number</label>
              <input
                type="text"
                placeholder="4111 •••• •••• 1111"
                defaultValue="4111 2222 3333 4444"
                className="w-full text-xs font-mono border border-gray-200 rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Expiry Date</label>
                <input
                  type="text"
                  placeholder="MM/YY"
                  defaultValue="12/28"
                  className="w-full text-xs font-mono border border-gray-200 rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">CVV</label>
                <input
                  type="password"
                  placeholder="•••"
                  defaultValue="123"
                  className="w-full text-xs font-mono border border-gray-200 rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-50 text-sm"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verifying Transaction...</span>
            </>
          ) : (
            <>
              <span>Authorize & Pay ₹{reservation?.total_amount?.toLocaleString()}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <div className="flex items-center justify-center space-x-1.5 text-[11px] text-gray-400">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          <span>Idempotent execution with protected transaction reference</span>
        </div>
      </form>
    </div>
  );
};
