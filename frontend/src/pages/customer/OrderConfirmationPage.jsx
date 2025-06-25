import { Link, useLocation } from 'react-router-dom';
import { Check } from 'lucide-react';
import marbleBg from '../../assets/marble-bg.jpg';

const OrderConfirmationPage = () => {
  const location = useLocation();
  const { orders, order, orderNumber, totalOrders } = location.state || {};
  
  // Use order number from API or fallback to random number
  const displayOrderNumber = orderNumber || order?.id || Math.floor(Math.random() * 100000);
  
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
        <div className="p-8 md:p-12 flex flex-col items-center justify-center min-h-[500px]">
          <h1 className="text-3xl md:text-5xl font-bold text-center text-gray-800 mb-4">THANK YOU FOR ORDERING</h1>
          <h2 className="text-2xl md:text-4xl font-bold text-center text-gray-800 mb-12">
            YOUR ORDER HAS BEEN CONFIRMED!
          </h2>

          <div className="bg-black rounded-full p-4 w-16 h-16 flex items-center justify-center mb-8">
            <Check className="text-white w-8 h-8" />
          </div>
          
          {/* Display order information */}
          {totalOrders > 1 ? (
            <div className="text-center mb-8">
              <p className="text-2xl font-bold md:text-xl text-black-700 mb-2">
                {totalOrders} orders have been created
              </p>
              <div className="space-y-2">
                {orders?.map((orderItem, index) => (
                  <p key={orderItem.id} className="text-lg font-bold text-black-700">
                    Order #{orderItem.id} - {orderItem.seller?.business_name || 'Store'}
                  </p>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-2xl font-bold md:text-xl text-black-700 text-center mb-2">
              your order number is #{displayOrderNumber}
            </p>
          )}
          
          <p className="text-2xl font-bold md:text-xl text-black-700 text-center mb-2">estimated delivery time 2-4 days</p>
          <p className="text-lg font-bold md:text-lg text-gray-700 text-center mt-12">
            you will receive an email regarding your order!
          </p>
          
          <Link
            to="/home"
            className="bg-black text-white px-8 py-3 rounded-full font-semibold text-lg absolute bottom-8 right-8"
          >
            HOME
          </Link>
        </div>
      </div>
  );
};

export default OrderConfirmationPage; 