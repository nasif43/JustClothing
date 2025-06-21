import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import marbleBg from '../../assets/marble-bg.jpg';
import { fetchOrderById, submitProductReview } from '../../services/api';
import { Star } from 'lucide-react';

const OrderDetailsPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    content: '',
    title: ''
  });

  useEffect(() => {
    const loadOrderDetails = async () => {
      try {
        setLoading(true);
        const orderData = await fetchOrderById(orderId);
        console.log('Order details:', orderData);
        setOrder(orderData);
      } catch (err) {
        setError(err.message || 'Failed to load order details');
        console.error('Failed to fetch order details:', err);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      loadOrderDetails();
    }
  }, [orderId]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return 'bg-green-600 text-white';
      case 'partially_delivered':
        return 'bg-yellow-500 text-white';
      case 'shipped':
        return 'bg-blue-600 text-white';
      case 'processing':
        return 'bg-indigo-500 text-white';
      case 'pending':
        return 'bg-gray-500 text-white';
      case 'cancelled':
        return 'bg-red-600 text-white';
      case 'refunded':
        return 'bg-purple-600 text-white';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status) => {
    return status?.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const handleProductClick = (item) => {
    // Navigate to product page
    if (item.product) {
      navigate(`/product/${item.product}`);
    }
  };

  const handleReviewClick = (item) => {
    setSelectedItem(item);
    setReviewData({
      rating: 5,
      content: '',
      title: ''
    });
    setShowReviewModal(true);
  };

  const handleReviewSubmit = async () => {
    try {
      // Validate required fields
      if (!reviewData.content.trim()) {
        alert('Please write a review before submitting.');
        return;
      }

      // Submit the review to the API
      await submitProductReview({
        product_id: selectedItem.product,
        order_id: order.id,
        rating: reviewData.rating,
        content: reviewData.content.trim()
      });
      
      // Close modal and show success
      setShowReviewModal(false);
      setSelectedItem(null);
      alert('Review submitted successfully! Thank you for your feedback.');
      
    } catch (error) {
      console.error('Failed to submit review:', error);
      alert(error.message || 'Failed to submit review. Please try again.');
    }
  };

  const isOrderDelivered = order?.status?.toLowerCase() === 'delivered' || order?.status?.toLowerCase() === 'partially_delivered';

  if (loading) {
    return (
      <div
        className="min-h-screen w-full py-8 px-4 md:px-8 flex flex-col items-center justify-center"
        style={{ backgroundImage: `url(${marbleBg})`, backgroundSize: 'cover' }}
      >
        <div className="bg-white bg-opacity-80 p-8 rounded-lg text-center">
          <p className="text-lg">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen w-full py-8 px-4 md:px-8 flex flex-col items-center justify-center"
        style={{ backgroundImage: `url(${marbleBg})`, backgroundSize: 'cover' }}
      >
        <div className="bg-white bg-opacity-80 p-8 rounded-lg text-center">
          <h1 className="text-2xl font-bold mb-4 text-black">Error</h1>
          <p className="text-lg mb-4">{error}</p>
          <button
            onClick={() => navigate('/orders')}
            className="px-6 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div
        className="min-h-screen w-full py-8 px-4 md:px-8 flex flex-col items-center justify-center"
        style={{ backgroundImage: `url(${marbleBg})`, backgroundSize: 'cover' }}
      >
        <div className="bg-white bg-opacity-80 p-8 rounded-lg text-center">
          <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
          <button
            onClick={() => navigate('/orders')}
            className="px-6 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full py-8 px-4 md:px-8"
      style={{ backgroundImage: `url(${marbleBg})`, backgroundSize: 'cover' }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/orders')}
            className="text-black hover:underline"
          >
            ← Back to Orders
          </button>
          <h1 className="text-4xl font-bold">ORDER DETAILS</h1>
          <div></div>
        </div>

        {/* Order Summary Card */}
        <div className="bg-white bg-opacity-90 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold">Order #{order.id}</h2>
              <p className="text-gray-600">
                Placed on {order.placedOn} at {order.time || order.placedTime}
              </p>
              {order.seller && (
                <div className="text-gray-600 mt-1">
                  <p><strong>Seller:</strong> {order.seller.business_name}</p>
                  <p className="text-sm">
                    {order.seller.phone_number && (
                      <span className="mr-4">Phone: {order.seller.phone_number}</span>
                    )}
                    {order.seller.business_address && (
                      <span>Address: {order.seller.business_address}</span>
                    )}
                  </p>
                </div>
              )}
            </div>
            <div className="text-right">
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                {formatStatus(order.status)}
              </span>
              {order.status?.toLowerCase() === 'partially_delivered' && (
                <p className="text-sm text-gray-500 mt-2">
                  Some items from your order have been delivered
                </p>
              )}
            </div>
          </div>

          {/* Customer Information */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold mb-2">Customer Information</h3>
              <p><strong>Name:</strong> {order.customer_name}</p>
              <p><strong>Email:</strong> {order.customer_email}</p>
              {order.customer_phone && (
                <p><strong>Phone:</strong> {order.customer_phone}</p>
              )}
            </div>
            <div>
              <h3 className="font-semibold mb-2">Shipping Address</h3>
              <p className="whitespace-pre-wrap">{order.customer_address}</p>
            </div>
          </div>
          
          {/* Payment Information */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Payment Information</h3>
            <p><strong>Method:</strong> {order.payment_method?.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</p>
            <p><strong>Total Amount:</strong> {order.bill}tk</p>
          </div>

          {/* Order Items */}
          <div>
            <h3 className="font-semibold mb-4">Order Items</h3>
            <div className="space-y-4">
              {order.items?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleProductClick(item)}
                >
                  {/* Product Image */}
                  {item.product_image && (
                    <img
                      src={item.product_image}
                      alt={item.title}
                      className="w-20 h-20 object-cover rounded-lg mr-4"
                    />
                  )}
                  
                  {/* Product Details */}
                  <div className="flex-1">
                    <h4 className="font-medium">{item.title}</h4>
                    <p className="text-sm text-gray-600">
                      {item.size && <span>Size: {item.size} | </span>}
                      {item.color && <span>Color: {item.color} | </span>}
                      Quantity: {item.quantity}
                    </p>
                    <p className="text-sm">
                      Price: {item.unit_price}tk × {item.quantity} = {item.total_price}tk
                    </p>
                  </div>
                  
                  {/* Review Button */}
                  {isOrderDelivered && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReviewClick(item);
                      }}
                      className="ml-4 px-4 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors text-sm"
                    >
                      Write Review
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h2 className="text-2xl font-bold mb-4">Write a Review</h2>
            <p className="text-gray-600 mb-4">for {selectedItem.title}</p>
            
            {/* Rating */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewData({ ...reviewData, rating: star })}
                    className={`p-1 rounded-full transition-colors ${
                      star <= reviewData.rating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  >
                    <Star fill={star <= reviewData.rating ? 'currentColor' : 'none'} />
                  </button>
                ))}
              </div>
            </div>
            
            {/* Review Content */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Your Review</label>
              <textarea
                value={reviewData.content}
                onChange={(e) => setReviewData({ ...reviewData, content: e.target.value })}
                placeholder="Write your review here..."
                className="w-full p-2 border rounded-lg"
                rows="4"
              />
            </div>
            
            {/* Buttons */}
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleReviewSubmit}
                className="px-4 py-2 bg-black text-white rounded-full hover:bg-gray-800"
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailsPage; 