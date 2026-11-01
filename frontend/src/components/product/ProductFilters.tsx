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
    <div className="bg-white rounded-xl border border-zinc-200 p-4 space-y-5">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
        <div className="flex items-center gap-1.5">
          <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-500" />
          <h3 className="font-semibold text-zinc-900 text-xs uppercase tracking-wider">Filters</h3>
          <span className="text-[11px] text-zinc-400">({totalResults})</span>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <X className="w-3 h-3" />
            Reset
          </button>
        )}
      </div>

      {/* Categories */}
      <div>
        <label className="block text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mb-2">
          Category
        </label>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => update({ category: '' })}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              !filters.category
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => update({ category: cat })}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                filters.category === cat
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mb-2">
          Price Range ($)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Min"
            min="0"
            value={filters.minPrice}
            onChange={(e) => update({ minPrice: e.target.value })}
            className="w-full px-2.5 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-400"
          />
          <input
            type="number"
            placeholder="Max"
            min="0"
            value={filters.maxPrice}
            onChange={(e) => update({ maxPrice: e.target.value })}
            className="w-full px-2.5 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-400"
          />
        </div>
      </div>

      {/* Stock availability */}
      <div className="pt-2 border-t border-zinc-100">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filters.inStockOnly}
            onChange={(e) => update({ inStockOnly: e.target.checked })}
            className="w-3.5 h-3.5 rounded text-zinc-900 focus:ring-zinc-900 border-zinc-300"
          />
          <span className="text-xs text-zinc-700">In-stock only</span>
        </label>
      </div>

      {/* Sorting */}
      <div className="pt-2 border-t border-zinc-100">
        <label className="block text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mb-2">
          Sort By
        </label>
        <select
          value={filters.sortBy}
          onChange={(e) => update({ sortBy: e.target.value as FilterState['sortBy'] })}
          className="w-full py-1.5 px-2.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-400 text-zinc-800"
        >
          <option value="featured">Featured</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="name">Name (A-Z)</option>
        </select>
      </div>

    </div>
  );
};
