import { Link } from 'react-router-dom'
import { MoreHorizontal, User, Star } from 'lucide-react'

function formatTimeAgo(date) {
  const now = new Date()
  const reviewDate = new Date(date)
  const diffInDays = Math.round((now - reviewDate) / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) return 'Today'
  if (diffInDays === 1) return 'Yesterday'
  if (diffInDays < 7) return `${diffInDays} days ago`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`
  return `${Math.floor(diffInDays / 365)} years ago`
}

function ReviewCard({ review }) {
  const {
    id,
    user,
    content,
    rating,
    productId,
    productName,
    productImage,
    images,
    createdAt
  } = review
  
  return (
    <div className="bg-black text-white p-6 rounded-lg mb-4">
      <div className="flex items-start gap-4">
        {/* User info */}
        <div className="flex-shrink-0">
          <div className="w-14 h-14 bg-gray-700 rounded-full flex items-center justify-center">
            {user.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.name} 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className="w-8 h-8 text-gray-400" />
            )}
          </div>
        </div>
        
        {/* Review content */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-semibold">{user.name}</h3>
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < rating ? 'text-black fill-black' : 'text-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="text-gray-200 mb-4">{content}</p>
          
          {/* Seller reply */}
          {review.reply && (
            <div className="bg-gray-800 rounded-lg p-4 mt-4 border-l-4 border-white">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium text-white">{review.reply.seller_name}</span>
                <span className="text-xs text-gray-400">
                  {formatTimeAgo(review.reply.created_at)}
                </span>
              </div>
              <p className="text-gray-200">{review.reply.content}</p>
            </div>
          )}
          
          {/* Review images */}
          {images && images.length > 0 && (
            <div className="flex gap-2 mb-4">
              {images.map((img, index) => (
                <div 
                  key={index}
                  className="w-20 h-20 bg-gray-700 rounded flex items-center justify-center"
                >
                  {index < 3 ? (
                    <img 
                      src={img} 
                      alt={`User review image ${index + 1}`} 
                      className="w-full h-full object-cover rounded"
                    />
                  ) : index === 3 ? (
                    <div className="w-full h-full bg-gray-700 rounded flex items-center justify-center">
                      <MoreHorizontal className="w-6 h-6 text-white" />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Product info */}
        <div className="flex-shrink-0 text-right">
          <Link to={`/product/${productId}`} className="inline-block">
            <div className="w-24 h-24 bg-gray-800 mb-2 rounded">
              {productImage && (
                <img 
                  src={productImage} 
                  alt={productName} 
                  className="w-full h-full object-cover rounded"
                />
              )}
            </div>
            <div className="text-xs uppercase font-medium">{productName}</div>
            <div className="text-gray-400 text-xs mt-1">{formatTimeAgo(createdAt)}</div>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ReviewCard 