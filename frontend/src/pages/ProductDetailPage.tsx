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
  MessageSquare
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

/**
 * Product detail page displaying descriptions, pricing, and verified reviews.
 */
export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);

  const { formatPrice } = useCurrency();
  const { addToCart, isLoading: cartLoading } = useCart();
  const { isAuthenticated, role } = useAuth();

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
    try {
      await addToCart(product.id, quantity);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not add to cart';
      setActionError(msg);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pulse space-y-8">
        <div className="h-4 bg-zinc-200 rounded w-24"></div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-6 aspect-square bg-zinc-200 rounded-3xl"></div>
          <div className="lg:col-span-6 space-y-4">
            <div className="h-8 bg-zinc-200 rounded w-3/4"></div>
            <div className="h-6 bg-zinc-200 rounded w-1/4"></div>
            <div className="h-20 bg-zinc-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white border border-zinc-200/80 rounded-3xl text-center space-y-4 shadow-premium">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-zinc-900">Product Not Found</h2>
        <p className="text-xs text-zinc-500">{error || 'The requested product does not exist or has been removed.'}</p>
        <Link
          to="/catalog"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Catalog
        </Link>
      </div>
    );
  }

  const imageUrl = product.imageUrl || CATEGORY_IMAGES[product.category] || CATEGORY_IMAGES.default;
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
    : '5.0';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      
      {/* Back button */}
      <Link
        to="/catalog"
        className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Catalog
      </Link>

      {/* Main Product Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Left Column: Image */}
        <div className="lg:col-span-6">
          <div className="relative aspect-[4/3] sm:aspect-square w-full rounded-3xl overflow-hidden bg-zinc-100 border border-zinc-200/80 shadow-sm">
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            <span className="absolute top-4 left-4 px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-white/90 backdrop-blur-md text-zinc-800 rounded-full shadow-sm">
              {product.category}
            </span>
          </div>
        </div>

        {/* Right Column: Details & Purchase */}
        <div className="lg:col-span-6 space-y-6">
          
          <div>
            <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
              <span className="font-semibold text-serendip-700">{product.sellerShopName || 'Verified Ceylon Merchant'}</span>
              <span>•</span>
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="w-4 h-4 fill-amber-400 stroke-amber-500" />
                <span className="font-bold">{averageRating}</span>
                <span className="text-zinc-400">({reviews.length} reviews)</span>
              </div>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight">
              {product.name}
            </h1>
          </div>

          {/* Pricing */}
          <div className="py-2">
            <span className="text-3xl font-bold text-zinc-900">
              {formatPrice(product.priceUsd, product.priceLkr)}
            </span>
            <span className="ml-2 text-xs text-zinc-400">Inclusive of export inspection</span>
          </div>

          {/* Description */}
          <div className="space-y-2 border-t border-b border-zinc-100 py-4">
            <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">About this Product</h3>
            <p className="text-sm text-zinc-600 leading-relaxed font-normal">
              {product.description || 'Authentic single-origin handcrafted item curated by verified Ceylon artisan merchants.'}
            </p>
          </div>

          {/* Specifications */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-100">
              <span className="text-zinc-400 block mb-0.5">Origin</span>
              <span className="font-semibold text-zinc-800">Sri Lanka (Ceylon)</span>
            </div>
            <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-100">
              <span className="text-zinc-400 block mb-0.5">Availability</span>
              <span className={`font-semibold ${product.stockQuantity > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                {product.stockQuantity > 0 ? `${product.stockQuantity} units in stock` : 'Out of Stock'}
              </span>
            </div>
          </div>

          {/* Add to Cart Actions */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-zinc-200 rounded-2xl bg-white p-1">
                <button
                  type="button"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-600 hover:bg-zinc-100 disabled:opacity-30"
                >
                  -
                </button>
                <span className="w-10 text-center font-bold text-xs text-zinc-900">{quantity}</span>
                <button
                  type="button"
                  disabled={quantity >= product.stockQuantity}
                  onClick={() => setQuantity((q) => Math.min(product.stockQuantity, q + 1))}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-600 hover:bg-zinc-100 disabled:opacity-30"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                disabled={product.stockQuantity === 0 || cartLoading || (isAuthenticated && role !== 'BUYER')}
                onClick={handleAddToCart}
                className={`flex-1 py-3.5 px-6 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm ${
                  added
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-white disabled:opacity-40'
                }`}
              >
                {added ? (
                  <>
                    <Check className="w-4 h-4" />
                    Added to Shopping Cart
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    Add {quantity > 1 ? `${quantity} Items` : 'to Cart'}
                  </>
                )}
              </button>
            </div>

            {actionError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}
          </div>

          {/* Value guarantees */}
          <div className="pt-2 flex flex-wrap items-center gap-6 text-xs text-zinc-500">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-zinc-400" />
              <span>Authentic Ceylon Origin</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-zinc-400" />
              <span>Worldwide Delivery</span>
            </div>
          </div>

        </div>

      </div>

      {/* Reviews Section */}
      <div className="border-t border-zinc-200 pt-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-serendip-600" />
            <h2 className="font-serif text-2xl font-bold text-zinc-900">
              Customer Reviews ({reviews.length})
            </h2>
          </div>

          <span className="text-xs text-zinc-400 bg-zinc-50 px-3 py-1.5 rounded-xl border border-zinc-200/60 font-medium">
            Reviews can be submitted after purchase
          </span>
        </div>

        {/* Existing reviews list */}
        {reviews.length === 0 ? (
          <div className="bg-zinc-50 rounded-2xl p-8 text-center border border-zinc-200/80">
            <p className="text-sm text-zinc-600">No reviews yet for this product.</p>
            <p className="text-xs text-zinc-400 mt-1">Verified customer reviews will appear here once orders are delivered.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((rev) => (
              <div key={rev.id} className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-zinc-900">{rev.buyerName || 'Verified Buyer'}</span>
                    <span className="text-[10px] text-zinc-400">{new Date(rev.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-amber-400 stroke-amber-500' : 'text-zinc-200'}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-zinc-700 leading-relaxed">{rev.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
