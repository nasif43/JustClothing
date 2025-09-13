import React, { useState, useEffect } from 'react';
import marbleBg from '../../assets/marble-bg.jpg';
import { useNavigate } from 'react-router-dom';
import { OrderItem } from '../../features/order/components';
import { fetchOrders } from '../../services/api';

const OrdersPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        const response = await fetchOrders();
        console.log('Orders API response:', response);
        
        // Handle paginated response if needed
        let ordersData = [];
        if (Array.isArray(response)) {
          ordersData = response;
        } else if (response && Array.isArray(response.results)) {
          ordersData = response.results;
        } else if (response && response.data && Array.isArray(response.data)) {
          ordersData = response.data;
        }
        
        console.log('Setting orders data:', ordersData);
        setOrders(ordersData);
      } catch (err) {
        setError(err.message || 'Failed to load orders');
        console.error('Failed to fetch orders:', err);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  const handleOrderClick = (orderId) => {
    console.log(`Viewing order ${orderId}`);
    navigate(`/order/${orderId}`);
  };

  return (
    <div
      className="min-h-screen w-full py-4 sm:py-8 px-2 sm:px-4 md:px-8 flex flex-col items-center"
      style={{ backgroundImage: `url(${marbleBg})`, backgroundSize: 'cover' }}
    >
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 md:mb-12 mt-4 sm:mt-8">ORDERS</h1>
      
      <div className="w-full max-w-5xl space-y-4 sm:space-y-6">
        {loading ? (
          <div className="bg-white bg-opacity-80 p-6 sm:p-8 rounded-lg text-center">
            <p className="text-base sm:text-lg">Loading your orders...</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p>Error: {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-1 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        ) : !Array.isArray(orders) || orders.length === 0 ? (
          <div className="bg-white bg-opacity-80 p-6 sm:p-8 rounded-lg text-center">
            <p className="text-base sm:text-lg mb-4">You don't have any orders yet</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Header - Hidden on Mobile */}
            <div className="hidden lg:flex justify-between font-semibold text-lg px-4">
              <span className="w-52 pl-6">ORDER NO.</span>
              <span className="ml-auto mr-4">STATUS</span>
            </div>
            
            {Array.isArray(orders) && orders.map((order) => (
              <OrderItem 
                key={order.id}
                order={order}
                onClick={handleOrderClick}
              />
            ))}
          </>
        )}
      </div>
      
      {/* Smiley face at the bottom */}
      <div className="mt-auto mb-6 sm:mb-8 opacity-30">
        <div className="w-8 sm:w-12 h-8 sm:h-12 rounded-full border-2 border-gray-500 flex items-center justify-center">
          <div className="flex">
            <div className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-gray-500 mx-0.5 sm:mx-1"></div>
            <div className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-gray-500 mx-0.5 sm:mx-1"></div>
          </div>
          <div className="w-4 sm:w-6 h-2 sm:h-3 border-b-2 border-gray-500 rounded-b-full absolute mt-2 sm:mt-3"></div>
        </div>
      </div>
    </div>
  );
};

export default OrdersPage; 