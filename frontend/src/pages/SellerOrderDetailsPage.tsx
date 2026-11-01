import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, CreditCard, Package, Truck, CheckCircle2, AlertCircle } from 'lucide-react';
import { SellerOrder } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { OrderStatusBadge } from '../components/orders/OrderStatusBadge';

/**
 * Detailed view for an individual seller sub-order including buyer destination, line items, and audit history.
 */
export const SellerOrderDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();

  const [order, setOrder] = useState<SellerOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Transition form state
  const [targetStatus, setTargetStatus] = useState('');
  const [carrier, setCarrier] = useState('Sri Lanka Post Express');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadSubOrder = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await api.getSellerOrderById(parseInt(id, 10));
      setOrder(data);
      setCarrier(data.carrier || 'Sri Lanka Post Express');
      setTrackingNumber(data.trackingNumber || '');

      const allowed = getAllowedTransitions(data.status);
      setTargetStatus(allowed.length > 0 ? allowed[0].status : '');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load seller order details';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubOrder();
  }, [id]);

  const getAllowedTransitions = (currentStatus: string): { status: string; label: string }[] => {
    const s = (currentStatus || '').toUpperCase();
    switch (s) {
      case 'PENDING_PAYMENT':
      case 'ORDER_PLACED':
        return [
          { status: 'PROCESSING', label: 'Begin Processing' },
          { status: 'CANCELLED', label: 'Cancel Order' },
        ];
      case 'PAID':
      case 'PAYMENT_CONFIRMED':
      case 'ORDER_CONFIRMED':
        return [
          { status: 'PROCESSING', label: 'Move to Processing' },
          { status: 'CANCELLED', label: 'Cancel Order' },
        ];
      case 'PROCESSING':
        return [
          { status: 'SHIPPED', label: 'Mark Shipped' },
          { status: 'CANCELLED', label: 'Cancel Order' },
        ];
      case 'SHIPPED':
        return [
          { status: 'OUT_FOR_DELIVERY', label: 'Mark Out for Delivery' },
          { status: 'DELIVERED', label: 'Mark Delivered' },
        ];
      case 'OUT_FOR_DELIVERY':
        return [
          { status: 'DELIVERED', label: 'Confirm Delivered' },
        ];
      default:
        return [];
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !targetStatus) return;

    if (targetStatus === 'SHIPPED' && !trackingNumber.trim()) {
      setError('A courier tracking number is required to mark this order as Shipped.');
      return;
    }

    setActionLoading(true);
    setError(null);
    try {
      const updated = await api.updateSellerOrderStatus(order.id, {
        newStatus: targetStatus,
        carrier: carrier.trim(),
        trackingNumber: trackingNumber.trim(),
        reason: notes.trim() || undefined,
      });
      setSuccess(`Sub-order status successfully advanced to ${targetStatus}.`);
      setOrder(updated);
      setNotes('');
      const allowed = getAllowedTransitions(updated.status);
      setTargetStatus(allowed.length > 0 ? allowed[0].status : '');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Status update failed';
      setError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  if (!user || user.role !== 'SELLER') {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white border border-zinc-200/80 rounded-3xl text-center shadow-premium">
        <h2 className="text-lg font-bold text-zinc-900">Seller Portal Required</h2>
        <p className="text-xs text-zinc-500 mt-2 mb-4">Please log in to inspect your merchant order.</p>
        <Link to="/login" className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-semibold">
          Sign In
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 space-y-6 animate-pulse">
        <div className="h-8 bg-zinc-200 rounded-xl w-48" />
        <div className="h-64 bg-white rounded-3xl border border-zinc-200" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white border border-zinc-200/80 rounded-3xl text-center shadow-premium space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h3 className="font-semibold text-zinc-900">Consignment Not Found</h3>
        <p className="text-xs text-zinc-500">{error || 'You do not have permission to view this order.'}</p>
        <Link
          to="/seller/orders"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Seller Orders</span>
        </Link>
      </div>
    );
  }

  const allowed = getAllowedTransitions(order.status);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      
      {/* Header */}
      <div className="border-b border-zinc-200 pb-5 space-y-1">
        <Link
          to="/seller/orders"
          className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 font-medium transition-colors mb-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>All Seller Orders</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-zinc-900">
              {order.subOrderNumber || order.orderNumber}
            </h1>
            <OrderStatusBadge status={order.status} />
          </div>
          {order.orderNumber && (
            <span className="text-xs text-zinc-400 font-mono">
              Parent Order: <strong>{order.orderNumber}</strong>
            </span>
          )}
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

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Items and Workflow Controls */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Items Table */}
          <div className="bg-white rounded-3xl border border-zinc-200/80 p-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-zinc-900 text-sm">Ordered Products</h3>
            <div className="divide-y divide-zinc-100 text-xs">
              {order.items?.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0">
                      <Package className="w-4 h-4 text-zinc-500" />
                    </div>
                    <div>
                      <span className="font-semibold text-zinc-900 block">{item.productName}</span>
                      <span className="text-zinc-400 text-[11px]">
                        {item.quantity} units × {formatPrice(item.unitPrice)}
                      </span>
                    </div>
                  </div>
                  <span className="font-bold text-zinc-900">{formatPrice(item.subtotal)}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-zinc-100 flex justify-between items-center text-xs">
              <span className="text-zinc-500">Order Subtotal:</span>
              <span className="font-bold text-base text-zinc-900">{formatPrice(order.subtotalAmount)}</span>
            </div>
          </div>

          {/* Status Update Workflow Form */}
          {allowed.length > 0 ? (
            <div className="bg-white rounded-3xl border border-zinc-200/80 p-6 shadow-sm space-y-4 text-xs">
              <h3 className="font-semibold text-zinc-900 text-sm">Update Workflow Status</h3>
              
              <form onSubmit={handleUpdateStatus} className="space-y-4">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Advance Status To:</label>
                  <select
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-serendip-500 text-xs font-semibold"
                  >
                    {allowed.map((t) => (
                      <option key={t.status} value={t.status}>
                        {t.label} ({t.status})
                      </option>
                    ))}
                  </select>
                </div>

                {(targetStatus === 'SHIPPED' || targetStatus === 'OUT_FOR_DELIVERY') && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-serendip-50/70 border border-serendip-200 rounded-2xl">
                    <div>
                      <label className="block font-semibold text-zinc-700 mb-1">Carrier Name</label>
                      <input
                        type="text"
                        value={carrier}
                        onChange={(e) => setCarrier(e.target.value)}
                        placeholder="e.g. Sri Lanka Post Express"
                        className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-zinc-700 mb-1">Tracking Number</label>
                      <input
                        type="text"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="e.g. SLP-8921-LK"
                        className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-mono"
                        required
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Audit Transition Reason (Optional)</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Dispatched to courier hub in Colombo..."
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionLoading || !targetStatus}
                  className="w-full py-2.5 rounded-xl bg-serendip-700 hover:bg-serendip-800 text-white font-semibold disabled:opacity-50 transition-colors"
                >
                  {actionLoading ? 'Updating Status...' : 'Apply Status Transition'}
                </button>
              </form>
            </div>
          ) : (
            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs text-zinc-500 text-center">
              This sub-order is in terminal status <strong>{order.status}</strong>. No further status changes permitted.
            </div>
          )}

          {/* Status History Timeline */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <div className="bg-white rounded-3xl border border-zinc-200/80 p-6 shadow-sm space-y-4 text-xs">
              <h3 className="font-semibold text-zinc-900 text-sm">Status Update Audit Log</h3>
              <div className="space-y-3">
                {order.statusHistory.map((h) => (
                  <div key={h.id} className="p-3 bg-zinc-50 border border-zinc-200/70 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-900">{h.newStatus}</span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {new Date(h.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      Changed by: <strong className="text-zinc-700">{h.changedByName || 'System'}</strong> ({h.changedByRole})
                    </div>
                    {h.comments && <p className="text-zinc-600 text-[11px] pt-0.5">{h.comments}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Buyer & Consignment Details */}
        <div className="space-y-6 text-xs">
          
          {/* Buyer Details */}
          <div className="bg-white rounded-3xl border border-zinc-200/80 p-6 shadow-sm space-y-3">
            <h3 className="font-semibold text-zinc-900 text-sm">Buyer Details</h3>
            <div className="space-y-2 text-zinc-600">
              <div className="flex justify-between">
                <span>Customer Name:</span>
                <span className="font-semibold text-zinc-900">{order.buyerName || 'Verified Buyer'}</span>
              </div>
              <div className="flex justify-between">
                <span>Customer Email:</span>
                <span className="font-medium text-zinc-800">{order.buyerEmail || '—'}</span>
              </div>
              {order.buyerPhone && (
                <div className="flex justify-between">
                  <span>Contact Number:</span>
                  <span className="font-mono text-zinc-800">{order.buyerPhone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-white rounded-3xl border border-zinc-200/80 p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2 font-semibold text-zinc-900 text-sm">
              <MapPin className="w-4 h-4 text-serendip-700" />
              <span>Fulfillment Destination</span>
            </div>
            <p className="text-zinc-700 bg-zinc-50 p-3 rounded-xl border border-zinc-200/60 font-mono text-[11px] leading-relaxed">
              {order.shippingAddress || 'Customer shipping address'}
            </p>
          </div>

          {/* Carrier & Tracking */}
          {order.trackingNumber && (
            <div className="bg-white rounded-3xl border border-zinc-200/80 p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-2 font-semibold text-zinc-900 text-sm">
                <Truck className="w-4 h-4 text-serendip-700" />
                <span>Consignment Tracking</span>
              </div>
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Carrier:</span>
                  <span className="font-semibold text-zinc-900">{order.carrier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Tracking Code:</span>
                  <span className="font-mono font-bold text-serendip-700">{order.trackingNumber}</span>
                </div>
              </div>
            </div>
          )}

          {/* Payment Status */}
          <div className="bg-white rounded-3xl border border-zinc-200/80 p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2 font-semibold text-zinc-900 text-sm">
              <CreditCard className="w-4 h-4 text-emerald-700" />
              <span>Payment Information</span>
            </div>
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between">
                <span className="text-zinc-500">Payment Gateway:</span>
                <span className="font-medium text-zinc-900">{order.paymentMethodName || 'Electronic Transfer'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Status:</span>
                <span className="font-semibold text-emerald-700 uppercase bg-emerald-50 px-2 py-0.5 rounded text-[10px] border border-emerald-200">
                  {order.paymentStatus || 'PAID'}
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
