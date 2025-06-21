import { Link } from 'react-router-dom'
import { useProductStore } from '../../../store'
import StarRating from '../../../components/ui/StarRating'

function ProductCard({ product, showStoreInfo = true }) {
  if (!product) return null

  const getStoreInfo = (storeId) => {
    try {
      const store = useProductStore.getState().getStoreById(storeId)
      return store ? { 
        name: store.name,
        rating: store.rating,
        id: store.id
      } : { name: 'Unknown Seller', rating: 0, id: null }
    } catch (err) {
      return { name: 'Unknown Seller', rating: 0, id: null }
    }
  }

  const store = showStoreInfo ? getStoreInfo(product.storeId) : null

  return (
    <div className="group">
      <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <Link to={`/product/${product.id}`} className="block">
          <div className="aspect-square relative">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-3 text-center">
            <h3 className="text-sm font-medium uppercase">{product.name}</h3>
            <p className="text-xs text-gray-500">
              {product.tags}
            </p>
          </div>
        </Link>
        
        <div className="px-3 pb-3">
          {showStoreInfo && store ? (
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                {store.id ? (
                  <Link to={`/store/${store.id}`} className="text-xs text-gray-500 hover:underline">
                    {store.name}
                  </Link>
                ) : (
                  <p className="text-xs text-gray-500">{store.name}</p>
                )}
                {store.rating > 0 && (
                  <StarRating 
                    rating={store.rating} 
                    size="small" 
                    showValue={true}
                    className="mt-1"
                  />
                )}
              </div>
              <p className="text-xl font-medium">£{product.price}</p>
            </div>
          ) : (
            <p className="text-xl font-medium text-center mt-1 mb-2">£{product.price}</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProductCard 