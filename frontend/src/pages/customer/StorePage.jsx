import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useProductStore } from '../../store'
import { StoreProfile, StoreNavigation, StoreReviews } from '../../features/store/components'
import { ProductGrid } from '../../features/product/components'

function StorePage() {
  const { id } = useParams()
  const [activeTab, setActiveTab] = useState('home')
  const { getStoreById, fetchStores, loading, error, stores } = useProductStore()
  const store = getStoreById(id)

  useEffect(() => {
    // If stores array is empty, fetch the stores data
    if (!stores || stores.length === 0) {
      fetchStores()
    }
    
    document.title = store ? `${store.name} | Just Clothing` : 'Store | Just Clothing'
    
    return () => {
      document.title = 'Just Clothing'
    }
  }, [store, stores, fetchStores])

  if (loading) return <div className="text-center py-8">Loading store details...</div>
  if (error) return <div className="text-center py-8 text-gray-700">Error: {error}</div>
  if (!store) return <div className="text-center py-8">Store not found</div>

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Store Profile Header */}
      <StoreProfile storeId={id} />
      
      {/* Navigation Tabs */}
      <StoreNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Content based on active tab */}
      <div className="mb-12">
        {activeTab === 'home' && (
          <>
            <h2 className="text-xl font-semibold mb-6 text-center">
              STORE PRODUCTS
            </h2>
            <ProductGrid 
              storeId={id} 
              showStoreInfo={false} 
              className="px-4"
            />
          </>
        )}
        
        {activeTab === 'top-picks' && (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-4">TOP PICKS</h2>
            <p className="text-gray-500">The store's top picks will be displayed here.</p>
          </div>
        )}
        
        {activeTab === 'offers' && (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-4">OFFERS</h2>
            <p className="text-gray-500">Special offers and discounts will be displayed here.</p>
          </div>
        )}
        
        {activeTab === 'reviews' && (
          <StoreReviews storeId={id} />
        )}
        
        {activeTab === 'social-media' && (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-4">SOCIAL MEDIA</h2>
            <p className="text-gray-500">Social media links and content will be displayed here.</p>
            <p className="mt-4 text-sm">Follow {store.name} on social media for the latest updates.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default StorePage 