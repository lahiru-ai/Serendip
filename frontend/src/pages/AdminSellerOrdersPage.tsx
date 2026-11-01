import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  ArrowLeft,
  Store,
  Mail,
  Phone,
  MapPin,
  Eye,
  AlertCircle
} from 'lucide-react';
import { AdminSellerOrderStats } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { OrderStatusBadge } from '../components/orders/OrderStatusBadge';

/**
 * Admin: Seller-specific sales analytics, commission reporting, and vendor order breakdown.
 */
export const AdminSellerOrdersPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();

  const [stats, setStats] = useState<AdminSellerOrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      if (!id || !user || user.role !== 'ADMIN') return;
      try {
        setLoading(true);
        setError(null);
        const data = await api.getAdminSellerAnalytics(parseInt(id, 10));
        setStats(data);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to load seller analytics';
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [id, user]);

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
        <div className="h-48 bg-white rounded-3xl border border-zinc-200" />
        <div className="h-64 bg-white rounded-3xl border border-zinc-200" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white border border-zinc-200/80 rounded-3xl text-center shadow-premium space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h3 className="font-semibold text-zinc-900">Seller Not Found</h3>
        <p className="text-xs text-zinc-500">{error || 'Unable to locate merchant sales records.'}</p>
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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      
      {/* Header */}
      <div className="border-b border-zinc-200 pb-5 space-y-1">
        <Link
          to="/admin/orders"
          className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 font-medium transition-colors mb-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Order Management Panel</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100/70 border border-amber-300 flex items-center justify-center shrink-0 text-amber-800">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-serif text-3xl font-bold text-zinc-900">{stats.shopName}</h1>
              <p className="text-xs text-zinc-500">
                Merchant Owner: <strong className="text-zinc-800">{stats.sellerName}</strong> • Account ID: <strong className="font-mono">#{stats.sellerId}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 font-mono font-bold">
              Standard Rate: {stats.commissionRate != null ? `${stats.commissionRate}%` : '10.0%'}
            </span>
          </div>
        </div>
      </div>

      {/* Seller Profile & Contact Summary */}
      <div className="bg-white rounded-3xl border border-zinc-200/80 p-6 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="flex items-center gap-3">
          <Mail className="w-4 h-4 text-zinc-400 shrink-0" />
          <div>
            <span className="text-zinc-400 text-[10px] uppercase block">Merchant Email</span>
            <span className="font-semibold text-zinc-800 font-mono">{stats.sellerEmail || '—'}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Phone className="w-4 h-4 text-zinc-400 shrink-0" />
          <div>
            <span className="text-zinc-400 text-[10px] uppercase block">Contact Number</span>
            <span className="font-semibold text-zinc-800 font-mono">{stats.sellerPhone || '—'}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <MapPin className="w-4 h-4 text-zinc-400 shrink-0" />
          <div>
            <span className="text-zinc-400 text-[10px] uppercase block">Shop Location / Address</span>
            <span className="font-semibold text-zinc-800">{stats.originCity || 'Colombo'}</span>
          </div>
        </div>
      </div>

      {/* 5 KPI Analytics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs">
        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-sm">
          <span className="text-zinc-400 font-semibold uppercase text-[10px] block">Total Orders</span>
          <p className="text-2xl font-bold text-zinc-900 mt-1">{stats.totalOrders}</p>
          <span className="text-zinc-400 text-[11px] block mt-0.5">{stats.totalQuantitySold} units sold</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-sm">
          <span className="text-zinc-400 font-semibold uppercase text-[10px] block">Catalog Breadth</span>
          <p className="text-2xl font-bold text-zinc-900 mt-1">{stats.totalProductsSold}</p>
          <span className="text-zinc-400 text-[11px] block mt-0.5">Distinct commodities</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-sm">
          <span className="text-zinc-400 font-semibold uppercase text-[10px] block">Gross Merchant Sales</span>
          <p className="text-2xl font-bold text-zinc-900 mt-1 font-mono">{formatPrice(stats.totalRevenue)}</p>
          <span className="text-zinc-400 text-[11px] block mt-0.5">Product subtotal value</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200/90 shadow-sm bg-gradient-to-br from-white to-amber-50/20">
          <span className="text-amber-800 font-semibold uppercase text-[10px] block">Platform Commission</span>
          <p className="text-2xl font-bold text-amber-700 mt-1 font-mono">+{formatPrice(stats.totalCommissionEarned)}</p>
          <span className="text-amber-600 text-[11px] block mt-0.5">Admin earnings retained</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200/90 shadow-sm bg-gradient-to-br from-white to-emerald-50/20">
          <span className="text-emerald-800 font-semibold uppercase text-[10px] block">Total Seller Earnings</span>
          <p className="text-2xl font-bold text-emerald-800 mt-1 font-mono">{formatPrice(stats.totalSellerEarnings)}</p>
          <span className="text-emerald-700 text-[11px] block mt-0.5">Net payout to vendor</span>
        </div>
      </div>

      {/* Order Status Breakdown Badges */}
      <div className="bg-white rounded-3xl border border-zinc-200/80 p-5 shadow-sm space-y-2 text-xs">
        <h4 className="font-semibold text-zinc-900 text-xs">Fulfillment Pipeline Breakdown</h4>
        <div className="flex flex-wrap gap-3 pt-1">
          <div className="px-3 py-1.5 rounded-xl bg-sky-50 text-sky-800 border border-sky-200 font-medium">
            Pending / Confirmed: <strong>{stats.pendingCount}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 font-medium">
            Processing: <strong>{stats.processingCount}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-800 border border-purple-200 font-medium">
            In Transit: <strong>{stats.shippedCount}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-green-50 text-green-800 border border-green-200 font-medium">
            Delivered: <strong>{stats.deliveredCount}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-red-50 text-red-800 border border-red-200 font-medium">
            Cancelled: <strong>{stats.cancelledCount}</strong>
          </div>
        </div>
      </div>

      {/* Detailed Seller Order Table */}
      <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
          <h3 className="font-semibold text-zinc-900 text-sm">
            Consignments Fulfilled by {stats.shopName} ({stats.orders?.length || 0})
          </h3>
          <span className="text-[11px] text-zinc-400">
            Isolated merchant accounting &bull; Excludes other vendor items
          </span>
        </div>

        {stats.orders?.length === 0 ? (
          <div className="p-12 text-center text-xs text-zinc-400">
            No orders registered for this merchant yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/80 text-zinc-500 text-[10px] uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Sub-Order #</th>
                  <th className="py-3 px-4">Parent Order #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Buyer</th>
                  <th className="py-3 px-4">Items &amp; Quantities</th>
                  <th className="py-3 px-4 text-right">Subtotal</th>
                  <th className="py-3 px-4 text-right text-amber-800 bg-amber-50/40">Commission</th>
                  <th className="py-3 px-4 text-right font-bold text-emerald-800">Net Earnings</th>
                  <th className="py-3 px-4">Order Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-700">
                {stats.orders.map((so) => {
                  const comm = so.commissionAmount != null ? so.commissionAmount : 0;
                  const earn = so.subtotalAmount - comm;

                  return (
                    <tr key={so.id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-zinc-900">
                        {so.subOrderNumber || so.orderNumber}
                      </td>
                      <td className="py-3 px-4 font-mono text-zinc-500">
                        {so.orderId ? (
                          <Link to={`/admin/orders/${so.orderId}`} className="hover:underline text-serendip-800">
                            {so.orderNumber}
                          </Link>
                        ) : (
                          so.orderNumber
                        )}
                      </td>
                      <td className="py-3 px-4 text-zinc-500 whitespace-nowrap">
                        {new Date(so.createdAt || Date.now()).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4 font-medium text-zinc-900">{so.buyerName || 'Buyer'}</td>
                      <td className="py-3 px-4 max-w-xs truncate">
                        {so.items?.map((i) => `${i.productName} (${i.quantity})`).join(', ')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-zinc-900">
                        {formatPrice(so.subtotalAmount)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-amber-700 bg-amber-50/30">
                        {formatPrice(comm)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-800">
                        {formatPrice(earn)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <OrderStatusBadge status={so.status} />
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {so.orderId && (
                          <Link
                            to={`/admin/orders/${so.orderId}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold text-[11px]"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Details</span>
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
