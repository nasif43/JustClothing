import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  fetchOffersPageData, 
  fetchTrendingOffers, 
  searchPromoCodes,
  trackPromoImpression 
} from '../../services/api'
import marbleBg from '../../assets/marble-bg.jpg'

// Import offer components
import OfferSection from '../../components/offers/OfferSection'
import OfferFilters from '../../components/offers/OfferFilters'
import { LoadingGrid } from '../../components/offers/LoadingCard'

const OffersPage = () => {
  const [offersData, setOffersData] = useState(null)
  const [trendingOffers, setTrendingOffers] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showingSearchResults, setShowingSearchResults] = useState(false)

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true)
        
        // Load main offers page data and trending offers in parallel
        const [offersResponse, trendingResponse] = await Promise.all([
          fetchOffersPageData(),
          fetchTrendingOffers().catch(() => ({ trending_offers: [] }))
        ])
        
        setOffersData(offersResponse)
        setTrendingOffers(trendingResponse.trending_offers || [])
        
      } catch (err) {
        setError(err.message)
        console.error('Error loading offers:', err)
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()
  }, [])

  // Handle search and filtering
  useEffect(() => {
    const performSearch = async () => {
      if (!searchTerm && !selectedType && !selectedCategory) {
        setShowingSearchResults(false)
        setSearchResults([])
        return
      }

      try {
        const results = await searchPromoCodes(searchTerm, selectedCategory, selectedType)
        setSearchResults(results.promo_codes || [])
        setShowingSearchResults(true)
      } catch (err) {
        console.error('Search error:', err)
        setSearchResults([])
        setShowingSearchResults(true)
      }
    }

    const debounceTimer = setTimeout(performSearch, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchTerm, selectedType, selectedCategory])

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedType('')
    setSelectedCategory('')
    setShowingSearchResults(false)
    setSearchResults([])
  }

  const handlePromoClick = async (featuredPromoId) => {
    if (featuredPromoId) {
      await trackPromoImpression(featuredPromoId, 'click')
    }
  }

  // Get available categories from offers data
  const getAvailableCategories = () => {
    if (!offersData?.category_offers) return []
    return Object.keys(offersData.category_offers)
  }

  return (
    <div
      className="min-h-screen w-full py-4 sm:py-8 px-2 sm:px-4 md:px-8"
      style={{ backgroundImage: `url(${marbleBg})`, backgroundSize: 'cover' }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Special Offers & Deals
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Discover amazing discounts, promo codes, and exclusive deals from all our sellers
          </p>
        </div>

        {loading ? (
          <div className="bg-white bg-opacity-90 rounded-lg p-6">
            <LoadingGrid count={6} />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
            <h3 className="font-medium mb-2">Error Loading Offers</h3>
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-3 text-red-600 hover:text-red-800 underline"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Search and Filters */}
            <div className="bg-white bg-opacity-90 rounded-lg">
              <OfferFilters
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedType={selectedType}
                setSelectedType={setSelectedType}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                categories={getAvailableCategories()}
                onClearFilters={clearFilters}
              />
            </div>

            {/* Search Results or Main Content */}
            <div className="bg-white bg-opacity-90 rounded-lg p-6">
              {showingSearchResults ? (
                <div>
                  <h2 className="text-2xl font-bold mb-6">
                    Search Results ({searchResults.length} found)
                  </h2>
                  {searchResults.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {searchResults.map((promoCode) => (
                        <div key={promoCode.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-3">
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                              {promoCode.code}
                            </code>
                            <span className="text-sm text-gray-500">
                              {promoCode.promotion_details?.promotion_type}
                            </span>
                          </div>
                          <h3 className="font-medium mb-2">{promoCode.promotion_details?.name}</h3>
                          <p className="text-gray-600 text-sm line-clamp-2">
                            {promoCode.promotion_details?.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No promo codes found matching your criteria</p>
                    </div>
                  )}
                </div>
              ) : offersData ? (
                <div className="space-y-12">
                  {/* Featured/Flash Deals */}
                  {offersData.flash_deals?.length > 0 && (
                    <OfferSection
                      title="⚡ Flash Deals"
                      description="Limited time offers ending soon!"
                      offers={offersData.flash_deals}
                      icon="🔥"
                      maxItems={6}
                    />
                  )}

                  {/* Hot Deals */}
                  {offersData.hot_deals?.length > 0 && (
                    <OfferSection
                      title="🔥 Hot Deals"
                      description="Most popular offers right now"
                      offers={offersData.hot_deals}
                      icon="🎯"
                      maxItems={6}
                    />
                  )}

                  {/* Trending Offers */}
                  {trendingOffers?.length > 0 && (
                    <OfferSection
                      title="📈 Trending Offers"
                      description="What everyone's talking about"
                      offers={trendingOffers}
                      icon="📊"
                      maxItems={6}
                    />
                  )}

                  {/* Percentage Deals */}
                  {offersData.percentage_deals?.length > 0 && (
                    <OfferSection
                      title="💯 Percentage Discounts"
                      description="Save big with percentage-based deals"
                      offers={offersData.percentage_deals}
                      icon="📊"
                      maxItems={8}
                    />
                  )}

                  {/* Free Shipping */}
                  {offersData.free_shipping_offers?.length > 0 && (
                    <OfferSection
                      title="🚚 Free Shipping"
                      description="No delivery charges on these offers"
                      offers={offersData.free_shipping_offers}
                      icon="📦"
                      maxItems={5}
                    />
                  )}

                  {/* Buy X Get Y */}
                  {offersData.bxgy_deals?.length > 0 && (
                    <OfferSection
                      title="🎁 Buy X Get Y"
                      description="Get more for your money"
                      offers={offersData.bxgy_deals}
                      icon="🎁"
                      maxItems={6}
                    />
                  )}

                  {/* Seasonal Offers */}
                  {offersData.seasonal_offers?.length > 0 && (
                    <OfferSection
                      title="🌟 Featured Offers"
                      description="Handpicked special deals"
                      offers={offersData.seasonal_offers}
                      icon="⭐"
                      maxItems={8}
                    />
                  )}

                  {/* Stats */}
                  {offersData.total_active_offers > 0 && (
                    <div className="text-center py-8 border-t border-gray-200">
                      <p className="text-gray-600">
                        Showing {offersData.total_active_offers} active offers across all categories
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-xl font-medium mb-2">No Active Offers</h3>
                  <p className="text-gray-600 mb-4">
                    There are no active offers at the moment. Check back soon for exciting deals!
                  </p>
                  <Link 
                    to="/" 
                    className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Browse Products
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default OffersPage