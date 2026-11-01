import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * Login page supporting user authentication and quick-fill demo accounts.
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
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-zinc-200/80 shadow-premium">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-white font-serif font-bold text-2xl flex items-center justify-center mx-auto shadow-sm">
            S
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
            Sign In to SERENDIP
          </h2>
          <p className="text-xs text-zinc-500">
            Access your buyer orders, merchant catalog, or admin operations.
          </p>
        </div>

        {/* Demo Fast-Login Chips */}
        <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200/60 space-y-2">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider text-center">
            Quick fill demo accounts:
          </p>
          <div className="grid grid-cols-3 gap-1.5 text-[11px]">
            <button
              type="button"
              onClick={() => handleQuickFill('buyer@serendip.com', 'BuyerPass123!')}
              className="px-2 py-1.5 rounded-lg bg-white border border-zinc-200 text-zinc-700 hover:border-serendip-500 font-medium truncate"
              title="Buyer Account"
            >
              Buyer
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('seller@serendip.com', 'SellerPass123!')}
              className="px-2 py-1.5 rounded-lg bg-white border border-zinc-200 text-zinc-700 hover:border-serendip-500 font-medium truncate"
              title="Seller Account"
            >
              Seller
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('admin@serendip.com', 'AdminPass123!')}
              className="px-2 py-1.5 rounded-lg bg-white border border-zinc-200 text-zinc-700 hover:border-red-500 font-medium truncate"
              title="Admin Account"
            >
              Admin
            </button>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5" htmlFor="login-email">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-serendip-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5" htmlFor="login-password">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                id="login-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-serendip-500 focus:bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer link to register */}
        <div className="text-center text-xs text-zinc-500 pt-2 border-t border-zinc-100">
          New to SERENDIP?{' '}
          <Link to="/register" className="font-semibold text-serendip-700 hover:underline">
            Create an account
          </Link>
        </div>

      </div>
    </div>
  );
};
