import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  Search, 
  LogOut, 
  Package, 
  Layers,
  ShieldCheck,
  Menu,
  X,
  ChevronDown,
  User as UserIcon,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useCart } from '../../context/CartContext';

/**
 * SERENDIP Global Navigation Bar
 * - Primary Heritage Green (#315D4F) background.
 * - Elegant serif brandmark and antique gold (#A48B57) accents.
 * - Navigation links: Home, Products, Producers, About, Contact.
 * - Integrated currency switcher (USD / LKR), search, cart, and authentication.
 */
export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { currency, setCurrency } = useCurrency();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    } else {
      navigate('/catalog');
    }
  };

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-50 bg-[#315D4F] text-[#F9F6EF] border-b border-[#426F60] shadow-md transition-all">
      {/* Top subtle gold accent line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-[#A48B57] via-[#BD9F75] to-[#A48B57]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* SERENDIP Logo and Brand Name */}
          <Link to="/" className="flex items-center gap-3 group shrink-0 focus:outline-none">
            {/* Traditional Sri Lankan Heritage Lotus / Ceylon Emblem */}
            <div className="w-10 h-10 rounded-xl bg-[#426F60] border border-[#A48B57]/60 flex items-center justify-center text-[#F9F6EF] shadow-inner group-hover:bg-[#19372E] group-hover:border-[#A48B57] transition-all duration-300">
              <svg 
                className="w-5 h-5 text-[#A48B57] group-hover:scale-110 transition-transform duration-300" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1.8"
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M12 2L14.5 8.5L21 9L16 13.5L18 20L12 16.5L6 20L8 13.5L3 9L9.5 8.5L12 2Z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-xl sm:text-2xl font-bold tracking-[0.18em] text-[#F9F6EF] group-hover:text-[#BD9F75] transition-colors leading-none">
                SERENDIP
              </span>
              <span className="text-[9px] tracking-[0.25em] text-[#A48B57] uppercase font-semibold mt-1">
                Ceylon Heritage
              </span>
            </div>
          </Link>

          {/* Navigation links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-[13px] font-medium tracking-wide">
            <Link 
              to="/" 
              className={`px-3.5 py-2 rounded-lg transition-all duration-200 relative ${
                isActive('/') 
                  ? 'text-[#F9F6EF] font-semibold bg-[#426F60]' 
                  : 'text-[#F9F6EF]/85 hover:text-[#F9F6EF] hover:bg-[#426F60]/60'
              }`}
            >
              Home
              {isActive('/') && (
                <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-[#A48B57] rounded-full" />
              )}
            </Link>

            <Link 
              to="/catalog" 
              className={`px-3.5 py-2 rounded-lg transition-all duration-200 relative ${
                isActive('/catalog') 
                  ? 'text-[#F9F6EF] font-semibold bg-[#426F60]' 
                  : 'text-[#F9F6EF]/85 hover:text-[#F9F6EF] hover:bg-[#426F60]/60'
              }`}
            >
              Products
              {isActive('/catalog') && (
                <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-[#A48B57] rounded-full" />
              )}
            </Link>

            <a 
              href="/#story" 
              className="px-3.5 py-2 rounded-lg text-[#F9F6EF]/85 hover:text-[#F9F6EF] hover:bg-[#426F60]/60 transition-all duration-200"
            >
              About
            </a>

            <a 
              href="/#contact" 
              className="px-3.5 py-2 rounded-lg text-[#F9F6EF]/85 hover:text-[#F9F6EF] hover:bg-[#426F60]/60 transition-all duration-200"
            >
              Contact
            </a>

            {/* Authenticated Role Portal Shortcuts */}
            {user?.role === 'BUYER' && (
              <Link 
                to="/orders" 
                className="px-3 py-1.5 ml-1 text-xs rounded-lg text-[#BD9F75] hover:text-[#F9F6EF] hover:bg-[#426F60]/70 border border-[#A48B57]/40 transition-all"
              >
                My Orders
              </Link>
            )}
            {user?.role === 'SELLER' && (
              <Link 
                to="/seller/dashboard" 
                className="px-3 py-1.5 ml-1 text-xs rounded-lg bg-[#A48B57] text-[#19372E] font-bold hover:bg-[#BD9F75] transition-all shadow-xs"
              >
                Seller Portal
              </Link>
            )}
            {user?.role === 'ADMIN' && (
              <Link 
                to="/admin/dashboard" 
                className="px-3 py-1.5 ml-1 text-xs rounded-lg bg-[#E9E4D7] text-[#19372E] font-bold hover:bg-[#FFFFFF] transition-all shadow-xs"
              >
                Admin Panel
              </Link>
            )}
          </nav>

          {/* Controls: Search, Currency, Cart, Account */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* Inline Desktop Search */}
            <form onSubmit={handleSearchSubmit} className="hidden md:flex relative w-48 xl:w-60">
              <input
                type="text"
                placeholder="Search Ceylon goods..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#19372E]/60 text-[#F9F6EF] placeholder:text-[#ADA78A] rounded-xl border border-[#426F60] focus:border-[#A48B57] focus:bg-[#19372E] focus:outline-none transition-all"
              />
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#A48B57]" />
            </form>

            {/* Mobile Search Toggle */}
            <button
              type="button"
              onClick={() => setSearchOpen(!searchOpen)}
              className="md:hidden p-2 text-[#F9F6EF]/90 hover:text-[#BD9F75] hover:bg-[#426F60] rounded-xl transition-colors"
              aria-label="Toggle search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Currency Switcher (USD / LKR) */}
            <div className="flex items-center bg-[#19372E]/80 p-0.5 rounded-xl text-[11px] font-semibold border border-[#426F60]">
              <button
                type="button"
                onClick={() => setCurrency('USD')}
                className={`px-2 py-1 rounded-lg transition-all ${
                  currency === 'USD'
                    ? 'bg-[#A48B57] text-[#19372E] font-bold shadow-xs'
                    : 'text-[#F9F6EF]/75 hover:text-[#F9F6EF]'
                }`}
                title="View prices in US Dollars"
              >
                USD
              </button>
              <button
                type="button"
                onClick={() => setCurrency('LKR')}
                className={`px-2 py-1 rounded-lg transition-all ${
                  currency === 'LKR'
                    ? 'bg-[#A48B57] text-[#19372E] font-bold shadow-xs'
                    : 'text-[#F9F6EF]/75 hover:text-[#F9F6EF]'
                }`}
                title="View prices in Sri Lankan Rupees"
              >
                LKR
              </button>
            </div>

            {/* Shopping Cart */}
            <Link
              to="/cart"
              className="relative p-2 text-[#F9F6EF] hover:text-[#BD9F75] hover:bg-[#426F60] rounded-xl transition-all"
              aria-label="View shopping cart"
            >
              <ShoppingBag className="w-5 h-5 text-[#F9F6EF]" />
              {itemCount > 0 && (
                <span className="absolute top-1 right-1 -mt-1 -mr-1 px-1.5 py-0.2 text-[10px] font-bold bg-[#A48B57] text-[#19372E] rounded-full leading-tight shadow-md border border-[#315D4F]">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Authentication / Account Menu */}
            {isAuthenticated && user ? (
              <div className="relative">
                <div className="flex items-center bg-[#426F60]/70 hover:bg-[#426F60] border border-[#A48B57]/50 rounded-xl transition-colors">
                  {/* Direct link to profile when clicking avatar or user name on corner */}
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 py-1.5 pl-1.5 pr-1 rounded-l-xl hover:text-[#BD9F75] transition-colors group"
                    title="View & Edit Personal Information"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#A48B57] text-[#19372E] flex items-center justify-center font-bold text-xs uppercase shadow-xs group-hover:scale-105 transition-transform">
                      {user.fullName.charAt(0)}
                    </div>
                    <span className="hidden sm:inline text-xs font-medium text-[#F9F6EF] max-w-[90px] truncate group-hover:text-[#BD9F75]">
                      {user.fullName.split(' ')[0]}
                    </span>
                  </Link>

                  {/* Dropdown toggle chevron */}
                  <button
                    type="button"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="p-1.5 pr-2 rounded-r-xl text-[#A48B57] hover:text-[#F9F6EF] transition-colors focus:outline-none"
                    aria-label="Account options menu"
                    title="Account menu"
                  >
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-56 bg-[#F9F6EF] text-[#222B1F] rounded-2xl shadow-elevated border border-[#D6CBB5] py-2 z-50 animate-in fade-in slide-in-from-top-1"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    {/* Clickable Header card to see/edit personal info */}
                    <Link
                      to="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="block px-4 py-2.5 border-b border-[#D6CBB5]/60 bg-[#E9E4D7]/50 hover:bg-[#E9E4D7] transition-colors group"
                      title="View & edit personal information"
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-bold text-[#222B1F] group-hover:text-[#315D4F] truncate">{user.fullName}</p>
                          <p className="text-[10px] font-semibold text-[#315D4F] uppercase tracking-wider">{user.role}</p>
                        </div>
                        <span className="text-[10px] font-bold text-[#A48B57] group-hover:text-[#315D4F] flex items-center gap-0.5 shrink-0">
                          Edit <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </Link>

                    {/* Dedicated Personal Information menu item */}
                    <Link
                      to="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#222B1F] hover:bg-[#E9E4D7] hover:text-[#315D4F] font-semibold transition-colors"
                    >
                      <UserIcon className="w-3.5 h-3.5 text-[#315D4F]" />
                      Personal Information
                    </Link>

                    {user.role === 'BUYER' && (
                      <Link
                        to="/orders"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#222B1F] hover:bg-[#E9E4D7] hover:text-[#315D4F] transition-colors"
                      >
                        <Package className="w-3.5 h-3.5 text-[#315D4F]" />
                        My Orders
                      </Link>
                    )}

                    {user.role === 'SELLER' && (
                      <>
                        <Link
                          to="/seller/dashboard"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#222B1F] hover:bg-[#E9E4D7] hover:text-[#315D4F] transition-colors"
                        >
                          <Layers className="w-3.5 h-3.5 text-[#315D4F]" />
                          Seller Dashboard
                        </Link>
                        <Link
                          to="/seller/orders"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#222B1F] hover:bg-[#E9E4D7] hover:text-[#315D4F] transition-colors"
                        >
                          <Package className="w-3.5 h-3.5 text-[#315D4F]" />
                          Merchant Orders
                        </Link>
                      </>
                    )}

                    {user.role === 'ADMIN' && (
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#222B1F] hover:bg-[#E9E4D7] hover:text-[#315D4F] transition-colors"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-[#315D4F]" />
                        Admin Panel
                      </Link>
                    )}

                    <div className="border-t border-[#D6CBB5]/60 mt-1.5 pt-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                          navigate('/');
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 text-left transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs font-medium text-[#F9F6EF] hover:text-[#BD9F75] hover:bg-[#426F60] rounded-xl border border-[#A48B57]/50 transition-all"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="hidden sm:inline-flex px-3.5 py-1.5 text-xs font-semibold text-[#19372E] bg-[#A48B57] hover:bg-[#BD9F75] rounded-xl shadow-xs transition-all"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-[#F9F6EF] hover:bg-[#426F60] rounded-xl transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Input */}
        {searchOpen && (
          <div className="md:hidden pb-3">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search teas, gems, spices, crafts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-[#19372E] text-[#F9F6EF] placeholder:text-[#ADA78A] rounded-xl border border-[#426F60] focus:border-[#A48B57] focus:outline-none"
              />
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#A48B57]" />
            </form>
          </div>
        )}

        {/* Mobile Drawer Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#426F60] py-4 space-y-3 bg-[#315D4F] text-[#F9F6EF] rounded-b-2xl">
            <div className="flex flex-col gap-1 text-sm font-medium">
              <Link 
                to="/" 
                onClick={() => setMobileMenuOpen(false)} 
                className={`px-3.5 py-2.5 rounded-xl transition-all ${
                  isActive('/') ? 'bg-[#426F60] text-[#BD9F75] font-semibold' : 'hover:bg-[#426F60]'
                }`}
              >
                Home
              </Link>
              <Link 
                to="/catalog" 
                onClick={() => setMobileMenuOpen(false)} 
                className={`px-3.5 py-2.5 rounded-xl transition-all ${
                  isActive('/catalog') ? 'bg-[#426F60] text-[#BD9F75] font-semibold' : 'hover:bg-[#426F60]'
                }`}
              >
                Products
              </Link>
              <a 
                href="/#story" 
                onClick={() => setMobileMenuOpen(false)} 
                className="px-3.5 py-2.5 rounded-xl hover:bg-[#426F60] transition-all"
              >
                About
              </a>
              <a 
                href="/#contact" 
                onClick={() => setMobileMenuOpen(false)} 
                className="px-3.5 py-2.5 rounded-xl hover:bg-[#426F60] transition-all"
              >
                Contact
              </a>

              {user && (
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#426F60]/60 text-[#BD9F75] hover:bg-[#426F60] font-semibold border border-[#A48B57]/30"
                >
                  <UserIcon className="w-4 h-4 text-[#A48B57]" />
                  <span>Personal Information ({user.fullName.split(' ')[0]})</span>
                </Link>
              )}

              {user?.role === 'BUYER' && (
                <Link 
                  to="/orders" 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="px-3.5 py-2.5 rounded-xl text-[#BD9F75] hover:bg-[#426F60] font-semibold"
                >
                  My Orders
                </Link>
              )}
              {user?.role === 'SELLER' && (
                <Link 
                  to="/seller/dashboard" 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="px-3.5 py-2.5 rounded-xl bg-[#A48B57] text-[#19372E] font-bold"
                >
                  Seller Dashboard
                </Link>
              )}
              {user?.role === 'ADMIN' && (
                <Link 
                  to="/admin/dashboard" 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="px-3.5 py-2.5 rounded-xl bg-[#E9E4D7] text-[#19372E] font-bold"
                >
                  Admin Panel
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
