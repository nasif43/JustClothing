import { useState, useEffect } from 'react'
import { useProductStore } from '../../store'
import ProductCard from './ProductCard'

function ProductGrid({ storeId = null, showStoreInfo = true, className = "m-10" }) {
  const { products, loading, error, fetchProducts } = useProductStore()
  const [displayProducts, setDisplayProducts] = useState([])
  
  useEffect(() => {
    if (products.length === 0) {
      fetchProducts()
    } else if (storeId) {
      // Filter products for specific store if storeId is provided
      const storeProducts = products.filter(product => 
        product.storeId === Number(storeId)
      )
      setDisplayProducts(storeProducts)
    } else {
      // Use all products if no storeId is provided
      setDisplayProducts(products)
    }
  }, [products, storeId, fetchProducts])
  
  if (loading) return <div className="text-center py-8">Loading products...</div>
  if (error) return <div className="text-center py-8 text-gray-700">Error: {error}</div>
  
  if (!displayProducts.length) {
    return (
      <div className="text-center py-8">
        {storeId ? "No products found for this store" : "No products found"}
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
  