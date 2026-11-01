import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Package, Layers, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { Product } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

/**
 * Seller dashboard for managing shop catalog listings, prices, and inventory.
 */
export const SellerDashboardPage: React.FC = () => {
  const { user } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal / Add Product Form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [currencyMode, setCurrencyMode] = useState<'USD' | 'LKR'>('LKR');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Tea');
  const [description, setDescription] = useState('');
  const [priceVal, setPriceVal] = useState('');
  const [stockQuantity, setStockQuantity] = useState('25');

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadSellerProducts = async () => {
    if (!user || user.role !== 'SELLER') return;
    try {
      setLoading(true);
      setError(null);
      const data = await api.getProducts({ sellerId: user.id });
      setProducts(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not fetch seller products';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSellerProducts();
  }, [user]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      if (currencyMode === 'LKR') {
        await api.createProductLkr({
          sellerId: user.id,
          name,
          category,
          description,
          priceLkr: parseFloat(priceVal),
          stockQuantity: parseInt(stockQuantity, 10),
        });
      } else {
        await api.createProductUsd({
          sellerId: user.id,
          name,
          category,
          description,
          priceUsd: parseFloat(priceVal),
          stockQuantity: parseInt(stockQuantity, 10),
        });
      }
      setFeedback('Product published successfully!');
      setShowAddModal(false);
      // Reset fields
      setName('');
      setDescription('');
      setPriceVal('');
      loadSellerProducts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create product';
      setFeedback(`Error: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || user.role !== 'SELLER') {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white border border-zinc-200/80 rounded-3xl text-center shadow-premium">
        <h2 className="text-lg font-bold text-zinc-900">Seller Portal Access</h2>
        <p className="text-xs text-zinc-500 mt-2 mb-4">Please log in with a registered SELLER account to access this merchant suite.</p>
        <Link to="/login" className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-semibold">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="border-b border-zinc-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-serendip-700 text-xs font-bold uppercase tracking-wider">
            <Layers className="w-4 h-4" />
            <span>Artisan Merchant Suite</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-zinc-900 mt-1">
            Merchant Dashboard
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Logged in as <span className="font-bold text-zinc-800">{user.fullName}</span> ({user.email})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/seller/orders"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-200 font-semibold text-xs shadow-sm transition-all"
          >
            <Package className="w-4 h-4 text-serendip-600" />
            Consignments & Orders
          </Link>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Add New Product
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Active Catalog</span>
          <p className="text-3xl font-bold text-zinc-900 mt-2">{products.length}</p>
          <span className="text-[11px] text-serendip-700 font-medium mt-1 block">Live in international market</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Inventory Stock</span>
          <p className="text-3xl font-bold text-zinc-900 mt-2">
            {products.reduce((acc, p) => acc + p.stockQuantity, 0)}
          </p>
          <span className="text-[11px] text-zinc-500 mt-1 block">Units ready for dispatch</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Shop Location / Address</span>
          <p className="text-xl font-bold text-zinc-900 mt-2 truncate">{(user as any)?.originCity || 'Sri Lanka'}</p>
          <span className="text-[11px] text-zinc-500 mt-1 block">Verified merchant operating address</span>
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-3xl border border-zinc-200/80 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
          <h3 className="font-semibold text-zinc-900 text-sm">Your Registered Products</h3>
          <button
            type="button"
            onClick={loadSellerProducts}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-zinc-400 animate-pulse">Loading merchant catalog...</div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-xs text-zinc-500 space-y-2">
            <Package className="w-8 h-8 text-zinc-300 mx-auto" />
            <p>You have not listed any products yet.</p>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="text-serendip-700 font-semibold"
            >
              Add your first Ceylon product →
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 text-zinc-400 font-semibold uppercase tracking-wider border-b border-zinc-100">
                <tr>
                  <th className="py-3 px-5">Product Name</th>
                  <th className="py-3 px-5">Category</th>
                  <th className="py-3 px-5">Price (USD)</th>
                  <th className="py-3 px-5">Price (LKR)</th>
                  <th className="py-3 px-5">Stock</th>
                  <th className="py-3 px-5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-700">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="py-3.5 px-5 font-semibold text-zinc-900">{p.name}</td>
                    <td className="py-3.5 px-5">
                      <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 font-medium">
                        {p.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-bold">${p.priceUsd.toFixed(2)}</td>
                    <td className="py-3.5 px-5">Rs. {Number(p.priceLkr).toLocaleString()}</td>
                    <td className="py-3.5 px-5 font-semibold">
                      <span className={p.stockQuantity < 5 ? 'text-amber-600' : 'text-zinc-800'}>
                        {p.stockQuantity}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                        {p.active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="font-serif text-xl font-bold text-zinc-900">Add New Ceylon Artifact</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-zinc-700 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              
              {/* Currency selection */}
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Pricing Currency</label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setCurrencyMode('LKR')}
                    className={`py-1.5 rounded-lg font-semibold transition-all ${
                      currencyMode === 'LKR' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'
                    }`}
                  >
                    Sri Lankan Rupee (LKR)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrencyMode('USD')}
                    className={`py-1.5 rounded-lg font-semibold transition-all ${
                      currencyMode === 'USD' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'
                    }`}
                  >
                    US Dollar (USD)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ceylon Earl Grey Supreme"
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-serendip-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-serendip-500"
                  >
                    <option value="Tea">Tea</option>
                    <option value="Gems">Gems</option>
                    <option value="Spices">Spices</option>
                    <option value="Crafts">Crafts</option>
                    <option value="Apparel">Apparel</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">
                    Price in {currencyMode} *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    required
                    value={priceVal}
                    onChange={(e) => setPriceVal(e.target.value)}
                    placeholder={currencyMode === 'LKR' ? '3000.00' : '10.00'}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-serendip-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Stock Quantity *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-serendip-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Description *</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe origin, grade, harvest, or craftsmanship..."
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-serendip-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold disabled:opacity-50"
                >
                  {submitting ? 'Listing...' : 'Publish Product'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
