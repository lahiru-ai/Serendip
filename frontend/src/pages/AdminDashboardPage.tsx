import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  UserX,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  Calculator,
  Lock,
  EyeOff,
  Package,
  Search,
  Download,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  FileSpreadsheet,
  Trash2,
  Store,
  DollarSign,
  TrendingUp,
  MapPin,
  Layers,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { api } from '../services/api';
import { Order, AdminSellerOrderStats } from '../types';
import { OrderStatusBadge } from '../components/orders/OrderStatusBadge';
import { OrderTimeline } from '../components/orders/OrderTimeline';

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

type AdminTab = 'ALL' | 'ORDERS' | 'COMMISSIONS' | 'USERS';

/**
 * Unified Single-Page Admin Panel:
 * Consolidates Central Order Management, Confidential Commission Governance,
 * and User Account Access Governance into a single, high-productivity dashboard.
 */
export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { formatPrice } = useCurrency();

  // Active view tab on this single page
  const [activeTab, setActiveTab] = useState<AdminTab>('ALL');

  // Global notifications
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // -------------------------------------------------------------
  // 1. ORDERS STATE & ACTIONS
  // -------------------------------------------------------------
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [exporting, setExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Status override modal state
  const [overrideOrder, setOverrideOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState('PROCESSING');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideLoading, setOverrideLoading] = useState(false);

  // Inline Order Inspector modal state
  const [inspectingOrderId, setInspectingOrderId] = useState<number | null>(null);
  const [inspectOrderData, setInspectOrderData] = useState<Order | null>(null);
  const [inspectOrderLoading, setInspectOrderLoading] = useState(false);

  // Inline Seller Analytics modal state
  const [inspectingSellerId, setInspectingSellerId] = useState<number | null>(null);
  const [sellerStatsData, setSellerStatsData] = useState<AdminSellerOrderStats | null>(null);
  const [sellerStatsLoading, setSellerStatsLoading] = useState(false);

  const loadAllOrders = async () => {
    if (!user || user.role !== 'ADMIN') return;
    try {
      setOrdersLoading(true);
      setError(null);
      const data = await api.getAllOrdersAdmin();
      setOrders(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch platform orders';
      setError(msg);
    } finally {
      setOrdersLoading(false);
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
      setMessage('Marketplace orders report exported to CSV successfully.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'CSV export failed';
      setError(msg);
    } finally {
      setExporting(false);
    }
  };

  const handleClearAllOrders = async () => {
    if (!window.confirm('Are you sure you want to delete all demo orders? This will permanently wipe platform orders.')) {
      return;
    }
    try {
      setOrdersLoading(true);
      setError(null);
      const res = await api.clearAllOrders();
      setMessage(`${res.message} (${res.deletedCount} orders cleared)`);
      await loadAllOrders();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to clear orders';
      setError(msg);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleStatusOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideOrder || !newStatus) return;
    if (!overrideReason.trim()) {
      setError('Please provide an administrative reason for overriding the order status.');
      return;
    }

    setOverrideLoading(true);
    setError(null);
    try {
      await api.adminUpdateOrderStatus(overrideOrder.id, {
        newStatus,
        reason: overrideReason.trim(),
      });
      setMessage(`Order ${overrideOrder.orderNumber} status updated to ${newStatus}.`);
      setOverrideOrder(null);
      setOverrideReason('');
      await loadAllOrders();
      // If inspecting the same order, refresh its view
      if (inspectingOrderId === overrideOrder.id) {
        openOrderInspector(overrideOrder.id);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Administrative update failed';
      setError(msg);
    } finally {
      setOverrideLoading(false);
    }
  };

  const openOrderInspector = async (orderId: number) => {
    setInspectingOrderId(orderId);
    setInspectOrderLoading(true);
    try {
      const data = await api.getOrderById(orderId);
      setInspectOrderData(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load order details';
      setError(msg);
      setInspectingOrderId(null);
    } finally {
      setInspectOrderLoading(false);
    }
  };

  const openSellerStatsModal = async (sellerId: number) => {
    setInspectingSellerId(sellerId);
    setSellerStatsLoading(true);
    try {
      const data = await api.getAdminSellerAnalytics(sellerId);
      setSellerStatsData(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load seller analytics';
      setError(msg);
      setInspectingSellerId(null);
    } finally {
      setSellerStatsLoading(false);
    }
  };

  // Flatten orders into line-item rows
  const tableRows = useMemo(() => {
    const rows: FlattenedOrderItemRow[] = [];
    for (const o of orders) {
      for (const so of o.sellerOrders || []) {
        const commRate = so.commissionRate != null ? so.commissionRate : 10.0;
        const commAmt = so.commissionAmount != null ? so.commissionAmount : 0;
        const sellerEarnings = so.subtotalAmount - commAmt;

        for (const item of so.items || []) {
          rows.push({
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
    return rows;
  }, [orders]);

  // Filter rows
  const filteredRows = useMemo(() => {
    return tableRows.filter((r) => {
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
  }, [tableRows, statusFilter, search]);

  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    return filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filteredRows, currentPage, pageSize]);

  // Platform overview stats
  const totalVolume = useMemo(() => orders.reduce((sum, o) => sum + o.totalAmount, 0), [orders]);
  const totalCommissions = useMemo(() => tableRows.reduce((sum, r) => sum + r.commissionAmount, 0), [tableRows]);
  const totalSellerEarnings = useMemo(() => Math.max(0, totalVolume - totalCommissions), [totalVolume, totalCommissions]);

  // -------------------------------------------------------------
  // 2. COMMISSION GOVERNANCE STATE & ACTIONS
  // -------------------------------------------------------------
  const [sellerIdInput, setSellerIdInput] = useState('');
  const [sellerLoading, setSellerLoading] = useState(false);
  const [sellerDetails, setSellerDetails] = useState<{
    id: number;
    fullName: string;
    shopName: string;
    role: string;
    commissionRate?: number;
  } | null>(null);
  const [newRate, setNewRate] = useState('');

  // Interactive Commission & Payout Calculator state
  const [calcSubtotal, setCalcSubtotal] = useState<number>(100);
  const [calcShipping, setCalcShipping] = useState<number>(15);
  const [calcRate, setCalcRate] = useState<number>(10.0);

  const calcCommission = Number(((calcSubtotal * calcRate) / 100).toFixed(2));
  const calcNetPayout = Number((calcSubtotal + calcShipping - calcCommission).toFixed(2));

  const handleFetchSeller = async () => {
    const id = parseInt(sellerIdInput, 10);
    if (isNaN(id)) {
      setError('Please provide a valid numeric Seller User ID.');
      return;
    }
    setSellerLoading(true);
    setError(null);
    setMessage(null);
    try {
      const data = await api.getUser(id);
      if (data.role !== 'SELLER') {
        setError(`User #${id} is registered as a ${data.role}, not a SELLER.`);
        setSellerDetails(null);
      } else {
        setSellerDetails({
          id: data.id,
          fullName: data.fullName,
          shopName: data.shopName || '',
          role: data.role,
          commissionRate: data.commissionRate,
        });
        setNewRate(data.commissionRate != null ? String(data.commissionRate) : '10.0');
        setCalcRate(data.commissionRate != null ? data.commissionRate : 10.0);
        setMessage(`Loaded merchant profile for "${data.shopName}".`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch seller details';
      setError(msg);
      setSellerDetails(null);
    } finally {
      setSellerLoading(false);
    }
  };

  const handleUpdateCommission = async () => {
    if (!sellerDetails) return;
    const rateNum = parseFloat(newRate);
    if (isNaN(rateNum) || rateNum < 0 || rateNum > 100) {
      setError('Commission rate must be a valid percentage between 0% and 100%.');
      return;
    }
    setSellerLoading(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await api.updateSellerCommission(sellerDetails.id, rateNum);
      setMessage(`Commission rate for "${sellerDetails.shopName}" successfully updated to ${rateNum}%.`);
      setSellerDetails({
        id: updated.id,
        fullName: updated.fullName,
        shopName: updated.shopName || '',
        role: updated.role,
        commissionRate: updated.commissionRate,
      });
      setCalcRate(rateNum);
      await loadAllOrders();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update commission rate';
      setError(msg);
    } finally {
      setSellerLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 3. USER ACCOUNT GOVERNANCE STATE & ACTIONS
  // -------------------------------------------------------------
  const [targetUserId, setTargetUserId] = useState('');
  const [userLoading, setUserLoading] = useState(false);
  const [inspectedUser, setInspectedUser] = useState<any | null>(null);

  const handleLookupUser = async () => {
    const id = parseInt(targetUserId, 10);
    if (isNaN(id)) {
      setError('Please provide a valid numeric User ID.');
      return;
    }
    setUserLoading(true);
    setError(null);
    setMessage(null);
    try {
      const u = await api.getUser(id);
      setInspectedUser(u);
      setMessage(`Loaded account record for ${u.fullName} (${u.role}).`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'User account not found';
      setError(msg);
      setInspectedUser(null);
    } finally {
      setUserLoading(false);
    }
  };

  const handleUserAction = async (action: 'activate' | 'suspend') => {
    const id = parseInt(targetUserId, 10);
    if (isNaN(id)) {
      setError('Please provide a valid numeric User ID.');
      return;
    }
    setUserLoading(true);
    setError(null);
    setMessage(null);
    try {
      if (action === 'activate') {
        const u = await api.activateUser(id);
        setMessage(`User #${id} (${u.fullName}) has been activated successfully.`);
        setInspectedUser(u);
      } else {
        const u = await api.suspendUser(id);
        setMessage(`User #${id} (${u.fullName}) has been suspended. Login & purchases blocked.`);
        setInspectedUser(u);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'User governance action failed';
      setError(msg);
    } finally {
      setUserLoading(false);
    }
  };

  // Clearance check
  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white border border-[#D6CBB5] rounded-3xl text-center shadow-lg">
        <ShieldCheck className="w-12 h-12 text-[#9E3D34] mx-auto mb-3" />
        <h2 className="text-lg font-bold text-[#222B1F]">Admin Clearance Required</h2>
        <p className="text-xs text-[#7A7462] mt-2 mb-4">
          You must be authenticated with role ADMIN to access the marketplace administration console.
        </p>
        <Link to="/login" className="px-5 py-2.5 bg-[#315D4F] text-[#F9F6EF] rounded-xl text-xs font-semibold hover:bg-[#19372E] transition-colors">
          Sign In as Admin
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[98%] xl:max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* ========================================================= */}
      {/* 1. UNIFIED ADMIN HEADER & NAVIGATION                      */}
      {/* ========================================================= */}
      <div className="bg-[#19372E] text-[#F9F6EF] rounded-3xl p-6 sm:p-8 shadow-xl border border-[#426F60] relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[#315D4F]/40 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#A48B57]/20 border border-[#A48B57]/50 text-[#BD9F75] text-[11px] font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Central Governance Center</span>
              </span>
              <span className="text-[11px] text-[#ADA78A] font-mono">
                Admin: {user.fullName}
              </span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#F9F6EF] tracking-tight">
              Marketplace Administration
            </h1>
            <p className="text-xs sm:text-sm text-[#E9E4D7]/80 max-w-2xl leading-relaxed">
              Complete single-page platform control. Manage marketplace orders, cross-vendor logistics, confidential commission rates, user access status, and payout settlement.
            </p>
          </div>

          {/* Quick Metrics Badges in Header */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0 bg-[#0E201B]/80 p-3 rounded-2xl border border-[#426F60]">
            <div className="px-3 py-2 text-center">
              <span className="text-[10px] text-[#ADA78A] uppercase font-bold tracking-wider block">Orders</span>
              <span className="text-xl font-bold font-mono text-[#F9F6EF]">{orders.length}</span>
            </div>
            <div className="px-3 py-2 text-center border-l border-[#426F60]">
              <span className="text-[10px] text-[#ADA78A] uppercase font-bold tracking-wider block">Gross Sales</span>
              <span className="text-xl font-bold font-mono text-[#BD9F75]">{formatPrice(totalVolume)}</span>
            </div>
            <div className="px-3 py-2 text-center border-l border-[#426F60]">
              <span className="text-[10px] text-[#ADA78A] uppercase font-bold tracking-wider block">Commission</span>
              <span className="text-xl font-bold font-mono text-emerald-400">{formatPrice(totalCommissions)}</span>
            </div>
            <div className="px-3 py-2 text-center border-l border-[#426F60]">
              <span className="text-[10px] text-[#ADA78A] uppercase font-bold tracking-wider block">Net Payouts</span>
              <span className="text-xl font-bold font-mono text-[#F9F6EF]">{formatPrice(totalSellerEarnings)}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation Controls (Stays on ONE page) */}
        <div className="mt-8 pt-6 border-t border-[#426F60]/70 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-[#ADA78A] mr-2">Admin Modules:</span>
          
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'ALL'
                ? 'bg-[#A48B57] text-[#19372E] shadow-md'
                : 'bg-[#426F60]/60 text-[#F9F6EF] hover:bg-[#426F60]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>All Functions (Unified View)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ORDERS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'ORDERS'
                ? 'bg-[#A48B57] text-[#19372E] shadow-md'
                : 'bg-[#426F60]/60 text-[#F9F6EF] hover:bg-[#426F60]'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Central Order Management</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('COMMISSIONS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'COMMISSIONS'
                ? 'bg-[#A48B57] text-[#19372E] shadow-md'
                : 'bg-[#426F60]/60 text-[#F9F6EF] hover:bg-[#426F60]'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Commission Governance</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('USERS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'USERS'
                ? 'bg-[#A48B57] text-[#19372E] shadow-md'
                : 'bg-[#426F60]/60 text-[#F9F6EF] hover:bg-[#426F60]'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>User Account Governance</span>
          </button>
        </div>
      </div>

      {/* Global Status Alerts */}
      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{message}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. CENTRAL ORDER MANAGEMENT PANEL (EMBEDDED DIRECTLY)     */}
      {/* ========================================================= */}
      {(activeTab === 'ALL' || activeTab === 'ORDERS') && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#D6CBB5]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#315D4F] text-[#F9F6EF] flex items-center justify-center shadow-md">
                <Package className="w-5 h-5 text-[#A48B57]" />
              </div>
              <div>
                <h2 className="font-serif text-2xl font-bold text-[#222B1F]">
                  Central Order Management Panel
                </h2>
                <p className="text-xs text-[#7A7462]">
                  Live cross-merchant fulfillment audits, item line commissions, status overrides, and transaction logging.
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={loadAllOrders}
                className="p-2 text-[#222B1F] hover:text-[#315D4F] rounded-xl border border-[#D6CBB5] bg-[#F9F6EF] hover:bg-white transition-all shadow-xs"
                title="Refresh Order List"
              >
                <RefreshCw className={`w-4 h-4 ${ordersLoading ? 'animate-spin text-[#315D4F]' : ''}`} />
              </button>

              <button
                type="button"
                disabled={exporting}
                onClick={handleExportCsv}
                className="px-4 py-2 bg-[#315D4F] hover:bg-[#19372E] text-[#F9F6EF] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5 text-[#BD9F75]" />
                <span>{exporting ? 'Exporting...' : 'Export to CSV'}</span>
              </button>

              <button
                type="button"
                onClick={handleClearAllOrders}
                className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                title="Wipe demo orders from system"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear Demo Orders</span>
              </button>
            </div>
          </div>

          {/* KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="bg-white p-5 rounded-2xl border border-[#D6CBB5]/80 shadow-sm">
              <div className="flex items-center justify-between text-[#7A7462]">
                <span className="font-semibold uppercase tracking-wider text-[10px]">Total Platform Orders</span>
                <Package className="w-4 h-4 text-[#315D4F]" />
              </div>
              <p className="text-2xl font-bold text-[#222B1F] mt-2 font-mono">{orders.length}</p>
              <span className="text-[#7A7462] text-[11px] block mt-0.5">{tableRows.length} item line(s) recorded</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#D6CBB5]/80 shadow-sm">
              <div className="flex items-center justify-between text-[#7A7462]">
                <span className="font-semibold uppercase tracking-wider text-[10px]">Gross Sales Settled</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-[#222B1F] mt-2 font-mono">{formatPrice(totalVolume)}</p>
              <span className="text-emerald-700 text-[11px] block mt-0.5 font-medium">Customer payments captured</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#BD9F75]/80 shadow-sm bg-gradient-to-br from-white to-[#A48B57]/10">
              <div className="flex items-center justify-between text-[#A48B57]">
                <span className="font-semibold uppercase tracking-wider text-[10px]">Platform Commission Retained</span>
                <TrendingUp className="w-4 h-4 text-[#A48B57]" />
              </div>
              <p className="text-2xl font-bold text-[#A48B57] mt-2 font-mono">{formatPrice(totalCommissions)}</p>
              <span className="text-[#7A7462] text-[11px] block mt-0.5">Admin earnings (confidential)</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#D6CBB5]/80 shadow-sm">
              <div className="flex items-center justify-between text-[#7A7462]">
                <span className="font-semibold uppercase tracking-wider text-[10px]">Seller Net Earnings</span>
                <Store className="w-4 h-4 text-[#315D4F]" />
              </div>
              <p className="text-2xl font-bold text-[#222B1F] mt-2 font-mono">{formatPrice(totalSellerEarnings)}</p>
              <span className="text-[#7A7462] text-[11px] block mt-0.5">Disbursements due to merchants</span>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white rounded-2xl border border-[#D6CBB5] p-4 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
              
              {/* Status Filter Tabs */}
              <div className="flex flex-wrap gap-1.5 w-full lg:w-auto">
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
                        ? 'bg-[#315D4F] text-[#F9F6EF] shadow-xs'
                        : 'bg-[#E9E4D7]/70 text-[#222B1F] hover:bg-[#D6CBB5]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative w-full lg:w-80">
                <Search className="w-4 h-4 text-[#7A7462] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search order #, buyer, seller, product..."
                  className="w-full pl-9 pr-3 py-2 bg-[#F9F6EF] border border-[#D6CBB5] rounded-xl text-xs focus:outline-none focus:border-[#315D4F] focus:bg-white transition-all text-[#222B1F]"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      setCurrentPage(1);
                    }}
                    className="absolute right-2.5 top-2.5 text-[#7A7462] hover:text-[#222B1F]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

            </div>
          </div>

          {/* Complete Line-Item Table */}
          <div className="bg-white rounded-3xl border border-[#D6CBB5] shadow-sm overflow-hidden">
            {ordersLoading ? (
              <div className="p-16 text-center text-xs text-[#7A7462] animate-pulse space-y-2">
                <RefreshCw className="w-6 h-6 mx-auto animate-spin text-[#315D4F]" />
                <p>Loading real-time marketplace order records...</p>
              </div>
            ) : filteredRows.length === 0 ? (
              <div className="p-16 text-center space-y-3">
                <FileSpreadsheet className="w-10 h-10 text-[#ADA78A] mx-auto" />
                <p className="text-xs text-[#7A7462] font-medium">No order lines match the specified filter criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#D6CBB5] bg-[#E9E4D7]/50 text-[#7A7462] text-[10px] uppercase tracking-wider font-semibold whitespace-nowrap">
                      <th className="py-3 px-3">Order Number</th>
                      <th className="py-3 px-3">Order Date</th>
                      <th className="py-3 px-3">Buyer Name</th>
                      <th className="py-3 px-3">Buyer Email</th>
                      <th className="py-3 px-3">Seller Name</th>
                      <th className="py-3 px-3">Seller Email</th>
                      <th className="py-3 px-3">Product Name</th>
                      <th className="py-3 px-3 text-center">Qty</th>
                      <th className="py-3 px-3 text-right">Unit Price</th>
                      <th className="py-3 px-3 text-right">Order Total</th>
                      <th className="py-3 px-3 text-right text-[#A48B57] bg-[#A48B57]/10">Comm Rate</th>
                      <th className="py-3 px-3 text-right text-[#A48B57] bg-[#A48B57]/10">Comm Amount</th>
                      <th className="py-3 px-3 text-right">Seller Net</th>
                      <th className="py-3 px-3">Payment Method</th>
                      <th className="py-3 px-3">Payment Status</th>
                      <th className="py-3 px-3">Order Status</th>
                      <th className="py-3 px-3 text-right sticky right-0 bg-[#E9E4D7]/90 shadow-l">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E9E4D7] text-[#222B1F]">
                    {paginatedRows.map((r, i) => (
                      <tr key={`${r.orderId}-${r.productName}-${i}`} className="hover:bg-[#F9F6EF] transition-colors whitespace-nowrap">
                        <td className="py-3 px-3 font-mono font-bold text-[#19372E]">
                          <button
                            type="button"
                            onClick={() => openOrderInspector(r.orderId)}
                            className="hover:underline text-[#315D4F] hover:text-[#19372E] text-left"
                            title="Inspect complete order details"
                          >
                            {r.orderNumber}
                          </button>
                        </td>

                        <td className="py-3 px-3 text-[#7A7462]">
                          {new Date(r.orderDate).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>

                        <td className="py-3 px-3 font-medium text-[#222B1F]">{r.buyerName}</td>
                        <td className="py-3 px-3 text-[#7A7462] font-mono text-[11px]">{r.buyerEmail}</td>

                        <td className="py-3 px-3 font-semibold text-[#19372E]">
                          {r.sellerId ? (
                            <button
                              type="button"
                              onClick={() => openSellerStatsModal(r.sellerId!)}
                              className="hover:underline text-[#315D4F] hover:text-[#19372E] text-left"
                              title="Inspect merchant performance analytics"
                            >
                              {r.sellerName}
                            </button>
                          ) : (
                            r.sellerName
                          )}
                        </td>
                        <td className="py-3 px-3 text-[#7A7462] font-mono text-[11px]">{r.sellerEmail}</td>

                        <td className="py-3 px-3 font-medium text-[#222B1F] max-w-xs truncate" title={r.productName}>
                          {r.productName}
                        </td>

                        <td className="py-3 px-3 text-center font-bold text-[#222B1F]">{r.productQuantity}</td>
                        <td className="py-3 px-3 text-right font-mono text-[#222B1F]">{formatPrice(r.productPrice)}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-[#19372E]">{formatPrice(r.orderTotal)}</td>

                        {/* Admin Confidential Commission Columns */}
                        <td className="py-3 px-3 text-right font-mono font-bold text-[#A48B57] bg-[#A48B57]/5">
                          {r.commissionRate.toFixed(1)}%
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-[#A48B57] bg-[#A48B57]/5">
                          {formatPrice(r.commissionAmount)}
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                          {formatPrice(r.sellerEarnings)}
                        </td>

                        <td className="py-3 px-3 font-medium text-[#222B1F]">{r.paymentMethod}</td>
                        <td className="py-3 px-3 font-bold text-emerald-700 uppercase text-[10px]">{r.paymentStatus}</td>
                        
                        <td className="py-3 px-3">
                          <OrderStatusBadge status={r.orderStatus} />
                        </td>

                        <td className="py-3 px-3 text-right sticky right-0 bg-white/95 shadow-l">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openOrderInspector(r.orderId)}
                              className="p-1.5 text-[#315D4F] hover:text-[#19372E] rounded-lg hover:bg-[#E9E4D7] transition-colors"
                              title="Inspect Order Details inline"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const found = orders.find((o) => o.id === r.orderId);
                                if (found) {
                                  setOverrideOrder(found);
                                  setNewStatus(found.status);
                                }
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[#E9E4D7] hover:bg-[#D6CBB5] text-[#222B1F] text-[10px] font-bold transition-colors"
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-[#D6CBB5] flex items-center justify-between text-xs text-[#7A7462] bg-[#F9F6EF]/50">
                <span>
                  Showing {(currentPage - 1) * pageSize + 1} to {Math.min(filteredRows.length, currentPage * pageSize)} of{' '}
                  {filteredRows.length} item line(s)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="p-1.5 rounded-lg border border-[#D6CBB5] hover:bg-white disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-semibold text-[#222B1F]">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="p-1.5 rounded-lg border border-[#D6CBB5] hover:bg-white disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* 3. CONFIDENTIAL COMMISSION GOVERNANCE & CALCULATOR        */}
      {/* ========================================================= */}
      {(activeTab === 'ALL' || activeTab === 'COMMISSIONS') && (
        <section className="space-y-6">
          <div className="flex items-center gap-3 pb-2 border-b border-[#D6CBB5]">
            <div className="w-10 h-10 rounded-2xl bg-[#A48B57] text-[#19372E] flex items-center justify-center shadow-md">
              <DollarSign className="w-5 h-5 text-[#19372E]" />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#222B1F]">
                Confidential Commission Governance
              </h2>
              <p className="text-xs text-[#7A7462]">
                Configure proprietary commission percentages for verified producers and simulate net payout economics.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Merchant Commission Adjuster */}
            <div className="bg-white rounded-3xl border border-[#BD9F75]/70 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#A48B57]/15 text-[#19372E] border border-[#A48B57]/40 rounded-lg text-[11px] font-bold mb-2">
                    <Lock className="w-3.5 h-3.5 text-[#A48B57]" />
                    <span>Admin Confidential</span>
                  </div>
                  <h3 className="font-semibold text-[#222B1F] text-base">Seller Commission Settings</h3>
                  <p className="text-xs text-[#7A7462] mt-1">
                    Commission rates remain private to administration and are never exposed to public endpoints or buyers.
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[#7A7462] text-xs">
                  <EyeOff className="w-4 h-4 text-[#ADA78A]" />
                  <span className="hidden sm:inline">Hidden from Sellers</span>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-[#222B1F] mb-1.5" htmlFor="admin-seller-id">
                    Seller User ID
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="admin-seller-id"
                      type="number"
                      min="1"
                      value={sellerIdInput}
                      onChange={(e) => setSellerIdInput(e.target.value)}
                      placeholder="e.g. 2"
                      className="w-full px-3.5 py-2.5 bg-[#F9F6EF] border border-[#D6CBB5] rounded-xl focus:outline-none focus:border-[#315D4F] focus:bg-white text-xs font-mono text-[#222B1F]"
                    />
                    <button
                      type="button"
                      disabled={sellerLoading || !sellerIdInput}
                      onClick={handleFetchSeller}
                      className="px-5 py-2.5 bg-[#315D4F] text-[#F9F6EF] rounded-xl font-semibold shrink-0 hover:bg-[#19372E] disabled:opacity-50 transition-colors shadow-xs"
                    >
                      {sellerLoading ? 'Checking...' : 'Inspect Seller'}
                    </button>
                  </div>
                </div>

                {sellerDetails && (
                  <div className="p-4 bg-[#F9F6EF] border border-[#D6CBB5] rounded-2xl space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#7A7462]">Shop Name:</span>
                      <span className="font-bold text-[#19372E]">{sellerDetails.shopName}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#7A7462]">Owner Full Name:</span>
                      <span className="font-medium text-[#222B1F]">{sellerDetails.fullName}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#7A7462]">Current Commission Rate:</span>
                      <span className="font-mono font-bold text-[#A48B57] bg-white px-2.5 py-0.5 rounded-lg border border-[#D6CBB5]">
                        {sellerDetails.commissionRate != null ? `${sellerDetails.commissionRate}%` : 'Not Set'}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-[#D6CBB5]">
                      <label className="block font-semibold text-[#222B1F] mb-1.5" htmlFor="admin-new-rate">
                        Adjust Commission Rate (%)
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="admin-new-rate"
                          type="number"
                          step="0.5"
                          min="0"
                          max="100"
                          value={newRate}
                          onChange={(e) => setNewRate(e.target.value)}
                          className="w-full px-3.5 py-2 bg-white border border-[#D6CBB5] rounded-xl focus:outline-none focus:border-[#A48B57] font-mono text-xs"
                          placeholder="10.0"
                        />
                        <button
                          type="button"
                          disabled={sellerLoading}
                          onClick={handleUpdateCommission}
                          className="px-5 py-2 bg-[#A48B57] text-[#19372E] rounded-xl font-bold shrink-0 hover:bg-[#BD9F75] disabled:opacity-50 transition-colors shadow-xs"
                        >
                          Save Rate
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Interactive Commission & Payout Simulator */}
            <div className="bg-white rounded-3xl border border-[#D6CBB5] p-6 sm:p-8 shadow-sm space-y-5 text-xs">
              <div className="flex items-center gap-2 text-[#222B1F] font-bold">
                <Calculator className="w-4 h-4 text-[#A48B57]" />
                <span className="text-sm font-serif">Commission & Settlement Simulator</span>
              </div>
              <p className="text-[#7A7462] text-xs">
                Simulate platform gross revenue and merchant net settlement before finalizing vendor contracts.
              </p>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#7A7462] mb-1">Subtotal ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={calcSubtotal}
                    onChange={(e) => setCalcSubtotal(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-2 bg-[#F9F6EF] border border-[#D6CBB5] rounded-xl text-xs font-mono focus:outline-none focus:border-[#315D4F]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#7A7462] mb-1">Shipping ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={calcShipping}
                    onChange={(e) => setCalcShipping(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-2 bg-[#F9F6EF] border border-[#D6CBB5] rounded-xl text-xs font-mono focus:outline-none focus:border-[#315D4F]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#7A7462] mb-1">Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={calcRate}
                    onChange={(e) => setCalcRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-2 bg-[#F9F6EF] border border-[#D6CBB5] rounded-xl text-xs font-mono focus:outline-none focus:border-[#315D4F]"
                  />
                </div>
              </div>

              <div className="p-4 bg-[#F9F6EF] border border-[#D6CBB5] rounded-2xl space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#7A7462]">SERENDIP Platform Revenue:</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">+{formatPrice(calcCommission)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#7A7462]">Seller Net Disbursed:</span>
                  <span className="font-mono font-bold text-[#19372E] text-sm">{formatPrice(calcNetPayout)}</span>
                </div>
              </div>

              <p className="text-[10px] text-[#7A7462] leading-relaxed">
                Standard Ceylon Formula: Platform Revenue = Subtotal × (Rate ÷ 100). Merchant Payout = Subtotal + Shipping − Commission.
              </p>
            </div>

          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* 4. USER ACCOUNT STATUS GOVERNANCE                         */}
      {/* ========================================================= */}
      {(activeTab === 'ALL' || activeTab === 'USERS') && (
        <section className="space-y-6">
          <div className="flex items-center gap-3 pb-2 border-b border-[#D6CBB5]">
            <div className="w-10 h-10 rounded-2xl bg-[#19372E] text-[#F9F6EF] flex items-center justify-center shadow-md">
              <UserCheck className="w-5 h-5 text-[#A48B57]" />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#222B1F]">
                User Account Status Governance
              </h2>
              <p className="text-xs text-[#7A7462]">
                Instant activation, suspension, and clearance audits across buyers, sellers, and system administrators.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#D6CBB5] p-6 sm:p-8 shadow-sm space-y-6">
            <div className="max-w-xl space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#222B1F] mb-1.5" htmlFor="admin-target-id">
                  Target User ID
                </label>
                <div className="flex gap-2">
                  <input
                    id="admin-target-id"
                    type="number"
                    min="1"
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                    placeholder="e.g. 1"
                    className="w-full px-3.5 py-2.5 bg-[#F9F6EF] border border-[#D6CBB5] rounded-xl focus:outline-none focus:border-[#315D4F] focus:bg-white text-xs font-mono text-[#222B1F]"
                  />
                  <button
                    type="button"
                    disabled={userLoading || !targetUserId}
                    onClick={handleLookupUser}
                    className="px-5 py-2.5 bg-[#E9E4D7] text-[#19372E] rounded-xl font-bold hover:bg-[#D6CBB5] transition-colors disabled:opacity-50 shrink-0"
                  >
                    Inspect User
                  </button>
                </div>
              </div>

              {/* Inspected User Profile Card */}
              {inspectedUser && (
                <div className="p-4 bg-[#F9F6EF] border border-[#D6CBB5] rounded-2xl space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm text-[#19372E]">{inspectedUser.fullName}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      inspectedUser.accountStatus === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-red-100 text-red-800 border border-red-300'
                    }`}>
                      {inspectedUser.accountStatus || 'ACTIVE'}
                    </span>
                  </div>
                  <div className="text-[#7A7462] flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
                    <span>Email: <strong className="text-[#222B1F]">{inspectedUser.email}</strong></span>
                    <span>Role: <strong className="text-[#315D4F] uppercase">{inspectedUser.role}</strong></span>
                    {inspectedUser.shopName && (
                      <span>Shop: <strong className="text-[#A48B57]">{inspectedUser.shopName}</strong></span>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  disabled={userLoading || !targetUserId}
                  onClick={() => handleUserAction('activate')}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#315D4F] hover:bg-[#19372E] text-[#F9F6EF] font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-xs"
                >
                  <UserCheck className="w-4 h-4 text-[#BD9F75]" />
                  <span>Activate User</span>
                </button>
                <button
                  type="button"
                  disabled={userLoading || !targetUserId}
                  onClick={() => handleUserAction('suspend')}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-xs"
                >
                  <UserX className="w-4 h-4" />
                  <span>Suspend User</span>
                </button>
              </div>

              <p className="text-[11px] text-[#7A7462] leading-normal pt-1">
                Security Policy: Suspended user accounts are blocked by Spring Security filters from authenticating, placing orders, or listing products.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* 5. MODAL: ADMIN STATUS OVERRIDE                           */}
      {/* ========================================================= */}
      {overrideOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in duration-200 border border-[#D6CBB5]">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#222B1F]">Admin Status Override</h3>
                <p className="text-xs text-[#7A7462] mt-1">
                  Order <strong className="font-mono text-[#19372E]">{overrideOrder.orderNumber}</strong> • Current Status: <strong>{overrideOrder.status}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOverrideOrder(null)}
                className="p-1.5 text-[#7A7462] hover:text-[#222B1F] rounded-lg hover:bg-[#F9F6EF]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStatusOverride} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#222B1F] mb-1.5">Target Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F9F6EF] border border-[#D6CBB5] rounded-xl focus:outline-none focus:border-[#315D4F] text-xs font-semibold text-[#222B1F]"
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
                <label className="block font-semibold text-[#222B1F] mb-1.5">Administrative Audit Reason *</label>
                <textarea
                  rows={3}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Mandatory administrative justification (logged in audit trail)..."
                  className="w-full px-3.5 py-2 bg-[#F9F6EF] border border-[#D6CBB5] rounded-xl focus:outline-none focus:border-[#315D4F] text-xs text-[#222B1F]"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={overrideLoading}
                  onClick={() => setOverrideOrder(null)}
                  className="flex-1 py-2.5 rounded-xl border border-[#D6CBB5] text-[#222B1F] font-semibold hover:bg-[#F9F6EF] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={overrideLoading}
                  className="flex-1 py-2.5 rounded-xl bg-[#315D4F] hover:bg-[#19372E] text-[#F9F6EF] font-bold disabled:opacity-50 transition-all shadow-xs"
                >
                  {overrideLoading ? 'Saving...' : 'Confirm Override'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. MODAL: INLINE COMPLETE ORDER INSPECTOR                 */}
      {/* ========================================================= */}
      {inspectingOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl space-y-6 my-8 border border-[#D6CBB5] max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-start justify-between pb-4 border-b border-[#D6CBB5]">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-serif text-2xl font-bold text-[#222B1F]">
                    Order {inspectOrderData?.orderNumber || inspectingOrderId}
                  </h3>
                  {inspectOrderData && <OrderStatusBadge status={inspectOrderData.status} />}
                </div>
                <p className="text-xs text-[#7A7462] mt-1 font-mono">
                  Database ID #{inspectingOrderId} • Placed {inspectOrderData?.createdAt ? new Date(inspectOrderData.createdAt).toLocaleString() : '—'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setInspectingOrderId(null);
                  setInspectOrderData(null);
                }}
                className="p-1.5 text-[#7A7462] hover:text-[#222B1F] rounded-lg hover:bg-[#F9F6EF]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {inspectOrderLoading || !inspectOrderData ? (
              <div className="p-12 text-center text-xs text-[#7A7462] animate-pulse space-y-2">
                <RefreshCw className="w-6 h-6 mx-auto animate-spin text-[#315D4F]" />
                <p>Retrieving complete order and sub-orders payload...</p>
              </div>
            ) : (
              <div className="space-y-6 text-xs text-[#222B1F]">
                
                {/* Visual Lifecycle Timeline */}
                <OrderTimeline 
                  currentStatus={inspectOrderData.status} 
                  history={inspectOrderData.statusHistory || []} 
                />

                {/* Buyer & Delivery Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-[#F9F6EF] border border-[#D6CBB5] rounded-2xl space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-[#7A7462]">Customer Information</span>
                    <p className="font-bold text-sm text-[#19372E]">{inspectOrderData.buyerName || 'Customer'}</p>
                    <p className="text-[#7A7462] font-mono">{inspectOrderData.buyerEmail}</p>
                    {inspectOrderData.buyerPhone && <p className="text-[#7A7462]">{inspectOrderData.buyerPhone}</p>}
                  </div>

                  <div className="p-4 bg-[#F9F6EF] border border-[#D6CBB5] rounded-2xl space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-[#7A7462]">Delivery Destination</span>
                    <div className="flex items-start gap-1.5 text-[#222B1F]">
                      <MapPin className="w-4 h-4 text-[#A48B57] shrink-0 mt-0.5" />
                      <p className="font-medium leading-relaxed">{inspectOrderData.shippingAddress || 'No address specified'}</p>
                    </div>
                  </div>
                </div>

                {/* Sub-Orders & Line Items */}
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-[#19372E] flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[#A48B57]" />
                    <span>Merchant Sub-Orders & Item Allocations</span>
                  </h4>

                  {inspectOrderData.sellerOrders?.map((so) => (
                    <div key={so.id} className="p-4 border border-[#D6CBB5] rounded-2xl space-y-3 bg-white">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D6CBB5]/60 pb-2">
                        <div>
                          <span className="font-bold text-[#19372E] text-xs">
                            Shop: {so.sellerShopName}
                          </span>
                          <span className="text-[11px] text-[#7A7462] ml-2 font-mono">
                            Sub-Order: #{so.subOrderNumber}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <OrderStatusBadge status={so.status} />
                          <span className="font-mono text-[11px] font-bold text-[#A48B57] bg-[#A48B57]/10 px-2 py-0.5 rounded">
                            Comm: {so.commissionRate ?? 10.0}% ({formatPrice(so.commissionAmount || 0)})
                          </span>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="divide-y divide-[#E9E4D7]">
                        {so.items?.map((item) => (
                          <div key={item.id} className="py-2 flex items-center justify-between text-xs">
                            <span className="font-medium">{item.productName} × {item.quantity}</span>
                            <span className="font-mono font-bold">{formatPrice(item.subtotal)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-[#D6CBB5]/60 flex justify-between text-xs font-semibold text-[#7A7462]">
                        <span>Merchant Subtotal: {formatPrice(so.subtotalAmount)}</span>
                        <span className="text-emerald-700">Net Seller Payout: {formatPrice(so.subtotalAmount - (so.commissionAmount || 0))}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Payment & Audit Footer */}
                <div className="p-4 bg-[#19372E] text-[#F9F6EF] rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#ADA78A]">Payment Summary</span>
                    <p className="text-sm font-bold text-[#BD9F75]">
                      {inspectOrderData.paymentMethodName || 'Electronic Settlement'} • {inspectOrderData.payment?.status || 'PAID'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-[#ADA78A]">Total Order Value</span>
                    <p className="text-2xl font-bold font-mono text-[#F9F6EF]">{formatPrice(inspectOrderData.totalAmount)}</p>
                  </div>
                </div>

                {/* Quick Override Button inside Inspector */}
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOverrideOrder(inspectOrderData);
                      setNewStatus(inspectOrderData.status);
                    }}
                    className="px-4 py-2 bg-[#A48B57] text-[#19372E] rounded-xl font-bold hover:bg-[#BD9F75] transition-colors"
                  >
                    Override Order Status
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInspectingOrderId(null);
                      setInspectOrderData(null);
                    }}
                    className="px-4 py-2 border border-[#D6CBB5] text-[#222B1F] rounded-xl font-semibold hover:bg-[#F9F6EF]"
                  >
                    Close Inspector
                  </button>
                </div>

              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 7. MODAL: INLINE SELLER ANALYTICS INSPECTOR               */}
      {/* ========================================================= */}
      {inspectingSellerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 my-8 border border-[#D6CBB5] max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-start justify-between pb-4 border-b border-[#D6CBB5]">
              <div>
                <h3 className="font-serif text-2xl font-bold text-[#222B1F]">
                  Merchant Performance: {sellerStatsData?.shopName || `Seller #${inspectingSellerId}`}
                </h3>
                <p className="text-xs text-[#7A7462] mt-1">
                  Vendor ID #{inspectingSellerId} • {sellerStatsData?.originCity || 'Sri Lanka'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setInspectingSellerId(null);
                  setSellerStatsData(null);
                }}
                className="p-1.5 text-[#7A7462] hover:text-[#222B1F] rounded-lg hover:bg-[#F9F6EF]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {sellerStatsLoading || !sellerStatsData ? (
              <div className="p-12 text-center text-xs text-[#7A7462] animate-pulse space-y-2">
                <RefreshCw className="w-6 h-6 mx-auto animate-spin text-[#315D4F]" />
                <p>Retrieving seller sales and commission breakdown...</p>
              </div>
            ) : (
              <div className="space-y-6 text-xs text-[#222B1F]">
                
                {/* 4 Stat Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-[#F9F6EF] border border-[#D6CBB5] rounded-xl text-center">
                    <span className="text-[10px] text-[#7A7462] uppercase font-bold">Total Orders</span>
                    <p className="text-lg font-bold font-mono text-[#19372E] mt-1">{sellerStatsData.totalOrders}</p>
                  </div>
                  <div className="p-3 bg-[#F9F6EF] border border-[#D6CBB5] rounded-xl text-center">
                    <span className="text-[10px] text-[#7A7462] uppercase font-bold">Gross Volume</span>
                    <p className="text-lg font-bold font-mono text-[#19372E] mt-1">{formatPrice(sellerStatsData.totalRevenue)}</p>
                  </div>
                  <div className="p-3 bg-[#A48B57]/10 border border-[#A48B57]/30 rounded-xl text-center">
                    <span className="text-[10px] text-[#A48B57] uppercase font-bold">Commission</span>
                    <p className="text-lg font-bold font-mono text-[#A48B57] mt-1">{formatPrice(sellerStatsData.totalCommissionEarned)}</p>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                    <span className="text-[10px] text-emerald-800 uppercase font-bold">Net Payout</span>
                    <p className="text-lg font-bold font-mono text-emerald-800 mt-1">{formatPrice(sellerStatsData.totalSellerEarnings)}</p>
                  </div>
                </div>

                {/* Merchant Details */}
                <div className="p-4 bg-[#F9F6EF] border border-[#D6CBB5] rounded-2xl space-y-2">
                  <span className="text-[10px] uppercase font-bold text-[#7A7462]">Merchant Contact & Commission</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>Owner: <strong>{sellerStatsData.sellerName}</strong></div>
                    <div>Email: <strong className="font-mono">{sellerStatsData.sellerEmail}</strong></div>
                    <div>City: <strong>{sellerStatsData.originCity}</strong></div>
                    <div>Rate: <strong className="font-mono text-[#A48B57]">{sellerStatsData.commissionRate != null ? `${sellerStatsData.commissionRate}%` : '10.0%'}</strong></div>
                  </div>
                </div>

                {/* Sub-orders list */}
                <div className="space-y-2">
                  <h4 className="font-bold text-xs uppercase text-[#7A7462] tracking-wider">
                    Recent Merchant Sub-Orders ({sellerStatsData.orders?.length || 0})
                  </h4>
                  <div className="max-h-60 overflow-y-auto divide-y divide-[#E9E4D7] border border-[#D6CBB5] rounded-2xl">
                    {sellerStatsData.orders?.map((so) => (
                      <div key={so.id} className="p-3 hover:bg-[#F9F6EF] flex items-center justify-between">
                        <div>
                          <p className="font-bold text-[#19372E]">Sub-Order #{so.subOrderNumber}</p>
                          <p className="text-[11px] text-[#7A7462]">{so.buyerName || 'Buyer'} • {so.items?.length || 0} product(s)</p>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          <span className="font-mono font-bold text-xs">{formatPrice(so.subtotalAmount)}</span>
                          <OrderStatusBadge status={so.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setInspectingSellerId(null);
                      setSellerStatsData(null);
                    }}
                    className="px-4 py-2 bg-[#315D4F] text-[#F9F6EF] rounded-xl font-bold hover:bg-[#19372E] transition-colors"
                  >
                    Close Analytics
                  </button>
                </div>

              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
