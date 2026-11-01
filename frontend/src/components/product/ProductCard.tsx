import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Check, AlertCircle } from 'lucide-react';
import { Product } from '../../types';
import { useCurrency } from '../../context/CurrencyContext';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

const CATEGORY_IMAGES: Record<string, string> = {
  Tea: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
  Gems: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80',
  Spices: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=600&q=80',
  Crafts: 'https://images.unsplash.com/photo-1606744837616-56c9a5c6a6eb?auto=format&fit=crop&w=600&q=80',
  Apparel: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=600&q=80',
  default: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80'
};

interface ProductCardProps {
  product: Product;
}

/**
 * Simple, clean product card focusing on image, title, price, and purchase action.
 */
export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { formatPrice } = useCurrency();
  const { addToCart, isLoading: cartLoading } = useCart();
  const { isAuthenticated, role } = useAuth();
  
  const [added, setAdded] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const imageUrl = product.imageUrl || CATEGORY_IMAGES[product.category] || CATEGORY_IMAGES.default;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      setErrorNotice('Sign in to purchase');
      setTimeout(() => setErrorNotice(null), 3000);
      return;
    }

    if (role !== 'BUYER') {
      setErrorNotice('Buyer account required');
      setTimeout(() => setErrorNotice(null), 3000);
      return;
    }

    try {
      await addToCart(product.id, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not add to cart';
      setErrorNotice(msg);
      setTimeout(() => setErrorNotice(null), 3500);
    }
  };

  const isOutOfStock = product.stockQuantity <= 0;

  return (
    <div className="group flex flex-col bg-white rounded-xl border border-zinc-200 overflow-hidden hover:border-zinc-300 hover:shadow-sm transition-all duration-200">
      
      {/* Product Image */}
      <Link to={`/products/${product.id}`} className="relative aspect-square w-full bg-zinc-100 overflow-hidden">
        <img
          src={imageUrl}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-300"
        />

        {/* Minimal Out of stock badge */}
        {isOutOfStock && (
          <span className="absolute top-2 right-2 px-2 py-0.5 text-[10px] font-medium uppercase bg-zinc-900/90 text-white rounded">
            Out of stock
          </span>
        )}
      </Link>

      {/* Content Details */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wide">
            {product.category}
          </span>

          <Link to={`/products/${product.id}`} className="block">
            <h3 className="text-sm font-medium text-zinc-900 line-clamp-1 group-hover:text-emerald-700 transition-colors">
              {product.name}
            </h3>
          </Link>
        </div>

        {/* Price and Cart Action */}
        <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-zinc-900">
            {formatPrice(product.priceUsd, product.priceLkr)}
          </span>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock || cartLoading}
            className={`p-2 rounded-lg text-xs font-medium transition-all ${
              isOutOfStock
                ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                : added
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-100 hover:bg-zinc-900 text-zinc-800 hover:text-white'
            }`}
            title={added ? 'Added to cart' : 'Add to cart'}
            aria-label={added ? 'Added to cart' : 'Add to cart'}
          >
            {added ? (
              <Check className="w-4 h-4" />
            ) : (
              <ShoppingBag className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Short inline error notice */}
        {errorNotice && (
          <div className="mt-2 p-1.5 bg-red-50 text-red-700 text-[11px] rounded flex items-center gap-1">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span className="truncate">{errorNotice}</span>
          </div>
        )}
      </div>

    </div>
  );
};
