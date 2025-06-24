import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useProductStore } from '../../store'
import { StoreProfile, StoreNavigation, StoreReviews } from '../../features/store/components'
import { ProductGrid } from '../../features/product/components'
import { fetchStoreHomepageProducts, fetchStoreActiveOffers } from '../../services/api'

function StorePage() {
  const { id } = useParams()
  const [activeTab, setActiveTab] = useState('home')
  const [homepageProducts, setHomepageProducts] = useState([])
  const [loadingHomepage, setLoadingHomepage] = useState(false)
  const [storeOffers, setStoreOffers] = useState([])
  const [loadingOffers, setLoadingOffers] = useState(false)
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

  useEffect(() => {
    if (id && activeTab === 'home') {
      loadHomepageProducts()
    } else if (id && activeTab === 'offers') {
      loadStoreOffers()
    }
  }, [id, activeTab])

  const loadHomepageProducts = async () => {
    try {
      setLoadingHomepage(true)
      console.log('🔍 Loading homepage products for store ID:', id)
      console.log('🔍 URL param ID type:', typeof id, 'value:', id)
      console.log('🔍 Store object:', store)
      console.log('🔍 Store ID from store object:', store?.id)
      
      const response = await fetchStoreHomepageProducts(id)
      console.log('📡 Homepage products API response:', response)
      console.log('📡 Response length:', response.length)
      
      if (response.length > 0) {
        console.log('📡 First item structure:', response[0])
        response.forEach((item, index) => {
          console.log(`📦 Item ${index}:`, item)
          console.log(`📦 Product data ${index}:`, item.product_data)
        })
      }
      
      const products = response.map(item => item.product_data).filter(Boolean)
      console.log('✅ Processed products:', products)
      console.log('✅ Final products count:', products.length)
      
      setHomepageProducts(products)
    } catch (error) {
      console.error('❌ Failed to load homepage products:', error)
      setHomepageProducts([])
    } finally {
      setLoadingHomepage(false)
    }
  }

  const loadStoreOffers = async () => {
    try {
      setLoadingOffers(true)
      const response = await fetchStoreActiveOffers(id)
      setStoreOffers(response.offers || [])
    } catch (error) {
      console.error('Failed to load store offers:', error)
      setStoreOffers([])
    } finally {
      setLoadingOffers(false)
    }
  }

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
            {loadingHomepage ? (
              <div className="text-center py-12">Loading homepage products...</div>
            ) : (
              <>
                {homepageProducts.length > 0 ? (
                  <>
                    <h2 className="text-xl font-semibold mb-6 text-center">
                      FEATURED PRODUCTS
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                      {homepageProducts.map(product => (
                        <div key={product.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                          <div className="aspect-square bg-gray-100">
                            {product.image ? (
                              <img 
                                src={product.image} 
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                No Image
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <h3 className="font-medium text-gray-900 mb-1">{product.name}</h3>
                            <p className="text-gray-600 text-xs mb-2 line-clamp-2">{product.short_description}</p>
                            <div className="flex justify-between items-center">
                              <div>
                                {product.has_active_offer ? (
                                  <div className="space-y-1">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-gray-500 line-through text-sm">৳{product.original_price}</span>
                                      <span className="text-lg font-bold text-gray-900">৳{product.discounted_price}</span>
                                    </div>
                                    <div className="text-xs text-gray-600">
                                      Save ৳{product.savings_amount}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-lg font-bold text-gray-900">৳{product.price}</span>
                                )}
                              </div>
                              <button className="px-3 py-1 bg-black text-white text-sm rounded hover:bg-gray-800 transition-colors">
                                View
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <h2 className="text-xl font-semibold mb-4">No Featured Products</h2>
                    <p className="text-gray-500">The store owner hasn't selected any products to feature yet.</p>
                  </div>
                )}
                
                <h2 className="text-xl font-semibold mb-6 text-center">
                  ALL STORE PRODUCTS
                </h2>
                <ProductGrid 
                  storeId={id} 
                  showStoreInfo={false} 
                  className="px-4"
                />
              </>
            )}
          </>
        )}
        
        {activeTab === 'top-picks' && (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-4">TOP PICKS</h2>
            <p className="text-gray-500">The store's top picks will be displayed here.</p>
          </div>
        )}
        
        {activeTab === 'offers' && (
          <div className="py-12">
            <h2 className="text-xl font-semibold mb-6 text-center">SPECIAL OFFERS</h2>
            {loadingOffers ? (
              <div className="text-center">
                <p className="text-gray-500">Loading offers...</p>
              </div>
            ) : storeOffers.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {storeOffers.map((offer) => (
                  <div key={offer.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="font-semibold text-lg text-gray-900">{offer.name}</h3>
                      <div className="flex-shrink-0">
                        {offer.offer_type === 'percentage' ? (
                          <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                            {offer.discount_percentage}% OFF
                          </span>
                        ) : (
                          <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                            ৳{offer.discount_amount} OFF
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {offer.description && (
                      <p className="text-gray-600 text-sm mb-4">{offer.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Until {new Date(offer.end_date).toLocaleDateString()}</span>
                      <span className="text-black font-medium">Sale Price Applied</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center">
                <div className="bg-gray-50 rounded-lg p-8">
                  <div className="text-4xl mb-4">🎉</div>
                  <p className="text-gray-500">No active offers at the moment.</p>
                  <p className="text-gray-400 text-sm mt-2">Check back later for exciting deals!</p>
                </div>
              </div>
            )}
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