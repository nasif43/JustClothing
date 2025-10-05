import React from 'react'

const LoadingCard = ({ className = "" }) => {
  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden border animate-pulse ${className}`}>
      {/* Header */}
      <div className="bg-gray-300 h-24 p-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="bg-gray-400 h-6 w-20 rounded-full mb-2"></div>
            <div className="bg-gray-400 h-5 w-32 rounded"></div>
          </div>
          <div className="w-8 h-8 bg-gray-400 rounded-full"></div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="bg-gray-300 h-4 w-full mb-3 rounded"></div>
        <div className="bg-gray-300 h-4 w-3/4 mb-4 rounded"></div>
        
        {/* Promo codes skeleton */}
        <div className="flex gap-2 mb-3">
          <div className="bg-gray-200 h-6 w-16 rounded"></div>
          <div className="bg-gray-200 h-6 w-20 rounded"></div>
        </div>
        
        {/* Progress bar skeleton */}
        <div className="mb-3">
          <div className="flex justify-between mb-1">
            <div className="bg-gray-300 h-3 w-12 rounded"></div>
            <div className="bg-gray-300 h-3 w-12 rounded"></div>
          </div>
          <div className="bg-gray-200 h-2 w-full rounded-full"></div>
        </div>
        
        {/* Footer */}
        <div className="flex justify-between items-center">
          <div className="bg-gray-300 h-4 w-20 rounded"></div>
          <div className="bg-gray-300 h-4 w-16 rounded"></div>
        </div>
      </div>
    </div>
  )
}

const LoadingGrid = ({ count = 6, className = "" }) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <LoadingCard key={index} />
      ))}
    </div>
  )
}

export { LoadingCard, LoadingGrid }