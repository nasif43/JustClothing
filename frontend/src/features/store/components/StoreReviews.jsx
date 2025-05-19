import { useState, useEffect } from 'react'
import { fetchStoreReviews } from '../../../services/api'
import { useProductStore } from '../../../store'
import { Star } from 'lucide-react'
import RatingDistribution from './RatingDistribution'
import ReviewSorter from './ReviewSorter'
import ReviewCard from './ReviewCard'

function StoreReviews({ storeId }) {
  const [reviewData, setReviewData] = useState({
    reviews: [],
    stats: {
      averageRating: 0,
      totalReviews: 0,
      distribution: []
    }
  })
  const [sortBy, setSortBy] = useState('default')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { products } = useProductStore()
  
  useEffect(() => {
    const loadReviews = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await fetchStoreReviews(storeId, sortBy)
        
        // Enhance review data with product details
        const enhancedReviews = data.reviews.map(review => {
          const product = products.find(p => p.id === review.productId)
          return {
            ...review,
            productName: product?.name || 'Unknown Product',
            productImage: product?.image || null
          }
        })
        
        setReviewData({
          ...data,
          reviews: enhancedReviews
        })
      } catch (err) {
        setError(err.message || 'Failed to load reviews')
      } finally {
        setLoading(false)
      }
    }
    
    loadReviews()
  }, [storeId, sortBy, products])
  
  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy)
  }
  
  if (loading) return <div className="text-center py-8">Loading reviews...</div>
  if (error) return <div className="text-center py-8 text-gray-700">Error: {error}</div>
  
  const { averageRating, totalReviews, distribution } = reviewData.stats
  
  return (
    <div className="space-y-8">
      {/* Rating overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Average rating */}
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center mb-1">
          <div className="text-9xl font-bold">{averageRating}</div>
            <Star className="h-20 w-20 text-black border-black" />
          </div>
          <div className="text-gray-500 text-sm">BASED ON {totalReviews} REVIEWS</div>
        </div>
        
        {/* Rating distribution */}
        <div className="col-span-2">
          <RatingDistribution 
            distribution={distribution} 
            totalReviews={totalReviews} 
          />
        </div>
      </div>
      
      {/* Sort controls */}
      <ReviewSorter 
        activeSorting={sortBy} 
        onSortChange={handleSortChange} 
      />
      
      {/* Review cards */}
      <div className="space-y-4">
        {reviewData.reviews.length > 0 ? (
          reviewData.reviews.map(review => (
            <ReviewCard key={review.id} review={review} />
          ))
        ) : (
          <div className="text-center py-8 text-gray-700">
            No reviews found for this store
          </div>
        )}
      </div>
    </div>
  )
}

export default StoreReviews 