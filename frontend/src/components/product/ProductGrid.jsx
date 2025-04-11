import { useEffect } from 'react'
import { useProductStore } from '../../store'

function ProductGrid() {
  const { products, loading, error, fetchProducts } = useProductStore()
  
  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])
  
  const getStoreNameandRating = (id) => {
    try {
      const store = useProductStore.getState().getStoreById(id)
      return store ? `${store.name} • ${store.rating} ★` : 'Unknown Seller'
    } catch (err) {
      return 'Unknown Seller'
    }
  }
  
  if (loading) return <div className="text-center py-8">Loading products...</div>
  if (error) return <div className="text-center py-8 text-red-500">Error: {error}</div>
  if (!products.length) return <div className="text-center py-8">No products found</div>
  
  return (
    <div className="m-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <a href={`/product/${product.id}`} key={product.id} className="group">
          <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="aspect-square relative">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-3 text-center">
              <h3 className="text-sm font-medium">{product.name}</h3>
              <p className="text-xs text-gray-500">{product.category}</p>
              <div className="flex justify-between items-center mt-1">
                <div>
                  <p className="text-xs text-gray-500">{getStoreNameandRating(product.storeId)}</p>
                </div>
                <p className="text-base font-medium -mt-1">£{product.price}</p>
              </div>
            </div>
          </div>
        </a>
      ))}
    </div>
  )
}

export default ProductGrid
  