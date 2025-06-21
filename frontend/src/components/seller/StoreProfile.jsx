import { useState, useEffect } from 'react'
import { Edit3, Upload, CheckCircle } from "lucide-react"
import { fetchUserStatus, fetchSellerStats } from '../../services/api'
import StarRating from '../ui/StarRating'

const StoreProfile = () => {
  const [sellerData, setSellerData] = useState(null)
  const [sellerStats, setSellerStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSellerData = async () => {
      try {
        setLoading(true)
        
        // Get user status to get seller profile
        const userStatus = await fetchUserStatus()
        
        if (userStatus.seller_profile) {
          setSellerData(userStatus.seller_profile)
          
          // Get seller statistics including rating
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

    loadSellerData()
  }, [])

  if (loading) {
    return (
      <div className="bg-white/90 rounded-lg p-6 mb-6">
        <div className="animate-pulse">Loading store profile...</div>
      </div>
    )
  }

  if (!sellerData) {
    return (
      <div className="bg-white/90 rounded-lg p-6 mb-6">
        <div className="text-gray-500">Store profile not found</div>
      </div>
    )
  }
  return (
    <div className="bg-white/90 rounded-lg overflow-hidden mb-6">
      {/* Cover photo area */}
      <div className="relative w-full h-48 bg-gray-200">
        {/* Upload cover photo button */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <button className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full text-sm">
            <Upload className="h-4 w-4" />
            Upload New Cover Photo
          </button>
        </div>
      </div>

      {/* Profile info section */}
      <div className="relative px-6 pb-6">
        {/* Profile picture - positioned to overlap the cover photo */}
        <div className="absolute -top-16 left-8">
          <div className="w-32 h-32 bg-gray-200 rounded-full border-4 border-white flex items-center justify-center overflow-hidden">
            {sellerData.logo ? (
              <img 
                src={sellerData.logo} 
                alt={sellerData.business_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-gray-600 text-xl font-medium">
                {sellerData.business_name?.charAt(0) || 'S'}
              </div>
            )}
          </div>
        </div>

        {/* Content section with proper spacing for the overlapping profile picture */}
        <div className="pt-20 flex justify-between items-start">
          {/* Store name and bio */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl font-bold text-gray-700 uppercase">
                {sellerData.business_name || 'Store Name'}
              </h1>
              {sellerData.verified && (
                <CheckCircle className="h-5 w-5 text-black fill-gray-200" />
              )}
            </div>
            
            {/* Rating display */}
            {sellerStats && sellerStats.rating > 0 && (
              <div className="mb-2">
                <StarRating 
                  rating={sellerStats.rating} 
                  size="medium" 
                  showValue={true}
                  showCount={true}
                  reviewCount={sellerStats.total_reviews}
                />
              </div>
            )}
            
            <p className="text-gray-500 text-sm max-w-md uppercase">
              {sellerData.bio || sellerData.business_description || 'No description available'}
            </p>
          </div>

          {/* Edit statistics button */}
          <button className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-full text-sm">
            <Edit3 className="h-4 w-4" />
            Edit statistics
          </button>
        </div>
      </div>
    </div>
  )
}

export default StoreProfile 