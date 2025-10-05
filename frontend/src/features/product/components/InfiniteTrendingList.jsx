import React, { useEffect, useState, useRef, useCallback } from 'react'
import ProductCard from './ProductCard'
import { ProductCardSkeleton } from '../../../components/ui/SkeletonLoader'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const PAGE_SIZE = 12

function InfiniteTrendingList() {
  const [products, setProducts] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const loaderRef = useRef(null)

  const fetchTrending = useCallback(async (pageNum = 1) => {
    setLoading(true)
    setError(null)
    try {
      const url = `${API_BASE_URL}/api/v1/products/?trending=true&page=${pageNum}&limit=${PAGE_SIZE}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch trending products')
      const data = await res.json()
      setProducts(prev => pageNum === 1 ? data.results : [...prev, ...data.results])
      setHasMore(data.has_next)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTrending(1)
    setPage(1)
  }, [fetchTrending])

  // Infinite scroll observer
  useEffect(() => {
    if (!hasMore || loading) return
    const observer = new window.IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          fetchTrending(page + 1)
          setPage(p => p + 1)
        }
      },
      { threshold: 1 }
    )
    if (loaderRef.current) observer.observe(loaderRef.current)
    return () => observer.disconnect()
  }, [hasMore, loading, page, fetchTrending])

  return (
    <div className="mt-10">
      <h2 className="text-2xl font-bold mb-4">Trending Products</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {products.map((product, index) => (
          <div key={product.id} className="group flex flex-col h-full">
            {/* Analytics Text Above Card - Fixed Height */}
            <div className="mb-2 text-center h-12 flex items-center justify-center">
              <div className="text-sm text-gray-500">
                {product.analytics && (
                  <div className="space-y-1">
                    {product.analytics.cart_adds > 0 && (
                      <div>
                        added to cart {product.analytics.cart_adds} times in {product.analytics.hours_analyzed} hours
                      </div>
                    )}
                    {product.analytics.orders > 0 && (
                      <div>
                        ordered {product.analytics.orders} times in {product.analytics.hours_analyzed} hours
                      </div>
                    )}
                    {product.analytics.cart_adds === 0 && product.analytics.orders === 0 && (
                      <div>
                        No recent activity in {product.analytics.hours_analyzed} hours
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            {/* Product Card Container */}
            <div className="relative flex-1">
              {/* Trending Rank Badge */}
              <div className="absolute top-2 left-2 bg-gray-800 text-white px-2 py-1 rounded-full text-xs font-bold z-10">
                #{index + 1}
              </div>
              <ProductCard product={product} />
            </div>
          </div>
        ))}
        {loading && <ProductCardSkeleton />}
      </div>
      <div ref={loaderRef} className="h-8 flex items-center justify-center">
        {loading && <span>Loading more...</span>}
        {!hasMore && !loading && products.length > 0 && (
          <span className="text-gray-400">No more trending products</span>
        )}
        {error && <span className="text-red-500">{error}</span>}
      </div>
    </div>
  )
}

export default InfiniteTrendingList
