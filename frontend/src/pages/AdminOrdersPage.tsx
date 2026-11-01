import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Search,
  Download,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  X,
  FileSpreadsheet,
  Trash2
} from 'lucide-react';
import { Order } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { OrderStatusBadge } from '../components/orders/OrderStatusBadge';

interface FlattenedOrderItemRow {
  orderId: number;
  orderNumber: string;
  orderDate: string;
  buyerName: string;
  buyerEmail: string;
  sellerId?: number;
  sellerName: string;
  sellerEmail: string;
  productName: string;
  productQuantity: number;
  productPrice: number;
  orderTotal: number;
  commissionRate: number;
  commissionAmount: number;
  sellerEarnings: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  subOrderId?: number;
}

/**
 * Admin: Complete Order Management Panel with line-item table, commission analytics, search, and CSV export.
 */
export const AdminOrdersPage: React.FC = () => {
  const { user } = useAuth();
  const { formatPrice } = useCurrency();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [exporting, setExporting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Status override modal state
  const [overrideOrder, setOverrideOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState('PROCESSING');
  const [overrideReason, setOverrideReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadAllOrders = async () => {
    if (!user || user.role !== 'ADMIN') return;
    try {
      setLoading(true);
      setError(null);
      const data = await api.getAllOrdersAdmin();
      setOrders(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch platform orders';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllOrders();
  }, [user]);

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const blob = await api.exportOrdersCsv();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `serendip-marketplace-orders-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setSuccess('Marketplace orders exported to CSV successfully.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'CSV export failed';
      setError(msg);
    } finally {
      setExporting(false);
    }
  };

  const handleStatusOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideOrder || !newStatus) return;
    if (!overrideReason.trim()) {
      setError('Please provide an administrative reason for overriding the order status.');
      return;
    }

    setActionLoading(true);
    setError(null);
    try {
      await api.adminUpdateOrderStatus(overrideOrder.id, {
        newStatus,
        reason: overrideReason.trim(),
      });
      setSuccess(`Order ${overrideOrder.orderNumber} status updated to ${newStatus}.`);
      setOverrideOrder(null);
      await loadAllOrders();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Administrative update failed';
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

  // Flatten orders into line-item rows matching the required columns
  const tableRows: FlattenedOrderItemRow[] = [];
  for (const o of orders) {
    for (const so of o.sellerOrders || []) {
      const commRate = so.commissionRate != null ? so.commissionRate : 10.0;
      const commAmt = so.commissionAmount != null ? so.commissionAmount : 0;
      const sellerEarnings = so.subtotalAmount - commAmt;

      for (const item of so.items || []) {
        tableRows.push({
          orderId: o.id,
          orderNumber: o.orderNumber,
          orderDate: o.createdAt,
          buyerName: o.buyerName || 'Customer',
          buyerEmail: o.buyerEmail || '—',
          sellerId: so.sellerId,
          sellerName: so.sellerShopName || 'Merchant',
          sellerEmail: so.sellerEmail || '—',
          productName: item.productName,
          productQuantity: item.quantity,
          productPrice: item.unitPrice,
          orderTotal: o.totalAmount,
          commissionRate: commRate,
          commissionAmount: commAmt,
          sellerEarnings: sellerEarnings,
          paymentMethod: o.paymentMethodName || 'Card',
          paymentStatus: o.payment?.status || 'PAID',
          orderStatus: so.status || o.status,
          subOrderId: so.id,
        });
      }
    }
  }

  // Filter rows
  const filteredRows = tableRows.filter((r) => {
    if (statusFilter !== 'ALL') {
      if (r.orderStatus.toUpperCase() !== statusFilter.toUpperCase()) {
        return false;
      }
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const mNum = r.orderNumber.toLowerCase().includes(q);
      const mBuyer = r.buyerName.toLowerCase().includes(q) || r.buyerEmail.toLowerCase().includes(q);
      const mSeller = r.sellerName.toLowerCase().includes(q) || r.sellerEmail.toLowerCase().includes(q);
      const mProduct = r.productName.toLowerCase().includes(q);
      return mNum || mBuyer || mSeller || mProduct;
    }
    return true;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const paginatedRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleClearAllOrders = async () => {
    if (!window.confirm('Are you sure you want to delete all demo orders? This will permanently wipe platform orders.')) {
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await api.clearAllOrders();
      setSuccess(`${res.message} (${res.deletedCount} orders cleared)`);
      await loadAllOrders();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to clear orders';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Platform overview stats
  const totalVolume = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalCommissions = tableRows.reduce((sum, r) => sum + r.commissionAmount, 0);

  return (
    <div className="max-w-[98%] mx-auto px-4 sm:px-6 py-10 space-y-8">
      
      {/* Header */}
      <div className="border-b border-zinc-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-ceylon-ruby text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Platform Governance Center</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-zinc-900 mt-1">Order Management</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Cross-vendor transaction governance, commission auditing, and administrative fulfillment controls.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadAllOrders}
            className="p-2 text-zinc-500 hover:text-zinc-900 rounded-xl border border-zinc-200 bg-white"
            title="Refresh List"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            disabled={exporting}
            onClick={handleExportCsv}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{exporting ? 'Exporting...' : 'Export to CSV'}</span>
          </button>

          <button
            type="button"
            onClick={handleClearAllOrders}
            className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Clear all demo orders"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Demo Orders</span>
          </button>

          <Link
            to="/admin/dashboard"
            className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-semibold hover:bg-zinc-800"
          >
            Admin Center
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

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-sm">
          <span className="text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">Total Platform Orders</span>
          <p className="text-2xl font-bold text-zinc-900 mt-1">{orders.length}</p>
          <span className="text-zinc-500 text-[11px] block mt-0.5">{tableRows.length} distinct item line(s)</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-sm">
          <span className="text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">Gross Marketplace Sales</span>
          <p className="text-2xl font-bold text-zinc-900 mt-1">{formatPrice(totalVolume)}</p>
          <span className="text-emerald-700 text-[11px] block mt-0.5">Customer payments settled</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-sm bg-gradient-to-br from-white to-amber-50/20">
          <span className="text-amber-800 font-semibold uppercase tracking-wider text-[10px]">Total Platform Commissions</span>
          <p className="text-2xl font-bold text-amber-700 mt-1 font-mono">{formatPrice(totalCommissions)}</p>
          <span className="text-amber-600 text-[11px] block mt-0.5">Admin earnings retained</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-sm">
          <span className="text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">Seller Net Earnings</span>
          <p className="text-2xl font-bold text-zinc-900 mt-1 font-mono">
            {formatPrice(Math.max(0, totalVolume - totalCommissions))}
          </p>
          <span className="text-zinc-500 text-[11px] block mt-0.5">Payout due to merchants</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-3xl border border-zinc-200/80 p-5 shadow-sm space-y-4 text-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Status Filter Tabs */}
          <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
            {[
              { id: 'ALL', label: 'All Statuses' },
              { id: 'PENDING_PAYMENT', label: 'Placed' },
              { id: 'PAYMENT_CONFIRMED', label: 'Confirmed' },
              { id: 'PROCESSING', label: 'Processing' },
              { id: 'SHIPPED', label: 'Shipped' },
              { id: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
              { id: 'DELIVERED', label: 'Delivered' },
              { id: 'CANCELLED', label: 'Cancelled' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.id);
                  setCurrentPage(1);
                }}
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
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search order #, buyer, seller, product..."
              className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:outline-none focus:border-serendip-500"
            />
          </div>

        </div>
      </div>

      {/* Complete Order Management Table */}
      <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-xs text-zinc-400 animate-pulse">Loading platform order records...</div>
        ) : filteredRows.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <FileSpreadsheet className="w-10 h-10 text-zinc-300 mx-auto" />
            <p className="text-xs text-zinc-500 font-medium">No order items match the selected filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/80 text-zinc-500 text-[10px] uppercase tracking-wider font-semibold whitespace-nowrap">
                  <th className="py-3 px-3">Order Number</th>
                  <th className="py-3 px-3">Order Date</th>
                  <th className="py-3 px-3">Buyer Name</th>
                  <th className="py-3 px-3">Buyer Email</th>
                  <th className="py-3 px-3">Seller Name</th>
                  <th className="py-3 px-3">Seller Email</th>
                  <th className="py-3 px-3">Product Name</th>
                  <th className="py-3 px-3 text-center">Qty</th>
                  <th className="py-3 px-3 text-right">Price</th>
                  <th className="py-3 px-3 text-right">Order Total</th>
                  <th className="py-3 px-3 text-right text-amber-700 bg-amber-50/40">Comm Rate</th>
                  <th className="py-3 px-3 text-right text-amber-700 bg-amber-50/40">Comm Amount</th>
                  <th className="py-3 px-3 text-right">Seller Earnings</th>
                  <th className="py-3 px-3">Payment Method</th>
                  <th className="py-3 px-3">Payment Status</th>
                  <th className="py-3 px-3">Order Status</th>
                  <th className="py-3 px-3 text-right sticky right-0 bg-zinc-50/90 shadow-l">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-700">
                {paginatedRows.map((r, i) => (
                  <tr key={`${r.orderId}-${r.productName}-${i}`} className="hover:bg-zinc-50/60 transition-colors whitespace-nowrap">
                    <td className="py-3 px-3 font-mono font-bold text-zinc-900">
                      <Link to={`/admin/orders/${r.orderId}`} className="hover:underline text-serendip-800">
                        {r.orderNumber}
                      </Link>
                    </td>

                    <td className="py-3 px-3 text-zinc-500">
                      {new Date(r.orderDate).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>

                    <td className="py-3 px-3 font-medium text-zinc-900">{r.buyerName}</td>
                    <td className="py-3 px-3 text-zinc-400 font-mono text-[11px]">{r.buyerEmail}</td>

                    <td className="py-3 px-3 font-semibold text-zinc-800">
                      {r.sellerId ? (
                        <Link to={`/admin/sellers/${r.sellerId}`} className="hover:underline text-serendip-800">
                          {r.sellerName}
                        </Link>
                      ) : (
                        r.sellerName
                      )}
                    </td>
                    <td className="py-3 px-3 text-zinc-400 font-mono text-[11px]">{r.sellerEmail}</td>

                    <td className="py-3 px-3 font-medium text-zinc-900 max-w-xs truncate" title={r.productName}>
                      {r.productName}
                    </td>

                    <td className="py-3 px-3 text-center font-bold text-zinc-900">{r.productQuantity}</td>
                    <td className="py-3 px-3 text-right font-mono text-zinc-800">{formatPrice(r.productPrice)}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-zinc-900">{formatPrice(r.orderTotal)}</td>

                    {/* Admin Confidential Commission Columns */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-amber-700 bg-amber-50/30">
                      {r.commissionRate.toFixed(1)}%
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-amber-700 bg-amber-50/30">
                      {formatPrice(r.commissionAmount)}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-800">
                      {formatPrice(r.sellerEarnings)}
                    </td>

                    <td className="py-3 px-3 font-medium text-zinc-700">{r.paymentMethod}</td>
                    <td className="py-3 px-3 font-bold text-emerald-700 uppercase text-[10px]">{r.paymentStatus}</td>
                    <td className="py-3 px-3">
                      <OrderStatusBadge status={r.orderStatus} />
                    </td>

                    <td className="py-3 px-3 text-right sticky right-0 bg-white/95 shadow-l">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/admin/orders/${r.orderId}`}
                          className="p-1 text-zinc-500 hover:text-zinc-900 rounded hover:bg-zinc-100"
                          title="Inspect Order Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            const found = orders.find((o) => o.id === r.orderId);
                            if (found) setOverrideOrder(found);
                          }}
                          className="px-2 py-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[10px] font-semibold"
                        >
                          Override
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
            <span>
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(filteredRows.length, currentPage * pageSize)} of{' '}
              {filteredRows.length} item(s)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-zinc-900">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Admin Status Override Modal */}
      {overrideOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in duration-200">
            <div>
              <h3 className="font-serif text-xl font-bold text-zinc-900">Admin Status Override</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Order <strong className="font-mono text-zinc-800">{overrideOrder.orderNumber}</strong> • Current Status: <strong>{overrideOrder.status}</strong>
              </p>
            </div>

            <form onSubmit={handleStatusOverride} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Target Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-serendip-500 text-xs font-semibold"
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
                <label className="block font-semibold text-zinc-700 mb-1">Administrative Audit Reason *</label>
                <textarea
                  rows={3}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Mandatory administrative justification (logged in audit trail)..."
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-serendip-500 text-xs"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setOverrideOrder(null)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-200 text-zinc-600 font-semibold hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-xl bg-serendip-700 hover:bg-serendip-800 text-white font-semibold disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Confirm Override'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
