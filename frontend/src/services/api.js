// API service for connecting to Django backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const API_VERSION = 'api/v1'

// Helper function to get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('access_token')
}

// Helper function to get headers with authentication
const getHeaders = (includeAuth = true, includeContentType = true) => {
  const headers = {}
  
  if (includeContentType) {
    headers['Content-Type'] = 'application/json'
  }
  
  if (includeAuth) {
    const token = getAuthToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }
  
  return headers
}

// Error handling wrapper
const handleApiError = async (response) => {
  if (!response.ok) {
    let errorMessage = 'An error occurred while fetching data'
    
    try {
      const errorData = await response.json()
      errorMessage = errorData.detail || errorData.message || errorMessage
    } catch (e) {
      errorMessage = `${response.status} ${response.statusText}`
    }
    
    throw new Error(errorMessage)
  }
  
  return response
}

// Generic API request function
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}/${API_VERSION}/${endpoint}`
  
  // Handle FormData differently - don't set Content-Type header
  const isFormData = options.body instanceof FormData
  const headers = isFormData 
    ? getHeaders(options.auth !== false, false) // Don't include Content-Type for FormData
    : getHeaders(options.auth !== false)
  
  const config = {
    headers,
    ...options,
  }
  
  try {
    const response = await fetch(url, config)
    await handleApiError(response)
    
    // Handle 204 No Content responses
    if (response.status === 204) {
      return null
    }
    
    return await response.json()
  } catch (error) {
    console.error('API Error:', error)
    throw error
  }
}

// Authentication API
export const login = async (credentials) => {
  try {
    // Map email to username since Django Simple JWT expects username field
    const loginData = {
      username: credentials.email,
      password: credentials.password
    }
    
    const response = await apiRequest('auth/login/', {
      method: 'POST',
      body: JSON.stringify(loginData),
      auth: false
    })
    
    // Store tokens in localStorage
    if (response.access) {
      localStorage.setItem('access_token', response.access)
      localStorage.setItem('refresh_token', response.refresh)
    }
    
    return response
  } catch (error) {
    throw new Error(error.message || 'Login failed')
  }
}

export const register = async (userData) => {
  try {
    const response = await apiRequest('auth/register/', {
      method: 'POST',
      body: JSON.stringify(userData),
      auth: false
    })
    
    return response
  } catch (error) {
    throw new Error(error.message || 'Registration failed')
  }
}

export const sellerSignup = async (sellerData) => {
  try {
    // Transform the seller form data to match backend expectations
    const formData = new FormData()
    
    // Owner information
    formData.append('first_name', sellerData.firstName)
    formData.append('last_name', sellerData.lastName)
    formData.append('email', sellerData.email)
    formData.append('username', sellerData.email)
    formData.append('phone', sellerData.phone)
    formData.append('user_type', 'seller')
    
    // Business information
    formData.append('business_name', sellerData.businessName)
    formData.append('business_type', sellerData.businessType)
    formData.append('founded_date', sellerData.founded)
    formData.append('bio', sellerData.bio)
    formData.append('pickup_location', sellerData.pickupLocation)
    formData.append('id_number', sellerData.idNumber)
    
    // Social links (optional)
    if (sellerData.instagram) formData.append('instagram', sellerData.instagram)
    if (sellerData.facebook) formData.append('facebook', sellerData.facebook)
    
    // Payment information
    formData.append('payment_method', sellerData.paymentMethod)
    formData.append('account_number', sellerData.accountNumber)
    if (sellerData.bankName) formData.append('bank_name', sellerData.bankName)
    if (sellerData.branchName) formData.append('branch_name', sellerData.branchName)
    
    // Logo file
    if (sellerData.logo) formData.append('logo', sellerData.logo)
    
    const response = await apiRequest('sellers/signup/', {
      method: 'POST',
      body: formData,
      auth: false,
      // Don't set Content-Type header for FormData, let browser set it
      headers: {}
    })
    
    return response
  } catch (error) {
    throw new Error(error.message || 'Seller signup failed')
  }
}

export const logout = async () => {
  try {
    const refreshToken = localStorage.getItem('refresh_token')
    
    if (refreshToken) {
      await apiRequest('auth/logout/', {
        method: 'POST',
        body: JSON.stringify({ refresh: refreshToken })
      })
    }
  } catch (error) {
    console.error('Logout error:', error)
  } finally {
    // Always clear tokens
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }
}

export const refreshToken = async () => {
  try {
    const refresh = localStorage.getItem('refresh_token')
    if (!refresh) {
      throw new Error('No refresh token available')
    }
    
    const response = await apiRequest('auth/refresh/', {
      method: 'POST',
      body: JSON.stringify({ refresh }),
      auth: false
    })
    
    if (response.access) {
      localStorage.setItem('access_token', response.access)
    }
    
    return response
  } catch (error) {
    // If refresh fails, clear all tokens
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    throw error
  }
}

// Products API
export const fetchProducts = async (params = {}) => {
  try {
    const queryString = new URLSearchParams(params).toString()
    const endpoint = queryString ? `products/?${queryString}` : 'products/'
    
    return await apiRequest(endpoint)
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch products')
  }
}

export const fetchProductById = async (id) => {
  try {
    return await apiRequest(`products/${id}/`)
  } catch (error) {
    throw new Error(error.message || 'Product not found')
  }
}

// Stores API
export const fetchStores = async () => {
  try {
    return await apiRequest('stores/')
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch stores')
  }
}

export const fetchStoreById = async (id) => {
  try {
    return await apiRequest(`stores/${id}/`)
  } catch (error) {
    throw new Error(error.message || 'Store not found')
  }
}

// Reviews API
export const fetchStoreReviews = async (storeId, sortBy = 'default') => {
  try {
    const params = new URLSearchParams({ sort: sortBy })
    return await apiRequest(`stores/${storeId}/reviews/?${params}`)
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch reviews')
  }
}

export const fetchProductReviews = async (productId) => {
  try {
    return await apiRequest(`products/${productId}/reviews/`)
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch product reviews')
  }
}

export const createReview = async (reviewData) => {
  try {
    return await apiRequest('reviews/', {
      method: 'POST',
      body: JSON.stringify(reviewData)
    })
  } catch (error) {
    throw new Error(error.message || 'Failed to create review')
  }
}

// Cart API (if you have cart endpoints in backend)
export const fetchCart = async () => {
  try {
    return await apiRequest('cart/')
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch cart')
  }
}

export const addToCart = async (productId, quantity = 1, size = null, color = null) => {
  try {
    const cartData = {
      product_id: productId,
      quantity,
      ...(size && { size }),
      ...(color && { color })
    }
    
    return await apiRequest('cart/add/', {
      method: 'POST',
      body: JSON.stringify(cartData)
    })
  } catch (error) {
    throw new Error(error.message || 'Failed to add to cart')
  }
}

export const updateCartItem = async (itemId, quantity) => {
  try {
    return await apiRequest(`cart/items/${itemId}/`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity })
    })
  } catch (error) {
    throw new Error(error.message || 'Failed to update cart item')
  }
}

export const removeFromCart = async (itemId) => {
  try {
    return await apiRequest(`cart/items/${itemId}/`, {
      method: 'DELETE'
    })
  } catch (error) {
    throw new Error(error.message || 'Failed to remove from cart')
  }
}

// Orders API
export const createOrder = async (orderData) => {
  try {
    return await apiRequest('orders/', {
      method: 'POST',
      body: JSON.stringify(orderData)
    })
  } catch (error) {
    throw new Error(error.message || 'Failed to create order')
  }
}

export const fetchOrders = async () => {
  try {
    return await apiRequest('orders/')
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch orders')
  }
}

export const fetchOrderById = async (id) => {
  try {
    return await apiRequest(`orders/${id}/`)
  } catch (error) {
    throw new Error(error.message || 'Order not found')
  }
}

// User Profile API
export const fetchUserProfile = async () => {
  try {
    return await apiRequest('users/profile/')
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch user profile')
  }
}

export const updateUserProfile = async (profileData) => {
  try {
    return await apiRequest('users/profile/', {
      method: 'PATCH',
      body: JSON.stringify(profileData)
    })
  } catch (error) {
    throw new Error(error.message || 'Failed to update profile')
  }
}

// Promotions API
export const fetchPromotions = async () => {
  try {
    return await apiRequest('promotions/')
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch promotions')
  }
}

export const validatePromoCode = async (code) => {
  try {
    return await apiRequest('promotions/validate/', {
      method: 'POST',
      body: JSON.stringify({ code })
    })
  } catch (error) {
    throw new Error(error.message || 'Invalid promo code')
  }
}

// Analytics API (for sellers/admins)
export const fetchAnalytics = async (period = '30d') => {
  try {
    return await apiRequest(`analytics/?period=${period}`)
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch analytics')
  }
}
