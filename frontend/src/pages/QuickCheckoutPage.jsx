import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  CheckoutForm,
  ProductSummary,
  CheckoutCostBreakdown,
  CouponInput,
  CheckoutPaymentMethod,
  ConfirmButton
} from '../components/checkout';
import Alert from '../components/Alert';

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
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [alertMessage, setAlertMessage] = useState('');
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const deliveryFee = 80;
  const grandTotal = product.price + deliveryFee - discount;

  const handleFormChange = (formData) => {
    // Check if all required fields are filled
    const isValid = 
      formData.name && 
      formData.phoneNumber && 
      formData.district && 
      formData.area && 
      formData.address;
    
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

  const handleConfirmOrder = () => {
    if (!formValid) {
      setAlertMessage('Please fill all the required fields');
      setIsAlertOpen(true);
      return;
    }

    // Process order here
    setAlertMessage('Order confirmed! Thank you for your purchase.');
    setIsAlertOpen(true);
    setTimeout(() => {
      navigate('/order-confirmation');
    }, 2000);
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
        {/* Left Column - Form */}
        <div>
          <CheckoutForm onFormChange={handleFormChange} />

          <div className="mt-6">
            <CheckoutPaymentMethod 
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
            />
          </div>
        </div>

        {/* Right Column - Order Summary */}
        <div>
          <ProductSummary product={product} />

          <CheckoutCostBreakdown
            productPrice={product.price}
            deliveryFee={deliveryFee}
            discount={discount}
            grandTotal={grandTotal}
          />

          <div className="mt-6">
            <CouponInput 
              couponCode={couponCode}
              setCouponCode={setCouponCode}
              handleApplyCoupon={handleApplyCoupon}
            />

            <div className="mt-6">
              <ConfirmButton 
                onClick={handleConfirmOrder}
                disabled={!formValid}
                buttonText={getButtonText()}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuickCheckoutPage;
