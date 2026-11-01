// Language: TypeScript (React TSX)
// Purpose: Root frontend layout component defining client-side routing, shared context providers (Auth, Cart, Currency), and global navigation.
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderHistoryPage } from './pages/OrderHistoryPage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { SellerDashboardPage } from './pages/SellerDashboardPage';
import { SellerOrdersPage } from './pages/SellerOrdersPage';
import { SellerOrderDetailsPage } from './pages/SellerOrderDetailsPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminOrdersPage } from './pages/AdminOrdersPage';
import { AdminOrderDetailsPage } from './pages/AdminOrderDetailsPage';
import { AdminSellerOrdersPage } from './pages/AdminSellerOrdersPage';

/**
 * Root component setting up context providers and application routing.
 */
export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CurrencyProvider>
          <CartProvider>
            <div className="min-h-screen flex flex-col bg-zinc-50 text-zinc-900 selection:bg-serendip-100 selection:text-serendip-900 font-sans">
              <Navbar />
              <main className="flex-1">
                <Routes>
                  {/* Public Core Routes */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/catalog" element={<CatalogPage />} />
                  <Route path="/products/:id" element={<ProductDetailPage />} />
                  
                  {/* Auth Routes */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />

                  {/* Buyer Routes */}
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/orders" element={<OrderHistoryPage />} />
                  <Route path="/buyer/orders" element={<OrderHistoryPage />} />
                  <Route path="/orders/:id" element={<OrderTrackingPage />} />
                  <Route path="/track/:orderNumber" element={<OrderTrackingPage />} />

                  {/* Merchant / Seller Routes */}
                  <Route path="/seller/dashboard" element={<SellerDashboardPage />} />
                  <Route path="/seller/orders" element={<SellerOrdersPage />} />
                  <Route path="/seller/orders/:id" element={<SellerOrderDetailsPage />} />

                  {/* Admin Governance & Order Management Routes */}
                  <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                  <Route path="/admin/orders" element={<AdminOrdersPage />} />
                  <Route path="/admin/orders/:id" element={<AdminOrderDetailsPage />} />
                  <Route path="/admin/sellers/:id" element={<AdminSellerOrdersPage />} />

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </CartProvider>
        </CurrencyProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
