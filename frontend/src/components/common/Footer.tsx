import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Clean, minimal footer without clutter.
 */
export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-zinc-200 bg-white text-zinc-600 text-xs mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-zinc-100">
          <div>
            <span className="font-semibold text-zinc-900 text-sm tracking-tight">
              SERENDIP
            </span>
            <p className="text-zinc-500 text-xs mt-1 max-w-sm">
              Authentic teas, gemstones, spices, and crafts direct from Sri Lanka.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs">
            <Link to="/catalog" className="text-zinc-600 hover:text-zinc-900 transition-colors">
              Catalog
            </Link>
            <Link to="/catalog?category=Tea" className="text-zinc-600 hover:text-zinc-900 transition-colors">
              Tea
            </Link>
            <Link to="/catalog?category=Gems" className="text-zinc-600 hover:text-zinc-900 transition-colors">
              Gems
            </Link>
            <Link to="/catalog?category=Spices" className="text-zinc-600 hover:text-zinc-900 transition-colors">
              Spices
            </Link>
            <Link to="/catalog?category=Crafts" className="text-zinc-600 hover:text-zinc-900 transition-colors">
              Crafts
            </Link>
            <Link to="/seller/dashboard" className="text-zinc-600 hover:text-zinc-900 transition-colors">
              Seller Portal
            </Link>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-zinc-400 text-[11px]">
          <p>© {new Date().getFullYear()} Serendip. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/orders" className="hover:text-zinc-600 transition-colors">
              Track Order
            </Link>
            <span>•</span>
            <span>Worldwide Shipping</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
