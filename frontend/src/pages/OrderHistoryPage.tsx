import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Calendar, ArrowRight, Truck, AlertCircle, CheckCircle2, X, Star } from 'lucide-react';
import { Order, OrderItem, SellerOrder, Review } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { OrderStatusBadge } from '../components/orders/OrderStatusBadge';

/**
 * Buyer: My Orders page displaying placed consignments, fulfillment statuses, tracking links,
 * and verified reviews for delivered products.
 */
export const OrderHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const { formatPrice } = useCurrency();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Cancel order modal state
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Review modal state for delivered items
  const [reviewingTarget, setReviewingTarget] = useState<{
    item: OrderItem;
    subOrder: SellerOrder;
    order: Order;
  } | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);
  const [reviewModalError, setReviewModalError] = useState<string | null>(null);

  // Track reviewed order items and products for the buyer
  const [reviewedOrderItemIds, setReviewedOrderItemIds] = useState<Set<number>>(new Set());
  const [reviewedProductIds, setReviewedProductIds] = useState<Set<number>>(new Set());

  const loadOrders = async () => {
    if (!user || user.role !== 'BUYER') return;
    try {
      setLoading(true);
      setError(null);
      const [ordersData, reviewsData] = await Promise.all([
        api.getOrdersForBuyer(user.id),
        api.getReviewsForBuyer(user.id).catch(() => [] as Review[]),
      ]);
      setOrders(ordersData);

      const itemIds = new Set<number>();
      const prodIds = new Set<number>();
      reviewsData.forEach((rev) => {
        if (rev.orderItemId) itemIds.add(rev.orderItemId);
        if (rev.productId) prodIds.add(rev.productId);
      });
      setReviewedOrderItemIds(itemIds);
      setReviewedProductIds(prodIds);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch orders';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [user]);

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingOrder) return;
    setActionLoading(true);
    try {
      await api.cancelOrder(cancellingOrder.id, cancelReason);
      setSuccessMsg(`Order ${cancellingOrder.orderNumber} has been successfully cancelled.`);
      setCancellingOrder(null);
      setCancelReason('');
      await loadOrders();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to cancel order';
      setError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const isCancellable = (status: string) => {
    const s = (status || '').toUpperCase();
    return s === 'PENDING_PAYMENT' || s === 'PAID' || s === 'PAYMENT_CONFIRMED' || s === 'ORDER_PLACED' || s === 'PROCESSING';
  };

  const isDelivered = (orderStatus: string, subOrderStatus: string) => {
    const o = (orderStatus || '').toUpperCase();
    const s = (subOrderStatus || '').toUpperCase();
    return o === 'DELIVERED' || o === 'COMPLETED' || s === 'DELIVERED' || s === 'COMPLETED';
  };

  const isItemReviewed = (item: OrderItem) => {
    return (item.id != null && reviewedOrderItemIds.has(item.id)) ||
           (item.productId != null && reviewedProductIds.has(item.productId));
  };

  const handleOpenReviewModal = (item: OrderItem, subOrder: SellerOrder, order: Order) => {
    setReviewingTarget({ item, subOrder, order });
    setReviewRating(5);
    setHoverRating(0);
    setReviewComment('');
    setReviewModalError(null);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingTarget || !user) return;
    if (!reviewComment.trim()) {
      setReviewModalError('Please share your feedback in the review comments.');
      return;
    }

    setSubmittingReview(true);
    setReviewModalError(null);
    try {
      await api.addReview({
        buyerId: user.id,
        orderItemId: reviewingTarget.item.id,
        productId: reviewingTarget.item.productId,
        rating: reviewRating,
        comment: reviewComment.trim(),
      });

      // Mark item as reviewed locally
      if (reviewingTarget.item.id) {
        setReviewedOrderItemIds((prev) => new Set(prev).add(reviewingTarget.item.id));
      }
      if (reviewingTarget.item.productId) {
        setReviewedProductIds((prev) => new Set(prev).add(reviewingTarget.item.productId));
      }

      setSuccessMsg(`Thank you! Your verified review for "${reviewingTarget.item.productName}" has been published.`);
      setReviewingTarget(null);
      setReviewComment('');
      setReviewRating(5);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit review';
      setReviewModalError(msg);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (!user || user.role !== 'BUYER') {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white border border-zinc-200/80 rounded-3xl text-center shadow-premium">
        <h2 className="text-lg font-bold text-zinc-900">Sign In as Buyer</h2>
        <p className="text-xs text-zinc-500 mt-2 mb-4">Please log in to inspect your order history.</p>
        <Link to="/login" className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-semibold">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      
      <div className="border-b border-zinc-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">My Orders</h1>
          <p className="text-xs text-zinc-500 mt-1">Track and view your recent orders.</p>
        </div>
        <Link
          to="/catalog"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-900 text-white text-xs font-semibold rounded-xl hover:bg-zinc-800 transition-colors self-start sm:self-auto"
        >
          <span>Continue Shopping</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-2xl border border-red-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 bg-white rounded-3xl border border-zinc-200 p-6"></div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-zinc-200/80 p-12 text-center max-w-md mx-auto shadow-sm space-y-4">
          <Package className="w-12 h-12 text-zinc-300 mx-auto" />
          <h3 className="font-semibold text-zinc-900">No orders placed yet</h3>
          <p className="text-xs text-zinc-500">Your completed purchases from Sri Lankan merchants will appear here.</p>
          <Link
            to="/catalog"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-semibold"
          >
            Explore Catalog
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-3xl border border-zinc-200/80 p-6 shadow-sm space-y-5">
              
              {/* Order top bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-zinc-900 text-base">{order.orderNumber}</span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <div className="flex items-center gap-3 text-zinc-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(order.createdAt).toLocaleDateString([], {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <span>•</span>
                    <span>Payment: <strong className="text-zinc-700">{order.paymentMethodName || 'Card'}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-auto">
                  <div className="text-right">
                    <span className="text-zinc-400 text-[11px] block">Order Total</span>
                    <span className="font-bold text-lg text-zinc-900">{formatPrice(order.totalAmount)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/orders/${order.id}`}
                      className="px-3.5 py-2 rounded-xl bg-serendip-700 hover:bg-serendip-800 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Track Order</span>
                    </Link>

                    {isCancellable(order.status) && (
                      <button
                        type="button"
                        onClick={() => {
                          setCancellingOrder(order);
                          setCancelReason('');
                        }}
                        className="px-3 py-2 rounded-xl bg-zinc-100 hover:bg-red-50 hover:text-red-700 text-zinc-600 text-xs font-semibold border border-zinc-200 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Sub-orders / Consignments */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  Merchant Consignments ({order.sellerOrders?.length || 0})
                </h4>
                {order.sellerOrders?.map((subOrder) => (
                  <div key={subOrder.id} className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/60 space-y-2.5 text-xs">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-zinc-900">{subOrder.sellerShopName || 'Ceylon Merchant'}</span>
                        <span className="text-zinc-400 text-[10px] ml-2">({subOrder.subOrderNumber || subOrder.orderNumber})</span>
                      </div>
                      <OrderStatusBadge status={subOrder.status} />
                    </div>

                    {subOrder.trackingNumber && (
                      <div className="flex items-center gap-2 text-xs text-serendip-700 font-medium bg-serendip-50/80 px-2.5 py-1.5 rounded-lg border border-serendip-100 w-fit">
                        <Truck className="w-3.5 h-3.5 shrink-0" />
                        <span>Carrier: <strong>{subOrder.carrier || 'Courier'}</strong></span>
                        <span>•</span>
                        <span>Tracking: <strong className="font-mono">{subOrder.trackingNumber}</strong></span>
                      </div>
                    )}

                    <div className="divide-y divide-zinc-200/50 pt-1">
                      {subOrder.items?.map((item) => {
                        const delivered = isDelivered(order.status, subOrder.status);
                        const reviewed = isItemReviewed(item);

                        return (
                          <div key={item.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-zinc-600 text-xs">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <Link
                                  to={`/products/${item.productId}`}
                                  className="font-medium text-zinc-900 hover:text-serendip-600 hover:underline transition-colors"
                                >
                                  {item.productName}
                                </Link>
                                <span className="text-zinc-400">× {item.quantity}</span>
                              </div>
                              <span className="text-[11px] text-zinc-400">
                                Unit: {formatPrice(item.unitPrice)}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 self-end sm:self-auto">
                              <span className="font-semibold text-zinc-900">{formatPrice(item.subtotal)}</span>

                              {/* Review Action based on delivery status */}
                              {delivered ? (
                                reviewed ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px] font-medium">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Reviewed</span>
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenReviewModal(item, subOrder, order)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-semibold transition-all shadow-sm hover:shadow"
                                    title="Write a review for this delivered product"
                                  >
                                    <Star className="w-3.5 h-3.5 fill-white stroke-none" />
                                    <span>Write Review</span>
                                  </button>
                                )
                              ) : (
                                <span className="text-[10px] text-zinc-400 bg-zinc-100/80 px-2 py-0.5 rounded text-center">
                                  Review after delivery
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Review Delivered Product Modal */}
      {reviewingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in duration-200">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-zinc-100">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/60">
                  Delivered Consignment
                </span>
                <h3 className="font-serif text-xl font-bold text-zinc-900 mt-2">
                  Review Product
                </h3>
                <p className="text-xs text-zinc-600 mt-1">
                  <strong className="text-zinc-900">{reviewingTarget.item.productName}</strong>
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Fulfilled by {reviewingTarget.subOrder.sellerShopName || 'Ceylon Merchant'} • Order #{reviewingTarget.order.orderNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setReviewingTarget(null);
                  setReviewModalError(null);
                }}
                className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-xl hover:bg-zinc-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {reviewModalError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2 border border-red-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{reviewModalError}</span>
              </div>
            )}

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              {/* Rating Stars Selector */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Rating <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setReviewRating(star)}
                        className="p-1 text-amber-400 hover:scale-110 transition-transform focus:outline-none"
                      >
                        <Star
                          className={`w-6 h-6 transition-colors ${
                            star <= (hoverRating || reviewRating)
                              ? 'fill-amber-400 stroke-amber-500'
                              : 'stroke-zinc-300 text-transparent'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-zinc-700">
                    {(hoverRating || reviewRating) === 5 ? '5 Stars (Exceptional)' :
                     (hoverRating || reviewRating) === 4 ? '4 Stars (Very Good)' :
                     (hoverRating || reviewRating) === 3 ? '3 Stars (Average)' :
                     (hoverRating || reviewRating) === 2 ? '2 Stars (Poor)' : '1 Star (Disappointed)'}
                  </span>
                </div>
              </div>

              {/* Review Comments */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Review Comments <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  maxLength={2000}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your thoughts on the aroma, authenticity, quality, packaging, and delivery..."
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-zinc-200 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 bg-zinc-50/50"
                />
                <div className="flex justify-between items-center text-[10px] text-zinc-400 mt-1">
                  <span>Verified customer feedback helps Ceylon artisans maintain quality.</span>
                  <span>{reviewComment.length} / 2000</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={submittingReview}
                  onClick={() => {
                    setReviewingTarget(null);
                    setReviewModalError(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-200 text-zinc-600 font-semibold text-xs hover:bg-zinc-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview || !reviewComment.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
                >
                  {submittingReview ? (
                    <span>Submitting...</span>
                  ) : (
                    <>
                      <Star className="w-3.5 h-3.5 fill-white stroke-none" />
                      <span>Submit Review</span>
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
      {cancellingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in duration-200">
            <div>
              <h3 className="font-serif text-xl font-bold text-zinc-900">Cancel Order</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Are you sure you want to cancel order <strong className="font-mono text-zinc-800">{cancellingOrder.orderNumber}</strong>?
              </p>
            </div>

            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Reason for Cancellation (Optional)
                </label>
                <textarea
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Changed my mind, found another product..."
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-serendip-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setCancellingOrder(null)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-200 text-zinc-600 font-semibold text-xs hover:bg-zinc-50"
                >
                  Keep Order
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs disabled:opacity-50"
                >
                  {actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
