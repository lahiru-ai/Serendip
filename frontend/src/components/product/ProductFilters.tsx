import React from 'react';
import { X, SlidersHorizontal } from 'lucide-react';

export interface FilterState {
  category: string;
  search: string;
  minPrice: string;
  maxPrice: string;
  inStockOnly: boolean;
  sortBy: 'featured' | 'price-asc' | 'price-desc' | 'name';
}

interface ProductFiltersProps {
  filters: FilterState;
  onChange: (newFilters: FilterState) => void;
  categories: string[];
  totalResults: number;
}

/**
 * Filter controls for search query, categories, price range, and sorting.
 * Styled in SERENDIP Warm Ivory (#F9F6EF), Soft Beige (#E9E4D7), and Heritage Green (#315D4F).
 */
export const ProductFilters: React.FC<ProductFiltersProps> = ({
  filters,
  onChange,
  categories,
  totalResults,
}) => {
  const update = (patch: Partial<FilterState>) => {
    onChange({ ...filters, ...patch });
  };

  const handleReset = () => {
    onChange({
      category: '',
      search: '',
      minPrice: '',
      maxPrice: '',
      inStockOnly: false,
      sortBy: 'featured',
    });
  };

  const hasActiveFilters = Boolean(
    filters.category ||
    filters.search ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.inStockOnly ||
    filters.sortBy !== 'featured'
  );

  return (
    <div className="bg-[#FFFFFF] rounded-2xl border border-[#D6CBB5] p-5 space-y-6 shadow-subtle">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-[#D6CBB5]/60">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[#315D4F]" />
          <h3 className="font-serif font-bold text-[#222B1F] text-sm uppercase tracking-wider">Filters</h3>
          <span className="text-[11px] font-semibold text-[#315D4F] bg-[#E9E4D7] px-2.5 py-0.5 rounded-full border border-[#D6CBB5]">
            {totalResults}
          </span>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 text-[11px] font-semibold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded-lg transition-colors"
          >
            <X className="w-3 h-3" />
            Reset
          </button>
        )}
      </div>

      {/* Categories */}
      <div>
        <label className="block text-[11px] font-bold text-[#7A755D] uppercase tracking-wider mb-2.5">
          Category
        </label>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => update({ category: '' })}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              !filters.category
                ? 'bg-[#315D4F] text-[#F9F6EF] border border-[#A48B57] shadow-xs'
                : 'bg-[#E9E4D7] text-[#222B1F] hover:bg-[#D6CBB5]'
            }`}
          >
            All
          </button>
          {categories.map((cat) => {
            const isSelected = filters.category.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                type="button"
                onClick={() => update({ category: cat })}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-[#315D4F] text-[#F9F6EF] border border-[#A48B57] shadow-xs'
                    : 'bg-[#E9E4D7] text-[#222B1F] hover:bg-[#D6CBB5]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-[11px] font-bold text-[#7A755D] uppercase tracking-wider mb-2">
          Price Range (USD)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Min $"
            min="0"
            value={filters.minPrice}
            onChange={(e) => update({ minPrice: e.target.value })}
            className="w-full px-3 py-2 text-xs bg-[#F9F6EF] text-[#222B1F] border border-[#D6CBB5] rounded-xl focus:outline-none focus:border-[#315D4F] focus:ring-1 focus:ring-[#315D4F]"
          />
          <input
            type="number"
            placeholder="Max $"
            min="0"
            value={filters.maxPrice}
            onChange={(e) => update({ maxPrice: e.target.value })}
            className="w-full px-3 py-2 text-xs bg-[#F9F6EF] text-[#222B1F] border border-[#D6CBB5] rounded-xl focus:outline-none focus:border-[#315D4F] focus:ring-1 focus:ring-[#315D4F]"
          />
        </div>
      </div>

      {/* Stock availability */}
      <div className="pt-2 border-t border-[#D6CBB5]/60">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filters.inStockOnly}
            onChange={(e) => update({ inStockOnly: e.target.checked })}
            className="w-4 h-4 rounded text-[#315D4F] focus:ring-[#315D4F] border-[#D6CBB5] accent-[#315D4F]"
          />
          <span className="text-xs font-medium text-[#222B1F]">In-stock items only</span>
        </label>
      </div>

      {/* Sorting */}
      <div className="pt-2 border-t border-[#D6CBB5]/60">
        <label className="block text-[11px] font-bold text-[#7A755D] uppercase tracking-wider mb-2">
          Sort By
        </label>
        <select
          value={filters.sortBy}
          onChange={(e) => update({ sortBy: e.target.value as FilterState['sortBy'] })}
          className="w-full py-2 px-3 text-xs bg-[#F9F6EF] border border-[#D6CBB5] rounded-xl focus:outline-none focus:border-[#315D4F] text-[#222B1F] font-medium"
        >
          <option value="featured">Featured Curations</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="name">Name (A-Z)</option>
        </select>
      </div>

    </div>
  );
};
