import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  CheckoutForm,
  ProductSummary,
  CheckoutCostBreakdown,
  CouponInput,
  CheckoutPaymentMethod,
  ConfirmButton
} from '../../features/checkout/components';
import { ShippingAddressModal } from '../../features/cart/components';
import Alert from '../../components/Alert';
import { createQuickOrder, fetchUserShippingInfo } from '../../services/api';

function QuickCheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get product data from navigation state or use fallback data
  const [product, setProduct] = useState(() => {
    const productFromState = location.state?.product;
    
    if (productFromState) {
      return productFromState;
    }
    
    // Fallback data if navigated directly to this page
    return {
      id: '123',
      name: 'SOLID BLACK T-SHIRT',
      color: 'Black',
      size: 'M',
      price: 450,
      quantity: 1,
      imageUrl: '/images/black-tshirt.jpg' // Placeholder path
    };
  });
  
  const [formValid, setFormValid] = useState(false);
  const [formData, setFormData] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [alertMessage, setAlertMessage] = useState('');
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);
  const [shippingInfo, setShippingInfo] = useState({
    address: '',
    phone: ''
  });
  
  const deliveryFee = 80;
  const grandTotal = product.price + deliveryFee - discount;

  // Fetch user's shipping info when component mounts
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetchUserShippingInfo();
        setShippingInfo({
          address: response.address_line_1 || '',
          phone: response.phone || ''
        });
      } catch (error) {
        console.error('Failed to fetch user info:', error);
      }
    };

    fetchUserInfo();
  }, []);

  const handleFormChange = (newFormData) => {
    // Check if all required fields are filled
    const isValid = 
      newFormData.name && 
      newFormData.phoneNumber && 
      newFormData.district && 
      newFormData.area && 
      newFormData.address;
    
    setFormData(newFormData);
    setFormValid(isValid);
  };

  const handleApplyCoupon = () => {
    if (couponCode.toLowerCase() === 'discount20') {
      const newDiscount = Math.round(product.price * 0.2);
      setDiscount(newDiscount);
      setAlertMessage('Coupon applied successfully!');
      setIsAlertOpen(true);
    } else {
      setAlertMessage('Invalid coupon code');
      setIsAlertOpen(true);
    }
  };

  const handleConfirmOrder = async () => {
    // Open shipping modal instead of checking form validity
    setIsShippingModalOpen(true);
  };

  const handleShippingConfirm = async (shippingData) => {
    if (loading) return;

    try {
      setLoading(true);
      
      // Update shipping info state
      setShippingInfo(shippingData);
      
      // Prepare order data
      const orderData = {
        product_id: product.id,
        quantity: product.quantity || 1,
        size: product.size || '',
        color: product.color || '',
        payment_method: paymentMethod === 'cash' ? 'cod' : 'card',
        customer_name: 'Customer', // Simple default name, could be improved with user profile
        customer_phone: shippingData.phone,
        customer_address: shippingData.address
      };

      // Create order via API
      const response = await createQuickOrder(orderData);
      
      setAlertMessage('Order confirmed! Thank you for your purchase.');
      setIsAlertOpen(true);
      setIsShippingModalOpen(false);
      
      setTimeout(() => {
        navigate('/order-confirmation', { 
          state: { 
            order: response,
            orderNumber: response.id 
          } 
        });
      }, 2000);
      
    } catch (error) {
      console.error('Order creation failed:', error);
      setAlertMessage(error.message || 'Failed to create order. Please try again.');
      setIsAlertOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToProduct = () => {
    navigate(`/product/${product.id}`);
  };

  // Determine the button text based on the payment method
  const getButtonText = () => {
    return paymentMethod === 'cash' ? 'CONFIRM' : 'PAY AND CONFIRM';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-white">
      <Alert 
        message={alertMessage}
        isOpen={isAlertOpen}
        onClose={() => setIsAlertOpen(false)}
      />
    
      <button
        onClick={handleBackToProduct}
        className="flex items-center text-sm hover:underline mb-6"
      >
        ← Back to Product
      </button>
      
      <div className="grid md:grid-cols-2 gap-8">
        {/* Left Column - Product Summary */}
        <div>
          <ProductSummary product={product} />

          <CheckoutCostBreakdown
            productPrice={product.price}
            deliveryFee={deliveryFee}
            discount={discount}
            grandTotal={grandTotal}
          />
        </div>

        {/* Right Column - Payment and Checkout */}
        <div>
          <div className="mb-6">
            <CheckoutPaymentMethod 
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
            />
          </div>

          <div className="mb-6">
            <CouponInput 
              couponCode={couponCode}
              setCouponCode={setCouponCode}
              handleApplyCoupon={handleApplyCoupon}
            />
          </div>

          <div className="mt-6">
            <ConfirmButton 
              onClick={handleConfirmOrder}
              disabled={loading}
              buttonText={loading ? 'Processing...' : getButtonText()}
            />
          </div>
        </div>
      </div>

      {/* Shipping Address Modal */}
      <ShippingAddressModal
        isOpen={isShippingModalOpen}
        onClose={() => setIsShippingModalOpen(false)}
        onConfirm={handleShippingConfirm}
        initialAddress={shippingInfo.address}
        initialPhone={shippingInfo.phone}
        loading={loading}
      />
    </div>
  );
}

export default QuickCheckoutPage;
