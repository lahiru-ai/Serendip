import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * SERENDIP Login Page
 * Styled in Warm Ivory (#F9F6EF), Antique Gold (#A48B57), and Heritage Green (#315D4F).
 */
export const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials';
      setError(msg);
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-[#FFFFFF] p-8 sm:p-10 rounded-3xl border border-[#D6CBB5] shadow-premium">
        
        {/* Brand Header */}
        <div className="text-center space-y-2.5">
          <div className="w-14 h-14 rounded-2xl bg-[#315D4F] border border-[#A48B57] text-[#BD9F75] font-serif font-bold text-2xl flex items-center justify-center mx-auto shadow-md">
            S
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#A48B57] block">
            Ceylon Heritage Marketplace
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#222B1F]">
            Sign In to SERENDIP
          </h2>
          <p className="text-xs text-[#7A755D]">
            Access your buyer orders, merchant catalog, or admin operations.
          </p>
        </div>

        {/* Demo Fast-Login Chips */}
        <div className="p-4 bg-[#E9E4D7]/70 rounded-2xl border border-[#D6CBB5] space-y-2">
          <p className="text-[11px] font-bold text-[#315D4F] uppercase tracking-wider text-center">
            Quick fill demo accounts:
          </p>
          <div className="grid grid-cols-3 gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => handleQuickFill('buyer@serendip.com', 'BuyerPass123!')}
              className="px-2 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#D6CBB5] text-[#222B1F] hover:bg-[#315D4F] hover:text-[#F9F6EF] font-semibold truncate transition-colors shadow-xs"
              title="Buyer Account"
            >
              Buyer
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('seller@serendip.com', 'SellerPass123!')}
              className="px-2 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#D6CBB5] text-[#222B1F] hover:bg-[#315D4F] hover:text-[#F9F6EF] font-semibold truncate transition-colors shadow-xs"
              title="Seller Account"
            >
              Seller
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('admin@serendip.com', 'AdminPass123!')}
              className="px-2 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#D6CBB5] text-[#222B1F] hover:bg-[#315D4F] hover:text-[#F9F6EF] font-semibold truncate transition-colors shadow-xs"
              title="Admin Account"
            >
              Admin
            </button>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#222B1F] mb-1.5" htmlFor="login-email">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#A48B57]" />
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#F9F6EF] text-[#222B1F] border border-[#D6CBB5] rounded-xl focus:outline-none focus:border-[#315D4F]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#222B1F] mb-1.5" htmlFor="login-password">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#A48B57]" />
              <input
                id="login-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#F9F6EF] text-[#222B1F] border border-[#D6CBB5] rounded-xl focus:outline-none focus:border-[#315D4F]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 px-4 rounded-xl bg-[#315D4F] hover:bg-[#19372E] text-[#F9F6EF] font-bold text-xs uppercase tracking-wider shadow-heritage transition-all flex items-center justify-center gap-2 disabled:opacity-50 border border-[#A48B57]/50"
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Account</span>
                <ArrowRight className="w-4 h-4 text-[#BD9F75]" />
              </>
            )}
          </button>
        </form>

        {/* Footer link to register */}
        <div className="text-center text-xs text-[#7A755D] pt-3 border-t border-[#D6CBB5]/60">
          New to SERENDIP?{' '}
          <Link to="/register" className="font-bold text-[#315D4F] hover:text-[#19372E] hover:underline">
            Create an account
          </Link>
        </div>

      </div>
    </div>
  );
};
