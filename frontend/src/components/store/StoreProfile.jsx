import { useProductStore } from '../../store'
import { Check } from 'lucide-react'
import placeholderImg from '../../assets/marble-bg.jpg'

function StoreProfile({ storeId }) {
  const { getStoreById, loading, error } = useProductStore()
  const store = getStoreById(storeId)

  if (loading) return <div className="text-center py-4">Loading store data...</div>
  if (error) return <div className="text-center py-4 text-gray-700">Error: {error}</div>
  if (!store) return <div className="text-center py-4">Store not found</div>

  return (
    <div className="bg-amber-100 p-6 rounded-lg mb-6 relative">
      {/* Background cover - a seller would upload their own */}
      <div className="flex flex-col items-center text-center">
        {/* Centered profile image */}
        <div className="w-28 h-28 rounded-full overflow-hidden flex items-center justify-center mb-4 border-2 border-white">
          <img 
            src={store.logo || placeholderImg} 
            alt={store.name} 
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = placeholderImg;
            }}
          />
        </div>
        
        {/* Store name with verification badge next to it */}
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-2xl font-bold tracking-wide">{store.name}</h1>
          {store.verified && (
            <div className="bg-gray-800 rounded-full p-1">
              <Check className="h-4 w-4 text-white" />
            </div>
          )}
        </div>
        
        {/* Minimal bio */}
        <p className="text-sm uppercase max-w-md">{store.bio}</p>
      </div>
    </div>
  )
}

export default StoreProfile 