import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Product } from '../types';
import { api } from '../services/api';
import { ProductGrid } from '../components/product/ProductGrid';
import { ProductFilters, FilterState } from '../components/product/ProductFilters';

const AVAILABLE_CATEGORIES = ['Tea', 'Gems', 'Spices', 'Crafts', 'Apparel'];

/**
 * Catalog page for browsing, searching, and filtering marketplace products.
 */
export const CatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize filter state from URL params
  const [filters, setFilters] = useState<FilterState>({
    category: searchParams.get('category') || '',
    search: searchParams.get('q') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    inStockOnly: searchParams.get('inStock') === 'true',
    sortBy: (searchParams.get('sort') as FilterState['sortBy']) || 'featured',
  });

  // Keep filters in sync when URL changes
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      category: searchParams.get('category') || '',
      search: searchParams.get('q') || '',
    }));
  }, [searchParams]);

  // Fetch products from backend
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getProducts();
      setAllProducts(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve products from marketplace';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Update URL search parameters when filters change
  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    const params = new URLSearchParams();
    if (newFilters.category) params.set('category', newFilters.category);
    if (newFilters.search) params.set('q', newFilters.search);
    if (newFilters.minPrice) params.set('minPrice', newFilters.minPrice);
    if (newFilters.maxPrice) params.set('maxPrice', newFilters.maxPrice);
    if (newFilters.inStockOnly) params.set('inStock', 'true');
    if (newFilters.sortBy !== 'featured') params.set('sort', newFilters.sortBy);
    setSearchParams(params, { replace: true });
  };

  // Filter & Sort logic
  const filteredProducts = useMemo(() => {
    return allProducts
      .filter((product) => {
        // Category filter
        if (filters.category && product.category.toLowerCase() !== filters.category.toLowerCase()) {
          return false;
        }

        // Search filter (name, description, seller name, category)
        if (filters.search) {
          const q = filters.search.toLowerCase();
          const matchName = product.name?.toLowerCase().includes(q);
          const matchDesc = product.description?.toLowerCase().includes(q);
          const matchSeller = product.sellerShopName?.toLowerCase().includes(q);
          const matchCat = product.category?.toLowerCase().includes(q);
          if (!matchName && !matchDesc && !matchSeller && !matchCat) {
            return false;
          }
        }

        // Price filter (evaluated in USD)
        if (filters.minPrice && product.priceUsd < parseFloat(filters.minPrice)) {
          return false;
        }
        if (filters.maxPrice && product.priceUsd > parseFloat(filters.maxPrice)) {
          return false;
        }

        // In-stock only
        if (filters.inStockOnly && product.stockQuantity <= 0) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'price-asc') return a.priceUsd - b.priceUsd;
        if (filters.sortBy === 'price-desc') return b.priceUsd - a.priceUsd;
        if (filters.sortBy === 'name') return a.name.localeCompare(b.name);
        return 0; // featured/default
      });
  }, [allProducts, filters]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Page Header */}
      <div className="border-b border-zinc-200 pb-5 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
            Catalog
          </h1>
          <p className="text-zinc-500 text-xs sm:text-sm mt-1">
            Explore authentic Ceylon teas, gems, spices, and crafts.
          </p>
        </div>
        <div className="text-xs text-zinc-500">
          {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}
        </div>
      </div>

      {/* Main Layout: Filters sidebar + Product grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Left Column: Filters */}
        <div className="lg:col-span-1 lg:sticky lg:top-24">
          <ProductFilters
            filters={filters}
            onChange={handleFiltersChange}
            categories={AVAILABLE_CATEGORIES}
            totalResults={filteredProducts.length}
          />
        </div>

        {/* Right Column: Product Grid */}
        <div className="lg:col-span-3">
          <ProductGrid
            products={filteredProducts}
            isLoading={loading}
            error={error}
            onRetry={fetchProducts}
          />
        </div>

      </div>

    </div>
  );
};
