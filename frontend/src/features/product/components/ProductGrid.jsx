import { useState, useEffect } from 'react'
import { useInView } from 'react-intersection-observer'
import { useProductStore } from '../../../store'
import ProductCard from './ProductCard'
import { ProductGridSkeleton } from '../../../components/ui/SkeletonLoader'

function ProductGrid({ storeId = null, showStoreInfo = true, className = "m-10" }) {
  const { 
    products, 
    filteredProducts, 
    currentBusinessType, 
    loading, 
    error, 
    hasMore,
    isLoadingMore,
    searchTerm,
    fetchProducts,
    getCurrentProducts,
    loadMoreProducts 
  } = useProductStore()
  const [displayProducts, setDisplayProducts] = useState([])
  
  // Intersection observer for infinite scroll - less aggressive
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.3,
    rootMargin: '20px' // Reduced from 100px to reduce premature loading
  })
  
  useEffect(() => {
    // Initialize products if not loaded
    if (products.length === 0 && !loading) {
      fetchProducts()
    }
  }, [products, loading, fetchProducts])

  // Disable infinite scroll to improve performance
  // useEffect(() => {
  //   if (inView && hasMore && !isLoadingMore && !loading && !searchTerm) {
  //     const additionalParams = {}
  //     if (currentBusinessType) {
  //       additionalParams.business_type = currentBusinessType
  //     }
  //     loadMoreProducts(additionalParams)
  //   }
  // }, [inView, hasMore, isLoadingMore, loading, searchTerm, currentBusinessType])
  
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
  
  if (loading && displayProducts.length === 0) return <ProductGridSkeleton count={6} />
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
    <div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
        {displayProducts.map((product) => (
          <div key={product.id} className="group flex flex-col h-full">
            <ProductCard 
              product={product} 
              showStoreInfo={showStoreInfo}
            />
          </div>
        ))}
      </div>
      
      {/* Infinite scroll trigger - only show when not searching and has more items */}
      {!searchTerm && hasMore && displayProducts.length > 0 && (
        <div ref={loadMoreRef} className="flex justify-center mt-8 py-4">
          {isLoadingMore && (
            <div className="flex items-center gap-2 text-gray-600">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
              <span>Loading more products...</span>
            </div>
          )}
        </div>
      )}
      
      {/* End of results indicator */}
      {!searchTerm && !hasMore && displayProducts.length > 0 && (
        <div className="text-center mt-8 py-4 text-gray-500">
          <span>No more products to show</span>
        </div>
      )}
    </div>
  )
}

export default ProductGrid 