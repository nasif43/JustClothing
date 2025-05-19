import React from 'react';

const OrderItem = ({ order, onClick }) => {
  return (
    <div 
      onClick={() => onClick(order.id)}
      className="flex justify-between items-center cursor-pointer hover:opacity-90 transition-opacity"
    >
      {/* Order details - left side */}
      <div className="flex-1 flex">
        <div className="bg-gray-200 bg-opacity-80 rounded-l-full p-4 w-52 flex items-center justify-center">
          <h2 className="text-2xl font-bold">#{order.id}</h2>
        </div>
        
        <div className="bg-gray-200 bg-opacity-80 rounded-r-full p-4 flex-1">
          <p className="text-lg">
            Total items : {order.totalItems} , Bill : {order.bill}tk.
            <span className="ml-8">
              Placed on : {order.placedOn}, Time : {order.time}
            </span>
          </p>
        </div>
      </div>
      
      {/* Status - right side */}
      <div className="ml-4">
        <div 
          className={`
            px-6 py-3 rounded-full text-center font-bold min-w-[160px]
            ${order.status === 'DELIVERED' 
              ? 'bg-gray-200 bg-opacity-80' 
              : 'bg-gray-300 bg-opacity-80'
            }
          `}
        >
          {order.status}
        </div>
      </div>
    </div>
  );
};

export default OrderItem; 