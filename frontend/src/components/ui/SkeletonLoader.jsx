import React from 'react'

// Base skeleton component
function Skeleton({ className = "", ...props }) {
  return (
    <div 
      className={`animate-pulse bg-gray-200 rounded ${className}`} 
      {...props}
    />
  )
}

// Product card skeleton
export function ProductCardSkeleton() {
  return (
    <div className="w-full bg-white rounded-lg overflow-hidden shadow-sm">
      <Skeleton className="aspect-square w-full" />
      <div className="p-1.5 sm:p-2 md:p-3 space-y-1.5 sm:space-y-2 md:space-y-3">
        <Skeleton className="h-2.5 sm:h-3 md:h-4 w-3/4" />
        <Skeleton className="h-2 sm:h-2.5 md:h-3 w-1/2" />
        <div className="flex justify-between items-center">
          <Skeleton className="h-2 sm:h-2.5 md:h-3 w-1/3" />
          <Skeleton className="h-3 sm:h-4 md:h-5 w-10 sm:w-12 md:w-16" />
        </div>
      </div>
    </div>
  )
}

// Product grid skeleton
export function ProductGridSkeleton({ count = 6 }) {
  return (
    <div className="w-full px-2 py-4 sm:px-4 sm:py-6 lg:p-10">
      <div className="w-full grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
        {Array.from({ length: count }).map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    </div>
  )
}

// Header skeleton
export function HeaderSkeleton() {
  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile Layout */}
        <div className="lg:hidden">
          {/* Top row - Logo, Cart, Menu */}
          <div className="flex items-center justify-between h-16 mb-3">
            <Skeleton className="h-8 w-24" />
            <div className="flex items-center space-x-4">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
          </div>
          {/* Bottom row - Search bar */}
          <div className="pb-3">
            <Skeleton className="h-10 w-full rounded-full" />
          </div>
        </div>

        {/* Desktop Layout - Preserved exactly as original */}
        <div className="hidden lg:flex justify-between items-center h-16">
          {/* Logo skeleton */}
          <Skeleton className="h-8 w-32" />
          
          {/* Search bar skeleton */}
          <div className="flex-1 max-w-2xl mx-8">
            <Skeleton className="h-12 w-full rounded-full" />
          </div>
          
          {/* Actions skeleton */}
          <div className="flex items-center space-x-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-20 rounded-full" />
          </div>
        </div>
      </div>
    </header>
  )
}

// Category pills skeleton
export function CategoryPillsSkeleton() {
  return (
    <div className="mb-8 lg:mb-12">
      {/* Mobile: Horizontal scrollable pills */}
      <div className="lg:hidden">
        <div className="flex space-x-2 overflow-x-hidden px-4 pb-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="flex-shrink-0 h-8 w-20 rounded-full" />
          ))}
        </div>
      </div>
      
      {/* Desktop: Centered pills */}
      <div className="hidden lg:flex justify-center gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-32 rounded-full" />
        ))}
      </div>
    </div>
  )
}

// Search results skeleton
export function SearchResultsSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex items-center space-x-2 sm:space-x-3 p-2">
          <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-3 sm:h-4 w-3/4" />
            <Skeleton className="h-2 sm:h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default Skeleton