// API service for fetching data from backend
// In a real application, this would connect to actual API endpoints

import stores from "../data/stores"
import products from "../data/products"
import reviews from "../data/reviews"

// Helper function to simulate network delay in development
const simulateDelay = async (ms = 300) => {
  if (process.env.NODE_ENV === 'development') {
    await new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Error handling wrapper
const handleApiError = (error) => {
  console.error('API Error:', error)
  throw new Error(error.message || 'An error occurred while fetching data')
}

// Products API
export const fetchProducts = async (params = {}) => {
  try {
    await simulateDelay()
    
    // In a real app, this would be:
    // const response = await fetch(`${API_BASE_URL}/${API_VERSION}/products?${new URLSearchParams(params)}`)
    // if (!response.ok) throw new Error('Failed to fetch products')
    // return await response.json()
    
    return products
  } catch (error) {
    handleApiError(error)
  }
}

export const fetchProductById = async (id) => {
  try {
    await simulateDelay()
    
    // In a real app, this would be:
    // const response = await fetch(`${API_BASE_URL}/${API_VERSION}/products/${id}`)
    // if (!response.ok) throw new Error('Product not found')
    // return await response.json()
    
    const product = products.find(p => p.id === Number(id))
    if (!product) throw new Error('Product not found')
    return product
  } catch (error) {
    handleApiError(error)
  }
}

// Stores API
export const fetchStores = async () => {
  try {
    await simulateDelay()
    
    // In a real app, this would be:
    // const response = await fetch(`${API_BASE_URL}/${API_VERSION}/stores`)
    // if (!response.ok) throw new Error('Failed to fetch stores')
    // return await response.json()
    
    return stores
  } catch (error) {
    handleApiError(error)
  }
}

export const fetchStoreById = async (id) => {
  try {
    await simulateDelay()
    
    // In a real app, this would be:
    // const response = await fetch(`${API_BASE_URL}/${API_VERSION}/stores/${id}`)
    // if (!response.ok) throw new Error('Store not found')
    // return await response.json()
    
    const store = stores.find(s => s.id === Number(id))
    if (!store) throw new Error('Store not found')
    return store
  } catch (error) {
    handleApiError(error)
  }
}

// Reviews API
export const fetchStoreReviews = async (storeId, sortBy = 'default') => {
  try {
    await simulateDelay()
    
    // In a real app, this would be:
    // const response = await fetch(`${API_BASE_URL}/${API_VERSION}/stores/${storeId}/reviews?sort=${sortBy}`)
    // if (!response.ok) throw new Error('Failed to fetch reviews')
    // return await response.json()
    
    // Filter reviews by store ID
    let storeReviews = reviews.filter(review => 
      products.find(p => p.id === review.productId)?.storeId === Number(storeId)
    )
    
    // Sort reviews based on sortBy parameter
    switch (sortBy) {
      case 'newest':
        storeReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        break
      case 'oldest':
        storeReviews.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        break
      default:
        // Default sorting logic (by rating, then by date)
        storeReviews.sort((a, b) => b.rating - a.rating || new Date(b.createdAt) - new Date(a.createdAt))
    }
    
    // Calculate rating statistics
    const totalReviews = storeReviews.length
    
    // Generate distribution data
    const distribution = [5, 4, 3, 2, 1].map(stars => ({
      stars,
      count: storeReviews.filter(review => Math.floor(review.rating) === stars).length
    }))
    
    // Calculate average rating
    const averageRating = totalReviews > 0
      ? storeReviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
      : 0
    
    return {
      reviews: storeReviews,
      stats: {
        averageRating: Number(averageRating.toFixed(1)),
        totalReviews,
        distribution
      }
    }
  } catch (error) {
    handleApiError(error)
  }
}

// Cart API
export const addToCart = async (productId, quantity = 1) => {
  try {
    await simulateDelay()
    
    // In a real app, this would be:
    // const response = await fetch(`${API_BASE_URL}/${API_VERSION}/cart`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ productId, quantity })
    // })
    // if (!response.ok) throw new Error('Failed to add to cart')
    // return await response.json()
    
    return { success: true, message: 'Product added to cart' }
  } catch (error) {
    handleApiError(error)
  }
}

// User API
export const login = async (credentials) => {
  try {
    await simulateDelay()
    
    // In a real app, this would be:
    // const response = await fetch(`${API_BASE_URL}/${API_VERSION}/auth/login`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(credentials)
    // })
    // if (!response.ok) throw new Error('Login failed')
    // return await response.json()
    
    return { token: 'mock-token', user: { id: 1, name: 'Test User' } }
  } catch (error) {
    handleApiError(error)
  }
}
