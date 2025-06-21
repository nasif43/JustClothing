import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import SellerLayout from '../../components/layout/SellerLayout'
import { Download } from 'lucide-react'
import { fetchSellerOrderDetails, updateOrderStatus } from '../../services/api'

const OrderDetailsPage = () => {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updating, setUpdating] = useState(false)
  
  useEffect(() => {
    const loadOrderDetails = async () => {
      try {
        setLoading(true)
        setError(null)
        const orderData = await fetchSellerOrderDetails(orderId)
        console.log('Seller Order Details:', orderData)
        setOrder(orderData)
      } catch (err) {
        setError(err.message || 'Failed to load order details')
        console.error('Failed to fetch seller order details:', err)
      } finally {
        setLoading(false)
      }
    }

    if (orderId) {
      loadOrderDetails()
    }
  }, [orderId])
  
  const handleMarkAsCompleted = async () => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      'Are you sure you want to mark this order as COMPLETED? This action will finalize the order.'
    )
    
    if (!confirmed) {
      return
    }

    try {
      setUpdating(true)
      await updateOrderStatus(orderId, 'delivered', 'Order marked as completed by seller')
      
      // Update local state
      setOrder(prev => ({
        ...prev,
        status: 'delivered',
        isCompleted: true
      }))
      
      // Navigate back to orders list after a delay
      setTimeout(() => {
        navigate('/seller/orders')
      }, 1000)
    } catch (err) {
      setError(err.message || 'Failed to update order status')
      console.error('Failed to update order status:', err)
    } finally {
      setUpdating(false)
    }
  }
  
  const handleStatusChange = async (newStatus) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to change the order status to "${newStatus.toUpperCase()}"?`
    )
    
    if (!confirmed) {
      return
    }

    try {
      setUpdating(true)
      await updateOrderStatus(orderId, newStatus, `Order status changed to ${newStatus}`)
      
      // Update local state
      setOrder(prev => ({
        ...prev,
        status: newStatus,
        isCompleted: newStatus === 'delivered'
      }))
    } catch (err) {
      setError(err.message || 'Failed to update order status')
      console.error('Failed to update order status:', err)
    } finally {
      setUpdating(false)
    }
  }

  const handleDownloadReceipt = () => {
    if (!order.isCompleted) {
      alert('Receipt can only be downloaded for completed orders.')
      return
    }

    // Create receipt content
    const receiptContent = `
      JUSTCLOTHING - ORDER RECEIPT
      ============================
      
      Order ID: #${order.id}
      Date: ${order.placedOn} at ${order.time}
      Status: ${order.status.toUpperCase()}
      
      CUSTOMER DETAILS:
      Name: ${order.customer_name}
      Phone: ${order.customer_phone}
      Address: ${order.customer_address}
      
      ORDER ITEMS:
      ${order.items.map(item => 
        `- ${item.title}
          Size: ${item.size || 'N/A'}, Color: ${item.color || 'N/A'}
          Qty: ${item.quantity} x ${item.unit_price}tk = ${item.total_price}tk`
      ).join('\n')}
      
      TOTAL: ${order.bill}tk
      Payment Method: ${order.payment_method.toUpperCase()}
      
      Thank you for your business!
      JustClothing Team
    `

    // Create and download the receipt
    const blob = new Blob([receiptContent], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `JustClothing_Receipt_${order.id}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <SellerLayout>
        <div className="bg-white/90 rounded-lg p-6 text-center">
          <p>Loading order details...</p>
        </div>
      </SellerLayout>
    )
  }

  if (error) {
    return (
      <SellerLayout>
        <div className="bg-white/90 rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-4 text-center">Order details</h1>
          <div className="bg-gray-100 border border-gray-400 text-black px-4 py-3 rounded">
            <p>Error: {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-1 bg-black text-white rounded hover:bg-gray-800"
            >
              Retry
            </button>
          </div>
        </div>
      </SellerLayout>
    )
  }

  if (!order) {
    return (
      <SellerLayout>
        <div className="bg-white/90 rounded-lg p-6 text-center">
          <p>Order not found</p>
        </div>
      </SellerLayout>
    )
  }

  return (
    <SellerLayout>
      <div className="bg-white/90 rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">Order details</h1>
        
        <div className="border border-gray-200 rounded-lg p-8">
          {/* Order Status */}
          <div className="mb-6">
            <label className="block text-sm text-gray-600 mb-2">Order Status</label>
            <select 
              value={order.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={order.isCompleted || updating}
              className="border border-gray-300 rounded p-2 mb-4"
            >
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
            </select>
            {updating && <p className="text-sm text-gray-500">Updating...</p>}
          </div>

          {/* Download Receipt Button */}
          <button 
            onClick={handleDownloadReceipt}
            className={`px-4 py-2 rounded flex items-center gap-2 mb-6 ${
              order.isCompleted 
                ? 'bg-black text-white hover:bg-gray-800' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            disabled={!order.isCompleted}
          >
            <Download size={18} />
            DOWNLOAD RECEIPT
          </button>
          
          {/* Customer Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm text-gray-600 mb-1">customer name</label>
              <input 
                type="text" 
                value={order.customer_name}
                readOnly={order.isCompleted}
                className="w-full border border-gray-300 rounded p-2"
              />
              
              <label className="block text-sm text-gray-600 mb-1 mt-4">address</label>
              <textarea 
                value={order.customer_address}
                readOnly={order.isCompleted}
                className="w-full border border-gray-300 rounded p-2"
                rows="3"
              />
              
              <label className="block text-sm text-gray-600 mb-1 mt-4">phone</label>
              <input 
                type="text" 
                value={order.customer_phone}
                readOnly={order.isCompleted}
                className="w-full border border-gray-300 rounded p-2"
              />
            </div>
            
            <div className="flex flex-col items-end">
              <label className="block text-sm text-gray-600 mb-1">total price</label>
              <div className="w-full bg-gray-200 rounded p-2 text-right">
                {order.bill}tk.
              </div>
              <div className="text-sm text-gray-500 mt-2">
                Placed on: {order.placedOn} at {order.time}
              </div>
            </div>
          </div>
          
          {/* Order Items */}
          <div className="space-y-4">
            {order.items && order.items.map(item => (
              <div 
                key={item.id}
                className="bg-gray-200 p-4 rounded-lg grid grid-cols-1 md:grid-cols-6 gap-4"
              >
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600 mb-1">Product Title</label>
                  <input 
                    type="text" 
                    value={item.title}
                    readOnly={order.isCompleted}
                    className="w-full border border-gray-300 rounded p-2"
                  />
                  
                  <label className="block text-sm text-gray-600 mb-1 mt-2">product photo</label>
                  <div className="w-32 h-32 border border-gray-300 bg-white">
                    {item.product_image && (
                      <img 
                        src={item.product_image} 
                        alt={item.title}
                        className="w-full h-full object-cover rounded"
                      />
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Size</label>
                  <input 
                    type="text" 
                    value={item.size || 'N/A'}
                    readOnly={order.isCompleted}
                    className="w-full border border-gray-300 rounded p-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-600 mb-1">colour</label>
                  <input 
                    type="text" 
                    value={item.color || 'N/A'}
                    readOnly={order.isCompleted}
                    className="w-full border border-gray-300 rounded p-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-600 mb-1">quantity</label>
                  <input 
                    type="number" 
                    value={item.quantity}
                    readOnly={order.isCompleted}
                    className="w-full border border-gray-300 rounded p-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-600 mb-1">unit price</label>
                  <input 
                    type="text" 
                    value={`${item.unit_price}tk`}
                    readOnly={order.isCompleted}
                    className="w-full border border-gray-300 rounded p-2"
                  />
                  <label className="block text-sm text-gray-600 mb-1 mt-2">total</label>
                  <input 
                    type="text" 
                    value={`${item.total_price}tk`}
                    readOnly={order.isCompleted}
                    className="w-full border border-gray-300 rounded p-2 font-bold"
                  />
                </div>
              </div>
            ))}
          </div>
          
          {/* Mark as Completed Button */}
          {!order.isCompleted && (
            <div className="flex justify-center mt-8">
              <button 
                onClick={handleMarkAsCompleted}
                disabled={updating}
                className="bg-black text-white px-6 py-3 rounded disabled:bg-gray-400"
              >
                {updating ? 'UPDATING...' : 'MARK AS COMPLETED'}
              </button>
            </div>
          )}
          
          {order.isCompleted && (
            <div className="flex justify-center mt-8">
              <div className="bg-black text-white px-6 py-3 rounded">
                ✓ Order Completed
              </div>
            </div>
          )}
        </div>
      </div>
    </SellerLayout>
  )
}

export default OrderDetailsPage 