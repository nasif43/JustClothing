import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import marbleBg from '../../assets/marble-bg.jpg'
import ProductCard from '../../features/product/components/ProductCard'

const TrendingPage = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [analyticsData, setAnalyticsData] = useState(null)

  // API call to fetch trending products
  const fetchTrendingProducts = async () => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    const url = `${API_BASE_URL}/api/v1/products/trending/`
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Failed to fetch trending products')
    }
    return response.json()
  }

  useEffect(() => {
    const loadTrendingProducts = async () => {
      try {
        setLoading(true)
        const response = await fetchTrendingProducts()
        setProducts(response.products || [])
        setAnalyticsData(response)
      } catch (err) {
        setError(err.message)
        console.error('Error loading trending products:', err)
      } finally {
        setLoading(false)
      }
    }

    loadTrendingProducts()
  }, [])

  return (
    <div
      className="min-h-screen w-full py-4 sm:py-8 px-2 sm:px-4 md:px-8"
      style={{ backgroundImage: `url(${marbleBg})`, backgroundSize: 'cover' }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Trending Products
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Discover what's popular right now based on real-time customer activity
          </p>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading trending products...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mx-4">
            <h3 className="font-medium mb-2">Error Loading Products</h3>
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-3 text-red-600 hover:text-red-800 underline"
            >
              Try Again
            </button>
          </div>
        ) : products.length > 0 ? (
          <div className="mx-2 sm:m-10">
            {/* Analytics Info */}
            <div className="mb-6">
              <p className="text-gray-500 text-sm text-center">
                Analytics based on customer activity in the last {analyticsData?.analytics_period_hours || 24} hours
              </p>
            </div>
              
              {/* Products Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                {products.map((product, index) => (
                  <div key={product.id} className="group flex flex-col h-full">
                    {/* Analytics Text Above Card - Fixed Height */}
                    <div className="mb-2 text-center h-12 flex items-center justify-center">
                      <div className="text-sm text-gray-500">
                        {product.analytics && (
                          <div className="space-y-1">
                            {product.analytics.cart_adds > 0 && (
                              <div>
                                added to cart {product.analytics.cart_adds} times in {product.analytics.hours_analyzed} hours
                              </div>
                            )}
                            {product.analytics.orders > 0 && (
                              <div>
                                ordered {product.analytics.orders} times in {product.analytics.hours_analyzed} hours
                              </div>
                            )}
                            {product.analytics.cart_adds === 0 && product.analytics.orders === 0 && (
                              <div>
                                No recent activity in {product.analytics.hours_analyzed} hours
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Product Card Container */}
                    <div className="relative flex-1">
                      {/* Trending Rank Badge */}
                      <div className="absolute top-2 left-2 bg-gray-800 text-white px-2 py-1 rounded-full text-xs font-bold z-10">
                        #{index + 1}
                      </div>
                      
                      {/* Product Card */}
                      <ProductCard 
                        product={product} 
                        showStoreInfo={true}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
        ) : (
          <div className="text-center py-12 mx-4">
            <div className="text-6xl mb-4">📈</div>
            <h3 className="text-xl font-medium mb-2">
              No Trending Products
            </h3>
            <p className="text-gray-600 mb-4">
              There are no trending products at the moment. Check back soon!
            </p>
            <Link 
              to="/home" 
              className="inline-block px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Browse All Products
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default TrendingPage