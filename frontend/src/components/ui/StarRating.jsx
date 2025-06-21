import { Star } from 'lucide-react'

const StarRating = ({ 
  rating = 0, 
  maxStars = 5, 
  size = 'medium', 
  showValue = true, 
  showCount = false,
  reviewCount = 0,
  className = ''
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'h-3 w-3'
      case 'large':
        return 'h-6 w-6'
      case 'xl':
        return 'h-8 w-8'
      default:
        return 'h-4 w-4'
    }
  }

  const getTextSize = () => {
    switch (size) {
      case 'small':
        return 'text-xs'
      case 'large':
        return 'text-base'
      case 'xl':
        return 'text-lg'
      default:
        return 'text-sm'
    }
  }

  const starSize = getSizeClasses()
  const textSize = getTextSize()
  const numericRating = parseFloat(rating) || 0

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {/* Stars */}
      <div className="flex items-center">
        {[...Array(maxStars)].map((_, index) => (
          <Star
            key={index}
            className={`${starSize} ${
              index < Math.floor(numericRating)
                ? 'text-black fill-black'
                : index < numericRating
                ? 'text-gray-600 fill-gray-600'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>

      {/* Rating value */}
      {showValue && (
        <span className={`${textSize} font-medium text-gray-700`}>
          {numericRating.toFixed(1)}
        </span>
      )}

      {/* Review count */}
      {showCount && reviewCount > 0 && (
        <span className={`${textSize} text-gray-500`}>
          ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
        </span>
      )}
    </div>
  )
}

export default StarRating 