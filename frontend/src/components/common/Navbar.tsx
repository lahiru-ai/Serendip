import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  Search, 
  LogOut, 
  Package, 
  Layers,
  ShieldCheck,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useCart } from '../../context/CartContext';

/**
 * Clean, modern navigation bar with search, currency toggle, cart, and auth controls.
 */
export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { currency, setCurrency } = useCurrency();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/catalog');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <span className="font-bold text-lg tracking-wider text-zinc-900 group-hover:text-emerald-700 transition-colors">
              SERENDIP
            </span>
          </Link>

          {/* Nav links (Desktop) */}
          <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-zinc-600">
            <Link to="/catalog" className="hover:text-zinc-950 transition-colors">
              Catalog
            </Link>
            {user?.role === 'BUYER' && (
              <Link to="/orders" className="hover:text-zinc-950 transition-colors">
                Orders
              </Link>
            )}
            {user?.role === 'SELLER' && (
              <Link to="/seller/dashboard" className="text-emerald-700 hover:text-emerald-800 transition-colors">
                Seller Dashboard
              </Link>
            )}
            {user?.role === 'ADMIN' && (
              <Link to="/admin/dashboard" className="text-zinc-900 hover:text-red-700 transition-colors">
                Admin
              </Link>
            )}
          </nav>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="hidden sm:flex flex-1 max-w-sm relative">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-zinc-100 focus:bg-white text-zinc-900 placeholder:text-zinc-400 rounded-lg border border-transparent focus:border-zinc-300 focus:outline-none transition-all"
              />
            </div>
          </form>

          {/* Right Controls: Currency Switcher, Cart, Auth */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* Currency Switcher */}
            <div className="flex items-center bg-zinc-100 p-0.5 rounded-lg text-xs font-medium">
              <button
                type="button"
                onClick={() => setCurrency('USD')}
                className={`px-2 py-1 rounded transition-colors ${
                  currency === 'USD'
                    ? 'bg-white text-zinc-900 shadow-sm font-semibold'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
                title="View in USD"
              >
                USD
              </button>
              <button
                type="button"
                onClick={() => setCurrency('LKR')}
                className={`px-2 py-1 rounded transition-colors ${
                  currency === 'LKR'
                    ? 'bg-white text-zinc-900 shadow-sm font-semibold'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
                title="View in LKR"
              >
                LKR
              </button>
            </div>

            {/* Shopping Cart Button */}
            <Link
              to="/cart"
              className="relative p-2 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 rounded-lg transition-colors"
              aria-label="View shopping cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute top-1 right-1 -mt-1 -mr-1 px-1.5 py-0.5 text-[10px] font-bold bg-zinc-900 text-white rounded-full leading-none">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Auth section */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-zinc-100 transition-colors border border-zinc-200"
                >
                  <div className="w-6 h-6 rounded bg-zinc-900 text-white flex items-center justify-center font-bold text-xs uppercase">
                    {user.fullName.charAt(0)}
                  </div>
                  <span className="hidden lg:inline text-xs font-medium text-zinc-800 max-w-[100px] truncate">
                    {user.fullName.split(' ')[0]}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-zinc-200 py-1 z-50"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-3 py-2 border-b border-zinc-100">
                      <p className="text-xs font-semibold text-zinc-900 truncate">{user.fullName}</p>
                      <p className="text-[11px] text-zinc-500 truncate">{user.role}</p>
                    </div>

                    {user.role === 'BUYER' && (
                      <Link
                        to="/orders"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-50"
                      >
                        <Package className="w-3.5 h-3.5 text-zinc-400" />
                        My Orders
                      </Link>
                    )}

                    {user.role === 'SELLER' && (
                      <>
                        <Link
                          to="/seller/dashboard"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-50"
                        >
                          <Layers className="w-3.5 h-3.5 text-zinc-400" />
                          Seller Dashboard
                        </Link>
                        <Link
                          to="/seller/orders"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-50"
                        >
                          <Package className="w-3.5 h-3.5 text-zinc-400" />
                          Orders
                        </Link>
                      </>
                    )}

                    {user.role === 'ADMIN' && (
                      <>
                        <Link
                          to="/admin/dashboard"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-50"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
                          Admin Dashboard
                        </Link>
                        <Link
                          to="/admin/orders"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-50"
                        >
                          <Package className="w-3.5 h-3.5 text-zinc-400" />
                          All Orders
                        </Link>
                      </>
                    )}

                    <div className="border-t border-zinc-100 mt-1 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                          navigate('/');
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 text-left"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link
                  to="/login"
                  className="px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:text-zinc-950 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1.5 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 text-zinc-600 hover:text-zinc-900 rounded-lg"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile search & links */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-200 py-3 space-y-3">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-100 rounded-lg"
              />
            </form>
            <div className="flex flex-col gap-1 text-sm font-medium">
              <Link to="/catalog" onClick={() => setMobileMenuOpen(false)} className="px-2 py-1.5 hover:bg-zinc-100 rounded-md">
                Catalog
              </Link>
              {user?.role === 'BUYER' && (
                <Link to="/orders" onClick={() => setMobileMenuOpen(false)} className="px-2 py-1.5 text-zinc-700 hover:bg-zinc-100 rounded-md">
                  My Orders
                </Link>
              )}
              {user?.role === 'SELLER' && (
                <Link to="/seller/dashboard" onClick={() => setMobileMenuOpen(false)} className="px-2 py-1.5 text-emerald-700 hover:bg-emerald-50 rounded-md">
                  Seller Dashboard
                </Link>
              )}
              {user?.role === 'ADMIN' && (
                <Link to="/admin/dashboard" onClick={() => setMobileMenuOpen(false)} className="px-2 py-1.5 text-zinc-900 hover:bg-zinc-100 rounded-md">
                  Admin Dashboard
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
