import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, CreditCard, ShieldCheck, Truck, Package, Copy, Check, AlertCircle, CheckCircle2, Star, X } from 'lucide-react';
import { Order, OrderItem, SellerOrder } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { OrderStatusBadge } from '../components/orders/OrderStatusBadge';
import { OrderTimeline } from '../components/orders/OrderTimeline';

/**
 * Detailed order tracking page showing status progression timeline, consignments, delivery details,
 * and review submission for delivered products.
 */
export const OrderTrackingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedTracking, setCopiedTracking] = useState<string | null>(null);

  // Cancellation state
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

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

  // Track reviewed items and products
  const [reviewedOrderItemIds, setReviewedOrderItemIds] = useState<Set<number>>(new Set());
  const [reviewedProductIds, setReviewedProductIds] = useState<Set<number>>(new Set());

  const loadOrder = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await api.getOrderById(parseInt(id, 10));
      setOrder(data);

      if (user?.id) {
        try {
          const reviewsData = await api.getReviewsForBuyer(user.id);
          const itemIds = new Set<number>();
          const prodIds = new Set<number>();
          reviewsData.forEach((rev) => {
            if (rev.orderItemId) itemIds.add(rev.orderItemId);
            if (rev.productId) prodIds.add(rev.productId);
          });
          setReviewedOrderItemIds(itemIds);
          setReviewedProductIds(prodIds);
        } catch {
          // Ignore review fetch error
        }
      }
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

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTracking(text);
    setTimeout(() => setCopiedTracking(null), 2000);
  };

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setCancelLoading(true);
    try {
      await api.cancelOrder(order.id, cancelReason);
      setCancelling(false);
      await loadOrder();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Cancellation failed';
      setError(msg);
    } finally {
      setCancelLoading(false);
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

  const handleOpenReviewModal = (item: OrderItem, subOrder: SellerOrder, ord: Order) => {
    setReviewingTarget({ item, subOrder, order: ord });
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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 space-y-6 animate-pulse">
        <div className="h-8 bg-zinc-200 rounded-xl w-48" />
        <div className="h-64 bg-white rounded-3xl border border-zinc-200" />
        <div className="h-64 bg-white rounded-3xl border border-zinc-200" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white border border-zinc-200/80 rounded-3xl text-center shadow-premium space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h3 className="font-semibold text-zinc-900">Order Not Found</h3>
        <p className="text-xs text-zinc-500">{error || 'Unable to locate consignment details.'}</p>
        <Link
          to="/orders"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to My Orders</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-200">
        <div className="space-y-1">
          <Link
            to="/orders"
            className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 font-medium transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>My Orders</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-zinc-900">
              Order {order.orderNumber}
            </h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Placed on {new Date(order.createdAt).toLocaleDateString([], {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>

        {isCancellable(order.status) && (
          <button
            type="button"
            onClick={() => setCancelling(true)}
            className="px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold self-start sm:self-auto transition-colors"
          >
            Cancel Order
          </button>
        )}
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

      {/* Visual Tracking Timeline */}
      <OrderTimeline currentStatus={order.status} history={order.statusHistory} />

      {/* Two Column Layout: Consignment Items & Order Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left: Consignments & Ordered Products (2 Cols) */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-zinc-200/80 p-6 shadow-sm space-y-5">
            <h3 className="font-semibold text-zinc-900 text-sm">Ordered Ceylon Commodities</h3>

            <div className="space-y-5">
              {order.sellerOrders?.map((subOrder) => (
                <div key={subOrder.id} className="p-5 rounded-2xl bg-zinc-50/80 border border-zinc-200/60 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-zinc-200/60 text-xs">
                    <div>
                      <span className="font-bold text-zinc-900 text-sm">{subOrder.sellerShopName || 'Ceylon Merchant'}</span>
                      <span className="text-zinc-400 text-[10px] ml-2 block sm:inline">Ref: {subOrder.subOrderNumber || subOrder.orderNumber}</span>
                    </div>
                    <OrderStatusBadge status={subOrder.status} />
                  </div>

                  {/* Shipping Carrier & Tracking Number */}
                  {subOrder.trackingNumber && (
                    <div className="flex items-center justify-between p-2.5 bg-serendip-50/70 border border-serendip-200 rounded-xl text-xs">
                      <div className="flex items-center gap-2 text-serendip-900">
                        <Truck className="w-4 h-4 text-serendip-700 shrink-0" />
                        <span>Carrier: <strong>{subOrder.carrier || 'Express Courier'}</strong></span>
                        <span className="text-serendip-400">•</span>
                        <span>Tracking: <strong className="font-mono">{subOrder.trackingNumber}</strong></span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(subOrder.trackingNumber!)}
                        className="p-1 text-serendip-700 hover:text-serendip-900 rounded"
                        title="Copy tracking number"
                      >
                        {copiedTracking === subOrder.trackingNumber ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}

                  {/* Line Items */}
                  <div className="divide-y divide-zinc-200/50">
                    {subOrder.items?.map((item) => {
                      const delivered = isDelivered(order.status, subOrder.status);
                      const reviewed = isItemReviewed(item);

                      return (
                        <div key={item.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0">
                              <Package className="w-4 h-4 text-zinc-400" />
                            </div>
                            <div>
                              <Link
                                to={`/products/${item.productId}`}
                                className="font-semibold text-zinc-900 hover:text-serendip-600 hover:underline block"
                              >
                                {item.productName}
                              </Link>
                              <span className="text-zinc-400 text-[11px]">
                                Quantity: {item.quantity} × {formatPrice(item.unitPrice)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 self-end sm:self-auto">
                            <span className="font-bold text-zinc-900">{formatPrice(item.subtotal)}</span>

                            {/* Delivered Review Trigger */}
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
        </div>

        {/* Right: Payment & Delivery Summary (1 Col) */}
        <div className="space-y-6">
          
          {/* Delivery Address */}
          <div className="bg-white rounded-3xl border border-zinc-200/80 p-6 shadow-sm space-y-3 text-xs">
            <div className="flex items-center gap-2 font-semibold text-zinc-900">
              <MapPin className="w-4 h-4 text-serendip-700" />
              <span>Consignment Destination</span>
            </div>
            <p className="text-zinc-600 leading-relaxed bg-zinc-50 p-3 rounded-xl border border-zinc-200/60 font-mono text-[11px]">
              {order.shippingAddress || 'Standard International Delivery Address'}
            </p>
          </div>

          {/* Payment Information */}
          <div className="bg-white rounded-3xl border border-zinc-200/80 p-6 shadow-sm space-y-3 text-xs">
            <div className="flex items-center gap-2 font-semibold text-zinc-900">
              <CreditCard className="w-4 h-4 text-emerald-700" />
              <span>Payment Details</span>
            </div>
            
            <div className="space-y-2 pt-1 text-zinc-600">
              <div className="flex justify-between">
                <span>Method:</span>
                <span className="font-medium text-zinc-900">{order.paymentMethodName || 'Electronic Gateway'}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Status:</span>
                <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] border border-emerald-200">
                  {order.payment?.status || 'COMPLETED'}
                </span>
              </div>
              {order.payment?.transactionReference && (
                <div className="flex justify-between">
                  <span>Reference:</span>
                  <span className="font-mono text-[10px] text-zinc-500">{order.payment.transactionReference}</span>
                </div>
              )}
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="bg-white rounded-3xl border border-zinc-200/80 p-6 shadow-sm space-y-3 text-xs">
            <div className="flex items-center gap-2 font-semibold text-zinc-900">
              <ShieldCheck className="w-4 h-4 text-serendip-700" />
              <span>Financial Summary</span>
            </div>

            <div className="space-y-2 pt-1 text-zinc-600">
              <div className="flex justify-between">
                <span>Items Subtotal:</span>
                <span className="font-medium text-zinc-800">{formatPrice(order.subtotalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Export Logistics &amp; Shipping:</span>
                <span className="font-medium text-zinc-800">{formatPrice(order.shippingAmount)}</span>
              </div>
              {order.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span>Duty &amp; Taxes:</span>
                  <span className="font-medium text-zinc-800">{formatPrice(order.taxAmount)}</span>
                </div>
              )}
              <div className="pt-2.5 border-t border-zinc-100 flex justify-between items-center text-sm">
                <span className="font-bold text-zinc-900">Final Total:</span>
                <span className="font-bold text-base text-zinc-900">{formatPrice(order.totalAmount)}</span>
              </div>
            </div>
          </div>

        </div>

      </div>

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

            <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
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

      {/* Cancel Order Modal */}
      {cancelling && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in duration-200">
            <div>
              <h3 className="font-serif text-xl font-bold text-zinc-900">Cancel Order</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Are you sure you want to cancel order <strong className="font-mono text-zinc-800">{order.orderNumber}</strong>?
              </p>
            </div>

            <form onSubmit={handleCancel} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">
                  Cancellation Reason (Optional)
                </label>
                <textarea
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Changed destination address or ordered wrong item..."
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-serendip-500 text-xs"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={cancelLoading}
                  onClick={() => setCancelling(false)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-200 text-zinc-600 font-semibold hover:bg-zinc-50"
                >
                  Keep Order
                </button>
                <button
                  type="submit"
                  disabled={cancelLoading}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-50"
                >
                  {cancelLoading ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
