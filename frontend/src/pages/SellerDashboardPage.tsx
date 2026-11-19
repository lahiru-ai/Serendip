import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Package, 
  Layers, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  Upload, 
  Image as ImageIcon, 
  X, 
  Sparkles,
  Camera
} from 'lucide-react';
import { Product } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

/**
 * SERENDIP Seller Dashboard
 * Manage shop catalog listings, prices, inventory, and upload product images to database.
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
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Dedicated Image Upload Modal for an existing product
  const [selectedProductForImage, setSelectedProductForImage] = useState<Product | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const addFileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

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

  // Handle Image Selection for New Product Modal
  const handleAddImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setFeedback('Error: Image file size must be under 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setImagePreview(dataUrl);
        setImageUrl(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearAddImage = () => {
    setImagePreview(null);
    setImageUrl('');
    if (addFileInputRef.current) addFileInputRef.current.value = '';
  };

  // Handle Create Product
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
          imageUrl: imageUrl.trim() || undefined,
        });
      } else {
        await api.createProductUsd({
          sellerId: user.id,
          name,
          category,
          description,
          priceUsd: parseFloat(priceVal),
          stockQuantity: parseInt(stockQuantity, 10),
          imageUrl: imageUrl.trim() || undefined,
        });
      }
      setFeedback('Product published successfully with database image!');
      setShowAddModal(false);
      // Reset fields
      setName('');
      setDescription('');
      setPriceVal('');
      setImageUrl('');
      setImagePreview(null);
      loadSellerProducts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create product';
      setFeedback(`Error: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Image Selection for Existing Product Modal
  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setFeedback('Error: Image file size must be under 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setEditImagePreview(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save Image for Existing Product
  const handleSaveProductImage = async () => {
    if (!selectedProductForImage || !editImagePreview) return;
    setUploadingImage(true);
    setFeedback(null);
    try {
      await api.updateProductImage(selectedProductForImage.id, editImagePreview);
      setFeedback(`Product image saved to database successfully for "${selectedProductForImage.name}"!`);
      setSelectedProductForImage(null);
      setEditImagePreview(null);
      loadSellerProducts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save product image';
      setFeedback(`Error: ${msg}`);
    } finally {
      setUploadingImage(false);
    }
  };

  if (!user || user.role !== 'SELLER') {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-[#FFFFFF] border border-[#D6CBB5] rounded-3xl text-center shadow-premium space-y-4">
        <h2 className="font-serif text-xl font-bold text-[#222B1F]">Merchant Portal Access</h2>
        <p className="text-xs text-[#7A755D]">Please log in with a registered SELLER account to access this merchant suite.</p>
        <Link to="/login" className="inline-block px-5 py-2.5 bg-[#315D4F] text-[#F9F6EF] rounded-xl text-xs font-semibold hover:bg-[#19372E] transition-colors">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      
      {/* Header */}
      <div className="border-b border-[#D6CBB5] pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#315D4F] text-xs font-bold uppercase tracking-wider">
            <Layers className="w-4 h-4 text-[#A48B57]" />
            <span>Sri Lankan Artisan Merchant Suite</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-[#222B1F] mt-1">
            Merchant Dashboard
          </h1>
          <p className="text-xs text-[#7A755D] mt-1">
            Merchant: <span className="font-bold text-[#222B1F]">{user.fullName}</span> ({user.email})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/seller/orders"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FFFFFF] hover:bg-[#E9E4D7] text-[#222B1F] border border-[#D6CBB5] font-semibold text-xs shadow-xs transition-all"
          >
            <Package className="w-4 h-4 text-[#315D4F]" />
            Orders & Consignments
          </Link>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#315D4F] hover:bg-[#19372E] text-[#F9F6EF] font-semibold text-xs shadow-heritage transition-all border border-[#A48B57]/50"
          >
            <Plus className="w-4 h-4 text-[#BD9F75]" />
            Add New Product
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-4 bg-[#E9E4D7] border border-[#A48B57] text-[#315D4F] rounded-2xl text-xs flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#315D4F] shrink-0" />
            <span className="font-semibold">{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-[#315D4F] hover:text-[#19372E]">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#D6CBB5] shadow-subtle space-y-1">
          <span className="text-[11px] font-bold text-[#7A755D] uppercase tracking-wider">Active Catalog</span>
          <p className="font-serif text-3xl font-bold text-[#222B1F]">{products.length}</p>
          <span className="text-[11px] text-[#315D4F] font-semibold block">Live in international marketplace</span>
        </div>

        <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#D6CBB5] shadow-subtle space-y-1">
          <span className="text-[11px] font-bold text-[#7A755D] uppercase tracking-wider">Total Inventory Stock</span>
          <p className="font-serif text-3xl font-bold text-[#222B1F]">
            {products.reduce((acc, p) => acc + p.stockQuantity, 0)}
          </p>
          <span className="text-[11px] text-[#7A755D] block">Units ready for worldwide dispatch</span>
        </div>

        <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#D6CBB5] shadow-subtle space-y-1">
          <span className="text-[11px] font-bold text-[#7A755D] uppercase tracking-wider">Production Origin</span>
          <p className="font-serif text-xl font-bold text-[#222B1F] truncate">{(user as any)?.originCity || 'Sri Lanka'}</p>
          <span className="text-[11px] text-[#7A755D] block">Verified artisan operating base</span>
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-[#FFFFFF] rounded-3xl border border-[#D6CBB5] overflow-hidden shadow-subtle">
        <div className="p-5 border-b border-[#D6CBB5]/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-serif font-bold text-[#222B1F] text-base">Your Listed Ceylon Products</h3>
            <span className="text-xs bg-[#E9E4D7] text-[#315D4F] px-2.5 py-0.5 rounded-full font-semibold">
              {products.length}
            </span>
          </div>
          <button
            type="button"
            onClick={loadSellerProducts}
            className="p-2 text-[#7A755D] hover:text-[#315D4F] hover:bg-[#E9E4D7] rounded-xl transition-colors"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-[#7A755D] animate-pulse">Loading merchant catalog...</div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#7A755D] space-y-3">
            <Package className="w-10 h-10 text-[#A48B57] mx-auto" />
            <p className="font-medium text-sm text-[#222B1F]">You have not listed any products yet.</p>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="text-[#315D4F] font-bold underline"
            >
              Add your first Ceylon product with photos →
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#E9E4D7]/60 text-[#7A755D] font-bold uppercase tracking-wider border-b border-[#D6CBB5]">
                <tr>
                  <th className="py-3.5 px-5">Image</th>
                  <th className="py-3.5 px-5">Product Name</th>
                  <th className="py-3.5 px-5">Category</th>
                  <th className="py-3.5 px-5">Price (USD)</th>
                  <th className="py-3.5 px-5">Price (LKR)</th>
                  <th className="py-3.5 px-5">Stock</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Image Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D6CBB5]/40 text-[#222B1F]">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F9F6EF] transition-colors">
                    {/* Image Thumbnail */}
                    <td className="py-3 px-5">
                      <div className="w-12 h-12 rounded-xl bg-[#E9E4D7] border border-[#D6CBB5] overflow-hidden flex items-center justify-center shrink-0">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-[#ADA78A]" />
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-5 font-serif font-bold text-sm text-[#222B1F]">
                      <Link to={`/products/${p.id}`} className="hover:text-[#315D4F] transition-colors">
                        {p.name}
                      </Link>
                    </td>

                    <td className="py-3 px-5">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#E9E4D7] text-[#315D4F] font-semibold text-[11px] border border-[#D6CBB5]">
                        {p.category}
                      </span>
                    </td>

                    <td className="py-3 px-5 font-bold">${p.priceUsd.toFixed(2)}</td>
                    <td className="py-3 px-5">Rs. {Number(p.priceLkr).toLocaleString()}</td>
                    
                    <td className="py-3 px-5 font-semibold">
                      <span className={p.stockQuantity < 5 ? 'text-amber-700 font-bold' : 'text-[#222B1F]'}>
                        {p.stockQuantity}
                      </span>
                    </td>

                    <td className="py-3 px-5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#315D4F] text-[#F9F6EF]">
                        {p.active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>

                    {/* Image Upload Action */}
                    <td className="py-3 px-5 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProductForImage(p);
                          setEditImagePreview(p.imageUrl || null);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E9E4D7] hover:bg-[#315D4F] text-[#222B1F] hover:text-[#F9F6EF] border border-[#D6CBB5] transition-all font-semibold text-xs"
                      >
                        <Camera className="w-3.5 h-3.5 text-[#A48B57]" />
                        <span>{p.imageUrl ? 'Change Image' : 'Upload Image'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Product Modal with Image Upload */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-[#D6CBB5] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#D6CBB5]/60">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#A48B57]" />
                <h3 className="font-serif text-xl font-bold text-[#222B1F]">Add New Ceylon Artifact</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-[#ADA78A] hover:text-[#222B1F] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              
              {/* Product Image Upload Section */}
              <div className="space-y-2">
                <label className="block font-semibold text-[#222B1F]">Product Image (Stored in Database)</label>
                
                <input
                  ref={addFileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleAddImageChange}
                  className="hidden"
                  id="add-product-image-file"
                />

                {imagePreview ? (
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-[#D6CBB5] bg-[#E9E4D7]">
                    <img
                      src={imagePreview}
                      alt="Product preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleClearAddImage}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-black transition-colors"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-[#315D4F] text-[#F9F6EF] px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                      Ready to store in database
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => addFileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#D6CBB5] hover:border-[#315D4F] hover:bg-[#E9E4D7]/30 transition-all rounded-2xl p-5 text-center cursor-pointer space-y-2"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#E9E4D7] flex items-center justify-center mx-auto text-[#315D4F]">
                      <Upload className="w-5 h-5 text-[#A48B57]" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#222B1F] text-xs">Click to upload product image</p>
                      <p className="text-[10px] text-[#7A755D] mt-0.5">JPG, PNG, or WebP up to 5MB (stored securely in database)</p>
                    </div>
                  </div>
                )}

                {/* Option to also paste image URL if preferred */}
                <div className="pt-1">
                  <input
                    type="text"
                    placeholder="Or paste external image URL..."
                    value={imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value);
                      setImagePreview(e.target.value || null);
                    }}
                    className="w-full px-3 py-2 bg-[#F9F6EF] text-[#222B1F] border border-[#D6CBB5] rounded-xl focus:outline-none focus:border-[#315D4F] text-xs"
                  />
                </div>
              </div>

              {/* Currency selection */}
              <div>
                <label className="block font-semibold text-[#222B1F] mb-1">Pricing Currency</label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-[#E9E4D7] rounded-xl border border-[#D6CBB5]">
                  <button
                    type="button"
                    onClick={() => setCurrencyMode('LKR')}
                    className={`py-1.5 rounded-lg font-bold transition-all ${
                      currencyMode === 'LKR' ? 'bg-[#315D4F] text-[#F9F6EF] shadow-xs' : 'text-[#7A755D]'
                    }`}
                  >
                    Sri Lankan Rupee (LKR)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrencyMode('USD')}
                    className={`py-1.5 rounded-lg font-bold transition-all ${
                      currencyMode === 'USD' ? 'bg-[#315D4F] text-[#F9F6EF] shadow-xs' : 'text-[#7A755D]'
                    }`}
                  >
                    US Dollar (USD)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#222B1F] mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ceylon Silver Tips White Tea"
                  className="w-full px-3 py-2 bg-[#F9F6EF] text-[#222B1F] border border-[#D6CBB5] rounded-xl focus:outline-none focus:border-[#315D4F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#222B1F] mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F9F6EF] text-[#222B1F] border border-[#D6CBB5] rounded-xl focus:outline-none focus:border-[#315D4F]"
                  >
                    <option value="Tea">Tea</option>
                    <option value="Gems">Gems</option>
                    <option value="Spices">Spices</option>
                    <option value="Crafts">Crafts</option>
                    <option value="Apparel">Apparel</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#222B1F] mb-1">
                    Price in {currencyMode} *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    required
                    value={priceVal}
                    onChange={(e) => setPriceVal(e.target.value)}
                    placeholder={currencyMode === 'LKR' ? '7500.00' : '25.00'}
                    className="w-full px-3 py-2 bg-[#F9F6EF] text-[#222B1F] border border-[#D6CBB5] rounded-xl focus:outline-none focus:border-[#315D4F]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#222B1F] mb-1">Initial Stock Quantity *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F9F6EF] text-[#222B1F] border border-[#D6CBB5] rounded-xl focus:outline-none focus:border-[#315D4F]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#222B1F] mb-1">Product Description *</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe regional origin, harvest estate, grade or master craftsmanship..."
                  className="w-full px-3 py-2 bg-[#F9F6EF] text-[#222B1F] border border-[#D6CBB5] rounded-xl focus:outline-none focus:border-[#315D4F]"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-[#D6CBB5]/60">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#E9E4D7] hover:bg-[#D6CBB5] text-[#222B1F] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-[#315D4F] hover:bg-[#19372E] text-[#F9F6EF] font-bold uppercase tracking-wider border border-[#A48B57]/50 shadow-heritage disabled:opacity-50"
                >
                  {submitting ? 'Publishing...' : 'Publish Product to Catalog'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Edit Image Modal for an Existing Product */}
      {selectedProductForImage && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-[#D6CBB5]">
            <div className="flex items-center justify-between pb-3 border-b border-[#D6CBB5]/60">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-[#315D4F]" />
                <h3 className="font-serif text-lg font-bold text-[#222B1F]">Update Product Image</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedProductForImage(null);
                  setEditImagePreview(null);
                }}
                className="p-1 text-[#ADA78A] hover:text-[#222B1F]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#7A755D]">
              Upload or update the photo for <strong className="text-[#222B1F] font-serif">{selectedProductForImage.name}</strong>. It will be stored directly in the database.
            </p>

            <input
              ref={editFileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleEditImageChange}
              className="hidden"
              id="edit-product-image-file"
            />

            {editImagePreview ? (
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-[#D6CBB5] bg-[#E9E4D7]">
                <img
                  src={editImagePreview}
                  alt="Product preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setEditImagePreview(null)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-black transition-colors"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 left-2 bg-[#315D4F] text-[#F9F6EF] px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                  New Image Selected
                </div>
              </div>
            ) : (
              <div
                onClick={() => editFileInputRef.current?.click()}
                className="border-2 border-dashed border-[#D6CBB5] hover:border-[#315D4F] hover:bg-[#E9E4D7]/30 transition-all rounded-2xl p-6 text-center cursor-pointer space-y-2"
              >
                <div className="w-10 h-10 rounded-full bg-[#E9E4D7] flex items-center justify-center mx-auto text-[#315D4F]">
                  <Upload className="w-5 h-5 text-[#A48B57]" />
                </div>
                <div>
                  <p className="font-semibold text-[#222B1F] text-xs">Choose photo from your device</p>
                  <p className="text-[10px] text-[#7A755D] mt-0.5">JPG, PNG, WebP up to 5MB</p>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-[#7A755D]">Or paste direct image URL</label>
              <input
                type="text"
                placeholder="https://..."
                value={editImagePreview?.startsWith('data:') ? '' : editImagePreview || ''}
                onChange={(e) => setEditImagePreview(e.target.value)}
                className="w-full px-3 py-2 bg-[#F9F6EF] text-[#222B1F] border border-[#D6CBB5] rounded-xl text-xs focus:outline-none focus:border-[#315D4F]"
              />
            </div>

            <div className="pt-3 flex justify-end gap-3 border-t border-[#D6CBB5]/60">
              <button
                type="button"
                onClick={() => {
                  setSelectedProductForImage(null);
                  setEditImagePreview(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-[#E9E4D7] text-[#222B1F] font-semibold text-xs hover:bg-[#D6CBB5]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={uploadingImage || !editImagePreview}
                onClick={handleSaveProductImage}
                className="px-5 py-2.5 rounded-xl bg-[#315D4F] hover:bg-[#19372E] text-[#F9F6EF] font-bold text-xs uppercase tracking-wider border border-[#A48B57]/50 shadow-heritage disabled:opacity-50"
              >
                {uploadingImage ? 'Saving...' : 'Save to Database'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
