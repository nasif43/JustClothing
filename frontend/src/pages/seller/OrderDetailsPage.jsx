import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import SellerLayout from '../../components/layout/SellerLayout'
import { Download } from 'lucide-react'

const OrderDetailsPage = () => {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Simulated order data - in a real app, this would come from an API
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockOrder = {
        id: orderId,
        isCompleted: orderId === '00001',
        customerName: 'John Doe',
        customerAddress: '123 Main Street, Dhaka',
        totalPrice: 620,
        items: [
          {
            id: 1,
            title: 'Premium Cotton T-Shirt',
            photo: null,
            size: 'M',
            color: 'Black',
            quantity: 2,
            price: 350
          },
          {
            id: 2,
            title: 'Slim Fit Jeans',
            photo: null,
            size: 'L',
            color: 'Blue',
            quantity: 1,
            price: 270
          }
        ]
      }
      
      setOrder(mockOrder)
      setLoading(false)
    }, 500)
  }, [orderId])
  
  const handleMarkAsCompleted = () => {
    // In a real app, this would make an API call
    setOrder(prev => ({
      ...prev,
      isCompleted: true
    }))
    
    // Navigate back to orders list after a delay
    setTimeout(() => {
      navigate('/seller/orders')
    }, 1000)
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

  return (
    <SellerLayout>
      <div className="bg-white/90 rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">Order details</h1>
        
        <div className="border border-gray-200 rounded-lg p-8">
          {/* Download Receipt Button */}
          <button 
            className="bg-black text-white px-4 py-2 rounded flex items-center gap-2 mb-6"
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
                value={order.customerName}
                readOnly={order.isCompleted}
                className="w-full border border-gray-300 rounded p-2"
              />
              
              <label className="block text-sm text-gray-600 mb-1 mt-4">address</label>
              <input 
                type="text" 
                value={order.customerAddress}
                readOnly={order.isCompleted}
                className="w-full border border-gray-300 rounded p-2"
              />
            </div>
            
            <div className="flex flex-col items-end">
              <label className="block text-sm text-gray-600 mb-1">total price</label>
              <div className="w-full bg-gray-200 rounded p-2 text-right">
                {order.totalPrice}tk.
              </div>
            </div>
          </div>
          
          {/* Order Items */}
          <div className="space-y-4">
            {order.items.map(item => (
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
                  <div className="w-32 h-32 border border-gray-300 bg-white"></div>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Size</label>
                  <input 
                    type="text" 
                    value={item.size}
                    readOnly={order.isCompleted}
                    className="w-full border border-gray-300 rounded p-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-600 mb-1">colour</label>
                  <input 
                    type="text" 
                    value={item.color}
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
                  <label className="block text-sm text-gray-600 mb-1">price</label>
                  <input 
                    type="number" 
                    value={item.price}
                    readOnly={order.isCompleted}
                    className="w-full border border-gray-300 rounded p-2"
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
                className="bg-black text-white px-6 py-3 rounded"
              >
                MARK AS COMPLETED
              </button>
            </div>
          )}
        </div>
      </div>
    </SellerLayout>
  )
}

export default OrderDetailsPage 