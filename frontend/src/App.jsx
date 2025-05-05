import { Routes, Route } from "react-router-dom"
import Header from "./components/layout/Header"
import Footer from "./components/layout/Footer"
import marbleBg from '../src/assets/marble-bg.jpg'
import Homepage from "../src/pages/Homepage"
import ProductDetailPage from "./pages/ProductDetailPage"
import CartPage from "./pages/CartPage"
import OrdersPage from "./pages/OrdersPage"
import QuickCheckoutPage from "./pages/QuickCheckoutPage"
import OrderConfirmationPage from "./pages/OrderConfirmationPage"
import WelcomePage from "./pages/WelcomePage"
import { ProductProvider, useProducts } from "./context/ProductContext"
import Notification from "./components/Notification"
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
        
        {/* Main routes with header/footer */}
        <Route path="/" element={<MainLayout><Homepage /></MainLayout>} />
        <Route path="/product/:id" element={<MainLayout><ProductDetailPage /></MainLayout>} />
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