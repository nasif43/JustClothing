import { useState, useEffect } from 'react'
import { useProductStore } from '../../../store'
import ProductCard from './ProductCard'

function ProductGrid({ storeId = null, showStoreInfo = true, className = "m-10" }) {
  const { 
    products, 
    filteredProducts, 
    currentBusinessType, 
    loading, 
    error, 
    fetchProducts,
    getCurrentProducts 
  } = useProductStore()
  const [displayProducts, setDisplayProducts] = useState([])
  
  useEffect(() => {
    // Initialize products if not loaded
    if (products.length === 0 && !loading) {
      fetchProducts()
    }
  }, [products, loading, fetchProducts])
  
  useEffect(() => {
    let productsToShow = []
    
    if (storeId) {
      // If storeId is provided, filter from all products for that specific store
      productsToShow = products.filter(product => 
        product.storeId === Number(storeId)
      )
    } else {
      // Use current products (filtered by business type or all products)
      productsToShow = getCurrentProducts()
    }
    
    setDisplayProducts(productsToShow)
  }, [products, filteredProducts, currentBusinessType, storeId, getCurrentProducts])
  
  if (loading) return <div className="text-center py-8">Loading products...</div>
  if (error) return <div className="text-center py-8 text-gray-700">Error: {error}</div>
  
  if (!displayProducts.length) {
    let emptyMessage = "No products found"
    
    if (storeId) {
      emptyMessage = "No products found for this store"
    } else if (currentBusinessType) {
      // Map business type to display name
      const displayName = currentBusinessType === "General Clothing" ? "General Clothing" :
                          currentBusinessType === "Thrifted Clothing" ? "Thrifted Clothing" :
                          currentBusinessType === "Loose Fabric" ? "Loose Fabric" : currentBusinessType
      emptyMessage = `No products found for ${displayName}`
    }
    
    return (
      <div className="text-center py-8">
        {emptyMessage}
      </div>
    )
  }
  
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {displayProducts.map((product) => (
        <ProductCard 
          key={product.id} 
          product={product} 
          showStoreInfo={showStoreInfo}
        />
      ))}
    </div>
  )
}

export default ProductGrid 