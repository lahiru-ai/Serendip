import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserCheck, Store, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

/**
 * Registration page for creating new Buyer or Seller accounts.
 */
export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [mode, setMode] = useState<'BUYER' | 'SELLER'>('BUYER');
  
  // Shared fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Buyer specific
  const [deliveryAddress, setDeliveryAddress] = useState('');

  // Seller specific
  const [shopName, setShopName] = useState('');
  const [shopLocation, setShopLocation] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'BUYER') {
        await api.registerBuyer({
          fullName,
          email,
          password,
          phoneNumber: phoneNumber || undefined,
          deliveryAddress: deliveryAddress || undefined,
        });
      } else {
        await api.registerSeller({
          fullName,
          email,
          password,
          phoneNumber: phoneNumber || undefined,
          shopName,
          originCity: shopLocation || 'Colombo',
        });
      }

      setSuccess(true);
      // Auto-login newly registered user
      try {
        await login(email, password);
        setTimeout(() => {
          navigate(mode === 'SELLER' ? '/seller/dashboard' : '/catalog');
        }, 1200);
      } catch {
        navigate('/login');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-zinc-200/80 shadow-premium">
        
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-white font-serif font-bold text-2xl flex items-center justify-center mx-auto shadow-sm">
            S
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
            Create Your SERENDIP Account
          </h2>
          <p className="text-xs text-zinc-500">
            Join the international marketplace as a buyer or registered Ceylon merchant.
          </p>
        </div>

        {/* Tab switch: Buyer vs Seller */}
        <div className="grid grid-cols-2 p-1 bg-zinc-100 rounded-2xl">
          <button
            type="button"
            onClick={() => { setMode('BUYER'); setError(null); }}
            className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              mode === 'BUYER'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <UserCheck className="w-4 h-4 text-serendip-600" />
            Buyer
          </button>
          <button
            type="button"
            onClick={() => { setMode('SELLER'); setError(null); }}
            className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              mode === 'SELLER'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <Store className="w-4 h-4 text-amber-600" />
            Ceylon Merchant
          </button>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Registration successful! Signing you in...</span>
          </div>
        )}

        {/* Registration form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-zinc-700 mb-1" htmlFor="reg-name">Full Name *</label>
              <input
                id="reg-name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Kasun Fernando"
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-serendip-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 mb-1" htmlFor="reg-email">Email Address *</label>
              <input
                id="reg-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="kasun@example.com"
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-serendip-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-zinc-700 mb-1" htmlFor="reg-pass">Password *</label>
              <input
                id="reg-pass"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-serendip-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 mb-1" htmlFor="reg-phone">Phone Number</label>
              <input
                id="reg-phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+94 77 123 4567"
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-serendip-500"
              />
            </div>
          </div>

          {/* Mode specific fields */}
          {mode === 'BUYER' ? (
            <div>
              <label className="block font-semibold text-zinc-700 mb-1" htmlFor="reg-address">Delivery Address</label>
              <textarea
                id="reg-address"
                rows={2}
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Suite 500, 100 Main St, New York, NY 10001, USA"
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-serendip-500"
              />
            </div>
          ) : (
            <div className="space-y-4 pt-2 border-t border-zinc-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1" htmlFor="reg-shop">Shop / Artisan Brand Name *</label>
                  <input
                    id="reg-shop"
                    type="text"
                    required
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="e.g. Ceylon Royal Gems"
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-serendip-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1" htmlFor="reg-location">Shop Location / Address *</label>
                  <input
                    id="reg-location"
                    type="text"
                    required
                    value={shopLocation}
                    onChange={(e) => setShopLocation(e.target.value)}
                    placeholder="e.g. 45 Galle Road, Colombo 03, Sri Lanka"
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-serendip-500"
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-sm shadow-sm transition-all mt-4 disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : `Register as ${mode === 'BUYER' ? 'Buyer' : 'Seller'}`}
          </button>
        </form>

        <div className="text-center text-xs text-zinc-500 pt-2 border-t border-zinc-100">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-serendip-700 hover:underline">
            Sign In
          </Link>
        </div>

      </div>
    </div>
  );
};
