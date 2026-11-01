import React from 'react';
import { PackageOpen, AlertTriangle } from 'lucide-react';
import { Product } from '../../types';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  onRetry?: () => void;
}

/**
 * Grid component that renders product cards with loading skeleton and error states.
 */
export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  isLoading,
  error,
  onRetry,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-zinc-200 p-3 space-y-3 animate-pulse"
          >
            <div className="aspect-square bg-zinc-100 rounded-lg"></div>
            <div className="space-y-1.5">
              <div className="h-3.5 bg-zinc-100 rounded w-2/3"></div>
              <div className="h-3 bg-zinc-100 rounded w-1/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center max-w-lg mx-auto my-12">
        <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <h3 className="font-semibold text-red-900 text-base mb-1">Failed to load products</h3>
        <p className="text-xs text-red-700 mb-4">{error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="px-4 py-2 text-xs font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors shadow-sm"
          >
            Retry Loading
          </button>
        )}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-white border border-zinc-200/80 rounded-2xl p-12 text-center max-w-md mx-auto my-12 shadow-sm">
        <PackageOpen className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
        <h3 className="font-semibold text-zinc-900 text-base mb-1">No products match your criteria</h3>
        <p className="text-xs text-zinc-500 mb-4">
          Try loosening your search filters, selecting a different category, or adjusting your price bounds.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};
