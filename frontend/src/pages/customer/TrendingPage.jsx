import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import marbleBg from '../../assets/marble-bg.jpg'

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

        {/* Content */}
        <div className="bg-white bg-opacity-90 rounded-lg p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading trending products...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
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
            <div>
              {/* Analytics Info */}
              <div className="mb-6">
                <p className="text-gray-500 text-sm text-center">
                  Analytics based on customer activity in the last {analyticsData?.analytics_period_hours || 24} hours
                </p>
              </div>
              
              {/* Products Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product, index) => (
                  <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    {/* Product Image */}
                    <div className="aspect-square relative">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0].image || product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.parentNode.querySelector('.fallback-image').style.display = 'flex'
                          }}
                        />
                      ) : product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.parentNode.querySelector('.fallback-image').style.display = 'flex'
                          }}
                        />
                      ) : null}
                      
                      {/* Fallback div for broken images */}
                      <div className="fallback-image w-full h-full bg-gray-200 flex items-center justify-center" style={{ display: (!product.images || product.images.length === 0) && !product.image ? 'flex' : 'none' }}>
                        <span className="text-gray-400">No Image</span>
                      </div>
                      
                      {/* Trending Rank Badge */}
                      <div className="absolute top-2 left-2 bg-gray-800 text-white px-2 py-1 rounded-full text-xs font-bold">
                        #{index + 1}
                      </div>
                      
                      {/* Discount Badge */}
                      {product.savings_amount && (
                        <div className="absolute top-2 right-2 bg-gray-600 text-white px-2 py-1 rounded-full text-sm font-bold">
                          Save ৳{product.savings_amount}
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                        {product.name}
                      </h3>
                      
                      {/* Seller */}
                      <p className="text-sm text-gray-600 mb-2">
                        by {product.store?.name || product.seller?.name || product.seller?.business_name || product.seller_name || product.seller_business_name || 'Seller'}
                      </p>

                      {/* Pricing */}
                      <div className="mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-gray-900">
                            ৳{product.discounted_price || product.price}
                          </span>
                          {product.original_price && product.original_price !== product.price && (
                            <span className="text-sm text-gray-500 line-through">
                              ৳{product.original_price}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* View Product Button */}
                      <Link
                        to={`/product/${product.id}`}
                        className="block w-full bg-gray-900 text-white text-center py-2 rounded-lg hover:bg-gray-800 transition-colors"
                      >
                        View Product
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
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
    </div>
  )
}

export default TrendingPage