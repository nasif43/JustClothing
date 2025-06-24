import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import SellerLayout from '../../components/layout/SellerLayout'
import { 
  Package, 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  MoreVertical,
  Edit,
  Eye,
  Trash2,
  Plus,
  AlertTriangle,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import { fetchSellerProducts, deleteProduct, updateProduct } from '../../services/api'

const SellerProductsPage = () => {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showingActions, setShowingActions] = useState(null)

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    filterAndSortProducts()
  }, [products, searchTerm, sortBy, statusFilter])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const response = await fetchSellerProducts()
      console.log('Seller Products API response:', response)
      
      let productsData = []
      if (Array.isArray(response)) {
        productsData = response
      } else if (response && Array.isArray(response.results)) {
        productsData = response.results
      } else if (response && response.data && Array.isArray(response.data)) {
        productsData = response.data
      }
      
      setProducts(productsData)
    } catch (err) {
      setError(err.message || 'Failed to load products')
      console.error('Failed to fetch seller products:', err)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortProducts = () => {
    let filtered = [...products]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(product => product.status === statusFilter)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at) - new Date(a.created_at)
        case 'oldest':
          return new Date(a.created_at) - new Date(b.created_at)
        case 'name':
          return a.name?.localeCompare(b.name) || 0
        case 'price_high':
          return (parseFloat(b.base_price?.amount || 0) - parseFloat(a.base_price?.amount || 0))
        case 'price_low':
          return (parseFloat(a.base_price?.amount || 0) - parseFloat(b.base_price?.amount || 0))
        case 'stock_high':
          return (b.stock_quantity || 0) - (a.stock_quantity || 0)
        case 'stock_low':
          return (a.stock_quantity || 0) - (b.stock_quantity || 0)
        case 'sales':
          return (b.sales_count || 0) - (a.sales_count || 0)
        default:
          return 0
      }
    })

    setFilteredProducts(filtered)
  }

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return
    }
    
    try {
      await deleteProduct(productId)
      setProducts(prev => prev.filter(p => p.id !== productId))
    } catch (error) {
      console.error('Failed to delete product:', error)
      alert('Failed to delete product: ' + error.message)
    }
  }

  const handleToggleStatus = async (productId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    
    try {
      await updateProduct(productId, { status: newStatus })
      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, status: newStatus } : p
      ))
    } catch (error) {
      console.error('Failed to update product status:', error)
      alert('Failed to update product status: ' + error.message)
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: 'bg-black text-white',
      inactive: 'bg-gray-400 text-white',
      draft: 'bg-gray-200 text-black',
      archived: 'bg-gray-600 text-white'
    }
    return statusConfig[status] || 'bg-gray-100 text-gray-800'
  }

  const getStockStatus = (stock) => {
    if (stock <= 0) return { text: 'Out of Stock', color: 'text-gray-600' }
    if (stock <= 5) return { text: 'Low Stock', color: 'text-gray-500' }
    return { text: 'In Stock', color: 'text-black' }
  }

  if (loading) {
    return (
      <SellerLayout>
        <div className="bg-white/90 rounded-lg p-6 text-center">
          <div className="flex items-center justify-center space-x-2">
            <Package className="h-6 w-6 animate-spin" />
            <p>Loading products...</p>
          </div>
        </div>
      </SellerLayout>
    )
  }

  if (error) {
    return (
      <SellerLayout>
        <div className="bg-white/90 rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-4 text-center">MY PRODUCTS</h1>
          <div className="bg-gray-100 border border-gray-400 text-black px-4 py-3 rounded">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-gray-600" />
              <p>Error: {error}</p>
            </div>
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

  return (
    <SellerLayout>
      <div className="bg-white/90 rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">MY PRODUCTS</h1>
          <Link
            to="/seller/products/add"
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </Link>
        </div>

        {/* Search and Filter Controls */}
        <div className="mb-6 p-4 bg-gray-100 rounded-lg space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:border-black"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="min-w-[150px]">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-black focus:border-black"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Sort */}
            <div className="min-w-[180px]">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-black focus:border-black"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Name A-Z</option>
                <option value="price_high">Price High-Low</option>
                <option value="price_low">Price Low-High</option>
                <option value="stock_high">Stock High-Low</option>
                <option value="stock_low">Stock Low-High</option>
                <option value="sales">Most Sold</option>
              </select>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            Showing {filteredProducts.length} of {products.length} products
          </div>
        </div>

        {/* Products Table */}
        {products.length === 0 ? (
          <div className="bg-gray-100 p-8 rounded-lg text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Products Yet</h2>
            <p className="text-gray-500 mb-4">Start by adding your first product to begin selling.</p>
            <Link
              to="/seller/products/add"
              className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 inline-flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Your First Product</span>
            </Link>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-gray-100 p-8 rounded-lg text-center">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Products Found</h2>
            <p className="text-gray-500 mb-4">No products match your current search and filters.</p>
            <button
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
                setSortBy('newest')
              }}
              className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-200 font-medium text-sm">
              <div className="col-span-4">PRODUCT</div>
              <div className="col-span-1">STATUS</div>
              <div className="col-span-1">STOCK</div>
              <div className="col-span-1">SOLD</div>
              <div className="col-span-2">PRICE</div>
              <div className="col-span-2">CREATED</div>
              <div className="col-span-1">ACTIONS</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-200">
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product.stock_quantity || 0)
                const price = product.base_price?.amount || 0
                const currency = product.base_price?.currency || 'BDT'
                
                return (
                  <div key={product.id} className="grid grid-cols-12 gap-4 p-4 hover:bg-gray-50">
                    {/* Product Info */}
                    <div className="col-span-4 flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0].image || product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover rounded-md"
                          />
                        ) : (
                          <Package className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{product.name}</p>
                        <p className="text-sm text-gray-500 truncate">
                          {product.category?.name || 'Uncategorized'}
                        </p>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="col-span-1 flex items-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(product.status)}`}>
                        {product.status?.toUpperCase() || 'UNKNOWN'}
                      </span>
                    </div>

                    {/* Stock */}
                    <div className="col-span-1 flex items-center">
                      <div className="text-center">
                        <p className="font-medium">{product.stock_quantity || 0}</p>
                        <p className={`text-xs ${stockStatus.color}`}>{stockStatus.text}</p>
                      </div>
                    </div>

                    {/* Sales */}
                    <div className="col-span-1 flex items-center">
                      <div className="text-center">
                        <p className="font-medium">{product.sales_count || 0}</p>
                        <div className="flex items-center justify-center">
                          {(product.sales_count || 0) > 0 ? (
                            <TrendingUp className="h-3 w-3 text-green-600" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="col-span-2 flex items-center">
                      <div>
                        <p className="font-medium">
                          {/* Handle different price formats */}
                          {product.base_price?.amount || product.price || 0} {product.base_price?.currency || 'BDT'}
                        </p>
                        {product.discount_percentage && (
                          <p className="text-xs text-gray-500">
                            {product.discount_percentage}% off
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Created Date */}
                    <div className="col-span-2 flex items-center">
                      <div className="text-sm text-gray-500">
                        {product.created_at ? new Date(product.created_at).toLocaleDateString() : 'Unknown'}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 flex items-center">
                      <div className="relative">
                        <button
                          onClick={() => setShowingActions(showingActions === product.id ? null : product.id)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        
                        {showingActions === product.id && (
                          <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[150px]">
                            <button
                              onClick={() => {
                                setShowingActions(null)
                                navigate(`/product/${product.id}`)
                              }}
                              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2 text-sm"
                            >
                              <Eye className="h-4 w-4" />
                              <span>View</span>
                            </button>
                            <button
                              onClick={() => {
                                setShowingActions(null)
                                navigate(`/seller/products/${product.id}/edit`)
                              }}
                              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2 text-sm"
                            >
                              <Edit className="h-4 w-4" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => {
                                setShowingActions(null)
                                handleToggleStatus(product.id, product.status)
                              }}
                              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2 text-sm"
                            >
                              {product.status === 'active' ? (
                                <>
                                  <ChevronDown className="h-4 w-4" />
                                  <span>Deactivate</span>
                                </>
                              ) : (
                                <>
                                  <ChevronUp className="h-4 w-4" />
                                  <span>Activate</span>
                                </>
                              )}
                            </button>
                            <hr className="my-1" />
                            <button
                              onClick={() => {
                                setShowingActions(null)
                                handleDeleteProduct(product.id)
                              }}
                              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2 text-sm text-gray-600"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Summary Stats */}
        {products.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-100 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold">{products.length}</p>
              <p className="text-sm text-gray-600">Total Products</p>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold">
                {products.filter(p => p.status === 'active').length}
              </p>
              <p className="text-sm text-gray-600">Active Products</p>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold">
                {products.reduce((sum, p) => sum + (p.stock_quantity || 0), 0)}
              </p>
              <p className="text-sm text-gray-600">Total Stock</p>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold">
                {products.reduce((sum, p) => sum + (p.sales_count || 0), 0)}
              </p>
              <p className="text-sm text-gray-600">Total Sales</p>
            </div>
          </div>
        )}

        {/* Smile icon at the bottom */}
        <div className="flex justify-center mt-8">
          <div className="text-3xl">☺</div>
        </div>
      </div>
    </SellerLayout>
  )
}

export default SellerProductsPage 