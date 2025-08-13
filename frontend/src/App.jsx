import { Routes, Route, Navigate } from "react-router-dom"
import Header from "./components/layout/Header"
import Footer from "./components/layout/Footer"
import marbleBg from './assets/marble-bg.jpg'
// Customer pages
import Homepage from "./pages/customer/Homepage"
import ProductDetailPage from "./pages/customer/ProductDetailPage"
import StorePage from "./pages/customer/StorePage"
import CartPage from "./pages/customer/CartPage"
import OrdersPage from "./pages/customer/OrdersPage"
import CustomerOrderDetailsPage from "./pages/customer/OrderDetailsPage"
import QuickCheckoutPage from "./pages/customer/QuickCheckoutPage"
import OrderConfirmationPage from "./pages/customer/OrderConfirmationPage"
// Shared pages
import WelcomePage from "./pages/shared/WelcomePage"
import { ProductProvider, useProducts } from "./context/ProductContext"
import Notification from "./components/Notification"
// Seller pages
import SellerOnboardingPage from "./pages/seller/SellerOnboardingPage"
import SellerSignupFormPage from "./pages/seller/SellerSignupFormPage"
import SellerSignupConfirmationPage from "./pages/seller/SellerSignupConfirmationPage"
import SellerDashboardPage from "./pages/seller/SellerDashboardPage"
import SellerHomepage from "./pages/seller/SellerHomepage"
import SellerOrdersPage from "./pages/seller/SellerOrdersPage"
import SellerOrderDetailsPage from "./pages/seller/OrderDetailsPage"
import SellerOffersPage from "./pages/seller/SellerOffersPage"
import SellerReviewsPage from "./pages/seller/SellerReviewsPage"
import SellerProductsPage from "./pages/seller/SellerProductsPage"
import AddProductPage from "./pages/seller/AddProductPage"

import ScrollToTop from "./components/ScrollToTop"
import "./App.css"
import { useEffect, useRef } from 'react'
import useUserStore from './store/useUserStore'
import useCartStore from './store/useCartStore'
import { initializeApiInterceptor } from './services/apiInterceptor'
import ProtectedRoute from './components/ProtectedRoute'
import SellerProtectedRoute from './components/SellerProtectedRoute'
import LoginPage from './pages/auth/LoginPage'
import SignUpPage from './pages/auth/SignUpPage'
import PreferencePage from './pages/customer/PreferencePage'
import OnboardingCheck from './components/OnboardingCheck'
// Layout component for pages that need header and footer
const MainLayout = ({ children }) => {
  const { notification, dismissNotification } = useProducts();
  
  return (
    <>
      <Header />
      <div className="flex-grow w-full" style={{ backgroundImage: `url(${marbleBg})`, backgroundSize: "cover" }}>
        {children}
      </div>
      <Footer />
      <Notification 
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={dismissNotification}
      />
    </>
  );
};

function App() {
  const { initializeAuth, isAuthenticated } = useUserStore()
  const { fetchCart, syncCartAfterLogin } = useCartStore()
  const hasInitializedCart = useRef(false)

  useEffect(() => {
    // Initialize API interceptor
    initializeApiInterceptor()
    
    // Initialize authentication from localStorage
    initializeAuth()
  }, [initializeAuth])

  useEffect(() => {
    if (isAuthenticated && !hasInitializedCart.current) {
      // Only sync cart once when user is authenticated for the first time
      hasInitializedCart.current = true
      fetchCart() // Just fetch the existing cart instead of syncing
    } else if (!isAuthenticated) {
      // Clear cart when user logs out
      hasInitializedCart.current = false
      useCartStore.getState().clearCart()
    }
  }, [isAuthenticated, fetchCart])

  return (
    <div className="min-h-screen flex flex-col">
      <ProductProvider>
        <ScrollToTop />
        <AppContent />
      </ProductProvider>
    </div>
  )
}

// Separate component to access context
function AppContent() {
  const { notification, dismissNotification } = useProducts();
  
  return (
    <OnboardingCheck>
      <Routes>
        {/* Redirect root to welcome page */}
        <Route path="/" element={<Navigate to="/welcome" replace />} />
        
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/signup" element={<SignUpPage />} />
        
        {/* Preference/Onboarding Page */}
        <Route path="/preferences" element={
          <ProtectedRoute>
            <PreferencePage />
          </ProtectedRoute>
        } />

        {/* Homepage accessible to both authenticated users and guests */}
        <Route path="/home" element={
          <MainLayout>
            <Homepage />
          </MainLayout>
        } />
        
        {/* Protected routes */}
        <Route path="/product/:id" element={
          <ProtectedRoute>
            <MainLayout>
              <ProductDetailPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/store/:id" element={
          <ProtectedRoute>
            <MainLayout>
              <StorePage />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/cart" element={
          <ProtectedRoute>
            <MainLayout><CartPage /></MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/orders" element={
          <ProtectedRoute>
            <MainLayout><OrdersPage /></MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/order/:orderId" element={
          <ProtectedRoute>
            <MainLayout><CustomerOrderDetailsPage /></MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/quick-checkout" element={
          <ProtectedRoute>
            <MainLayout><QuickCheckoutPage /></MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/order-confirmation" element={
          <ProtectedRoute>
            <MainLayout><OrderConfirmationPage /></MainLayout>
          </ProtectedRoute>
        } />
        
        {/* Seller routes */}
        <Route path="/seller" element={<SellerOnboardingPage />} />
        <Route path="/seller/signup" element={<SellerSignupFormPage />} />
        <Route path="/seller/signup-confirmation" element={<MainLayout><SellerSignupConfirmationPage /></MainLayout>} />
        
        {/* Seller dashboard routes */}
        <Route path="/seller/dashboard" element={
          <SellerProtectedRoute>
            <SellerDashboardPage />
          </SellerProtectedRoute>
        } />
        <Route path="/seller/homepage" element={
          <SellerProtectedRoute>
            <SellerHomepage />
          </SellerProtectedRoute>
        } />
        <Route path="/seller/customize" element={
          <SellerProtectedRoute>
            <SellerHomepage />
          </SellerProtectedRoute>
        } />
        <Route path="/seller/customise" element={
          <SellerProtectedRoute>
            <SellerHomepage />
          </SellerProtectedRoute>
        } />
        <Route path="/seller/orders" element={
          <SellerProtectedRoute>
            <SellerOrdersPage />
          </SellerProtectedRoute>
        } />
        <Route path="/seller/orders/:orderId" element={
          <SellerProtectedRoute>
            <SellerOrderDetailsPage />
          </SellerProtectedRoute>
        } />
        <Route path="/seller/offers" element={
          <SellerProtectedRoute>
            <SellerOffersPage />
          </SellerProtectedRoute>
        } />
        <Route path="/seller/reviews" element={
          <SellerProtectedRoute>
            <SellerReviewsPage />
          </SellerProtectedRoute>
        } />
        <Route path="/seller/products" element={
          <SellerProtectedRoute>
            <SellerProductsPage />
          </SellerProtectedRoute>
        } />
        <Route path="/seller/products/add" element={
          <SellerProtectedRoute>
            <AddProductPage />
          </SellerProtectedRoute>
        } />
        <Route path="/seller/products/:productId/edit" element={
          <SellerProtectedRoute>
            <AddProductPage />
          </SellerProtectedRoute>
        } />
      </Routes>
    </OnboardingCheck>
  );
}

export default App