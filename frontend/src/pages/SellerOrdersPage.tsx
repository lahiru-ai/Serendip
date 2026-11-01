import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Search, Eye, RefreshCw, CheckCircle2, AlertCircle, Calendar, X } from 'lucide-react';
import { SellerOrder } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { OrderStatusBadge } from '../components/orders/OrderStatusBadge';

/**
 * Seller order management page allowing merchants to view consignments, update fulfillment, and record tracking.
 */
export const SellerOrdersPage: React.FC = () => {
  const { user } = useAuth();
  const { formatPrice } = useCurrency();

  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Status update modal state
  const [updatingOrder, setUpdatingOrder] = useState<SellerOrder | null>(null);
  const [targetStatus, setTargetStatus] = useState('');
  const [carrier, setCarrier] = useState('Sri Lanka Post Express');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [updateReason, setUpdateReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadSellerOrders = async () => {
    if (!user || user.role !== 'SELLER') return;
    try {
      setLoading(true);
      setError(null);
      const data = await api.getOrdersForSeller(user.id);
      setOrders(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load seller orders';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSellerOrders();
  }, [user]);

  // Determine allowed workflow transitions based on current status
  const getAllowedTransitions = (currentStatus: string): { status: string; label: string }[] => {
    const s = (currentStatus || '').toUpperCase();
    switch (s) {
      case 'PENDING_PAYMENT':
      case 'ORDER_PLACED':
        return [
          { status: 'PROCESSING', label: 'Start Processing' },
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
          { status: 'SHIPPED', label: 'Mark as Shipped' },
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
        return []; // Terminal states
    }
  };

  const handleOpenUpdateModal = (order: SellerOrder) => {
    setUpdatingOrder(order);
    const transitions = getAllowedTransitions(order.status);
    setTargetStatus(transitions.length > 0 ? transitions[0].status : '');
    setCarrier(order.carrier || 'Sri Lanka Post Express');
    setTrackingNumber(order.trackingNumber || '');
    setUpdateReason('');
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatingOrder || !targetStatus) return;

    if (targetStatus === 'SHIPPED' && !trackingNumber.trim()) {
      setError('Please provide a tracking number before marking order as Shipped.');
      return;
    }

    setActionLoading(true);
    setError(null);
    try {
      await api.updateSellerOrderStatus(updatingOrder.id, {
        newStatus: targetStatus,
        carrier: carrier.trim(),
        trackingNumber: trackingNumber.trim(),
        reason: updateReason.trim() || undefined,
      });

      setSuccess(`Order ${updatingOrder.subOrderNumber || updatingOrder.orderNumber} status updated to ${targetStatus}.`);
      setUpdatingOrder(null);
      await loadSellerOrders();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update order status';
      setError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  if (!user || user.role !== 'SELLER') {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white border border-zinc-200/80 rounded-3xl text-center shadow-premium">
        <h2 className="text-lg font-bold text-zinc-900">Seller Portal Required</h2>
        <p className="text-xs text-zinc-500 mt-2 mb-4">Please log in with your merchant credentials.</p>
        <Link to="/login" className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-semibold">
          Sign In
        </Link>
      </div>
    );
  }

  // Filter and search orders
  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== 'ALL') {
      const s = o.status.toUpperCase();
      if (statusFilter === 'PENDING' && !['PENDING_PAYMENT', 'ORDER_PLACED', 'PAID', 'PAYMENT_CONFIRMED', 'ORDER_CONFIRMED'].includes(s)) return false;
      if (statusFilter === 'PROCESSING' && s !== 'PROCESSING') return false;
      if (statusFilter === 'SHIPPED' && !['SHIPPED', 'OUT_FOR_DELIVERY'].includes(s)) return false;
      if (statusFilter === 'DELIVERED' && !['DELIVERED', 'COMPLETED'].includes(s)) return false;
      if (statusFilter === 'CANCELLED' && s !== 'CANCELLED') return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchNum = (o.subOrderNumber || o.orderNumber || '').toLowerCase().includes(q);
      const matchBuyer = (o.buyerName || '').toLowerCase().includes(q) || (o.buyerEmail || '').toLowerCase().includes(q);
      const matchItem = o.items?.some((i) => (i.productName || '').toLowerCase().includes(q));
      return matchNum || matchBuyer || matchItem;
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      
      {/* Header */}
      <div className="border-b border-zinc-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-serendip-700 text-xs font-bold uppercase tracking-wider">
            <Package className="w-4 h-4" />
            <span>Merchant Fulfillment Portal</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-zinc-900 mt-1">Order Management</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Process consignments, update dispatch workflows, and monitor deliveries for your shop.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadSellerOrders}
            className="p-2 text-zinc-500 hover:text-zinc-900 rounded-xl border border-zinc-200 bg-white"
            title="Refresh Orders"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            to="/seller/dashboard"
            className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-semibold hover:bg-zinc-800"
          >
            Dashboard
          </Link>
        </div>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-3xl border border-zinc-200/80 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
            {[
              { id: 'ALL', label: 'All Orders' },
              { id: 'PENDING', label: 'Confirmed / Pending' },
              { id: 'PROCESSING', label: 'Processing' },
              { id: 'SHIPPED', label: 'In Transit' },
              { id: 'DELIVERED', label: 'Delivered' },
              { id: 'CANCELLED', label: 'Cancelled' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  statusFilter === tab.id
                    ? 'bg-zinc-900 text-white shadow-sm'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order, buyer, product..."
              className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:outline-none focus:border-serendip-500"
            />
          </div>

        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-zinc-400">Loading merchant consignments...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Package className="w-10 h-10 text-zinc-300 mx-auto" />
            <p className="text-xs text-zinc-500 font-medium">No seller orders match your filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/70 text-zinc-500 text-[11px] uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Order Number</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Buyer Details</th>
                  <th className="py-3.5 px-4">Commodities &amp; Qty</th>
                  <th className="py-3.5 px-4">Subtotal</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4">Order Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-700">
                {filteredOrders.map((so) => {
                  const allowed = getAllowedTransitions(so.status);
                  const totalUnits = so.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

                  return (
                    <tr key={so.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-zinc-900 block">{so.subOrderNumber || so.orderNumber}</span>
                        {so.orderNumber && so.subOrderNumber && (
                          <span className="text-[10px] text-zinc-400 block font-mono">Parent: {so.orderNumber}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-zinc-500 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{new Date(so.createdAt || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-zinc-900 block">{so.buyerName || 'Verified Customer'}</span>
                        <span className="text-zinc-400 text-[10px] block">{so.buyerEmail || '—'}</span>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <span className="font-medium text-zinc-900 block truncate">
                          {so.items?.map((i) => i.productName).join(', ') || 'Commodities'}
                        </span>
                        <span className="text-[10px] text-zinc-400 block">{totalUnits} unit(s) total</span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-bold text-zinc-900 block">{formatPrice(so.subtotalAmount)}</span>
                        <span className="text-[10px] text-zinc-400">+ {formatPrice(so.shippingAmount)} shipping</span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-medium text-zinc-800 block">{so.paymentMethodName || 'Gateway'}</span>
                        <span className="text-[10px] text-emerald-700 font-semibold uppercase">{so.paymentStatus || 'PAID'}</span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <OrderStatusBadge status={so.status} />
                        {so.trackingNumber && (
                          <span className="text-[10px] text-serendip-700 font-mono block mt-0.5">
                            {so.carrier}: {so.trackingNumber}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {allowed.length > 0 && (
                            <button
                              type="button"
                              onClick={() => handleOpenUpdateModal(so)}
                              className="px-2.5 py-1.5 bg-serendip-700 hover:bg-serendip-800 text-white font-semibold rounded-lg text-xs transition-colors"
                            >
                              Update Status
                            </button>
                          )}
                          <Link
                            to={`/seller/orders/${so.id}`}
                            className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100 transition-colors"
                            title="Inspect Consignment"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Workflow Transition Modal */}
      {updatingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in duration-200">
            <div>
              <h3 className="font-serif text-xl font-bold text-zinc-900">Update Consignment Status</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Sub-Order <strong className="font-mono text-zinc-800">{updatingOrder.subOrderNumber || updatingOrder.orderNumber}</strong> • Current Status: <strong className="text-zinc-900">{updatingOrder.status}</strong>
              </p>
            </div>

            <form onSubmit={handleStatusSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Target Workflow Status</label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-serendip-500 text-xs font-semibold"
                >
                  {getAllowedTransitions(updatingOrder.status).map((t) => (
                    <option key={t.status} value={t.status}>
                      {t.label} ({t.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Show carrier & tracking input if transitioning to SHIPPED or OUT_FOR_DELIVERY */}
              {(targetStatus === 'SHIPPED' || targetStatus === 'OUT_FOR_DELIVERY') && (
                <div className="space-y-3 p-4 bg-serendip-50/60 border border-serendip-200/80 rounded-2xl">
                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">Courier / Carrier</label>
                    <input
                      type="text"
                      value={carrier}
                      onChange={(e) => setCarrier(e.target.value)}
                      placeholder="e.g. Sri Lanka Post, DHL Express, FedEx"
                      className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">Consignment Tracking Number</label>
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="e.g. SLP-9842104-LK"
                      className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-mono"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Status Update Note (Optional)</label>
                <textarea
                  rows={2}
                  value={updateReason}
                  onChange={(e) => setUpdateReason(e.target.value)}
                  placeholder="e.g. Packaged in sealed export carton and handed to courier..."
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-serendip-500 text-xs"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setUpdatingOrder(null)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-200 text-zinc-600 font-semibold hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !targetStatus}
                  className="flex-1 py-2.5 rounded-xl bg-serendip-700 hover:bg-serendip-800 text-white font-semibold disabled:opacity-50"
                >
                  {actionLoading ? 'Updating...' : 'Save Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
