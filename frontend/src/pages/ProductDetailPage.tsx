import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Star, 
  ShoppingBag, 
  ShieldCheck, 
  Truck, 
  ArrowLeft, 
  Check, 
  AlertCircle,
  MessageSquare,
  Sparkles,
  MapPin,
  HeartHandshake
} from 'lucide-react';
import { Product, Review } from '../types';
import { api } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const CATEGORY_IMAGES: Record<string, string> = {
  Tea: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=1200&q=80',
  Gems: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=80',
  Spices: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=1200&q=80',
  Crafts: 'https://images.unsplash.com/photo-1606744837616-56c9a5c6a6eb?auto=format&fit=crop&w=1200&q=80',
  Apparel: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1200&q=80',
  default: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80'
};

const getItemImage = (product: Product): string => {
  if (product.imageUrl) return product.imageUrl;
  const name = product.name.toLowerCase();
  if (name.includes('white tea') || name.includes('silver tip')) {
    return 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=1200&q=80';
  }
  if (name.includes('bopf') || name.includes('black tea') || name.includes('ruhuna')) {
    return 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=1200&q=80';
  }
  if (name.includes('sapphire') || name.includes('gem')) {
    return 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=80';
  }
  if (name.includes('cinnamon') || name.includes('quill')) {
    return 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=1200&q=80';
  }
  if (name.includes('mask') || name.includes('peacock') || name.includes('raksha')) {
    return 'https://images.unsplash.com/photo-1606744837616-56c9a5c6a6eb?auto=format&fit=crop&w=1200&q=80';
  }
  if (name.includes('batik') || name.includes('sarong') || name.includes('cotton')) {
    return 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1200&q=80';
  }
  return CATEGORY_IMAGES[product.category] || CATEGORY_IMAGES.default;
};

/**
 * SERENDIP Product Detail Page
 * Heritage styling with Warm Ivory, Antique Gold, and Primary Heritage Green.
 */
export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);

  const { formatPrice } = useCurrency();
  const { addToCart, isLoading: cartLoading } = useCart();
  const { isAuthenticated, role, user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (isNaN(productId)) return;
      try {
        setLoading(true);
        setError(null);
        const [p, r] = await Promise.all([
          api.getProductById(productId),
          api.getReviewsForProduct(productId).catch(() => []),
        ]);
        setProduct(p);
        setReviews(r);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to load product details';
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [productId]);

  const handleAddToCart = async () => {
    if (!product) return;
    setActionError(null);

    if (!isAuthenticated) {
      setActionError('Sign in with a buyer account to purchase');
      return;
    }

    if (role !== 'BUYER') {
      setActionError('Buyer account required to purchase');
      return;
    }

    try {
      await addToCart(product.id, quantity);
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not add to cart';
      setActionError(msg);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 animate-pulse space-y-8">
        <div className="h-4 bg-[#E9E4D7] rounded w-28" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-6 aspect-square bg-[#E9E4D7] rounded-3xl" />
          <div className="lg:col-span-6 space-y-5">
            <div className="h-8 bg-[#E9E4D7] rounded w-3/4" />
            <div className="h-6 bg-[#E9E4D7] rounded w-1/4" />
            <div className="h-24 bg-[#E9E4D7] rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-[#FFFFFF] border border-[#D6CBB5] rounded-3xl text-center space-y-4 shadow-subtle">
        <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
        <h2 className="font-serif text-lg font-bold text-[#222B1F]">Item Not Found</h2>
        <p className="text-xs text-[#7A755D]">{error || 'The requested product could not be located in our catalog.'}</p>
        <Link
          to="/catalog"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#315D4F] text-[#F9F6EF] text-xs font-semibold hover:bg-[#19372E] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Catalog
        </Link>
      </div>
    );
  }

  const imageUrl = getItemImage(product);
  const hasReviews = reviews.length > 0;
  const averageRating = hasReviews 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-12">
      
      {/* Back button */}
      <Link
        to="/catalog"
        className="inline-flex items-center gap-2 text-xs font-bold text-[#315D4F] hover:text-[#19372E] transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 text-[#A48B57] group-hover:-translate-x-1 transition-transform" />
        Back to Catalog
      </Link>

      {/* Main Product Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        
        {/* Left Column: Image with antique gold border styling */}
        <div className="lg:col-span-6">
          <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-[#FFFFFF] border border-[#D6CBB5] shadow-premium">
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider bg-[#315D4F] text-[#F9F6EF] border border-[#A48B57]/50 rounded-full shadow-sm">
                {product.category}
              </span>
              <span className="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider bg-[#FFFFFF]/90 text-[#315D4F] border border-[#D6CBB5] rounded-full shadow-sm flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#A48B57]" />
                Certified Ceylon
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Details & Purchase */}
        <div className="lg:col-span-6 space-y-6">
          
          <div>
            <div className="flex items-center gap-2 text-xs text-[#7A755D] mb-1.5">
              <span className="font-semibold text-[#315D4F]">{product.sellerShopName || 'Ceylon Heritage Guild'}</span>
              <span>•</span>
              {hasReviews ? (
                <div className="flex items-center gap-1 text-[#A48B57]">
                  <Star className="w-4 h-4 fill-[#A48B57]" />
                  <span className="font-bold text-[#222B1F]">{averageRating}</span>
                  <span className="text-[#ADA78A]">({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-[#ADA78A]">
                  <Star className="w-3.5 h-3.5 text-[#D6CBB5]" />
                  <span className="text-xs text-[#7A755D]">No reviews yet</span>
                </div>
              )}
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#222B1F] tracking-tight leading-tight">
              {product.name}
            </h1>
          </div>

          {/* Pricing */}
          <div className="py-2 border-y border-[#D6CBB5]/60 flex items-baseline gap-3">
            <span className="font-serif text-3xl sm:text-4xl font-bold text-[#315D4F]">
              {formatPrice(product.priceUsd, product.priceLkr)}
            </span>
            <span className="text-xs text-[#7A755D] font-medium">Export Inspected & Certified</span>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-[#7A755D] uppercase tracking-wider">Heritage Story & Details</h3>
            <p className="text-sm text-[#222B1F] leading-relaxed font-normal">
              {product.description || 'Authentic single-origin handcrafted item curated by verified Ceylon artisan merchants.'}
            </p>
          </div>

          {/* Specifications */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-[#FFFFFF] rounded-2xl border border-[#D6CBB5]">
              <span className="text-[#7A755D] block mb-0.5 font-semibold text-[11px] uppercase tracking-wider">Origin</span>
              <span className="font-serif font-bold text-[#222B1F] text-sm flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#315D4F]" />
                Sri Lanka (Ceylon)
              </span>
            </div>
            <div className="p-4 bg-[#FFFFFF] rounded-2xl border border-[#D6CBB5]">
              <span className="text-[#7A755D] block mb-0.5 font-semibold text-[11px] uppercase tracking-wider">Availability</span>
              <span className={`font-semibold text-sm ${product.stockQuantity > 0 ? 'text-[#315D4F]' : 'text-rose-700'}`}>
                {product.stockQuantity > 0 ? `${product.stockQuantity} units available` : 'Sold out'}
              </span>
            </div>
          </div>

          {/* Add to Cart Actions */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-[#D6CBB5] rounded-xl bg-[#FFFFFF] p-1">
                <button
                  type="button"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-[#222B1F] hover:bg-[#E9E4D7] disabled:opacity-30 transition-colors"
                >
                  -
                </button>
                <span className="w-10 text-center font-bold text-xs text-[#222B1F]">{quantity}</span>
                <button
                  type="button"
                  disabled={quantity >= product.stockQuantity}
                  onClick={() => setQuantity((q) => Math.min(product.stockQuantity, q + 1))}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-[#222B1F] hover:bg-[#E9E4D7] disabled:opacity-30 transition-colors"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                disabled={product.stockQuantity === 0 || cartLoading}
                onClick={handleAddToCart}
                className={`flex-1 py-3.5 px-6 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
                  added
                    ? 'bg-[#315D4F] text-[#BD9F75]'
                    : 'bg-[#315D4F] hover:bg-[#19372E] text-[#F9F6EF] border border-[#A48B57]/50 disabled:opacity-40 hover:scale-[1.01] active:scale-[0.99]'
                }`}
              >
                {added ? (
                  <>
                    <Check className="w-4 h-4 text-[#BD9F75]" />
                    Added to Shopping Cart
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4 text-[#BD9F75]" />
                    Add {quantity > 1 ? `${quantity} Items` : 'to Cart'}
                  </>
                )}
              </button>
            </div>

            {user?.role === 'SELLER' && user?.id === product.sellerId && (
              <div className="p-3 bg-[#E9E4D7] border border-[#A48B57] rounded-xl flex items-center justify-between">
                <span className="text-xs text-[#315D4F] font-semibold">You are the seller of this artifact</span>
                <Link
                  to="/seller"
                  className="px-3 py-1.5 bg-[#315D4F] hover:bg-[#19372E] text-[#F9F6EF] text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  Edit in Merchant Suite &rarr;
                </Link>
              </div>
            )}

            {actionError && (
              <div className="p-3 bg-rose-50 text-rose-800 text-xs rounded-xl flex items-center gap-2 border border-rose-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{actionError}</span>
              </div>
            )}
          </div>

          {/* Value guarantees */}
          <div className="pt-3 border-t border-[#D6CBB5]/60 flex flex-wrap items-center gap-6 text-xs text-[#7A755D]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#315D4F]" />
              <span className="font-medium">100% Genuine Ceylon Provenance</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#315D4F]" />
              <span className="font-medium">Inspected International Express</span>
            </div>
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-[#315D4F]" />
              <span className="font-medium">Fair Return to Artisan Family</span>
            </div>
          </div>

        </div>

      </div>

      {/* Reviews Section */}
      <div className="border-t border-[#D6CBB5] pt-12 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#D6CBB5]/60">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="w-5 h-5 text-[#315D4F]" />
            <h2 className="font-serif text-2xl font-bold text-[#222B1F]">
              Customer Reviews ({reviews.length})
            </h2>
          </div>

          <span className="text-xs text-[#7A755D] bg-[#E9E4D7] px-3.5 py-1.5 rounded-xl border border-[#D6CBB5] font-medium">
            Verified international buyer reviews
          </span>
        </div>

        {reviews.length === 0 ? (
          <div className="bg-[#FFFFFF] rounded-2xl p-8 text-center border border-[#D6CBB5] space-y-1">
            <p className="text-sm font-semibold text-[#222B1F]">No buyer reviews submitted yet.</p>
            <p className="text-xs text-[#7A755D]">Verified reviews will appear here once orders are delivered.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((rev) => (
              <div key={rev.id} className="bg-[#FFFFFF] border border-[#D6CBB5] rounded-2xl p-5 shadow-subtle space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-bold text-xs text-[#222B1F]">{rev.buyerName || 'Verified International Buyer'}</span>
                    <span className="text-[10px] text-[#ADA78A]">{new Date(rev.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-0.5 text-[#A48B57]">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-[#A48B57]' : 'text-zinc-200'}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-[#222B1F] leading-relaxed">{rev.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
