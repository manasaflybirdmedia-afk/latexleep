import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { CartProvider } from "./contexts/CartContext.jsx";
import { WishlistProvider } from "./contexts/WishlistContext.jsx";
import { ProtectedRoute, AdminRoute } from "./components/ProtectedRoute.jsx";
import { App, NotFoundPage } from "./App.jsx";
import "./index.css";

// Admin pages
import AdminLogin from "./admin/AdminLogin.jsx";
import AdminLayout from "./admin/AdminLayout.jsx";
import Dashboard from "./admin/Dashboard.jsx";
import ProductManagement from "./admin/ProductManagement.jsx";
import CategoryManagement from "./admin/CategoryManagement.jsx";
import OrderManagement from "./admin/OrderManagement.jsx";
import CustomerManagement from "./admin/CustomerManagement.jsx";
import InventoryManagement from "./admin/InventoryManagement.jsx";
import CouponManagement from "./admin/CouponManagement.jsx";
import TeamManagement from "./admin/TeamManagement.jsx";
import AdminSettings from "./admin/Settings.jsx";

// User pages
import ProductsPage from "./pages/ProductsPage.jsx";
import ProductDetailPage from "./pages/ProductDetailPage.jsx";
import CartPage from "./pages/CartPage.jsx";
import CheckoutPage from "./pages/CheckoutPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import UserDashboard from "./pages/UserDashboard.jsx";
import WishlistPage from "./pages/WishlistPage.jsx";

function Root() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <Routes>
              {/* Landing page */}
              <Route path="/" element={<App />} />

              {/* User-facing store pages */}
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/:slug" element={<ProductDetailPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
              <Route path="/wishlist" element={<WishlistPage />} />

              {/* Admin */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="products" element={<ProductManagement />} />
                <Route path="categories" element={<CategoryManagement />} />
                <Route path="orders" element={<OrderManagement />} />
                <Route path="customers" element={<CustomerManagement />} />
                <Route path="inventory" element={<InventoryManagement />} />
                <Route path="coupons" element={<CouponManagement />} />
                <Route path="team" element={<AdminRoute roles={["super_admin", "admin"]}><TeamManagement /></AdminRoute>} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
            <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
