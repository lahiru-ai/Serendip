export type Role = 'BUYER' | 'SELLER' | 'ADMIN';

export type Currency = 'USD' | 'LKR';

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  accountStatus: 'ACTIVE' | 'SUSPENDED';
  phoneNumber?: string;
}

export interface Buyer extends User {
  deliveryAddress?: string;
}

export interface Seller extends User {
  shopName: string;
  originCity: string;
  commissionRate?: number;
}

export interface AuthResponse {
  userId: number;
  email: string;
  fullName: string;
  role: Role;
  message: string;
}

/** Product information for catalog display and management. */
export interface Product {
  id: number;
  sellerId: number;
  sellerShopName: string;
  name: string;
  category: string;
  description: string;
  priceUsd: number;
  priceLkr: number;
  currencyCode: string;
  stockQuantity: number;
  weightGrams?: number;
  active: boolean;
  imageUrl?: string;
}

export interface Review {
  id: number;
  buyerId: number;
  buyerName: string;
  productId: number;
  productName: string;
  orderItemId: number;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface CartItem {
  id: number;
  productId: number;
  productName: string;
  sellerShopName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

/** Shopping cart holding items selected by a buyer. */
export interface Cart {
  buyerId: number;
  items: CartItem[];
  totalItemCount: number;
  total: number;
  empty: boolean;
}

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface OrderStatusHistory {
  id: number;
  orderId: number;
  sellerOrderId?: number;
  previousStatus?: string;
  newStatus: string;
  changedByUserId?: number;
  changedByName?: string;
  changedByRole?: string;
  comments?: string;
  createdAt: string;
}

/** Seller sub-order representing goods fulfilled by a specific seller. */
export interface SellerOrder {
  id: number;
  orderId?: number;
  orderNumber?: string;
  sellerId: number;
  sellerShopName: string;
  sellerEmail?: string;
  subOrderNumber: string;
  status: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  shippingAddress?: string;
  paymentMethodName?: string;
  paymentStatus?: string;
  subtotalAmount: number;
  shippingAmount: number;
  commissionRate?: number;
  commissionAmount?: number;
  netPayoutAmount?: number;
  carrier?: string;
  trackingNumber?: string;
  createdAt?: string;
  updatedAt?: string;
  items: OrderItem[];
  statusHistory?: OrderStatusHistory[];
}

/** Supported payment methods for checkout. */
export type PaymentMethodType = 'CARD_PAYMENT' | 'PAYPAL' | 'BANK_TRANSFER';

/** Complete customer order composed of one or more seller sub-orders. */
export interface Order {
  id: number;
  buyerId: number;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  subtotalAmount: number;
  shippingAmount: number;
  taxAmount: number;
  currency: string;
  shippingAddress: string;
  paymentMethodName?: string;
  payment?: {
    id: number;
    paymentMethod: string;
    transactionReference: string;
    amount: number;
    currency: string;
    status: string;
    message?: string;
    depositSlipUrl?: string;
    createdAt: string;
  };
  createdAt: string;
  updatedAt?: string;
  sellerOrders: SellerOrder[];
  statusHistory?: OrderStatusHistory[];
}

/** Aggregated seller metrics in admin center. */
export interface AdminSellerOrderStats {
  sellerId: number;
  shopName: string;
  sellerName: string;
  sellerEmail: string;
  sellerPhone?: string;
  originCity: string;
  commissionRate?: number;
  totalOrders: number;
  totalProductsSold: number;
  totalQuantitySold: number;
  totalRevenue: number;
  totalCommissionEarned: number;
  totalSellerEarnings: number;
  pendingCount: number;
  processingCount: number;
  shippedCount: number;
  deliveredCount: number;
  cancelledCount: number;
  orders: SellerOrder[];
}

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}
