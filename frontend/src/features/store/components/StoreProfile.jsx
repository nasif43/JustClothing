import { useProductStore } from '../../../store'
import { CheckCircle } from 'lucide-react'
import placeholderImg from '../../../assets/marble-bg.jpg'

function StoreProfile({ storeId }) {
  const { getStoreById, loading, error } = useProductStore()
  const store = getStoreById(storeId)

  if (loading) return <div className="text-center py-4">Loading store data...</div>
  if (error) return <div className="text-center py-4 text-gray-700">Error: {error}</div>
  if (!store) return <div className="text-center py-4">Store not found</div>

  return (
    <div className="bg-white/90 rounded-lg overflow-hidden mb-6">
      {/* Cover photo area */}
      <div className="relative h-68 bg-gray-200">
        <img 
          src={store.banner_image || placeholderImg} 
          alt={`${store.name} cover`} 
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = placeholderImg;
          }}
        />
      </div>

      {/* Profile info section */}
      <div className="relative px-6 pb-6">
        {/* Profile picture - positioned to overlap the cover photo */}
        <div className="absolute -top-16 left-8">
          <div className="w-32 h-32 bg-amber-100 rounded-full border-4 border-white overflow-hidden">
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
        </div>

        {/* Content section with proper spacing for the overlapping profile picture */}
        <div className="pt-20 flex justify-between items-start">
          {/* Store name and bio */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl font-bold text-gray-700">{store.name}</h1>
              {store.verified && (
                <CheckCircle className="h-5 w-5 text-gray-500 fill-gray-200" />
              )}
            </div>
            <p className="text-gray-500 text-sm max-w-md uppercase">
              {store.bio}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StoreProfile 