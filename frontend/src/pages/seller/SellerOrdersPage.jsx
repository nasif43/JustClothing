import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import SellerLayout from '../../components/layout/SellerLayout'

const SellerOrdersPage = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Simulated orders data - in a real app, this would come from an API
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockOrders = [
        {
          id: '69420',
          totalItems: 2,
          billAmount: 790,
          placedOn: '02/03/25',
          placedTime: '04:20 P.M',
          isCompleted: false
        },
        {
          id: '00002',
          totalItems: 1,
          billAmount: 470,
          placedOn: '15/02/25',
          placedTime: '07:35 P.M',
          isCompleted: false
        },
        {
          id: '00001',
          totalItems: 3,
          billAmount: 620,
          placedOn: '01/02/25',
          placedTime: '01:45 P.M',
          isCompleted: true
        }
      ]
      
      setOrders(mockOrders)
      setLoading(false)
    }, 500)
  }, [])

  if (loading) {
    return (
      <SellerLayout>
        <div className="bg-white/90 rounded-lg p-6 text-center">
          <p>Loading orders...</p>
        </div>
      </SellerLayout>
    )
  }
  
  if (orders.length === 0) {
    return (
      <SellerLayout>
        <div className="bg-white/90 rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-4 text-center">ORDERS</h1>
          <div className="bg-gray-100 p-8 rounded-lg text-center">
            <h2 className="text-xl font-semibold mb-2">No Orders Yet</h2>
            <p className="text-gray-500">Your orders will appear here once customers place them.</p>
          </div>
        </div>
      </SellerLayout>
    )
  }

  return (
    <SellerLayout>
      <div className="bg-white/90 rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">ORDERS</h1>
        
        <div className="space-y-2">
          <div className="grid grid-cols-6 gap-2 font-medium px-4">
            <div className="col-span-1">ORDER NO.</div>
            <div className="col-span-4"></div>
            <div className="col-span-1"></div>
          </div>
          
          {orders.map(order => (
            <div 
              key={order.id}
              className={`grid grid-cols-6 gap-2 ${
                order.isCompleted 
                  ? 'bg-black text-white' 
                  : 'bg-gray-200 text-black'
              } p-4 rounded-lg`}
            >
              <div className="col-span-1 font-bold">#{order.id}</div>
              <div className="col-span-4">
                Total items : {order.totalItems} , Bill : {order.billAmount}tk.
                &nbsp;&nbsp;&nbsp;Placed on : {order.placedOn}, Time : {order.placedTime}
              </div>
              <div className="col-span-1 text-right">
                <Link
                  to={`/seller/orders/${order.id}`}
                  className={`inline-block px-6 py-1 rounded ${
                    order.isCompleted 
                      ? 'bg-white text-black'
                      : 'bg-gray-300 text-black hover:bg-gray-400'
                  }`}
                >
                  view
                </Link>
              </div>
            </div>
          ))}
        </div>
        
        {/* Smile icon at the bottom */}
        <div className="flex justify-center mt-8">
          <div className="text-3xl">☺</div>
        </div>
      </div>
    </SellerLayout>
  )
}

export default SellerOrdersPage 