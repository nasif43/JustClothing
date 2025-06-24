import React, { useState, useEffect } from 'react'
import { MessageCircle, Reply, ThumbsUp, Calendar, Star } from 'lucide-react'
import SellerLayout from '../../components/layout/SellerLayout'
import { fetchUserStatus, fetchSellerStats, fetchSellerReviews, fetchSellerReviewStats, replyToReview } from '../../services/api'
import StarRating from '../../components/ui/StarRating'

const ReviewCard = ({ review, onReply }) => {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)

  const handleReplySubmit = async (e) => {
    e.preventDefault()
    if (!replyText.trim()) return

    setSubmittingReply(true)
    try {
      await onReply(review.id, replyText.trim())
      setReplyText('')
      setShowReplyForm(false)
    } catch (error) {
      console.error('Failed to submit reply:', error)
    } finally {
      setSubmittingReply(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-4">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-gray-600 font-medium">
              {review.user_info?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div>
            <h4 className="font-medium text-gray-900">
              {review.user_info?.name || 'Anonymous User'}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <StarRating rating={review.rating} size="small" showValue={false} />
              <span className="text-sm text-gray-500">
                {new Date(review.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {review.communication_rating && (
            <div className="text-xs text-gray-500">
              Communication: {review.communication_rating}/5
            </div>
          )}
          {review.shipping_rating && (
            <div className="text-xs text-gray-500">
              Shipping: {review.shipping_rating}/5
            </div>
          )}
        </div>
      </div>

      <div className="mb-4">
        <p className="text-gray-700 leading-relaxed">{review.content}</p>
      </div>

      {review.order && (
        <div className="text-sm text-gray-500 mb-4">
          Order #{review.order}
        </div>
      )}

      {/* Show existing reply if it exists */}
      {review.reply && (
        <div className="mt-4 bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-gray-900">{review.reply.seller_name}</span>
            <span className="text-xs text-gray-500">
              {new Date(review.reply.created_at).toLocaleDateString()}
            </span>
          </div>
          <p className="text-gray-700">{review.reply.content}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {!review.reply && (
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
            >
              <Reply className="h-4 w-4" />
              Reply
            </button>
          )}
        </div>
        <div className="text-sm text-gray-500">
          {review.quality_rating && `Quality: ${review.quality_rating}/5`}
        </div>
      </div>

      {showReplyForm && (
        <form onSubmit={handleReplySubmit} className="mt-4 border-t pt-4">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write your response to this review..."
            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-black"
            rows={3}
            required
          />
          <div className="flex justify-end gap-2 mt-3">
            <button
              type="button"
              onClick={() => setShowReplyForm(false)}
              className="px-4 py-2 text-gray-600 hover:text-black transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingReply || !replyText.trim()}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {submittingReply ? 'Posting...' : 'Post Reply'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

const SellerReviewsPage = () => {
  const [sellerData, setSellerData] = useState(null)
  const [sellerStats, setSellerStats] = useState(null)
  const [reviews, setReviews] = useState([])
  const [reviewStats, setReviewStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        // Get user status to get seller profile
        const userStatus = await fetchUserStatus()
        
        if (userStatus.seller_profile) {
          setSellerData(userStatus.seller_profile)
          
          // Load seller statistics and reviews in parallel
          try {
            const [stats, reviewsData, reviewStatsData] = await Promise.all([
              fetchSellerStats(userStatus.seller_profile.id),
              fetchSellerReviews(userStatus.seller_profile.id, 1, 10),
              fetchSellerReviewStats(userStatus.seller_profile.id)
            ])
            
            setSellerStats(stats)
            setReviews(reviewsData.results || reviewsData)
            setReviewStats(reviewStatsData)
            setHasMore((reviewsData.results || reviewsData).length === 10)
          } catch (error) {
            console.error('Failed to fetch seller data:', error)
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

  const loadMoreReviews = async () => {
    if (reviewsLoading || !hasMore || !sellerData) return

    setReviewsLoading(true)
    try {
      const nextPage = currentPage + 1
      const moreReviews = await fetchSellerReviews(sellerData.id, nextPage, 10)
      const newReviews = moreReviews.results || moreReviews
      
      setReviews(prev => [...prev, ...newReviews])
      setCurrentPage(nextPage)
      setHasMore(newReviews.length === 10)
    } catch (error) {
      console.error('Failed to load more reviews:', error)
    } finally {
      setReviewsLoading(false)
    }
  }

  const handleReplyToReview = async (reviewId, replyText) => {
    try {
      await replyToReview(reviewId, replyText)
      // Reload reviews to show the new reply
      if (sellerData) {
        const reviewsData = await fetchSellerReviews(sellerData.id, 1, 10)
        setReviews(reviewsData.results || reviewsData)
      }
      alert('Reply posted successfully!')
    } catch (error) {
      console.error('Failed to reply to review:', error)
      // Show specific error message to user
      alert(error.message || 'Failed to post reply. Please try again.')
    }
  }

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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <ThumbsUp className="h-8 w-8 text-green-600" />
                  <span className="text-3xl font-bold">
                    {reviewStats ? Math.round((reviewStats.rating_distribution?.['5'] + reviewStats.rating_distribution?.['4']) / reviewStats.total_reviews * 100) || 0 : 0}%
                  </span>
                </div>
                <p className="text-gray-600">Positive Reviews</p>
              </div>
            </div>
          </div>
        )}

        {/* Rating Distribution */}
        {reviewStats && reviewStats.rating_distribution && (
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Rating Distribution</h3>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map(rating => {
                const count = reviewStats.rating_distribution[rating.toString()] || 0
                const percentage = reviewStats.total_reviews > 0 ? (count / reviewStats.total_reviews) * 100 : 0
                
                return (
                  <div key={rating} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-12">
                      <span className="text-sm font-medium">{rating}</span>
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    </div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        
        {/* Reviews List */}
        {reviews.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Customer Reviews ({reviews.length})</h2>
              <div className="text-sm text-gray-500">
                Showing {reviews.length} of {sellerStats?.total_reviews || 0} reviews
              </div>
            </div>
            
            <div className="space-y-4">
              {reviews.map(review => (
                <ReviewCard 
                  key={review.id} 
                  review={review} 
                  onReply={handleReplyToReview}
                />
              ))}
            </div>

            {hasMore && (
              <div className="text-center mt-6">
                <button
                  onClick={loadMoreReviews}
                  disabled={reviewsLoading}
                  className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {reviewsLoading ? 'Loading...' : 'Load More Reviews'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-100 p-8 rounded-lg text-center">
            <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Reviews Yet</h2>
            <p className="text-gray-500">Customer reviews will appear here once they leave feedback on your products.</p>
          </div>
        )}
      </div>
    </SellerLayout>
  )
}

export default SellerReviewsPage 