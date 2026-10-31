import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Hotel, AlertCircle, Loader2, Sparkles, Shield, Building2, User } from 'lucide-react';

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
    <div className="max-w-md mx-auto my-12 px-4 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-blue-100">
          <Hotel className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black text-gray-900">Sign in to GrandStay</h1>
        <p className="text-xs text-gray-500">Access your hotel reservations or property manager portal.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl flex items-center space-x-2.5 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Demo Credentials Helper */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-3 text-xs shadow-sm">
        <div className="flex items-center justify-between">
          <span className="font-black text-gray-900 flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Quick Demo Logins</span>
          </span>
          <span className="text-[10px] text-gray-400 font-mono">Password: Password123!</span>
        </div>

        {/* 1 Super Admin Account */}
        <div>
          <button
            type="button"
            onClick={() => fillDemo('admin@example.com')}
            className="w-full bg-slate-50 hover:bg-slate-100 p-2.5 rounded-xl text-left transition border border-slate-200 flex items-center justify-between group"
          >
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-slate-700 group-hover:scale-110 transition" />
              <div>
                <p className="font-bold text-[11px] text-slate-900 leading-tight">Super Admin (Both Properties)</p>
                <p className="text-[10px] text-slate-500 font-mono">admin@example.com</p>
              </div>
            </div>
            <span className="text-[10px] bg-slate-200/60 text-slate-700 px-2 py-0.5 rounded font-bold uppercase">
              Super Admin
            </span>
          </button>
        </div>

        {/* 2 Manager Accounts (Mumbai & Goa) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => fillDemo('manager1@example.com')}
            className="bg-blue-50/60 hover:bg-blue-100/60 p-2.5 rounded-xl text-left transition border border-blue-200 space-y-0.5 group"
          >
            <div className="flex items-center space-x-1.5 text-blue-700 font-bold text-[11px]">
              <Building2 className="w-3.5 h-3.5 group-hover:scale-110 transition" />
              <span>Manager Mumbai</span>
            </div>
            <p className="text-[10px] text-gray-600 truncate font-mono">manager1@example.com</p>
            <p className="text-[9px] text-blue-600 font-medium">Grand Mumbai Hotel</p>
          </button>

          <button
            type="button"
            onClick={() => fillDemo('manager2@example.com')}
            className="bg-purple-50/60 hover:bg-purple-100/60 p-2.5 rounded-xl text-left transition border border-purple-200 space-y-0.5 group"
          >
            <div className="flex items-center space-x-1.5 text-purple-700 font-bold text-[11px]">
              <Building2 className="w-3.5 h-3.5 group-hover:scale-110 transition" />
              <span>Manager Goa</span>
            </div>
            <p className="text-[10px] text-gray-600 truncate font-mono">manager2@example.com</p>
            <p className="text-[9px] text-purple-600 font-medium">Sunset Goa Resort</p>
          </button>
        </div>

        {/* 2 Guest Accounts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => fillDemo('guest1@example.com')}
            className="bg-gray-50 hover:bg-gray-100 p-2.5 rounded-xl text-left transition border border-gray-200 space-y-0.5 group"
          >
            <div className="flex items-center space-x-1.5 text-gray-800 font-bold text-[11px]">
              <User className="w-3.5 h-3.5 group-hover:scale-110 transition" />
              <span>Guest 1 (John Doe)</span>
            </div>
            <p className="text-[10px] text-gray-500 truncate font-mono">guest1@example.com</p>
          </button>

          <button
            type="button"
            onClick={() => fillDemo('guest2@example.com')}
            className="bg-gray-50 hover:bg-gray-100 p-2.5 rounded-xl text-left transition border border-gray-200 space-y-0.5 group"
          >
            <div className="flex items-center space-x-1.5 text-gray-800 font-bold text-[11px]">
              <User className="w-3.5 h-3.5 group-hover:scale-110 transition" />
              <span>Guest 2 (Jane Smith)</span>
            </div>
            <p className="text-[10px] text-gray-500 truncate font-mono">guest2@example.com</p>
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
            className="w-full text-xs border border-gray-200 rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
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
            className="w-full text-xs border border-gray-200 rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition flex items-center justify-center space-x-2 text-xs disabled:opacity-50"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Sign In</span>}
        </button>
      </form>

      <p className="text-center text-xs text-gray-500">
        Don't have an account?{' '}
        <Link to="/register" className="font-bold text-blue-600 hover:underline">
          Create Account
        </Link>
      </p>
    </div>
  );
};
