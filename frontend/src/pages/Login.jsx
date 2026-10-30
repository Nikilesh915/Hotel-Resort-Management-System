import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Hotel, AlertCircle, Loader2, KeyRound, Sparkles } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const redirectUrl = searchParams.get('redirect') || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const user = await login(email, password);
      if (['ADMIN', 'PROPERTY_MANAGER'].includes(user.role)) {
        navigate('/admin');
      } else {
        navigate(redirectUrl);
      }
    } catch (err) {
      setError(err.formattedMessage || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('Password123!');
  };

  return (
    <div className="max-w-md mx-auto my-16 px-4 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-teal-100 text-teal-700 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <Hotel className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black text-gray-900">Sign in to GrandStay</h1>
        <p className="text-xs text-gray-500">Access your reservations or manage hotel properties.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl flex items-center space-x-2.5 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Demo Credentials Helper */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2.5 text-xs shadow-md">
        <div className="flex items-center space-x-1.5 text-teal-400 font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Quick Demo Logins (Password123!)</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => fillDemo('admin@example.com')}
            className="bg-slate-800 hover:bg-slate-700 p-2 rounded-lg text-left transition border border-slate-700"
          >
            <p className="font-bold text-[11px] text-teal-300">Super Admin</p>
            <p className="text-[10px] text-slate-400 truncate">admin@example.com</p>
          </button>
          <button
            type="button"
            onClick={() => fillDemo('manager1@example.com')}
            className="bg-slate-800 hover:bg-slate-700 p-2 rounded-lg text-left transition border border-slate-700"
          >
            <p className="font-bold text-[11px] text-teal-300">Manager Mumbai</p>
            <p className="text-[10px] text-slate-400 truncate">manager1@example.com</p>
          </button>
          <button
            type="button"
            onClick={() => fillDemo('guest1@example.com')}
            className="bg-slate-800 hover:bg-slate-700 p-2 rounded-lg text-left transition border border-slate-700"
          >
            <p className="font-bold text-[11px] text-teal-300">Guest One</p>
            <p className="text-[10px] text-slate-400 truncate">guest1@example.com</p>
          </button>
          <button
            type="button"
            onClick={() => fillDemo('guest2@example.com')}
            className="bg-slate-800 hover:bg-slate-700 p-2 rounded-lg text-left transition border border-slate-700"
          >
            <p className="font-bold text-[11px] text-teal-300">Guest Two</p>
            <p className="text-[10px] text-slate-400 truncate">guest2@example.com</p>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-sm">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Email Address</label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full text-xs border border-gray-200 rounded-lg p-2.5 focus:ring-1 focus:ring-teal-500 focus:outline-none"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full text-xs border border-gray-200 rounded-lg p-2.5 focus:ring-1 focus:ring-teal-500 focus:outline-none"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition flex items-center justify-center space-x-2 text-xs disabled:opacity-50"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Sign In</span>}
        </button>
      </form>

      <p className="text-center text-xs text-gray-500">
        Don't have an account?{' '}
        <Link to="/register" className="font-bold text-teal-600 hover:underline">
          Create Guest Account
        </Link>
      </p>
    </div>
  );
};
