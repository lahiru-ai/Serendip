import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Coffee, 
  Gem, 
  Flame, 
  Palette,
  ShoppingBag
} from 'lucide-react';
import { Product } from '../types';
import { api } from '../services/api';
import { ProductCard } from '../components/product/ProductCard';

const CATEGORIES = [
  { name: 'Tea', label: 'Ceylon Tea', icon: Coffee },
  { name: 'Gems', label: 'Gems & Jewelry', icon: Gem },
  { name: 'Spices', label: 'Organic Spices', icon: Flame },
  { name: 'Crafts', label: 'Artisan Crafts', icon: Palette },
];

/**
 * Simple, clean home page with minimal distraction and direct product discovery.
 */
export const HomePage: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadProducts() {
      try {
        setLoading(true);
        const data = await api.getProducts();
        if (mounted) {
          setFeaturedProducts(data.slice(0, 8));
        }
      } catch (err: unknown) {
        if (mounted) {
          const msg = err instanceof Error ? err.message : 'Unable to load catalog';
          setError(msg);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadProducts();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-12 sm:space-y-16 pb-16">
      
      {/* Clean, Minimalist Hero Section */}
      <section className="border-b border-zinc-200/80 bg-white py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <span className="inline-block px-3 py-1 text-xs font-medium uppercase tracking-wider text-emerald-700 bg-emerald-50 rounded-full">
            Direct from Sri Lanka
          </span>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-zinc-900 leading-[1.15]">
            Authentic Ceylon goods, delivered worldwide.
          </h1>

          <p className="text-zinc-600 text-base sm:text-lg max-w-xl mx-auto font-normal leading-relaxed">
            Handpicked single-estate teas, certified gemstones, organic spices, and traditional artisan crafts.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/catalog"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-sm transition-colors shadow-sm"
            >
              <ShoppingBag className="w-4 h-4" />
              Shop Catalog
            </Link>
          </div>
        </div>
      </section>

      {/* Clean Category Navigation */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.name}
                to={`/catalog?category=${cat.name}`}
                className="group flex items-center gap-3 p-4 rounded-xl border border-zinc-200 bg-white hover:border-zinc-400 hover:bg-zinc-50/50 transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-zinc-100 group-hover:bg-emerald-50 text-zinc-700 group-hover:text-emerald-700 flex items-center justify-center shrink-0 transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-zinc-900 text-sm truncate group-hover:text-emerald-700 transition-colors">
                    {cat.label}
                  </h3>
                  <span className="text-xs text-zinc-500 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    View <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-zinc-200/80">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
              Featured Products
            </h2>
            <p className="text-zinc-500 text-xs sm:text-sm mt-0.5">
              Popular items available for immediate dispatch.
            </p>
          </div>
          <Link
            to="/catalog"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-zinc-700 hover:text-zinc-950 transition-colors"
          >
            View all
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-zinc-200 p-3 space-y-3 animate-pulse">
                <div className="aspect-square bg-zinc-100 rounded-lg"></div>
                <div className="h-4 bg-zinc-100 rounded w-2/3"></div>
                <div className="h-4 bg-zinc-100 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-8 text-center max-w-md mx-auto">
            <p className="text-sm text-zinc-700">{error}</p>
            <p className="text-xs text-zinc-500 mt-1">Please ensure the backend server is running.</p>
          </div>
        ) : featuredProducts.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center max-w-md mx-auto">
            <p className="text-sm text-zinc-500">No products available at the moment.</p>
            <Link to="/catalog" className="mt-2 inline-block text-xs font-medium text-emerald-700">
              Browse full catalog →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {featuredProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

    </div>
  );
};
