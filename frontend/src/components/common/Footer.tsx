import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Globe2, 
  ShieldCheck, 
  Heart, 
  MapPin, 
  ArrowUpRight
} from 'lucide-react';

/**
 * SERENDIP Premium Footer
 * - Primary Heritage Green (#315D4F) background.
 * - Warm Ivory (#F9F6EF) and Antique Gold (#A48B57) typography.
 * - Comprehensive navigation, brand storytelling, certifications, and social channels.
 */
export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#315D4F] text-[#F9F6EF] text-xs border-t border-[#426F60] mt-auto">
      
      {/* Decorative Gold Ribbon */}
      <div className="h-[2px] w-full bg-gradient-to-r from-[#A48B57] via-[#BD9F75] to-[#A48B57]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-14 border-b border-[#426F60]">
          
          {/* Brand Mission & Identity */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#426F60] border border-[#A48B57]/60 flex items-center justify-center text-[#A48B57]">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L14.5 8.5L21 9L16 13.5L18 20L12 16.5L6 20L8 13.5L3 9L9.5 8.5L12 2Z" />
                </svg>
              </div>
              <div>
                <span className="font-serif text-xl font-bold tracking-[0.2em] text-[#F9F6EF] block leading-none">
                  SERENDIP
                </span>
                <span className="text-[9px] tracking-[0.25em] text-[#A48B57] uppercase font-semibold">
                  Ceylon Heritage Marketplace
                </span>
              </div>
            </div>

            <p className="text-[#E9E4D7]/80 text-xs leading-relaxed max-w-sm">
              An international digital marketplace curating authentic Sri Lankan local treasures: single-estate Ceylon teas, certified natural sapphires, pure true cinnamon, and ancestral artisan handicrafts.
            </p>

            <div className="pt-2 flex items-center gap-2 text-[11px] text-[#BD9F75]">
              <MapPin className="w-3.5 h-3.5 text-[#A48B57]" />
              <span>Colombo • Kandy • Galle • Nuwara Eliya</span>
            </div>

            {/* Social Icons */}
            <div className="pt-3 flex items-center gap-3 text-[#E9E4D7]/80">
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noreferrer" 
                className="w-8 h-8 rounded-lg bg-[#426F60] border border-[#A48B57]/40 flex items-center justify-center hover:bg-[#19372E] hover:text-[#BD9F75] transition-colors"
                aria-label="Instagram"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noreferrer" 
                className="w-8 h-8 rounded-lg bg-[#426F60] border border-[#A48B57]/40 flex items-center justify-center hover:bg-[#19372E] hover:text-[#BD9F75] transition-colors"
                aria-label="Facebook"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" />
                </svg>
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noreferrer" 
                className="w-8 h-8 rounded-lg bg-[#426F60] border border-[#A48B57]/40 flex items-center justify-center hover:bg-[#19372E] hover:text-[#BD9F75] transition-colors"
                aria-label="Twitter"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Column 1: Heritage Categories */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="font-serif text-sm font-bold text-[#F9F6EF] tracking-wider uppercase border-b border-[#426F60] pb-2">
              Categories
            </h4>
            <ul className="space-y-2 text-[#E9E4D7]/75">
              <li>
                <Link to="/catalog?category=Tea" className="hover:text-[#BD9F75] transition-colors">
                  Ceylon Tea
                </Link>
              </li>
              <li>
                <Link to="/catalog?category=Spices" className="hover:text-[#BD9F75] transition-colors">
                  Organic Spices
                </Link>
              </li>
              <li>
                <Link to="/catalog?category=Gems" className="hover:text-[#BD9F75] transition-colors">
                  Gems & Jewels
                </Link>
              </li>
              <li>
                <Link to="/catalog?category=Crafts" className="hover:text-[#BD9F75] transition-colors">
                  Artisan Crafts
                </Link>
              </li>
              <li>
                <Link to="/catalog?category=Apparel" className="hover:text-[#BD9F75] transition-colors">
                  Handloom & Batik
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Marketplace Discovery */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-serif text-sm font-bold text-[#F9F6EF] tracking-wider uppercase border-b border-[#426F60] pb-2">
              Marketplace
            </h4>
            <ul className="space-y-2 text-[#E9E4D7]/75">
              <li>
                <Link to="/catalog" className="hover:text-[#BD9F75] transition-colors">
                  Browse Full Catalog
                </Link>
              </li>
              <li>
                <a href="/#producers" className="hover:text-[#BD9F75] transition-colors">
                  Meet the Producers
                </a>
              </li>
              <li>
                <a href="/#story" className="hover:text-[#BD9F75] transition-colors">
                  Our Ceylon Story
                </a>
              </li>
              <li>
                <Link to="/orders" className="hover:text-[#BD9F75] transition-colors">
                  Track Your Order
                </Link>
              </li>
              <li>
                <a href="/#contact" className="hover:text-[#BD9F75] transition-colors">
                  The Serendip Circle
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Merchant & Producer Portal */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-serif text-sm font-bold text-[#F9F6EF] tracking-wider uppercase border-b border-[#426F60] pb-2">
              Artisan Guild
            </h4>
            <ul className="space-y-2 text-[#E9E4D7]/75">
              <li>
                <Link to="/register" className="hover:text-[#BD9F75] transition-colors flex items-center gap-1">
                  <span>Register as Producer</span>
                  <ArrowUpRight className="w-3 h-3 text-[#A48B57]" />
                </Link>
              </li>
              <li>
                <Link to="/seller/dashboard" className="hover:text-[#BD9F75] transition-colors">
                  Merchant Portal Login
                </Link>
              </li>
              <li>
                <span className="text-[#BD9F75] font-semibold block text-[11px] pt-1">
                  Fair Trade Return Guarantee
                </span>
                <p className="text-[10px] text-[#E9E4D7]/60">
                  85%+ of purchase value directly supports village craft families and smallholders.
                </p>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Worldwide Shipping Marks */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[#E9E4D7]/70 text-[11px]">
          
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <p>© {new Date().getFullYear()} SERENDIP Marketplace. All rights reserved.</p>
            <span className="hidden sm:inline text-[#A48B57]">•</span>
            <p className="flex items-center gap-1 text-[#BD9F75]">
              <span>Handcrafted in Sri Lanka</span>
              <Heart className="w-3 h-3 fill-[#A48B57] text-[#A48B57]" />
              <span>for the World</span>
            </p>
          </div>

          <div className="flex items-center gap-6">
            <span className="text-[11px] text-[#E9E4D7]/80 flex items-center gap-1.5">
              <Globe2 className="w-3.5 h-3.5 text-[#A48B57]" />
              Inspected Air Express Shipping
            </span>
            <span className="text-[#A48B57]">•</span>
            <span className="text-[11px] text-[#E9E4D7]/80 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#A48B57]" />
              Certified Authenticity
            </span>
          </div>

        </div>

      </div>

    </footer>
  );
};
