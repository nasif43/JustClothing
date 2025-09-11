import { useState, useRef, useEffect } from 'react'
import { useInView } from 'react-intersection-observer'

function LazyImage({ 
  src, 
  alt, 
  className = '', 
  placeholder = null,
  fallback = null,
  onLoad = null,
  onError = null,
  ...props 
}) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [currentSrc, setCurrentSrc] = useState(null)
  
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
    rootMargin: '50px' // Start loading 50px before the image comes into view
  })

  // Load the image when it comes into view - FIXED: moved to useEffect
  useEffect(() => {
    if (inView && !currentSrc && !hasError) {
      setCurrentSrc(src)
    }
  }, [inView, currentSrc, hasError, src])

  const handleLoad = () => {
    setIsLoaded(true)
    if (onLoad) onLoad()
  }

  const handleError = (e) => {
    setHasError(true)
    if (fallback) {
      setCurrentSrc(fallback)
      setHasError(false) // Reset error state when using fallback
    }
    if (onError) onError(e)
  }

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`} {...props}>
      {/* Show placeholder while loading */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
          {placeholder || (
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
              <svg 
                className="w-8 h-8 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                />
              </svg>
            </div>
          )}
        </div>
      )}

      {/* Show error state */}
      {hasError && !fallback && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
            <svg 
              className="w-8 h-8 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          </div>
        </div>
      )}

      {/* Actual image */}
      {currentSrc && (
        <img
          src={currentSrc}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy" // Browser native lazy loading as backup
        />
      )}
    </div>
  )
}

export default LazyImage