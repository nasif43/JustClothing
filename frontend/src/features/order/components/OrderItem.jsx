import React from 'react';

const OrderItem = ({ order, onClick }) => {
  // Function to get status color and background
  const getStatusStyle = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'bg-green-200 text-green-800';
      case 'partially_delivered':
        return 'bg-yellow-200 text-yellow-800';
      case 'cancelled':
        return 'bg-red-200 text-red-800';
      case 'refunded':
        return 'bg-purple-200 text-purple-800';
      case 'shipped':
        return 'bg-blue-200 text-blue-800';
      case 'processing':
        return 'bg-indigo-200 text-indigo-800';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  // Function to format status text
  const formatStatus = (status) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  return (
    <div 
      onClick={() => onClick(order.id)}
      className="flex flex-col cursor-pointer hover:opacity-90 transition-opacity"
    >
      {/* Order details - top */}
      <div className="flex justify-between items-center mb-2">
        <div className="bg-gray-200 bg-opacity-80 rounded-l-full p-4 w-52 flex items-center justify-center">
          <h2 className="text-2xl font-bold">#{order.id}</h2>
        </div>
        
        <div className="bg-gray-200 bg-opacity-80 rounded-r-full p-4 flex-1 mr-4">
          <p className="text-lg">
            Total items : {order.totalItems} , Bill : {order.bill}tk.
            <span className="ml-8">
              Placed on : {order.placedOn}, Time : {order.time}
            </span>
          </p>
        </div>
        
        {/* Status */}
        <div 
          className={`
            px-6 py-3 rounded-full text-center font-bold min-w-[160px]
            ${getStatusStyle(order.status)}
          `}
        >
          {formatStatus(order.status)}
        </div>
      </div>
      
      {/* Seller info - bottom */}
      {order.seller && (
        <div className="ml-52 text-sm text-gray-600">
          <strong>Seller:</strong> {order.seller.business_name}
          {order.seller.phone_number && (
            <span className="ml-4">Phone: {order.seller.phone_number}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderItem; 