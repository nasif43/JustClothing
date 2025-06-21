import React, { useState, useEffect } from 'react'
import { MessageCircle } from 'lucide-react'
import SellerLayout from '../../components/layout/SellerLayout'
import { fetchUserStatus, fetchSellerStats } from '../../services/api'
import StarRating from '../../components/ui/StarRating'

const SellerReviewsPage = () => {
  const [sellerData, setSellerData] = useState(null)
  const [sellerStats, setSellerStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        // Get user status to get seller profile
        const userStatus = await fetchUserStatus()
        
        if (userStatus.seller_profile) {
          setSellerData(userStatus.seller_profile)
          
          // Get seller statistics
          try {
            const stats = await fetchSellerStats(userStatus.seller_profile.id)
            setSellerStats(stats)
          } catch (error) {
            console.error('Failed to fetch seller stats:', error)
          }
        }
      } catch (error) {
        console.error('Failed to fetch seller data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <SellerLayout>
        <div className="bg-white/90 rounded-lg p-6">
          <div className="animate-pulse">Loading reviews...</div>
        </div>
      </SellerLayout>
    )
  }

  return (
    <SellerLayout>
      <div className="bg-white/90 rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4">Customer Reviews</h1>
        <p className="text-gray-600 mb-6">
          View and respond to customer reviews for your products and store.
        </p>
        
        {/* Rating Overview */}
        {sellerStats && (
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="flex flex-col items-center mb-2">
                  <span className="text-3xl font-bold mb-2">{sellerStats.rating?.toFixed(1) || '0.0'}</span>
                  <StarRating 
                    rating={sellerStats.rating} 
                    size="large" 
                    showValue={false}
                  />
                </div>
                <p className="text-gray-600">Overall Rating</p>
              </div>
              
                              <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <MessageCircle className="h-8 w-8 text-black" />
                    <span className="text-3xl font-bold">{sellerStats.total_reviews || 0}</span>
                  </div>
                  <p className="text-gray-600">Total Reviews</p>
                </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-3xl font-bold">{sellerStats.total_products || 0}</span>
                </div>
                <p className="text-gray-600">Products</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Reviews List */}
        {sellerStats && sellerStats.total_reviews > 0 ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Recent Reviews</h2>
            <div className="bg-gray-100 p-8 rounded-lg text-center">
              <h3 className="text-lg font-semibold mb-2">Reviews Integration Coming Soon</h3>
              <p className="text-gray-500">
                You have {sellerStats.total_reviews} review{sellerStats.total_reviews !== 1 ? 's' : ''} with an average rating of {sellerStats.rating?.toFixed(1)} stars.
                Individual review display will be implemented in the next update.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-gray-100 p-8 rounded-lg text-center">
            <h2 className="text-xl font-semibold mb-2">No Reviews Yet</h2>
            <p className="text-gray-500">Customer reviews will appear here once they leave feedback on your products.</p>
          </div>
        )}
      </div>
    </SellerLayout>
  )
}

export default SellerReviewsPage 