import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2, ArrowRight, ArrowLeft, ShieldCheck, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';

/**
 * SERENDIP Shopping Cart Page
 * Warm Ivory (#F9F6EF) and Heritage Green (#315D4F) styling.
 */
export const CartPage: React.FC = () => {
  const { cart, updateQuantity, removeItem, clearCart, isLoading, error } = useCart();
  const { formatPrice } = useCurrency();
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 sm:p-10 bg-[#FFFFFF] border border-[#D6CBB5] rounded-3xl text-center shadow-premium space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-[#E9E4D7] border border-[#D6CBB5] flex items-center justify-center text-[#A48B57] mx-auto">
          <ShoppingBag className="w-7 h-7" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-[#222B1F]">Sign In to View Cart</h2>
        <p className="text-xs text-[#7A755D] max-w-xs mx-auto">
          Your shopping cart is securely attached to your international buyer profile.
        </p>
        <div className="pt-2">
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-[#315D4F] hover:bg-[#19372E] text-[#F9F6EF] font-bold text-xs shadow-md transition-all border border-[#A48B57]/40"
          >
            Sign In to Your Account
          </Link>
        </div>
      </div>
    );
  }

  if (role !== 'BUYER') {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-[#FFFFFF] border border-[#D6CBB5] rounded-3xl text-center space-y-3 shadow-subtle">
        <h2 className="font-serif text-lg font-bold text-[#222B1F]">Buyer Cart Only</h2>
        <p className="text-xs text-[#7A755D]">
          Your current account role is <span className="font-bold text-[#315D4F]">{role}</span>. Shopping carts are designated for international buyers.
        </p>
      </div>
    );
  }

  const items = cart?.items || [];
  const isEmpty = items.length === 0;
  const computedSubtotal = items.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0);
  const cartTotal = (typeof cart?.total === 'number' && cart.total > 0)
    ? cart.total
    : (typeof cart?.totalAmount === 'number' && cart.totalAmount > 0)
      ? cart.totalAmount
      : computedSubtotal;
  const itemCount = cart?.totalItemCount ?? items.reduce((sum, it) => sum + (it.quantity || 1), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
      
      {/* Header */}
      <div className="border-b border-[#D6CBB5] pb-5 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#A48B57] block">
            Your Selection
          </span>
          <h1 className="font-serif text-3xl font-bold text-[#222B1F] tracking-tight">
            Shopping Cart
          </h1>
          <p className="text-xs text-[#7A755D] mt-1">
            {cart?.totalItemCount || 0} {cart?.totalItemCount === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>
        {!isEmpty && (
          <button
            type="button"
            onClick={clearCart}
            disabled={isLoading}
            className="text-xs font-semibold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Cart
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs">
          {error}
        </div>
      )}

      {isEmpty ? (
        <div className="bg-[#FFFFFF] border border-[#D6CBB5] rounded-2xl p-12 text-center max-w-md mx-auto space-y-4 shadow-subtle">
          <div className="w-12 h-12 rounded-xl bg-[#E9E4D7] flex items-center justify-center text-[#A48B57] mx-auto">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-lg font-bold text-[#222B1F]">Your cart is empty</h3>
          <p className="text-xs text-[#7A755D] max-w-sm mx-auto">
            Discover authentic Ceylon teas, gemstones, and spices in the catalog.
          </p>
          <div className="pt-2">
            <Link
              to="/catalog"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#315D4F] hover:bg-[#19372E] text-[#F9F6EF] font-semibold text-xs transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-[#BD9F75]" />
              Explore Products
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Cart Items List */}
          <div className="lg:col-span-8 space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-[#FFFFFF] rounded-2xl border border-[#D6CBB5] p-5 shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#315D4F] block">
                    {item.sellerShopName || 'Ceylon Heritage Guild'}
                  </span>
                  <h4 className="font-serif font-bold text-[#222B1F] text-base truncate mt-0.5">
                    {item.productName}
                  </h4>
                  <div className="text-xs text-[#7A755D] mt-1">
                    Unit Price: <span className="font-semibold text-[#222B1F]">{formatPrice(item.unitPrice)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                  {/* Quantity controls */}
                  <div className="flex items-center border border-[#D6CBB5] rounded-xl bg-[#F9F6EF] overflow-hidden">
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="px-3 py-1.5 text-xs font-bold text-[#222B1F] hover:bg-[#E9E4D7] transition-colors"
                    >
                      -
                    </button>
                    <span className="px-3 py-1.5 text-xs font-bold text-[#222B1F] min-w-[32px] text-center">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="px-3 py-1.5 text-xs font-bold text-[#222B1F] hover:bg-[#E9E4D7] transition-colors"
                    >
                      +
                    </button>
                  </div>

                  {/* Line total */}
                  <div className="text-right min-w-[90px]">
                    <span className="font-serif font-bold text-base text-[#315D4F] block">
                      {formatPrice(item.subtotal)}
                    </span>
                  </div>

                  {/* Remove button */}
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => removeItem(item.productId)}
                    className="p-2 text-[#ADA78A] hover:text-rose-700 rounded-lg transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-4 bg-[#FFFFFF] rounded-3xl border border-[#D6CBB5] p-6 sm:p-7 shadow-premium space-y-6">
            <h3 className="font-serif text-xl font-bold text-[#222B1F] pb-3 border-b border-[#D6CBB5]/60 flex items-center justify-between">
              <span>Order Summary</span>
              <Sparkles className="w-4 h-4 text-[#A48B57]" />
            </h3>

            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between text-[#7A755D]">
                <span>Items Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
                <span className="font-semibold text-[#222B1F]">{formatPrice(cartTotal)}</span>
              </div>
              <div className="flex justify-between text-[#7A755D]">
                <span>Export Packaging</span>
                <span className="font-semibold text-[#315D4F]">Complimentary</span>
              </div>
              <div className="flex justify-between text-[#7A755D]">
                <span>Worldwide Inspected Freight</span>
                <span className="font-semibold text-[#222B1F]">Calculated at Checkout</span>
              </div>
            </div>

            <div className="border-t border-[#D6CBB5] pt-4 flex justify-between items-baseline">
              <span className="font-serif text-sm font-bold text-[#222B1F]">Estimated Total</span>
              <span className="font-serif text-2xl font-bold text-[#315D4F]">
                {formatPrice(cartTotal)}
              </span>
            </div>

            <button
              type="button"
              disabled={isLoading || isEmpty}
              onClick={() => navigate('/checkout')}
              className="w-full py-4 rounded-xl bg-[#315D4F] hover:bg-[#19372E] text-[#F9F6EF] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-heritage transition-all border border-[#A48B57]/50"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4 text-[#BD9F75]" />
            </button>

            <div className="flex items-center gap-2 text-[11px] text-[#7A755D] pt-2 justify-center">
              <ShieldCheck className="w-4 h-4 text-[#315D4F]" />
              <span>Certified Sri Lankan Provenance & Secure Checkout</span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
