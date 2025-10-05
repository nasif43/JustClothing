import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import marbleBg from '../../assets/marble-bg.jpg'

const OffersPage = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredProducts, setFilteredProducts] = useState([])

  // Simple API call to fetch products
  const fetchProducts = async (params = {}) => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    const queryParams = new URLSearchParams(params).toString()
    const url = `${API_BASE_URL}/api/v1/products/${queryParams ? `?${queryParams}` : ''}`
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Failed to fetch products')
    }
    return response.json()
  }

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true)
        // Fetch all products and filter for those with offers
        const response = await fetchProducts({ limit: 100 })
        const productsWithOffers = response.results?.filter(product => product.has_active_offer) || []
        setProducts(productsWithOffers)
        setFilteredProducts(productsWithOffers)
      } catch (err) {
        setError(err.message)
        console.error('Error loading products:', err)
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [])

  // Filter products based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredProducts(products)
    } else {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredProducts(filtered)
    }
  }, [searchTerm, products])

  return (
    <div
      className="min-h-screen w-full py-4 sm:py-8 px-2 sm:px-4 md:px-8"
      style={{ backgroundImage: `url(${marbleBg})`, backgroundSize: 'cover' }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Products on Sale
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Discover amazing discounts on products from all our sellers
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white bg-opacity-90 rounded-lg p-4 mb-6">
          <div className="max-w-md mx-auto">
            <input
              type="text"
              placeholder="Search products on sale..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Content */}
        <div className="bg-white bg-opacity-90 rounded-lg p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading products with offers...</p>
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
          ) : filteredProducts.length > 0 ? (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {searchTerm ? `Search Results (${filteredProducts.length})` : `Products on Sale (${filteredProducts.length})`}
                </h2>
              </div>
              
              {/* Products Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
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
                      
                      {/* Discount Badge */}
                      {product.savings_amount && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-sm font-bold">
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
              <div className="text-6xl mb-4">🏷️</div>
              <h3 className="text-xl font-medium mb-2">
                {searchTerm ? 'No Products Found' : 'No Products on Sale'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm 
                  ? `No products found matching "${searchTerm}"`
                  : 'There are no products with active offers at the moment. Check back soon for great deals!'
                }
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="inline-block px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors mr-4"
                >
                  Clear Search
                </button>
              )}
              <Link 
                to="/" 
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

export default OffersPage