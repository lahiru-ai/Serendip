import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  CreditCard,
  Wallet,
  Landmark,
  Lock,
  Copy,
  Check,
  Info,
  Upload,
  FileCheck,
  FileText,
  X
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Order, PaymentMethodType } from '../types';

/**
 * Checkout page supporting Card Payment, PayPal, and Bank Transfer with Deposit Slip submission.
 */
export const CheckoutPage: React.FC = () => {
  const { cart, clearCart } = useCart();
  const { formatPrice, currency } = useCurrency();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Selected payment method
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('CARD_PAYMENT');

  // Card details
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState(user?.fullName || '');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  // PayPal details
  const [paypalEmail, setPaypalEmail] = useState(user?.email || '');

  // Bank Transfer details
  const [bankReference, setBankReference] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [depositSlipFile, setDepositSlipFile] = useState<File | null>(null);
  const [depositSlipPreview, setDepositSlipPreview] = useState<string | null>(null);
  const [depositSlipName, setDepositSlipName] = useState<string>('');

  // Optional simulation flag for test mode
  const [simulateSuccess, setSimulateSuccess] = useState(true);

  if (!user || user.role !== 'BUYER') {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white border border-zinc-200/80 rounded-3xl text-center shadow-premium">
        <h2 className="text-lg font-bold text-zinc-900">Sign In Required</h2>
        <p className="text-xs text-zinc-500 mt-2 mb-4">You must be signed in as a buyer to check out.</p>
        <Link to="/login" className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-semibold">
          Sign In
        </Link>
      </div>
    );
  }

  const items = cart?.items || [];
  if (items.length === 0 && !completedOrder) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white border border-zinc-200/80 rounded-3xl text-center shadow-premium space-y-4">
        <h2 className="text-lg font-bold text-zinc-900">Your Cart is Empty</h2>
        <p className="text-xs text-zinc-500">Add products to your cart before proceeding to checkout.</p>
        <Link to="/catalog" className="inline-block px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-semibold">
          Return to Catalog
        </Link>
      </div>
    );
  }

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatCardInput = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiryInput = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 2) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    return digits;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Deposit slip file size exceeds 10MB limit.');
        return;
      }
      setDepositSlipFile(file);
      setDepositSlipName(file.name);
      setError(null);

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setDepositSlipPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setDepositSlipPreview(null);
      }
    }
  };

  const handleRemoveFile = () => {
    setDepositSlipFile(null);
    setDepositSlipPreview(null);
    setDepositSlipName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    setError(null);

    // Validation per method
    if (selectedMethod === 'CARD_PAYMENT') {
      if (cardNumber.replace(/\s+/g, '').length < 12) {
        setError('Please enter a valid card number (at least 12-16 digits).');
        setLoading(false);
        return;
      }
      if (!cardHolder.trim()) {
        setError('Please provide the cardholder name.');
        setLoading(false);
        return;
      }
      if (!cardExpiry.includes('/') || cardExpiry.length < 5) {
        setError('Please provide expiry date in MM/YY format.');
        setLoading(false);
        return;
      }
      if (cardCvc.trim().length < 3) {
        setError('Please provide a 3 or 4 digit CVC security code.');
        setLoading(false);
        return;
      }
    } else if (selectedMethod === 'PAYPAL') {
      if (!paypalEmail.trim() || !paypalEmail.includes('@')) {
        setError('Please enter a valid PayPal account email address.');
        setLoading(false);
        return;
      }
    } else if (selectedMethod === 'BANK_TRANSFER') {
      // Require deposit slip to be submitted for bank deposit
      if (!depositSlipFile && !depositSlipName) {
        setError('Please upload or attach your bank deposit slip / receipt to complete checkout.');
        setLoading(false);
        return;
      }
    }

    try {
      const order = await api.checkout(
        user.id,
        simulateSuccess,
        selectedMethod,
        {
          cardNumber: cardNumber.replace(/\s+/g, ''),
          cardExpiry,
          cardCvc,
          cardHolder,
          paypalEmail,
          bankReference: bankReference.trim(),
          depositSlipUrl: depositSlipPreview || (depositSlipFile ? depositSlipFile.name : undefined),
          depositSlipName: depositSlipName || undefined,
        }
      );
      setCompletedOrder(order);
      await clearCart();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Order checkout failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const getMethodDisplayName = (name?: string) => {
    switch (name) {
      case 'CARD_PAYMENT':
      case 'CARD':
        return 'Credit / Debit Card';
      case 'PAYPAL':
        return 'PayPal';
      case 'BANK_TRANSFER':
      case 'BANK':
        return 'Bank Transfer / Deposit';
      default:
        return name || 'Payment Gateway';
    }
  };

  if (completedOrder) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 sm:p-12 bg-white border border-zinc-200/80 rounded-3xl text-center shadow-premium space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Order Confirmed</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900">Thank you for your order!</h2>
          <p className="text-xs text-zinc-500">
            Order Reference: <span className="font-mono font-bold text-zinc-800">{completedOrder.orderNumber}</span>
          </p>
        </div>

        {/* Payment Summary Box */}
        <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 text-left text-xs space-y-2.5 max-w-md mx-auto">
          <div className="flex justify-between items-center text-zinc-600">
            <span>Payment Method:</span>
            <span className="font-semibold text-zinc-900">{getMethodDisplayName(completedOrder.paymentMethodName)}</span>
          </div>
          {completedOrder.payment?.transactionReference && (
            <div className="flex justify-between items-center text-zinc-600">
              <span>Transaction Ref:</span>
              <span className="font-mono font-medium text-zinc-800">{completedOrder.payment.transactionReference}</span>
            </div>
          )}
          {depositSlipName && (
            <div className="flex justify-between items-center text-zinc-600">
              <span>Deposit Slip:</span>
              <span className="font-medium text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md text-[11px] flex items-center gap-1">
                <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                {depositSlipName} (Submitted)
              </span>
            </div>
          )}
          <div className="flex justify-between items-center text-zinc-600">
            <span>Total Amount:</span>
            <span className="font-bold text-emerald-700">{formatPrice(completedOrder.totalAmount)}</span>
          </div>
          <div className="flex justify-between items-center text-zinc-600">
            <span>Status:</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              {completedOrder.status}
            </span>
          </div>
        </div>

        <p className="text-xs text-zinc-600 max-w-sm mx-auto leading-relaxed">
          Your order and deposit details have been recorded and will be verified by the admin and artisan merchants in Sri Lanka.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/orders"
            className="px-6 py-3 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition-colors"
          >
            View My Orders
          </Link>
          <Link
            to="/catalog"
            className="px-6 py-3 bg-zinc-100 text-zinc-800 rounded-xl text-xs font-semibold hover:bg-zinc-200 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      
      <div>
        <Link to="/cart" className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 mb-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Cart
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">Checkout</h1>
        <p className="text-xs text-zinc-500 mt-1">Select your preferred payment method and confirm your order.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Left: Summary list */}
        <div className="md:col-span-6 bg-white rounded-3xl border border-zinc-200/80 p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-zinc-900 text-sm pb-2 border-b border-zinc-100">
            Items to Purchase ({cart?.totalItemCount})
          </h3>
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-xs">
                <div>
                  <p className="font-semibold text-zinc-900">{item.productName}</p>
                  <p className="text-zinc-400">Qty: {item.quantity} • Merchant: {item.sellerShopName || 'Verified'}</p>
                </div>
                <span className="font-bold text-zinc-800">{formatPrice(item.subtotal)}</span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-zinc-100 space-y-2 text-xs">
            <div className="flex justify-between text-zinc-600">
              <span>Subtotal</span>
              <span className="font-semibold text-zinc-900">{formatPrice(cart?.total || 0)}</span>
            </div>
            <div className="flex justify-between text-zinc-600">
              <span>Currency Basis</span>
              <span className="font-semibold text-zinc-900">{currency}</span>
            </div>
            <div className="flex justify-between text-zinc-600">
              <span>Shipping & Insurance</span>
              <span className="font-semibold text-emerald-700">Calculated</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-zinc-900 pt-2 border-t border-zinc-100">
              <span>Grand Total</span>
              <span className="text-serendip-700">{formatPrice(cart?.total || 0)}</span>
            </div>
          </div>
        </div>

        {/* Right: Payment Method Selection & Inputs */}
        <div className="md:col-span-6 bg-white rounded-3xl border border-zinc-200/80 p-6 shadow-sm space-y-5">
          <h3 className="font-semibold text-zinc-900 text-sm flex items-center justify-between">
            <span>Payment Method</span>
            <span className="text-[11px] font-normal text-zinc-400 flex items-center gap-1">
              <Lock className="w-3 h-3" /> Encrypted
            </span>
          </h3>

          {/* Method selector tabs */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => { setSelectedMethod('CARD_PAYMENT'); setError(null); }}
              className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                selectedMethod === 'CARD_PAYMENT'
                  ? 'border-zinc-900 bg-zinc-900 text-white shadow-sm'
                  : 'border-zinc-200 bg-zinc-50/50 hover:bg-zinc-100 text-zinc-700'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              <span className="text-xs font-semibold">Card</span>
            </button>

            <button
              type="button"
              onClick={() => { setSelectedMethod('PAYPAL'); setError(null); }}
              className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                selectedMethod === 'PAYPAL'
                  ? 'border-zinc-900 bg-zinc-900 text-white shadow-sm'
                  : 'border-zinc-200 bg-zinc-50/50 hover:bg-zinc-100 text-zinc-700'
              }`}
            >
              <Wallet className="w-5 h-5" />
              <span className="text-xs font-semibold">PayPal</span>
            </button>

            <button
              type="button"
              onClick={() => { setSelectedMethod('BANK_TRANSFER'); setError(null); }}
              className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                selectedMethod === 'BANK_TRANSFER'
                  ? 'border-zinc-900 bg-zinc-900 text-white shadow-sm'
                  : 'border-zinc-200 bg-zinc-50/50 hover:bg-zinc-100 text-zinc-700'
              }`}
            >
              <Landmark className="w-5 h-5" />
              <span className="text-xs font-semibold">Bank Wire</span>
            </button>
          </div>

          {/* 1. Credit / Debit Card Form */}
          {selectedMethod === 'CARD_PAYMENT' && (
            <div className="space-y-3 pt-2 text-xs animate-fadeIn">
              <div className="flex items-center justify-between text-zinc-500 text-[11px] pb-1">
                <span>Credit or Debit Card</span>
                <span className="font-medium text-zinc-400">Visa • Mastercard • Amex</span>
              </div>

              <div>
                <label className="block text-zinc-600 font-medium mb-1">Cardholder Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="block text-zinc-600 font-medium mb-1">Card Number</label>
                <input
                  type="text"
                  placeholder="4532 0000 0000 8821"
                  maxLength={19}
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardInput(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-600 font-medium mb-1">Expiry Date</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    maxLength={5}
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(formatExpiryInput(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-zinc-600 font-medium mb-1">Security Code (CVC)</label>
                  <input
                    type="password"
                    placeholder="123"
                    maxLength={4}
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2. PayPal Form */}
          {selectedMethod === 'PAYPAL' && (
            <div className="space-y-3 pt-2 text-xs animate-fadeIn">
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-start gap-2.5 text-blue-900">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-blue-950">PayPal Buyer Protection</p>
                  <p className="text-[11px] text-blue-800 leading-relaxed">
                    Check out quickly using your PayPal account balance, linked credit card, or bank account.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-zinc-600 font-medium mb-1">PayPal Account Email</label>
                <input
                  type="email"
                  placeholder="your-email@paypal.com"
                  value={paypalEmail}
                  onChange={(e) => setPaypalEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900"
                />
              </div>
            </div>
          )}

          {/* 3. Bank Transfer & Deposit Slip Form */}
          {selectedMethod === 'BANK_TRANSFER' && (
            <div className="space-y-3.5 pt-2 text-xs animate-fadeIn">
              {/* Bank Account Info Box */}
              <div className="p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-2xl space-y-2 text-zinc-800">
                <div className="flex items-center justify-between pb-1 border-b border-amber-200/50">
                  <span className="font-semibold text-amber-950">Bank Wire Escrow Account</span>
                  <span className="text-[10px] uppercase font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                    Direct Deposit
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-zinc-500 block">Bank Name:</span>
                    <span className="font-semibold text-zinc-900">Commercial Bank PLC</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">SWIFT / BIC:</span>
                    <span className="font-mono font-semibold text-zinc-900">CCEYLKLX</span>
                  </div>
                  <div className="col-span-2 flex items-center justify-between bg-white/70 p-2 rounded-xl border border-amber-200/40">
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Account Number:</span>
                      <span className="font-mono font-bold text-zinc-900 text-xs">8842 1099 4201</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy('884210994201', 'acc')}
                      className="text-zinc-500 hover:text-zinc-900 flex items-center gap-1 text-[10px]"
                    >
                      {copiedField === 'acc' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedField === 'acc' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="col-span-2">
                    <span className="text-zinc-500 block">Beneficiary:</span>
                    <span className="font-semibold text-zinc-900">SERENDIP MARKETPLACE ESCROW</span>
                  </div>
                </div>
              </div>

              {/* Deposit Slip Upload Section */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-zinc-800 font-semibold flex items-center gap-1">
                    <span>Bank Deposit Slip / Receipt</span>
                    <span className="text-red-500 font-bold">*</span>
                  </label>
                  <span className="text-[10px] text-zinc-400">PNG, JPG, PDF up to 10MB</span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="deposit-slip-input"
                />

                {!depositSlipFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-zinc-300 hover:border-zinc-500 hover:bg-zinc-50/70 transition-all rounded-2xl p-4 text-center cursor-pointer space-y-1.5"
                  >
                    <div className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-600">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-zinc-800 text-xs">Click to upload deposit slip</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">Attach a photo or scan of your bank deposit receipt</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          {depositSlipPreview ? (
                            <img
                              src={depositSlipPreview}
                              alt="Deposit Slip Preview"
                              className="w-8 h-8 object-cover rounded-lg"
                            />
                          ) : (
                            <FileText className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-zinc-900 truncate text-xs">{depositSlipName}</p>
                          <p className="text-[10px] text-zinc-400">{formatFileSize(depositSlipFile.size)} • Ready to submit</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="p-1 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {depositSlipPreview && (
                      <div className="mt-2 pt-2 border-t border-zinc-200/60">
                        <img
                          src={depositSlipPreview}
                          alt="Slip Preview"
                          className="max-h-32 w-auto mx-auto rounded-lg border border-zinc-200 object-contain shadow-xs"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Wire reference input */}
              <div>
                <label className="block text-zinc-600 font-medium mb-1">
                  Wire / Slip Reference Code <span className="text-zinc-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. SLIP-849204 or Transaction No."
                  value={bankReference}
                  onChange={(e) => setBankReference(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900"
                />
              </div>
            </div>
          )}

          {/* Test Mode Simulation Toggle */}
          <div className="pt-2 flex items-center justify-between text-[11px] text-zinc-500 border-t border-zinc-100">
            <span>Payment Simulation:</span>
            <button
              type="button"
              onClick={() => setSimulateSuccess(!simulateSuccess)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                simulateSuccess
                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  : 'bg-red-50 text-red-700 hover:bg-red-100'
              }`}
            >
              {simulateSuccess ? 'Simulate Approval' : 'Simulate Decline'}
            </button>
          </div>

          <button
            type="button"
            onClick={handlePlaceOrder}
            disabled={loading}
            className="w-full py-3.5 px-5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
          >
            {loading ? (
              <span>Submitting {getMethodDisplayName(selectedMethod)}...</span>
            ) : (
              <span>Pay with {getMethodDisplayName(selectedMethod)} • {formatPrice(cart?.total || 0)}</span>
            )}
          </button>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-400">
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span>256-bit SSL encrypted checkout & escrow protection</span>
          </div>
        </div>

      </div>

    </div>
  );
};
