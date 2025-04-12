import React from 'react';
import orders from '../data/orders';
import marbleBg from '../assets/marble-bg.jpg';
import { useNavigate } from 'react-router-dom';
import OrderItem from '../components/order/OrderItem';

const OrdersPage = () => {
  const navigate = useNavigate();

  const handleOrderClick = (orderId) => {
    // In a real application, this would navigate to an order details page
    console.log(`Viewing order ${orderId}`);
    // navigate(`/order/${orderId}`);
  };

  return (
    <div
      className="min-h-screen w-full py-8 px-4 md:px-8 flex flex-col items-center"
      style={{ backgroundImage: `url(${marbleBg})`, backgroundSize: 'cover' }}
    >
      <h1 className="text-4xl font-bold mb-12 mt-8">ORDERS</h1>
      
      <div className="w-full max-w-5xl space-y-6">
        {orders.length === 0 ? (
          <div className="bg-white bg-opacity-80 p-8 rounded-lg text-center">
            <p className="text-lg mb-4">You don't have any orders yet</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <>
            <div className="flex justify-between font-semibold text-lg px-4">
              <span className="w-52 pl-6">ORDER NO.</span>
              <span className="ml-auto mr-4">STATUS</span>
            </div>
            
            {orders.map((order) => (
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
      <div className="mt-auto mb-8 opacity-30">
        <div className="w-12 h-12 rounded-full border-2 border-gray-500 flex items-center justify-center">
          <div className="flex">
            <div className="w-1.5 h-1.5 rounded-full bg-gray-500 mx-1"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-gray-500 mx-1"></div>
          </div>
          <div className="w-6 h-3 border-b-2 border-gray-500 rounded-b-full absolute mt-3"></div>
        </div>
      </div>
    </div>
  );
};

export default OrdersPage; 