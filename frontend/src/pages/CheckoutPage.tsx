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
  X,
  Sparkles
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Order, PaymentMethodType } from '../types';

/**
 * SERENDIP Checkout Page
 * Supports Credit Card, PayPal, and Direct Bank Wire Transfer with Deposit Slip upload.
 * Styled in Heritage Green (#315D4F), Antique Gold (#A48B57), and Warm Ivory (#F9F6EF).
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
      <div className="max-w-md mx-auto my-20 p-8 sm:p-10 bg-[#FFFFFF] border border-[#D6CBB5] rounded-3xl text-center shadow-premium space-y-4">
        <h2 className="font-serif text-xl font-bold text-[#222B1F]">Sign In Required</h2>
        <p className="text-xs text-[#7A755D]">You must be signed in as a buyer to check out.</p>
        <Link 
          to="/login" 
          className="inline-block px-5 py-2.5 bg-[#315D4F] text-[#F9F6EF] rounded-xl text-xs font-semibold hover:bg-[#19372E] transition-colors"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const items = cart?.items || [];
  if (items.length === 0 && !completedOrder) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-[#FFFFFF] border border-[#D6CBB5] rounded-3xl text-center shadow-premium space-y-4">
        <h2 className="font-serif text-xl font-bold text-[#222B1F]">Your Cart is Empty</h2>
        <p className="text-xs text-[#7A755D]">Add products to your cart before proceeding to checkout.</p>
        <Link 
          to="/catalog" 
          className="inline-block px-5 py-2.5 bg-[#315D4F] text-[#F9F6EF] rounded-xl text-xs font-semibold hover:bg-[#19372E] transition-colors"
        >
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
        setError('Deposit slip file must be under 10MB');
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
    setError(null);

    // Validation per payment method
    if (selectedMethod === 'CARD_PAYMENT') {
      const cleanCard = cardNumber.replace(/\s/g, '');
      if (cleanCard.length < 13 || cleanCard.length > 19) {
        setError('Please enter a valid 16-digit card number');
        return;
      }
      if (!cardExpiry || cardExpiry.length < 5) {
        setError('Please enter expiration date (MM/YY)');
        return;
      }
      if (!cardCvc || cardCvc.length < 3) {
        setError('Please enter the 3 or 4-digit security code (CVC)');
        return;
      }
    } else if (selectedMethod === 'PAYPAL') {
      if (!paypalEmail || !paypalEmail.includes('@')) {
        setError('Please enter a valid PayPal account email');
        return;
      }
    } else if (selectedMethod === 'BANK_TRANSFER') {
      if (!depositSlipFile && !bankReference.trim()) {
        setError('Please either attach a photo of your deposit slip or provide a bank reference code');
        return;
      }
    }

    try {
      setLoading(true);

      const paymentDetails: {
        cardNumber?: string;
        cardExpiry?: string;
        cardCvc?: string;
        cardHolder?: string;
        paypalEmail?: string;
        bankReference?: string;
        depositSlipUrl?: string;
        depositSlipName?: string;
      } = {};

      if (selectedMethod === 'CARD_PAYMENT') {
        paymentDetails.cardNumber = cardNumber.replace(/\s/g, '');
        paymentDetails.cardExpiry = cardExpiry;
        paymentDetails.cardCvc = cardCvc;
        paymentDetails.cardHolder = cardHolder;
      } else if (selectedMethod === 'PAYPAL') {
        paymentDetails.paypalEmail = paypalEmail;
      } else if (selectedMethod === 'BANK_TRANSFER') {
        paymentDetails.bankReference = bankReference.trim();
        paymentDetails.depositSlipName = depositSlipName;
        if (depositSlipPreview) {
          paymentDetails.depositSlipUrl = depositSlipPreview;
        } else if (depositSlipName) {
          paymentDetails.depositSlipUrl = `uploads/slips/${Date.now()}_${depositSlipName}`;
        }
      }

      const order = await api.checkout(
        user.id,
        simulateSuccess,
        selectedMethod,
        paymentDetails
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
      <div className="max-w-xl mx-auto my-16 p-8 sm:p-12 bg-[#FFFFFF] border border-[#D6CBB5] rounded-3xl text-center shadow-premium space-y-6">
        <div className="w-16 h-16 rounded-full bg-[#E9E4D7] text-[#315D4F] border border-[#A48B57] flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10 text-[#315D4F]" />
        </div>
        
        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#A48B57] block">
            Payment Recorded & Confirmed
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#222B1F]">
            Ayubowan! Thank you for your order.
          </h2>
          <p className="text-xs text-[#7A755D]">
            Order Reference: <span className="font-mono font-bold text-[#315D4F]">{completedOrder.orderNumber}</span>
          </p>
        </div>

        {/* Payment Summary Box */}
        <div className="p-5 bg-[#F9F6EF] rounded-2xl border border-[#D6CBB5] text-left text-xs space-y-2.5 max-w-md mx-auto">
          <div className="flex justify-between items-center text-[#7A755D]">
            <span>Payment Method:</span>
            <span className="font-semibold text-[#222B1F]">{getMethodDisplayName(completedOrder.paymentMethodName)}</span>
          </div>
          {completedOrder.payment?.transactionReference && (
            <div className="flex justify-between items-center text-[#7A755D]">
              <span>Transaction Ref:</span>
              <span className="font-mono font-medium text-[#222B1F]">{completedOrder.payment.transactionReference}</span>
            </div>
          )}
          {depositSlipName && (
            <div className="flex justify-between items-center text-[#7A755D]">
              <span>Deposit Slip:</span>
              <span className="font-medium text-[#315D4F] bg-[#E9E4D7] px-2 py-0.5 rounded-md text-[11px] flex items-center gap-1 border border-[#D6CBB5]">
                <FileCheck className="w-3.5 h-3.5 text-[#315D4F]" />
                {depositSlipName} (Submitted)
              </span>
            </div>
          )}
          <div className="flex justify-between items-center text-[#7A755D]">
            <span>Total Amount:</span>
            <span className="font-serif font-bold text-[#315D4F] text-sm">{formatPrice(completedOrder.totalAmount)}</span>
          </div>
          <div className="flex justify-between items-center text-[#7A755D]">
            <span>Status:</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#315D4F] text-[#F9F6EF]">
              {completedOrder.status}
            </span>
          </div>
        </div>

        <p className="text-xs text-[#7A755D] max-w-sm mx-auto leading-relaxed">
          Your order and deposit details have been recorded and will be verified by the admin and artisan merchants in Sri Lanka.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/orders"
            className="px-6 py-3.5 bg-[#315D4F] text-[#F9F6EF] rounded-xl text-xs font-bold hover:bg-[#19372E] transition-colors border border-[#A48B57]/40 shadow-xs"
          >
            View My Orders
          </Link>
          <Link
            to="/catalog"
            className="px-6 py-3.5 bg-[#E9E4D7] text-[#222B1F] rounded-xl text-xs font-semibold hover:bg-[#D6CBB5] transition-colors border border-[#D6CBB5]"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-8">
      
      <div>
        <Link to="/cart" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#315D4F] hover:text-[#19372E] mb-2 group">
          <ArrowLeft className="w-4 h-4 text-[#A48B57] group-hover:-translate-x-1 transition-transform" />
          Back to Shopping Cart
        </Link>
        <h1 className="font-serif text-3xl font-bold text-[#222B1F] tracking-tight">Checkout & Payment</h1>
        <p className="text-xs text-[#7A755D] mt-1">Select your preferred payment method and confirm your order.</p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Left: Summary list */}
        <div className="md:col-span-6 bg-[#FFFFFF] rounded-3xl border border-[#D6CBB5] p-6 shadow-subtle space-y-4">
          <h3 className="font-serif font-bold text-[#222B1F] text-base pb-2 border-b border-[#D6CBB5]/60 flex items-center justify-between">
            <span>Items to Purchase ({cart?.totalItemCount})</span>
            <Sparkles className="w-4 h-4 text-[#A48B57]" />
          </h3>
          
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-xs pb-2 border-b border-[#D6CBB5]/30">
                <div>
                  <p className="font-serif font-bold text-[#222B1F]">{item.productName}</p>
                  <p className="text-[#7A755D] text-[11px]">Qty: {item.quantity} • Merchant: {item.sellerShopName || 'Ceylon Heritage Guild'}</p>
                </div>
                <span className="font-serif font-bold text-[#315D4F]">{formatPrice(item.subtotal)}</span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-[#D6CBB5] space-y-2 text-xs">
            <div className="flex justify-between text-[#7A755D]">
              <span>Subtotal</span>
              <span className="font-semibold text-[#222B1F]">{formatPrice(cart?.total || 0)}</span>
            </div>
            <div className="flex justify-between text-[#7A755D]">
              <span>Currency Basis</span>
              <span className="font-semibold text-[#222B1F]">{currency}</span>
            </div>
            <div className="flex justify-between text-[#7A755D]">
              <span>Export Handling & Packing</span>
              <span className="font-semibold text-[#315D4F]">Complimentary</span>
            </div>
            <div className="flex justify-between text-base font-bold text-[#222B1F] pt-3 border-t border-[#D6CBB5]">
              <span className="font-serif">Grand Total</span>
              <span className="font-serif text-xl text-[#315D4F]">{formatPrice(cart?.total || 0)}</span>
            </div>
          </div>
        </div>

        {/* Right: Payment Method Selection & Inputs */}
        <div className="md:col-span-6 bg-[#FFFFFF] rounded-3xl border border-[#D6CBB5] p-6 shadow-premium space-y-5">
          <h3 className="font-serif font-bold text-[#222B1F] text-base flex items-center justify-between">
            <span>Payment Method</span>
            <span className="text-[11px] font-normal text-[#7A755D] flex items-center gap-1">
              <Lock className="w-3 h-3 text-[#315D4F]" /> Encrypted
            </span>
          </h3>

          {/* Method selector tabs */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => { setSelectedMethod('CARD_PAYMENT'); setError(null); }}
              className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                selectedMethod === 'CARD_PAYMENT'
                  ? 'border-[#A48B57] bg-[#315D4F] text-[#F9F6EF] shadow-xs'
                  : 'border-[#D6CBB5] bg-[#E9E4D7]/50 hover:bg-[#E9E4D7] text-[#222B1F]'
              }`}
            >
              <CreditCard className="w-5 h-5 text-[#BD9F75]" />
              <span className="text-xs font-semibold">Card</span>
            </button>

            <button
              type="button"
              onClick={() => { setSelectedMethod('PAYPAL'); setError(null); }}
              className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                selectedMethod === 'PAYPAL'
                  ? 'border-[#A48B57] bg-[#315D4F] text-[#F9F6EF] shadow-xs'
                  : 'border-[#D6CBB5] bg-[#E9E4D7]/50 hover:bg-[#E9E4D7] text-[#222B1F]'
              }`}
            >
              <Wallet className="w-5 h-5 text-[#BD9F75]" />
              <span className="text-xs font-semibold">PayPal</span>
            </button>

            <button
              type="button"
              onClick={() => { setSelectedMethod('BANK_TRANSFER'); setError(null); }}
              className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                selectedMethod === 'BANK_TRANSFER'
                  ? 'border-[#A48B57] bg-[#315D4F] text-[#F9F6EF] shadow-xs'
                  : 'border-[#D6CBB5] bg-[#E9E4D7]/50 hover:bg-[#E9E4D7] text-[#222B1F]'
              }`}
            >
              <Landmark className="w-5 h-5 text-[#BD9F75]" />
              <span className="text-xs font-semibold">Bank Wire</span>
            </button>
          </div>

          {/* 1. Credit / Debit Card Form */}
          {selectedMethod === 'CARD_PAYMENT' && (
            <div className="space-y-3 pt-2 text-xs">
              <div className="flex items-center justify-between text-[#7A755D] text-[11px] pb-1">
                <span>Credit or Debit Card</span>
                <span className="font-medium text-[#ADA78A]">Visa • Mastercard • Amex</span>
              </div>

              <div>
                <label className="block text-[#222B1F] font-semibold mb-1">Cardholder Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6CBB5] bg-[#F9F6EF] text-[#222B1F] focus:outline-none focus:border-[#315D4F]"
                />
              </div>

              <div>
                <label className="block text-[#222B1F] font-semibold mb-1">Card Number</label>
                <input
                  type="text"
                  placeholder="4532 0000 0000 8821"
                  maxLength={19}
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardInput(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6CBB5] bg-[#F9F6EF] text-[#222B1F] font-mono tracking-wider focus:outline-none focus:border-[#315D4F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#222B1F] font-semibold mb-1">Expiry Date</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    maxLength={5}
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(formatExpiryInput(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6CBB5] bg-[#F9F6EF] text-[#222B1F] font-mono focus:outline-none focus:border-[#315D4F]"
                  />
                </div>
                <div>
                  <label className="block text-[#222B1F] font-semibold mb-1">Security Code (CVC)</label>
                  <input
                    type="password"
                    placeholder="123"
                    maxLength={4}
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6CBB5] bg-[#F9F6EF] text-[#222B1F] font-mono focus:outline-none focus:border-[#315D4F]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2. PayPal Form */}
          {selectedMethod === 'PAYPAL' && (
            <div className="space-y-3 pt-2 text-xs">
              <div className="p-3.5 bg-[#E9E4D7] border border-[#D6CBB5] rounded-2xl flex items-start gap-2.5 text-[#222B1F]">
                <Info className="w-4 h-4 text-[#315D4F] shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-serif font-bold text-[#222B1F]">PayPal Buyer Protection</p>
                  <p className="text-[11px] text-[#7A755D] leading-relaxed">
                    Check out quickly using your PayPal account balance, linked card, or bank account.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-[#222B1F] font-semibold mb-1">PayPal Account Email</label>
                <input
                  type="email"
                  placeholder="your-email@paypal.com"
                  value={paypalEmail}
                  onChange={(e) => setPaypalEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6CBB5] bg-[#F9F6EF] text-[#222B1F] focus:outline-none focus:border-[#315D4F]"
                />
              </div>
            </div>
          )}

          {/* 3. Bank Transfer & Deposit Slip Form */}
          {selectedMethod === 'BANK_TRANSFER' && (
            <div className="space-y-3.5 pt-2 text-xs">
              {/* Bank Account Info Box */}
              <div className="p-4 bg-[#E9E4D7]/70 border border-[#D6CBB5] rounded-2xl space-y-2 text-[#222B1F]">
                <div className="flex items-center justify-between pb-1 border-b border-[#D6CBB5]/60">
                  <span className="font-serif font-bold text-[#222B1F]">Bank Wire Escrow Account</span>
                  <span className="text-[10px] uppercase font-bold text-[#19372E] bg-[#A48B57] px-2 py-0.5 rounded-full">
                    Direct Deposit
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-[#7A755D] block">Bank Name:</span>
                    <span className="font-semibold text-[#222B1F]">Commercial Bank PLC (Colombo)</span>
                  </div>
                  <div>
                    <span className="text-[#7A755D] block">SWIFT / BIC:</span>
                    <span className="font-mono font-semibold text-[#222B1F]">CCEYLKLX</span>
                  </div>
                  <div className="col-span-2 flex items-center justify-between bg-[#FFFFFF] p-2 rounded-xl border border-[#D6CBB5]">
                    <div>
                      <span className="text-[#7A755D] block text-[10px]">Account Number:</span>
                      <span className="font-mono font-bold text-[#315D4F] text-xs">8842 1099 4201</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy('884210994201', 'acc')}
                      className="text-[#315D4F] hover:text-[#19372E] flex items-center gap-1 text-[10px] font-bold"
                    >
                      {copiedField === 'acc' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedField === 'acc' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[#7A755D] block">Beneficiary:</span>
                    <span className="font-semibold text-[#222B1F]">SERENDIP MARKETPLACE ESCROW</span>
                  </div>
                </div>
              </div>

              {/* Deposit Slip Upload Section */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[#222B1F] font-semibold flex items-center gap-1">
                    <span>Bank Deposit Slip / Receipt</span>
                    <span className="text-rose-600 font-bold">*</span>
                  </label>
                  <span className="text-[10px] text-[#ADA78A]">PNG, JPG, PDF up to 10MB</span>
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
                    className="border-2 border-dashed border-[#D6CBB5] hover:border-[#315D4F] hover:bg-[#E9E4D7]/40 transition-all rounded-2xl p-4 text-center cursor-pointer space-y-1.5"
                  >
                    <div className="w-9 h-9 rounded-full bg-[#E9E4D7] flex items-center justify-center mx-auto text-[#315D4F]">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#222B1F] text-xs">Click to upload deposit slip</p>
                      <p className="text-[10px] text-[#7A755D] mt-0.5">Attach a photo or scan of your bank deposit receipt</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-[#F9F6EF] border border-[#D6CBB5] rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="w-8 h-8 rounded-lg bg-[#315D4F] text-[#F9F6EF] flex items-center justify-center shrink-0">
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
                          <p className="font-semibold text-[#222B1F] truncate text-xs">{depositSlipName}</p>
                          <p className="text-[10px] text-[#7A755D]">{formatFileSize(depositSlipFile.size)} • Ready to submit</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="p-1 rounded-lg text-[#ADA78A] hover:text-rose-700 transition-colors"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {depositSlipPreview && (
                      <div className="mt-2 pt-2 border-t border-[#D6CBB5]">
                        <img
                          src={depositSlipPreview}
                          alt="Slip Preview"
                          className="max-h-32 w-auto mx-auto rounded-lg border border-[#D6CBB5] object-contain shadow-xs"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Wire reference input */}
              <div>
                <label className="block text-[#222B1F] font-semibold mb-1">
                  Wire / Slip Reference Code <span className="text-[#ADA78A] font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. SLIP-849204 or Transaction No."
                  value={bankReference}
                  onChange={(e) => setBankReference(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6CBB5] bg-[#F9F6EF] text-[#222B1F] font-mono focus:outline-none focus:border-[#315D4F]"
                />
              </div>
            </div>
          )}

          {/* Test Mode Simulation Toggle */}
          <div className="pt-2 flex items-center justify-between text-[11px] text-[#7A755D] border-t border-[#D6CBB5]/60">
            <span>Payment Gateway Simulator:</span>
            <button
              type="button"
              onClick={() => setSimulateSuccess(!simulateSuccess)}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                simulateSuccess
                  ? 'bg-[#E9E4D7] text-[#315D4F] border border-[#D6CBB5]'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {simulateSuccess ? 'Simulate Approval' : 'Simulate Decline'}
            </button>
          </div>

          <button
            type="button"
            onClick={handlePlaceOrder}
            disabled={loading}
            className="w-full py-4 px-5 rounded-xl bg-[#315D4F] hover:bg-[#19372E] text-[#F9F6EF] font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-heritage border border-[#A48B57]/50"
          >
            {loading ? (
              <span>Submitting {getMethodDisplayName(selectedMethod)}...</span>
            ) : (
              <span>Pay with {getMethodDisplayName(selectedMethod)} • {formatPrice(cart?.total || 0)}</span>
            )}
          </button>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#7A755D]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#315D4F] shrink-0" />
            <span>256-bit SSL encrypted checkout & escrow protection</span>
          </div>
        </div>

      </div>

    </div>
  );
};
