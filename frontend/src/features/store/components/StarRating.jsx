import { Star } from 'lucide-react'

function StarRating({ rating, size = 'medium', showEmpty = true, maxStars = 5 }) {
  const getStarSize = () => {
    switch (size) {
      case 'small': return 'h-4 w-4'
      case 'large': return 'h-8 w-8'
      default: return 'h-6 w-6'
    }
  }

  const starSize = getStarSize()

  return (
    <div className="flex items-center">
      {[...Array(maxStars)].map((_, i) => (
        <Star
          key={i}
          className={`${starSize} ${
            i < Math.floor(rating) 
              ? 'text-black fill-black' 
              : (showEmpty ? 'text-gray-300' : 'hidden')
          }`}
        />
      ))}
    </div>
  )
}

export default StarRating 