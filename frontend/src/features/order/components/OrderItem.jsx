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
      className="cursor-pointer hover:opacity-90 transition-opacity"
    >
      {/* Mobile Layout */}
      <div className="lg:hidden bg-white bg-opacity-90 rounded-lg p-4 space-y-3">
        {/* Order Number and Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-bold">#{order.id}</h2>
            <div 
              className={`
                px-3 py-1 rounded-full text-xs font-bold
                ${getStatusStyle(order.status)}
              `}
            >
              {formatStatus(order.status)}
            </div>
          </div>
        </div>
        
        {/* Order Details */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Items:</span>
            <span className="font-medium">{order.totalItems}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total:</span>
            <span className="font-bold">{order.bill}tk</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Date:</span>
            <span>{order.placedOn}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Time:</span>
            <span>{order.time}</span>
          </div>
        </div>
        
        {/* Seller Info */}
        {order.seller && (
          <div className="pt-2 border-t border-gray-200 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Seller:</span>
              <span className="font-medium">{order.seller.business_name}</span>
            </div>
            {order.seller.phone_number && (
              <div className="flex justify-between mt-1">
                <span className="text-gray-600">Phone:</span>
                <span>{order.seller.phone_number}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Desktop Layout - Preserved */}
      <div className="hidden lg:flex lg:flex-col">
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
    </div>
  );
};

export default OrderItem; 