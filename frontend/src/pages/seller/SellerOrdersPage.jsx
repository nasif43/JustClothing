import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import SellerLayout from '../../components/layout/SellerLayout'
import { fetchSellerOrders } from '../../services/api'

const SellerOrdersPage = () => {
  const [orders, setOrders] = useState([])
  const [filteredOrders, setFilteredOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    status: 'all',
    sortBy: 'newest'
  })
  
  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true)
        const response = await fetchSellerOrders()
        console.log('Seller Orders API response:', response)
        
        // Handle paginated response if needed
        let ordersData = []
        if (Array.isArray(response)) {
          ordersData = response
        } else if (response && Array.isArray(response.results)) {
          ordersData = response.results
        } else if (response && response.data && Array.isArray(response.data)) {
          ordersData = response.data
        }
        
        setOrders(ordersData)
        setFilteredOrders(ordersData)
      } catch (err) {
        setError(err.message || 'Failed to load orders')
        console.error('Failed to fetch seller orders:', err)
      } finally {
        setLoading(false)
      }
    }

    loadOrders()
  }, [])

  // Filter and sort orders when filters change
  useEffect(() => {
    let filtered = [...orders]

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(order => order.status === filters.status)
    }

    // Sort orders
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'newest':
          return new Date(b.created_at) - new Date(a.created_at)
        case 'oldest':
          return new Date(a.created_at) - new Date(b.created_at)
        case 'amount_high':
          return parseFloat(b.bill) - parseFloat(a.bill)
        case 'amount_low':
          return parseFloat(a.bill) - parseFloat(b.bill)
        case 'status':
          return a.status.localeCompare(b.status)
        default:
          return 0
      }
    })

    setFilteredOrders(filtered)
  }, [orders, filters])

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }))
  }

  if (loading) {
    return (
      <SellerLayout>
        <div className="bg-white/90 rounded-lg p-6 text-center">
          <p>Loading orders...</p>
        </div>
      </SellerLayout>
    )
  }
  
  if (error) {
    return (
      <SellerLayout>
        <div className="bg-white/90 rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-4 text-center">ORDERS</h1>
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
        
        {/* Filter Controls */}
        <div className="mb-6 p-4 bg-gray-100 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="all">All Orders</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort by
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="amount_high">Amount (High to Low)</option>
                <option value="amount_low">Amount (Low to High)</option>
                <option value="status">Status</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                Showing {filteredOrders.length} of {orders.length} orders
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="grid grid-cols-6 gap-2 font-medium px-4">
            <div className="col-span-1">ORDER NO.</div>
            <div className="col-span-4">ORDER DETAILS</div>
            <div className="col-span-1">ACTION</div>
          </div>
          
          {filteredOrders.length === 0 ? (
            <div className="bg-gray-100 p-8 rounded-lg text-center">
              <h2 className="text-xl font-semibold mb-2">No Orders Found</h2>
              <p className="text-gray-500">
                {filters.status !== 'all' || filters.sortBy !== 'newest'
                  ? 'No orders match your current filters. Try adjusting your filter settings.'
                  : 'Your orders will appear here once customers place them.'
                }
              </p>
              {(filters.status !== 'all' || filters.sortBy !== 'newest') && (
                <button
                  onClick={() => setFilters({ status: 'all', sortBy: 'newest' })}
                  className="mt-4 px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            filteredOrders.map(order => {
            const getStatusColor = (status) => {
              switch (status?.toLowerCase()) {
                case 'delivered':
                  return 'bg-black text-white'
                case 'shipped':
                  return 'bg-gray-600 text-white'
                case 'processing':
                  return 'bg-gray-400 text-black'
                case 'pending':
                  return 'bg-gray-200 text-black'
                case 'cancelled':
                  return 'bg-gray-800 text-white'
                default:
                  return 'bg-gray-100 text-gray-800'
              }
            }

            const getStatusBadge = (status) => {
              const colors = {
                pending: 'bg-gray-200 text-black',
                processing: 'bg-gray-300 text-black',
                shipped: 'bg-gray-400 text-white',
                delivered: 'bg-black text-white',
                cancelled: 'bg-gray-600 text-white'
              }
              return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800'
            }

            return (
              <div 
                key={order.id}
                className={`grid grid-cols-6 gap-2 ${getStatusColor(order.status)} p-4 rounded-lg`}
              >
                <div className="col-span-1 font-bold">#{order.id}</div>
                <div className="col-span-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(order.status)}`}>
                      {order.status?.toUpperCase() || 'UNKNOWN'}
                    </span>
                  </div>
                  <div>
                    Total items : {order.totalItems || 0} , Bill : {order.bill || 0}tk.
                    &nbsp;&nbsp;&nbsp;Placed on : {order.placedOn}, Time : {order.time}
                  </div>
                </div>
                <div className="col-span-1 text-right">
                  <Link
                    to={`/seller/orders/${order.id}`}
                    className={`inline-block px-6 py-1 rounded ${
                      order.isCompleted 
                        ? 'bg-white text-black hover:bg-gray-100'
                        : 'bg-gray-300 text-black hover:bg-gray-400'
                    }`}
                  >
                    view
                  </Link>
                </div>
              </div>
                         )
           })
          )}
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