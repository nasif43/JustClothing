import { Routes, Route } from "react-router-dom"
import Header from "./components/layout/Header"
import Footer from "./components/layout/Footer"
import marbleBg from './assets/marble-bg.jpg'
// Customer pages
import Homepage from "./pages/customer/Homepage"
import ProductDetailPage from "./pages/customer/ProductDetailPage"
import StorePage from "./pages/customer/StorePage"
import CartPage from "./pages/customer/CartPage"
import OrdersPage from "./pages/customer/OrdersPage"
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
import OrderDetailsPage from "./pages/seller/OrderDetailsPage"
import SellerOffersPage from "./pages/seller/SellerOffersPage"
import SellerReviewsPage from "./pages/seller/SellerReviewsPage"
import AddProductPage from "./pages/seller/AddProductPage"

import ScrollToTop from "./components/ScrollToTop"
import "./App.css"
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
    <>
      <Routes>
        {/* Landing page - no header/footer */}
        <Route path="/welcome" element={
          <>
            <WelcomePage />
            <Notification 
              message={notification.message}
              isVisible={notification.isVisible}
              onClose={dismissNotification}
            />
          </>
        } />
        {/* Seller onboarding - no header/footer */}
        <Route path="/seller" element={<SellerOnboardingPage />} />
        <Route path="/seller/signup" element={<SellerSignupFormPage />} />
        <Route path="/seller/signup-confirmation" element={<MainLayout><SellerSignupConfirmationPage /></MainLayout>} />
        
        {/* Seller dashboard routes */}
        <Route path="/seller/dashboard" element={<SellerDashboardPage />} />
        <Route path="/seller/homepage" element={<SellerHomepage />} />
        <Route path="/seller/customize" element={<SellerHomepage />} />
        <Route path="/seller/customise" element={<SellerHomepage />} />
        <Route path="/seller/orders" element={<SellerOrdersPage />} />
        <Route path="/seller/orders/:orderId" element={<OrderDetailsPage />} />
        <Route path="/seller/offers" element={<SellerOffersPage />} />
        <Route path="/seller/reviews" element={<SellerReviewsPage />} />
        <Route path="/seller/products/add" element={<AddProductPage />} />
        
        {/* Main routes with header/footer */}
        <Route path="/" element={<MainLayout><Homepage /></MainLayout>} />
        <Route path="/product/:id" element={<MainLayout><ProductDetailPage /></MainLayout>} />
        <Route path="/store/:id" element={<MainLayout><StorePage /></MainLayout>} />
        <Route path="/cart" element={<MainLayout><CartPage /></MainLayout>} />
        <Route path="/orders" element={<MainLayout><OrdersPage /></MainLayout>} />
        <Route path="/quick-checkout" element={<MainLayout><QuickCheckoutPage /></MainLayout>} />
        <Route path="/order-confirmation" element={<MainLayout><OrderConfirmationPage /></MainLayout>} />
        <Route path="/login" element={<MainLayout><div>Login Page Content</div></MainLayout>} />
        <Route path="/signup" element={<MainLayout><div>Signup Page Content</div></MainLayout>} />
      </Routes>
    </>
  );
}

export default App