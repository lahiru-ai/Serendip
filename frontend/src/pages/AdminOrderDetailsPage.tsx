import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  ArrowLeft,
  CreditCard,
  User,
  Store,
  Percent,
  Package,
  CheckCircle2,
  AlertCircle,
  Truck
} from 'lucide-react';
import { Order } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { OrderStatusBadge } from '../components/orders/OrderStatusBadge';
import { OrderTimeline } from '../components/orders/OrderTimeline';

/**
 * Admin: Comprehensive Order Details panel with full buyer, seller, payment, commission, and audit information.
 */
export const AdminOrderDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Status override state
  const [newStatus, setNewStatus] = useState('PROCESSING');
  const [overrideReason, setOverrideReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadOrder = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await api.getOrderById(parseInt(id, 10));
      setOrder(data);
      setNewStatus(data.status);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load order details';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  const handleStatusOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !newStatus) return;
    if (!overrideReason.trim()) {
      setError('Please provide an administrative reason for overriding the status.');
      return;
    }

    setActionLoading(true);
    setError(null);
    try {
      const updated = await api.adminUpdateOrderStatus(order.id, {
        newStatus,
        reason: overrideReason.trim(),
      });
      setSuccess(`Order status successfully updated to ${newStatus}.`);
      setOrder(updated);
      setOverrideReason('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Status override failed';
      setError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white border border-zinc-200/80 rounded-3xl text-center shadow-premium">
        <ShieldCheck className="w-12 h-12 text-ceylon-ruby mx-auto mb-3" />
        <h2 className="text-lg font-bold text-zinc-900">Admin Clearance Required</h2>
        <p className="text-xs text-zinc-500 mt-2 mb-4">Please log in with administrator privileges.</p>
        <Link to="/login" className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-semibold">
          Sign In
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 space-y-6 animate-pulse">
        <div className="h-8 bg-zinc-200 rounded-xl w-48" />
        <div className="h-64 bg-white rounded-3xl border border-zinc-200" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white border border-zinc-200/80 rounded-3xl text-center shadow-premium space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h3 className="font-semibold text-zinc-900">Order Not Found</h3>
        <p className="text-xs text-zinc-500">{error || 'Unable to locate order records.'}</p>
        <Link
          to="/admin/orders"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Orders</span>
        </Link>
      </div>
    );
  }

  // Calculate platform totals across all sub-orders
  const totalSubtotal = order.sellerOrders?.reduce((sum, so) => sum + so.subtotalAmount, 0) || order.subtotalAmount;
  const totalCommission = order.sellerOrders?.reduce((sum, so) => sum + (so.commissionAmount || 0), 0) || 0;
  const totalEarnings = totalSubtotal - totalCommission;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      
      {/* Header */}
      <div className="border-b border-zinc-200 pb-5 space-y-1">
        <Link
          to="/admin/orders"
          className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 font-medium transition-colors mb-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Order Management Panel</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-zinc-900">
              Order {order.orderNumber}
            </h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 font-mono">
              Database Order ID: <strong>#{order.id}</strong>
            </span>
          </div>
        </div>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-emerald-600 hover:text-emerald-900">
            &times;
          </button>
        </div>
      )}

      {/* Visual Lifecycle Progression */}
      <OrderTimeline currentStatus={order.status} history={order.statusHistory} />

      {/* 2-Column Main Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Order Items & Sub-orders (2 Cols) */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Section A: Order Information & Products */}
          <div className="bg-white rounded-3xl border border-zinc-200/80 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-zinc-900 text-sm">
                A. Order Information &amp; Commodities
              </h3>
              <span className="text-xs text-zinc-400">
                Created: {new Date(order.createdAt).toLocaleString()}
              </span>
            </div>

            <div className="space-y-4">
              {order.sellerOrders?.map((so) => {
                const commRate = so.commissionRate != null ? so.commissionRate : 10.0;
                const commAmt = so.commissionAmount != null ? so.commissionAmount : 0;
                const sellerEarnings = so.subtotalAmount - commAmt;

                return (
                  <div key={so.id} className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200/70 space-y-3">
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-200">
                      <div>
                        <span className="font-bold text-zinc-900 text-sm">
                          {so.sellerShopName || 'Merchant'}
                        </span>
                        <span className="text-zinc-400 text-[10px] ml-2">
                          (Sub-Order: {so.subOrderNumber || so.orderNumber})
                        </span>
                      </div>
                      <OrderStatusBadge status={so.status} />
                    </div>

                    {/* Items */}
                    <div className="divide-y divide-zinc-200/60 text-xs">
                      {so.items?.map((item) => (
                        <div key={item.id} className="py-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white border border-zinc-200 flex items-center justify-center shrink-0">
                              <Package className="w-4 h-4 text-zinc-500" />
                            </div>
                            <div>
                              <span className="font-semibold text-zinc-900 block">{item.productName}</span>
                              <span className="text-zinc-400 text-[11px]">
                                {item.quantity} units &times; {formatPrice(item.unitPrice)}
                              </span>
                            </div>
                          </div>
                          <span className="font-bold text-zinc-900">{formatPrice(item.subtotal)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Sub-order Financial & Commission Summary */}
                    <div className="p-3 bg-white border border-zinc-200 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-zinc-400 text-[10px] uppercase block">Subtotal</span>
                        <span className="font-bold text-zinc-900">{formatPrice(so.subtotalAmount)}</span>
                      </div>
                      <div>
                        <span className="text-amber-700 text-[10px] uppercase block">Platform Comm ({commRate}%)</span>
                        <span className="font-bold text-amber-700 font-mono">+{formatPrice(commAmt)}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 text-[10px] uppercase block">Seller Earnings</span>
                        <span className="font-bold text-emerald-800 font-mono">{formatPrice(sellerEarnings)}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 text-[10px] uppercase block">Shipping Fee</span>
                        <span className="font-medium text-zinc-700">{formatPrice(so.shippingAmount)}</span>
                      </div>
                    </div>

                    {/* Tracking details */}
                    {so.trackingNumber && (
                      <div className="flex items-center gap-2 text-xs text-serendip-800 bg-serendip-50 p-2.5 rounded-xl border border-serendip-200">
                        <Truck className="w-4 h-4 text-serendip-700 shrink-0" />
                        <span>Carrier: <strong>{so.carrier || 'Courier'}</strong></span>
                        <span>•</span>
                        <span>Tracking: <strong className="font-mono">{so.trackingNumber}</strong></span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Administrative Status Override Tool */}
          <div className="bg-white rounded-3xl border border-zinc-200/80 p-6 shadow-sm space-y-4 text-xs">
            <h3 className="font-semibold text-zinc-900 text-sm">Administrative Status Override &amp; Audit</h3>
            
            <form onSubmit={handleStatusOverride} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Override Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-serendip-500 font-semibold"
                  >
                    <option value="ORDER_PLACED">Order Placed (PENDING_PAYMENT)</option>
                    <option value="PAYMENT_CONFIRMED">Order Confirmed (PAYMENT_CONFIRMED)</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Administrative Reason *</label>
                  <input
                    type="text"
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="e.g. Customer requested immediate expedited dispatch..."
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-serendip-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold disabled:opacity-50 transition-colors"
              >
                {actionLoading ? 'Saving...' : 'Execute Admin Status Override'}
              </button>
            </form>
          </div>

        </div>

        {/* Right Column: Buyer, Seller, Payment & Commission (1 Col) */}
        <div className="space-y-6 text-xs">
          
          {/* Section B: Buyer Information */}
          <div className="bg-white rounded-3xl border border-zinc-200/80 p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2 font-semibold text-zinc-900 text-sm">
              <User className="w-4 h-4 text-serendip-700" />
              <span>B. Buyer Information</span>
            </div>
            <div className="space-y-2 text-zinc-600">
              <div className="flex justify-between">
                <span>Account ID:</span>
                <span className="font-mono text-zinc-900 font-bold">#{order.buyerId}</span>
              </div>
              <div className="flex justify-between">
                <span>Full Name:</span>
                <span className="font-semibold text-zinc-900">{order.buyerName || 'Buyer'}</span>
              </div>
              <div className="flex justify-between">
                <span>Email:</span>
                <span className="font-medium text-zinc-800">{order.buyerEmail || '—'}</span>
              </div>
              {order.buyerPhone && (
                <div className="flex justify-between">
                  <span>Contact Phone:</span>
                  <span className="font-mono text-zinc-800">{order.buyerPhone}</span>
                </div>
              )}
              <div className="pt-2 border-t border-zinc-100">
                <span className="text-zinc-400 text-[10px] uppercase block mb-1">Delivery Address</span>
                <p className="p-2.5 bg-zinc-50 rounded-xl border border-zinc-200 font-mono text-[11px] leading-relaxed">
                  {order.shippingAddress}
                </p>
              </div>
            </div>
          </div>

          {/* Section C: Seller Details Summary */}
          <div className="bg-white rounded-3xl border border-zinc-200/80 p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2 font-semibold text-zinc-900 text-sm">
              <Store className="w-4 h-4 text-amber-700" />
              <span>C. Seller Information</span>
            </div>
            <div className="space-y-3">
              {order.sellerOrders?.map((so) => (
                <div key={so.id} className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-zinc-900">{so.sellerShopName}</span>
                    {so.sellerId && (
                      <Link
                        to={`/admin/sellers/${so.sellerId}`}
                        className="text-[10px] text-serendip-700 font-semibold hover:underline"
                      >
                        Inspect Merchant &rarr;
                      </Link>
                    )}
                  </div>
                  <div className="flex justify-between text-zinc-500 text-[11px]">
                    <span>Account ID:</span>
                    <span className="font-mono font-bold text-zinc-800">#{so.sellerId}</span>
                  </div>
                  <div className="flex justify-between text-zinc-500 text-[11px]">
                    <span>Email:</span>
                    <span className="font-mono text-zinc-700">{so.sellerEmail || '—'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section D: Payment Information */}
          <div className="bg-white rounded-3xl border border-zinc-200/80 p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2 font-semibold text-zinc-900 text-sm">
              <CreditCard className="w-4 h-4 text-emerald-700" />
              <span>D. Payment Information</span>
            </div>
            <div className="space-y-2 text-zinc-600">
              <div className="flex justify-between">
                <span>Method:</span>
                <span className="font-medium text-zinc-900">{order.paymentMethodName || 'Electronic Transfer'}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="font-bold text-emerald-700 uppercase bg-emerald-50 px-2 py-0.5 rounded text-[10px] border border-emerald-200">
                  {order.payment?.status || 'COMPLETED'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Payment Amount:</span>
                <span className="font-bold text-zinc-900">{formatPrice(order.totalAmount)}</span>
              </div>
              {order.payment?.transactionReference && (
                <div className="flex justify-between">
                  <span>Tx Reference:</span>
                  <span className="font-mono text-[10px] text-zinc-500">{order.payment.transactionReference}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Refund Status:</span>
                <span className="text-zinc-500 text-[11px]">None (Settled)</span>
              </div>
              <p className="text-[10px] text-zinc-400 italic pt-1">
                * PCI-DSS: Full card numbers, CVVs, and raw payment secrets are strictly redacted.
              </p>
            </div>
          </div>

          {/* Section E: Platform Commission & Seller Earnings */}
          <div className="bg-white rounded-3xl border border-amber-200/90 p-6 shadow-sm space-y-3 bg-gradient-to-br from-white to-amber-50/20">
            <div className="flex items-center gap-2 font-semibold text-amber-900 text-sm">
              <Percent className="w-4 h-4 text-amber-700" />
              <span>E. Commission &amp; Earnings</span>
            </div>

            <div className="space-y-2 text-zinc-600">
              <div className="flex justify-between">
                <span>Commissionable Subtotal:</span>
                <span className="font-medium text-zinc-800">{formatPrice(totalSubtotal)}</span>
              </div>
              <div className="flex justify-between text-amber-800 font-bold">
                <span>Platform Commission:</span>
                <span className="font-mono">+{formatPrice(totalCommission)}</span>
              </div>
              <div className="flex justify-between text-emerald-800 font-bold">
                <span>Seller Product Earnings:</span>
                <span className="font-mono">{formatPrice(totalEarnings)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping Fees:</span>
                <span className="font-medium text-zinc-800">{formatPrice(order.shippingAmount)}</span>
              </div>
              <div className="pt-2 border-t border-amber-200 flex justify-between items-center text-sm">
                <span className="font-bold text-zinc-900">Final Order Total:</span>
                <span className="font-bold text-base text-zinc-900">{formatPrice(order.totalAmount)}</span>
              </div>
            </div>

            <p className="text-[10px] text-zinc-400 leading-normal pt-1">
              Formula: Commission = Subtotal &times; Rate. Seller Earnings = Subtotal &minus; Commission. Historical commission rate frozen at checkout.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
