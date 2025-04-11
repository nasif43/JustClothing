// API service for fetching data from backend
// In a real application, this would connect to actual API endpoints

import stores from "../data/stores"
import products from "../data/products"

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
