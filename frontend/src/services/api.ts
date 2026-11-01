// Language: TypeScript
// Purpose: REST API HTTP client service; encapsulates fetch requests, authentication header injection, and typed JSON responses for backend integration.
import { Product, Review, Cart, Order, AuthResponse, SellerOrder } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

/**
 * Client service handling HTTP requests to the backend REST API.
 */
class ApiService {
  /** Builds request headers including HTTP Basic authorization if available. */
  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const authCredentials = localStorage.getItem('serendip_auth_credentials');
    if (authCredentials) {
      headers['Authorization'] = `Basic ${authCredentials}`;
    }
    return headers;
  }

  /** Sends an HTTP request and parses JSON or throws an error on failure. */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.details && Array.isArray(errorData.details) && errorData.details.length > 0) {
          errorMessage = errorData.details.join(', ');
        } else {
          errorMessage = errorData.message || errorData.error || errorMessage;
        }
      } catch {
        // Fallback to HTTP status text if response is not JSON
      }
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  /** Authenticates a user and saves credentials to local storage. */
  async login(email: string, password: string):Promise<AuthResponse> {
    const credentials = btoa(`${email}:${password}`);
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('serendip_auth_credentials', credentials);
    return response;
  }

  /** Registers a new buyer account. */
  async registerBuyer(data: {
    fullName: string;
    email: string;
    password: string;
    phoneNumber?: string;
    deliveryAddress?: string;
  }) {
    return this.request('/auth/register/buyer', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /** Registers a new seller account. */
  async registerSeller(data: {
    fullName: string;
    email: string;
    password: string;
    phoneNumber?: string;
    shopName: string;
    originCity?: string;
    shopLocation?: string;
    commissionRate?: number;
  }) {
    const effectiveLocation = data.shopLocation || data.originCity || 'Colombo';
    return this.request('/auth/register/seller', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        originCity: effectiveLocation,
        commissionRate: data.commissionRate ?? 10.0,
      }),
    });
  }

  /** Clears user session credentials from local storage. */
  logout() {
    localStorage.removeItem('serendip_auth_credentials');
    localStorage.removeItem('serendip_user');
  }

  /** Fetches products with optional seller or category filtering. */
  async getProducts(params?: { sellerId?: number; category?: string }): Promise<Product[]> {
    const query = new URLSearchParams();
    if (params?.sellerId) query.append('sellerId', params.sellerId.toString());
    if (params?.category) query.append('category', params.category);

    const qs = query.toString();
    return this.request<Product[]>(`/products${qs ? `?${qs}` : ''}`);
  }

  /** Fetches a single product by ID. */
  async getProductById(id: number): Promise<Product> {
    return this.request<Product>(`/products/${id}`);
  }

  /** Creates a product with price in USD. */
  async createProductUsd(data: {
    sellerId: number;
    name: string;
    category: string;
    description: string;
    priceUsd: number;
    stockQuantity: number;
    weightGrams?: number;
  }): Promise<Product> {
    return this.request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /** Creates a product with price specified in LKR. */
  async createProductLkr(data: {
    sellerId: number;
    name: string;
    category: string;
    description: string;
    priceLkr: number;
    stockQuantity: number;
    weightGrams?: number;
  }): Promise<Product> {
    return this.request<Product>('/products/lkr', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /** Updates the price of an existing product. */
  async updateProductPrice(id: number, newPriceUsd: number): Promise<Product> {
    return this.request<Product>(`/products/${id}/price`, {
      method: 'PUT',
      body: JSON.stringify({ newPriceUsd }),
    });
  }

  /** Adds stock quantity to an existing product. */
  async replenishStock(id: number, quantity: number): Promise<Product> {
    return this.request<Product>(`/products/${id}/replenish`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  }

  /** Fetches customer reviews for a specific product. */
  async getReviewsForProduct(productId: number): Promise<Review[]> {
    return this.request<Review[]>(`/reviews/product/${productId}`);
  }

  /** Fetches all customer reviews submitted by a specific buyer. */
  async getReviewsForBuyer(buyerId: number): Promise<Review[]> {
    return this.request<Review[]>(`/reviews/buyer/${buyerId}`);
  }

  /** Submits a customer review for an order item or product. */
  async addReview(data: {
    buyerId?: number;
    productId?: number;
    orderItemId?: number;
    rating: number;
    comment: string;
  }): Promise<Review> {
    return this.request<Review>('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /** Fetches the shopping cart for a buyer. */
  async getCart(buyerId: number): Promise<Cart> {
    return this.request<Cart>(`/carts/${buyerId}`);
  }

  /** Adds a product and quantity to the buyer's cart. */
  async addToCart(buyerId: number, productId: number, quantity: number = 1): Promise<Cart> {
    return this.request<Cart>(`/carts/${buyerId}/items`, {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    });
  }

  /** Updates the quantity of an item in the buyer's cart. */
  async updateCartItem(buyerId: number, productId: number, quantity: number): Promise<Cart> {
    return this.request<Cart>(`/carts/${buyerId}/items/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  }

  /** Removes a product from the buyer's cart. */
  async removeFromCart(buyerId: number, productId: number): Promise<Cart> {
    return this.request<Cart>(`/carts/${buyerId}/items/${productId}`, {
      method: 'DELETE',
    });
  }

  /** Clears all items from the buyer's cart. */
  async clearCart(buyerId: number): Promise<void> {
    return this.request<void>(`/carts/${buyerId}`, {
      method: 'DELETE',
    });
  }

  /** Submits checkout for a buyer's cart and initiates payment. */
  async checkout(
    buyerId: number,
    simulateSuccess: boolean = true,
    paymentMethodName: string = 'CARD_PAYMENT',
    paymentDetails?: {
      cardNumber?: string;
      cardExpiry?: string;
      cardCvc?: string;
      cardHolder?: string;
      paypalEmail?: string;
      bankReference?: string;
      depositSlipUrl?: string;
      depositSlipName?: string;
    }
  ): Promise<Order> {
    return this.request<Order>('/orders/checkout', {
      method: 'POST',
      body: JSON.stringify({
        buyerId,
        simulateSuccess,
        paymentMethodName,
        ...paymentDetails,
      }),
    });
  }

  /** Fetches order history for a buyer. */
  async getOrdersForBuyer(buyerId: number): Promise<Order[]> {
    return this.request<Order[]>(`/orders/buyer/${buyerId}`);
  }

  /** Fetches a single order by database ID. */
  async getOrderById(id: number): Promise<Order> {
    return this.request<Order>(`/orders/${id}`);
  }

  /** Fetches a single order by its public order number. */
  async getOrderByNumber(orderNumber: string): Promise<Order> {
    return this.request<Order>(`/orders/number/${orderNumber}`);
  }

  /** Cancels an order and restocks inventory with an optional audit reason. */
  async cancelOrder(id: number, reason?: string): Promise<Order> {
    return this.request<Order>(`/orders/${id}/cancel`, {
      method: 'PUT',
      body: JSON.stringify(reason ? { reason } : {}),
    });
  }

  /** Marks a seller sub-order as shipped with tracking details. */
  async fulfillSellerOrder(sellerOrderId: number, carrier: string, trackingNumber: string): Promise<SellerOrder> {
    return this.request<SellerOrder>(`/orders/seller-orders/${sellerOrderId}/fulfill`, {
      method: 'PUT',
      body: JSON.stringify({ carrier, trackingNumber }),
    });
  }

  /** Fetches all sub-orders for a specific seller. */
  async getOrdersForSeller(sellerId: number): Promise<SellerOrder[]> {
    return this.request<SellerOrder[]>(`/orders/seller/${sellerId}`);
  }

  /** Fetches details for a single seller sub-order. */
  async getSellerOrderById(sellerOrderId: number): Promise<SellerOrder> {
    return this.request<SellerOrder>(`/orders/seller-orders/${sellerOrderId}`);
  }

  /** Updates seller sub-order status through permitted workflow states. */
  async updateSellerOrderStatus(
    sellerOrderId: number,
    data: { newStatus: string; carrier?: string; trackingNumber?: string; reason?: string }
  ): Promise<SellerOrder> {
    return this.request<SellerOrder>(`/orders/seller-orders/${sellerOrderId}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /** Administrator: Fetches all marketplace orders with optional search and filters. */
  async getAllOrdersAdmin(params?: {
    search?: string;
    status?: string;
    sellerId?: number;
    buyerId?: number;
  }): Promise<Order[]> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.status && params.status !== 'ALL') query.append('status', params.status);
    if (params?.sellerId) query.append('sellerId', String(params.sellerId));
    if (params?.buyerId) query.append('buyerId', String(params.buyerId));
    const qs = query.toString();
    return this.request<Order[]>(`/orders/admin${qs ? `?${qs}` : ''}`);
  }

  /** Administrator: Overrides order status with audit reason. */
  async adminUpdateOrderStatus(orderId: number, data: { newStatus: string; reason: string }): Promise<Order> {
    return this.request<Order>(`/orders/${orderId}/admin-status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /** Administrator: Retrieves seller analytics and seller order breakdown. */
  async getAdminSellerAnalytics(sellerId: number) {
    return this.request<any>(`/orders/admin/sellers/${sellerId}`);
  }

  /** Administrator: Deletes all platform orders. */
  async clearAllOrders(): Promise<{ message: string; deletedCount: number }> {
    return this.request<{ message: string; deletedCount: number }>('/orders/admin/clear-all', {
      method: 'DELETE',
    });
  }

  /** Administrator: Downloads orders report CSV. */
  async exportOrdersCsv(): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/orders/admin/export-csv`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to export orders report');
    }
    return response.blob();
  }

  /** Activates a user account. */
  async activateUser(userId: number) {
    return this.request(`/users/${userId}/activate`, {
      method: 'PUT',
    });
  }

  /** Suspends a user account. */
  async suspendUser(userId: number) {
    return this.request(`/users/${userId}/suspend`, {
      method: 'PUT',
    });
  }

  /** Fetches a user profile by ID (Admin/User). */
  async getUser(userId: number) {
    return this.request<any>(`/users/${userId}`);
  }

  /** Updates seller commission rate (Admin only). */
  async updateSellerCommission(sellerId: number, commissionRate: number) {
    return this.request<any>(`/users/sellers/${sellerId}/commission`, {
      method: 'PUT',
      body: JSON.stringify({ commissionRate }),
    });
  }
}

export const api = new ApiService();
