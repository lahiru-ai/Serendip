import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, UserX, UserCheck, AlertCircle, CheckCircle2, Calculator, Lock, EyeOff, Package, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

/**
 * Admin dashboard for user governance, account activation, and confidential commission management.
 */
export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [targetUserId, setTargetUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Commission management state (Admin only)
  const [sellerId, setSellerId] = useState('');
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

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white border border-zinc-200/80 rounded-3xl text-center shadow-premium">
        <ShieldCheck className="w-12 h-12 text-ceylon-ruby mx-auto mb-3" />
        <h2 className="text-lg font-bold text-zinc-900">Admin Clearance Required</h2>
        <p className="text-xs text-zinc-500 mt-2 mb-4">You must authenticate with ROLE_ADMIN to view governance controls.</p>
        <Link to="/login" className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-semibold">
          Sign In
        </Link>
      </div>
    );
  }

  const handleAction = async (action: 'activate' | 'suspend') => {
    const id = parseInt(targetUserId, 10);
    if (isNaN(id)) {
      setError('Please provide a valid numeric User ID');
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      if (action === 'activate') {
        await api.activateUser(id);
        setMessage(`User #${id} has been activated successfully.`);
      } else {
        await api.suspendUser(id);
        setMessage(`User #${id} has been suspended.`);
      }
      setTargetUserId('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Action failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchSeller = async () => {
    const id = parseInt(sellerId, 10);
    if (isNaN(id)) {
      setError('Please provide a valid numeric Seller ID');
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
        setSellerDetails(data);
        setNewRate(data.commissionRate != null ? String(data.commissionRate) : '10.0');
        setCalcRate(data.commissionRate != null ? data.commissionRate : 10.0);
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
      setError('Commission rate must be a percentage between 0% and 100%.');
      return;
    }
    setSellerLoading(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await api.updateSellerCommission(sellerDetails.id, rateNum);
      setMessage(`Commission rate for "${sellerDetails.shopName}" updated to ${rateNum}%.`);
      setSellerDetails(updated);
      setCalcRate(rateNum);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update commission rate';
      setError(msg);
    } finally {
      setSellerLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      
      <div className="border-b border-zinc-200 pb-5">
        <div className="flex items-center gap-2 text-ceylon-ruby text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>Governance Center</span>
        </div>
        <h1 className="font-serif text-3xl font-bold text-zinc-900 mt-1">
          Marketplace Administration
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          Role-Based Access Control, Merchant Governance, Order Audits, and Confidential Commission Management.
        </p>
      </div>

      {/* Quick Access to Complete Order Management */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-ceylon-ruby/80 text-white p-6 rounded-3xl shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <Package className="w-4 h-4" />
            <span>Marketplace Orders & Logistics</span>
          </div>
          <h2 className="text-xl font-bold text-white">Central Order Management Panel</h2>
          <p className="text-xs text-zinc-300 max-w-xl">
            Audit every order across all buyers and sellers, inspect line-item commissions and merchant earnings, override fulfillment statuses, and export transaction logs to CSV.
          </p>
        </div>
        <Link
          to="/admin/orders"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-zinc-900 font-semibold text-xs hover:bg-zinc-100 shadow-sm shrink-0 transition-all"
        >
          <span>Open Order Panel</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Admin-Only Confidential Commission Management */}
      <div className="bg-white rounded-3xl border border-amber-200/90 p-8 shadow-premium space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-[11px] font-semibold mb-2">
              <Lock className="w-3.5 h-3.5 text-amber-700" />
              <span>Admin Confidential</span>
            </div>
            <h3 className="font-semibold text-zinc-900 text-base">Seller Commission Governance</h3>
            <p className="text-xs text-zinc-500 mt-1">
              Commission rates are hidden from sellers, buyers, and public endpoints. Only administrators can view and configure them.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-zinc-400 text-xs">
            <EyeOff className="w-4 h-4" />
            <span>Hidden from Sellers</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Rate Lookup & Config */}
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-zinc-700 mb-1" htmlFor="admin-seller-id">
                Seller User ID
              </label>
              <div className="flex gap-2">
                <input
                  id="admin-seller-id"
                  type="number"
                  min="1"
                  value={sellerId}
                  onChange={(e) => setSellerId(e.target.value)}
                  placeholder="e.g. 2"
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  disabled={sellerLoading || !sellerId}
                  onClick={handleFetchSeller}
                  className="px-4 py-2 bg-zinc-900 text-white rounded-xl font-semibold shrink-0 hover:bg-zinc-800 disabled:opacity-50"
                >
                  Inspect
                </button>
              </div>
            </div>

            {sellerDetails && (
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500">Shop Name:</span>
                  <span className="font-bold text-zinc-900">{sellerDetails.shopName}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500">Owner:</span>
                  <span className="font-medium text-zinc-800">{sellerDetails.fullName}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500">Current Rate:</span>
                  <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {sellerDetails.commissionRate != null ? `${sellerDetails.commissionRate}%` : 'Not Set'}
                  </span>
                </div>

                <div className="pt-2 border-t border-zinc-200">
                  <label className="block font-semibold text-zinc-700 mb-1" htmlFor="admin-new-rate">
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
                      className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-amber-500 font-mono"
                    />
                    <button
                      type="button"
                      disabled={sellerLoading}
                      onClick={handleUpdateCommission}
                      className="px-4 py-2 bg-amber-600 text-white rounded-xl font-semibold shrink-0 hover:bg-amber-700 disabled:opacity-50"
                    >
                      Save Rate
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Confidential Commission Calculator Simulator */}
          <div className="bg-zinc-50/80 border border-zinc-200/90 rounded-2xl p-5 space-y-4 text-xs">
            <div className="flex items-center gap-2 text-zinc-800 font-semibold">
              <Calculator className="w-4 h-4 text-amber-600" />
              <span>Admin Commission Calculator</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] uppercase font-semibold text-zinc-500 mb-1">Subtotal ($)</label>
                <input
                  type="number"
                  min="0"
                  value={calcSubtotal}
                  onChange={(e) => setCalcSubtotal(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-semibold text-zinc-500 mb-1">Shipping ($)</label>
                <input
                  type="number"
                  min="0"
                  value={calcShipping}
                  onChange={(e) => setCalcShipping(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-semibold text-zinc-500 mb-1">Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={calcRate}
                  onChange={(e) => setCalcRate(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="p-3 bg-white border border-zinc-200 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-zinc-600">Platform Revenue (Admin):</span>
                <span className="font-mono font-bold text-emerald-700">+${calcCommission.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-600">Seller Net Payout:</span>
                <span className="font-mono font-bold text-zinc-900">${calcNetPayout.toFixed(2)}</span>
              </div>
            </div>

            <p className="text-[10px] text-zinc-400 leading-normal">
              Formula: Platform Commission = Subtotal × (Rate ÷ 100). Seller Net Payout = Subtotal + Shipping − Commission.
            </p>
          </div>
        </div>
      </div>

      {/* User Governance Tool */}
      <div className="bg-white rounded-3xl border border-zinc-200/80 p-8 shadow-premium space-y-6">
        <div>
          <h3 className="font-semibold text-zinc-900 text-base">User Account Status Governance</h3>
          <p className="text-xs text-zinc-500 mt-1">
            Suspended users are prevented by Spring Security from logging in or performing marketplace transactions.
          </p>
        </div>

        <div className="space-y-4 max-w-md text-xs">
          <div>
            <label className="block font-semibold text-zinc-700 mb-1" htmlFor="admin-target-id">
              Target User ID
            </label>
            <input
              id="admin-target-id"
              type="number"
              min="1"
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              placeholder="e.g. 1"
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-serendip-500"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              disabled={loading || !targetUserId}
              onClick={() => handleAction('activate')}
              className="flex-1 py-2.5 px-4 rounded-xl bg-serendip-700 hover:bg-serendip-800 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <UserCheck className="w-4 h-4" />
              Activate User
            </button>
            <button
              type="button"
              disabled={loading || !targetUserId}
              onClick={() => handleAction('suspend')}
              className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <UserX className="w-4 h-4" />
              Suspend User
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
