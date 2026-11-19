import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserCheck, Store, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

/**
 * SERENDIP Registration Page
 * Buyer & Seller registrations styled in SERENDIP Warm Ivory (#F9F6EF), Antique Gold (#A48B57), and Heritage Green (#315D4F).
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
      <div className="max-w-xl w-full space-y-8 bg-[#FFFFFF] p-8 sm:p-10 rounded-3xl border border-[#D6CBB5] shadow-premium">
        
        <div className="text-center space-y-2.5">
          <div className="w-14 h-14 rounded-2xl bg-[#315D4F] border border-[#A48B57] text-[#BD9F75] font-serif font-bold text-2xl flex items-center justify-center mx-auto shadow-md">
            S
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#A48B57] block">
            Ceylon Heritage Marketplace
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#222B1F]">
            Create Your SERENDIP Account
          </h2>
          <p className="text-xs text-[#7A755D]">
            Join the international marketplace as a buyer or registered Ceylon merchant.
          </p>
        </div>

        {/* Tab switch: Buyer vs Seller */}
        <div className="grid grid-cols-2 p-1.5 bg-[#E9E4D7] rounded-2xl border border-[#D6CBB5]">
          <button
            type="button"
            onClick={() => { setMode('BUYER'); setError(null); }}
            className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              mode === 'BUYER'
                ? 'bg-[#315D4F] text-[#F9F6EF] shadow-sm border border-[#A48B57]/40'
                : 'text-[#222B1F] hover:text-[#315D4F]'
            }`}
          >
            <UserCheck className="w-4 h-4 text-[#BD9F75]" />
            <span>International Buyer</span>
          </button>
          <button
            type="button"
            onClick={() => { setMode('SELLER'); setError(null); }}
            className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              mode === 'SELLER'
                ? 'bg-[#315D4F] text-[#F9F6EF] shadow-sm border border-[#A48B57]/40'
                : 'text-[#222B1F] hover:text-[#315D4F]'
            }`}
          >
            <Store className="w-4 h-4 text-[#BD9F75]" />
            <span>Ceylon Merchant / Artisan</span>
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Success notification */}
        {success && (
          <div className="p-3.5 bg-[#E9E4D7] border border-[#A48B57] rounded-xl text-[#315D4F] text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#315D4F]" />
            <span>Registration successful! Signing in to your account...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#222B1F] mb-1.5">
                Full Name <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Kamal Perera"
                className="w-full px-3.5 py-2.5 text-xs bg-[#F9F6EF] text-[#222B1F] border border-[#D6CBB5] rounded-xl focus:outline-none focus:border-[#315D4F]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#222B1F] mb-1.5">
                Email Address <span className="text-rose-600">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="kamal@example.com"
                className="w-full px-3.5 py-2.5 text-xs bg-[#F9F6EF] text-[#222B1F] border border-[#D6CBB5] rounded-xl focus:outline-none focus:border-[#315D4F]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#222B1F] mb-1.5">
                Password <span className="text-rose-600">*</span>
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="w-full px-3.5 py-2.5 text-xs bg-[#F9F6EF] text-[#222B1F] border border-[#D6CBB5] rounded-xl focus:outline-none focus:border-[#315D4F]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#222B1F] mb-1.5">
                Phone Number <span className="text-[#ADA78A] font-normal">(Optional)</span>
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+94 77 123 4567"
                className="w-full px-3.5 py-2.5 text-xs bg-[#F9F6EF] text-[#222B1F] border border-[#D6CBB5] rounded-xl focus:outline-none focus:border-[#315D4F]"
              />
            </div>
          </div>

          {/* Mode specific fields */}
          {mode === 'BUYER' ? (
            <div>
              <label className="block text-xs font-semibold text-[#222B1F] mb-1.5">
                Delivery Address <span className="text-[#ADA78A] font-normal">(Optional)</span>
              </label>
              <textarea
                rows={2}
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Street address, city, country, postal code"
                className="w-full px-3.5 py-2.5 text-xs bg-[#F9F6EF] text-[#222B1F] border border-[#D6CBB5] rounded-xl focus:outline-none focus:border-[#315D4F]"
              />
            </div>
          ) : (
            <div className="space-y-4 pt-1 border-t border-[#D6CBB5]/60">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#222B1F] mb-1.5">
                    Shop / Brand Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="e.g. Ruhuna Spice Artisans"
                    className="w-full px-3.5 py-2.5 text-xs bg-[#F9F6EF] text-[#222B1F] border border-[#D6CBB5] rounded-xl focus:outline-none focus:border-[#315D4F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#222B1F] mb-1.5">
                    City / Production Origin <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={shopLocation}
                    onChange={(e) => setShopLocation(e.target.value)}
                    placeholder="e.g. Kandy, Galle, Matale"
                    className="w-full px-3.5 py-2.5 text-xs bg-[#F9F6EF] text-[#222B1F] border border-[#D6CBB5] rounded-xl focus:outline-none focus:border-[#315D4F]"
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-4 rounded-xl bg-[#315D4F] hover:bg-[#19372E] text-[#F9F6EF] font-bold text-xs uppercase tracking-wider shadow-heritage transition-all flex items-center justify-center gap-2 disabled:opacity-50 border border-[#A48B57]/50"
          >
            {loading ? (
              <span>Creating account...</span>
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight className="w-4 h-4 text-[#BD9F75]" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-[#7A755D] pt-3 border-t border-[#D6CBB5]/60">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-[#315D4F] hover:text-[#19372E] hover:underline">
            Sign In
          </Link>
        </div>

      </div>
    </div>
  );
};
