import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2, ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';

/**
 * Shopping cart page for viewing items, adjusting quantities, and proceeding to checkout.
 */
export const CartPage: React.FC = () => {
  const { cart, updateQuantity, removeItem, clearCart, isLoading, error } = useCart();
  const { formatPrice, currency } = useCurrency();
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white border border-zinc-200/80 rounded-3xl text-center shadow-premium">
        <ShoppingBag className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-zinc-900">Sign In to View Cart</h2>
        <p className="text-xs text-zinc-500 mt-2 mb-6">
          Your shopping cart is securely attached to your international buyer profile.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-zinc-900 text-white font-semibold text-xs shadow-sm hover:bg-zinc-800"
        >
          Sign In to Your Account
        </Link>
      </div>
    );
  }

  if (role !== 'BUYER') {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-amber-50 border border-amber-200 rounded-3xl text-center">
        <h2 className="text-lg font-bold text-amber-900">Buyer Cart Only</h2>
        <p className="text-xs text-amber-700 mt-2">
          Your current account role is <span className="font-bold">{role}</span>. Shopping carts are designated for international buyers.
        </p>
      </div>
    );
  }

  const items = cart?.items || [];
  const isEmpty = items.length === 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="border-b border-zinc-200 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
            Cart
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            {cart?.totalItemCount || 0} {cart?.totalItemCount === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>
        {!isEmpty && (
          <button
            type="button"
            onClick={clearCart}
            disabled={isLoading}
            className="text-xs text-zinc-500 hover:text-red-600 transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs">
          {error}
        </div>
      )}

      {isEmpty ? (
        <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center max-w-md mx-auto space-y-4">
          <ShoppingBag className="w-12 h-12 text-zinc-300 mx-auto" />
          <h3 className="text-lg font-semibold text-zinc-900">Your cart is empty</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Discover authentic Ceylon teas, gemstones, and spices in the catalog.
          </p>
          <div className="pt-2">
            <Link
              to="/catalog"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 text-white font-medium text-xs hover:bg-zinc-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Browse Catalog
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
                className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-serendip-700">
                    {item.sellerShopName || 'Ceylon Merchant'}
                  </span>
                  <h4 className="font-semibold text-zinc-900 text-base truncate mt-0.5">
                    {item.productName}
                  </h4>
                  <div className="text-xs text-zinc-500 mt-1">
                    Unit Price: <span className="font-medium text-zinc-800">{formatPrice(item.unitPrice)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                  {/* Quantity controls */}
                  <div className="flex items-center border border-zinc-200 rounded-xl bg-zinc-50 overflow-hidden">
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="px-3 py-1.5 text-xs font-bold text-zinc-600 hover:bg-zinc-200 transition-colors"
                    >
                      -
                    </button>
                    <span className="px-3 py-1.5 text-xs font-semibold text-zinc-900 min-w-[32px] text-center">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="px-3 py-1.5 text-xs font-bold text-zinc-600 hover:bg-zinc-200 transition-colors"
                    >
                      +
                    </button>
                  </div>

                  {/* Line total */}
                  <div className="text-right min-w-[80px]">
                    <span className="font-bold text-sm text-zinc-900 block">
                      {formatPrice(item.subtotal)}
                    </span>
                  </div>

                  {/* Remove button */}
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => removeItem(item.productId)}
                    className="p-1.5 text-zinc-400 hover:text-red-600 rounded-lg transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-zinc-200/80 p-6 shadow-premium space-y-6">
            <h3 className="font-serif text-lg font-bold text-zinc-900 pb-3 border-b border-zinc-100">
              Order Summary
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-zinc-600">
                <span>Subtotal ({cart?.totalItemCount} items)</span>
                <span className="font-semibold text-zinc-900">{formatPrice(cart?.total || 0)}</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>International Shipping</span>
                <span className="font-semibold text-zinc-900">Calculated at Checkout</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>Currency Basis</span>
                <span className="font-semibold text-zinc-900">{currency}</span>
              </div>
              <div className="pt-3 border-t border-zinc-100 flex justify-between text-base font-bold text-zinc-900">
                <span>Estimated Total</span>
                <span className="text-serendip-700">{formatPrice(cart?.total || 0)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/checkout')}
              className="w-full py-3 px-5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs transition-colors flex items-center justify-center gap-2"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 pt-2 border-t border-zinc-100">
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span>Secure transaction protection</span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
