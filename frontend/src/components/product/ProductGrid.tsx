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
 * SERENDIP Product Grid
 * Renders products with heritage styled loading skeletons and empty states.
 */
export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  isLoading,
  error,
  onRetry,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-[#FFFFFF] rounded-2xl border border-[#D6CBB5] p-4 space-y-3 animate-pulse"
          >
            <div className="aspect-square bg-[#E9E4D7] rounded-xl" />
            <div className="space-y-2 pt-2">
              <div className="h-4 bg-[#E9E4D7] rounded w-2/3" />
              <div className="h-3.5 bg-[#E9E4D7] rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#FFFFFF] border border-[#D6CBB5] rounded-2xl p-8 text-center max-w-lg mx-auto my-12 shadow-subtle">
        <AlertTriangle className="w-10 h-10 text-rose-600 mx-auto mb-3" />
        <h3 className="font-serif font-semibold text-[#222B1F] text-base mb-1">Catalog Connection Notice</h3>
        <p className="text-xs text-[#7A755D] mb-4">{error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="px-5 py-2.5 text-xs font-semibold bg-[#315D4F] text-[#F9F6EF] rounded-xl hover:bg-[#19372E] transition-colors shadow-xs"
          >
            Retry Loading
          </button>
        )}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-[#FFFFFF] border border-[#D6CBB5] rounded-2xl p-12 text-center max-w-md mx-auto my-12 shadow-subtle space-y-3">
        <PackageOpen className="w-12 h-12 text-[#A48B57] mx-auto" />
        <h3 className="font-serif font-bold text-[#222B1F] text-base">No Products Found</h3>
        <p className="text-xs text-[#7A755D]">
          Try loosening your search filters, selecting another Sri Lankan category, or adjusting your price bounds.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};
