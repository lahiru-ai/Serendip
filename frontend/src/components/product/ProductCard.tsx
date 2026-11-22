import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Check, AlertCircle, Heart, Star, Sparkles } from 'lucide-react';
import { Product } from '../../types';
import { useCurrency } from '../../context/CurrencyContext';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

// Authentic high-quality Sri Lankan imagery for catalog items
const CATEGORY_IMAGES: Record<string, string> = {
  Tea: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=700&q=80',
  Gems: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=700&q=80',
  Spices: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=700&q=80',
  Crafts: 'https://images.unsplash.com/photo-1606744837616-56c9a5c6a6eb?auto=format&fit=crop&w=700&q=80',
  Apparel: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=700&q=80',
  default: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=700&q=80'
};

// Specialized authentic Sri Lankan item image mapping based on name keywords
const getItemImage = (product: Product): string => {
  if (product.imageUrl) return product.imageUrl;
  const name = product.name.toLowerCase();
  if (name.includes('white tea') || name.includes('silver tip')) {
    return 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=700&q=80';
  }
  if (name.includes('bopf') || name.includes('black tea') || name.includes('ruhuna')) {
    return 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=700&q=80';
  }
  if (name.includes('sapphire') || name.includes('gem')) {
    return 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=700&q=80';
  }
  if (name.includes('cinnamon') || name.includes('quill')) {
    return 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=700&q=80';
  }
  if (name.includes('mask') || name.includes('peacock') || name.includes('raksha')) {
    return 'https://images.unsplash.com/photo-1606744837616-56c9a5c6a6eb?auto=format&fit=crop&w=700&q=80';
  }
  if (name.includes('batik') || name.includes('sarong') || name.includes('cotton')) {
    return 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=700&q=80';
  }
  return CATEGORY_IMAGES[product.category] || CATEGORY_IMAGES.default;
};

interface ProductCardProps {
  product: Product;
  badge?: 'Bestseller' | 'New' | 'Featured' | 'Heritage';
}

/**
 * SERENDIP Premium Product Card
 * - Generous image display with smooth zoom
 * - Heritage Green and Antique Gold accents
 * - Producer name, rating, wishlist toggle, and cart action
 */
export const ProductCard: React.FC<ProductCardProps> = ({ product, badge }) => {
  const { formatPrice } = useCurrency();
  const { addToCart, isLoading: cartLoading } = useCart();
  const { isAuthenticated, role } = useAuth();
  
  const [added, setAdded] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const imageUrl = getItemImage(product);
  const isOutOfStock = product.stockQuantity <= 0;

  // Deriving rating and badge based on product attributes
  const displayBadge = badge || (product.id === 1 ? 'Featured' : product.id === 3 ? 'Bestseller' : product.id === 2 ? 'Heritage' : 'New');

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlisted(!wishlisted);
  };

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

  return (
    <div className="group relative flex flex-col bg-[#FFFFFF] rounded-2xl border border-[#D6CBB5]/80 overflow-hidden hover:border-[#A48B57] hover:shadow-premium transition-all duration-300 hover:-translate-y-1">
      
      {/* Product Image Container */}
      <Link to={`/products/${product.id}`} className="relative aspect-square w-full bg-[#E9E4D7]/50 overflow-hidden block">
        <img
          src={imageUrl}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
        />

        {/* Subtle dark vignette overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {isOutOfStock ? (
            <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#222B1F]/90 text-[#F9F6EF] rounded-full backdrop-blur-xs">
              Out of stock
            </span>
          ) : (
            <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#315D4F] text-[#F9F6EF] rounded-full shadow-xs border border-[#A48B57]/40 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-[#BD9F75]" />
              {displayBadge}
            </span>
          )}
        </div>

        {/* Category Pill on Image */}
        <div className="absolute bottom-2.5 left-3 flex items-center z-10 pr-3">
          <span className="text-[11px] font-semibold text-[#F9F6EF] drop-shadow-md tracking-wider uppercase">
            {product.category}
          </span>
        </div>

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={handleWishlistToggle}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all duration-200 z-10 ${
            wishlisted
              ? 'bg-[#315D4F] text-[#BD9F75] shadow-md'
              : 'bg-white/80 text-[#222B1F] hover:bg-white hover:text-[#315D4F] shadow-xs'
          }`}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          title={wishlisted ? 'In wishlist' : 'Save to wishlist'}
        >
          <Heart className={`w-3.5 h-3.5 ${wishlisted ? 'fill-[#A48B57] text-[#A48B57]' : ''}`} />
        </button>
      </Link>

      {/* Product Content Details */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          {/* Producer / Artisan info & Weight */}
          <div className="flex items-center justify-between gap-2 text-[11px] font-medium text-[#7A755D]">
            <p className="truncate flex items-center gap-1 min-w-0">
              <span>By</span>
              <span className="text-[#315D4F] font-semibold hover:underline truncate">
                {product.sellerShopName || 'Ceylon Heritage Guild'}
              </span>
            </p>
            {product.weightGrams && product.weightGrams > 0 ? (
              <span className="text-[10px] font-semibold text-[#315D4F] bg-[#E9E4D7] border border-[#D6CBB5] px-1.5 py-0.5 rounded shrink-0">
                Weight: {product.weightGrams >= 1000 ? `${(product.weightGrams / 1000).toFixed(product.weightGrams % 1000 === 0 ? 0 : 1)} kg` : `${product.weightGrams}g`}
              </span>
            ) : null}
          </div>

          {/* Product Title */}
          <Link to={`/products/${product.id}`} className="block">
            <h3 className="font-serif text-sm sm:text-base font-bold text-[#222B1F] line-clamp-1 group-hover:text-[#315D4F] transition-colors leading-snug">
              {product.name}
            </h3>
          </Link>

          {/* Rating */}
          {product.reviewCount && product.reviewCount > 0 ? (
            <div className="flex items-center gap-1.5 pt-0.5">
              <div className="flex items-center text-[#A48B57]">
                <Star className="w-3 h-3 fill-[#A48B57]" />
              </div>
              <span className="text-[11px] font-bold text-[#222B1F]">
                {product.averageRating ? product.averageRating.toFixed(1) : '5.0'}
              </span>
              <span className="text-[11px] text-[#ADA78A]">({product.reviewCount})</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 pt-0.5 text-[#ADA78A]">
              <Star className="w-3 h-3 text-[#D6CBB5]" />
              <span className="text-[11px] text-[#7A755D]">No reviews yet</span>
            </div>
          )}
        </div>

        {/* Pricing and Cart Action */}
        <div className="pt-3 border-t border-[#D6CBB5]/50 flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] text-[#7A755D] block uppercase tracking-wider font-semibold">Price</span>
            <span className="font-serif text-base sm:text-lg font-bold text-[#222B1F] group-hover:text-[#315D4F] transition-colors">
              {formatPrice(product.priceUsd, product.priceLkr)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock || cartLoading}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs ${
              isOutOfStock
                ? 'bg-[#E9E4D7] text-[#ADA78A] cursor-not-allowed'
                : added
                ? 'bg-[#315D4F] text-[#BD9F75] font-bold shadow-md'
                : 'bg-[#315D4F] hover:bg-[#19372E] text-[#F9F6EF] border border-[#A48B57]/40 hover:border-[#A48B57] active:scale-95'
            }`}
            title={added ? 'Added to cart' : 'Add to cart'}
            aria-label={added ? 'Added to cart' : 'Add to cart'}
          >
            {added ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#BD9F75]" />
                <span>Added</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5 text-[#BD9F75]" />
                <span>Add</span>
              </>
            )}
          </button>
        </div>

        {/* Error Notice */}
        {errorNotice && (
          <div className="p-1.5 bg-[#FAF7F0] text-rose-800 text-[11px] rounded-lg border border-rose-300 flex items-center gap-1.5">
            <AlertCircle className="w-3 h-3 shrink-0 text-rose-600" />
            <span className="truncate">{errorNotice}</span>
          </div>
        )}
      </div>

    </div>
  );
};
