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
      
      // Handle different error response formats
      if (errorData.error) {
        errorMessage = errorData.error
      } else if (errorData.detail) {
        errorMessage = errorData.detail
      } else if (errorData.message) {
        errorMessage = errorData.message
      } else if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors)) {
        errorMessage = errorData.non_field_errors.join(', ')
      } else if (typeof errorData === 'string') {
        errorMessage = errorData
      } else if (typeof errorData === 'object') {
        // Handle field-specific errors (e.g., email: ["This field is required"])
        const fieldErrors = []
        for (const [field, errors] of Object.entries(errorData)) {
          if (Array.isArray(errors)) {
            fieldErrors.push(`${field}: ${errors.join(', ')}`)
          } else if (typeof errors === 'string') {
            fieldErrors.push(`${field}: ${errors}`)
          }
        }
        if (fieldErrors.length > 0) {
          errorMessage = fieldErrors.join('; ')
        }
      }
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
    // Send email directly (backend now handles both email and username)
    const loginData = {
      email: credentials.email,  // Send as email field
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
    // Ensure username is set to email for consistency
    const registrationData = {
      ...userData,
      username: userData.email  // Use email as username
    }
    
    const response = await apiRequest('auth/register/', {
      method: 'POST',
      body: JSON.stringify(registrationData),
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
    formData.append('phone', sellerData.phone)
    formData.append('id_number', sellerData.idNumber)
    
    // Business information
    formData.append('business_name', sellerData.businessName)
    formData.append('business_type', sellerData.businessType)
    formData.append('founded_date', sellerData.founded)
    formData.append('bio', sellerData.bio)
    formData.append('pickup_location', sellerData.pickupLocation)
    
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
    
    const response = await apiRequest('auth/seller/signup/', {
      method: 'POST',
      body: formData,
      auth: true  // Requires authentication - headers will be set automatically
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
    // Set default pagination if not provided
    const paginationParams = {
      page: 1,
      limit: 20,
      ...params
    }
    
    const queryString = new URLSearchParams(paginationParams).toString()
    const endpoint = queryString ? `products/?${queryString}` : 'products/'
    
    return await apiRequest(endpoint)
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch products')
  }
}

// Fetch products with pagination support
export const fetchProductsPaginated = async (page = 1, limit = 20, additionalParams = {}) => {
  try {
    const params = {
      page,
      limit,
      ...additionalParams
    }
    
    const queryString = new URLSearchParams(params).toString()
    const endpoint = `products/?${queryString}`
    
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

// Seller Product Management API
export const createProduct = async (productData) => {
  try {
    return await apiRequest('products/seller/products/create/', {
      method: 'POST',
      body: productData // FormData for file uploads
    })
  } catch (error) {
    throw new Error(error.message || 'Failed to create product')
  }
}

export const fetchSellerProducts = async () => {
  try {
    return await apiRequest('products/seller/products/')
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch seller products')
  }
}

export const updateProduct = async (productId, productData) => {
  try {
    return await apiRequest(`products/seller/products/${productId}/update/`, {
      method: 'PATCH',
      body: productData
    })
  } catch (error) {
    throw new Error(error.message || 'Failed to update product')
  }
}

export const updateProductStatus = async (productId, status) => {
  try {
    return await apiRequest(`products/seller/products/${productId}/update/`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    })
  } catch (error) {
    throw new Error(error.message || 'Failed to update product status')
  }
}

export const deleteProduct = async (productId) => {
  try {
    return await apiRequest(`products/seller/products/${productId}/delete/`, {
      method: 'DELETE'
    })
  } catch (error) {
    throw new Error(error.message || 'Failed to delete product')
  }
}

// Stores API
export const fetchStores = async () => {
  try {
    return await apiRequest('auth/stores/')
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch stores')
  }
}

export const fetchStoreById = async (id) => {
  try {
    return await apiRequest(`auth/stores/${id}/`)
  } catch (error) {
    throw new Error(error.message || 'Store not found')
  }
}

export const fetchSellerStats = async (sellerId) => {
  try {
    return await apiRequest(`auth/stores/${sellerId}/stats/`, {
      method: 'GET',
      auth: false
    })
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch seller statistics')
  }
}

// Enhanced seller reviews API
export const fetchSellerReviews = async (sellerId, page = 1, limit = 10) => {
  try {
    return await apiRequest(`reviews/seller/reviews/`, {
      method: 'GET',
      auth: true
    })
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch seller reviews')
  }
}

export const fetchSellerReviewStats = async (sellerId) => {
  try {
    return await apiRequest(`reviews/sellers/${sellerId}/stats/`, {
      method: 'GET',
      auth: false
    })
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch seller review stats')
  }
}

// Seller analytics API
export const fetchSellerAnalytics = async (period = '30d') => {
  try {
    return await apiRequest(`analytics/seller/?period=${period}`)
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch seller analytics')
  }
}

export const fetchSellerDashboardStats = async () => {
  try {
    return await apiRequest('analytics/seller/dashboard/')
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch seller dashboard stats')
  }
}

export const fetchSellerOrderAnalytics = async (period = '30d') => {
  try {
    return await apiRequest(`analytics/seller/orders/?period=${period}`)
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch seller order analytics')
  }
}

export const fetchSellerRevenueAnalytics = async (period = '30d') => {
  try {
    return await apiRequest(`analytics/seller/revenue/?period=${period}`)
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch seller revenue analytics')
  }
}

// Reviews API
export const fetchStoreReviews = async (storeId, sortBy = 'default') => {
  try {
    const params = new URLSearchParams({ sort: sortBy })
    return await apiRequest(`reviews/stores/${storeId}/?${params}`, {
      method: 'GET',
      auth: false
    })
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch reviews')
  }
}

export const fetchProductReviews = async (productId) => {
  try {
    return await apiRequest(`reviews/products/${productId}/`)
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

export const submitProductReview = async (reviewData) => {
  try {
    return await apiRequest('reviews/', {
      method: 'POST',
      body: JSON.stringify({
        product: reviewData.product_id,
        order: reviewData.order_id,
        rating: reviewData.rating,
        content: reviewData.content,
        review_type: 'product'
      })
    })
  } catch (error) {
    throw new Error(error.message || 'Failed to submit review')
  }
}

export const replyToReview = async (reviewId, content) => {
  try {
    return await apiRequest(`reviews/seller/reviews/${reviewId}/reply/`, {
      method: 'POST',
      body: JSON.stringify({
        content: content
      })
    })
  } catch (error) {
    // Parse specific error messages from backend
    if (error.message.includes('reply already exists')) {
      throw new Error('You have already replied to this review')
    } else if (error.message.includes('Only sellers can reply')) {
      throw new Error('Only sellers can reply to reviews')
    } else if (error.message.includes('your own products')) {
      throw new Error('You can only reply to reviews for your own products')
    } else if (error.message.includes('Review not found')) {
      throw new Error('Review not found')
    }
    throw new Error(error.message || 'Failed to reply to review')
  }
}

// Cart API (if you have cart endpoints in backend)
export const fetchCart = async () => {
  try {
    return await apiRequest('orders/cart/')
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
    
    return await apiRequest('orders/cart/add/', {
      method: 'POST',
      body: JSON.stringify(cartData)
    })
  } catch (error) {
    throw new Error(error.message || 'Failed to add to cart')
  }
}

export const updateCartItem = async (itemId, quantity) => {
  try {
    return await apiRequest(`orders/cart/items/${itemId}/update/`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity })
    })
  } catch (error) {
    throw new Error(error.message || 'Failed to update cart item')
  }
}

export const removeFromCart = async (itemId) => {
  try {
    return await apiRequest(`orders/cart/items/${itemId}/remove/`, {
      method: 'DELETE'
    })
  } catch (error) {
    throw new Error(error.message || 'Failed to remove from cart')
  }
}

export const clearCart = async () => {
  try {
    return await apiRequest('orders/cart/clear/', {
      method: 'POST'
    })
  } catch (error) {
    throw new Error(error.message || 'Failed to clear cart')
  }
}

// Orders API
export const createOrder = async (orderData) => {
  try {
    return await apiRequest('orders/orders/create/', {
      method: 'POST',
      body: JSON.stringify(orderData)
    })
  } catch (error) {
    throw new Error(error.message || 'Failed to create order')
  }
}

export const createQuickOrder = async (orderData) => {
  try {
    return await apiRequest('orders/orders/quick-create/', {
      method: 'POST',
      body: JSON.stringify(orderData)
    })
  } catch (error) {
    throw new Error(error.message || 'Failed to create order')
  }
}

export const fetchOrders = async () => {
  try {
    return await apiRequest('orders/orders/')
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch orders')
  }
}

export const fetchOrderById = async (id) => {
  try {
    return await apiRequest(`orders/orders/${id}/`)
  } catch (error) {
    throw new Error(error.message || 'Order not found')
  }
}

export const fetchSellerOrders = async () => {
  try {
    return await apiRequest('orders/seller/orders/')
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch seller orders')
  }
}

export const fetchSellerOrderDetails = async (orderId) => {
  try {
    return await apiRequest(`orders/seller/orders/${orderId}/`)
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch order details')
  }
}

export const updateOrderStatus = async (orderId, status, notes = '') => {
  try {
    return await apiRequest(`orders/seller/orders/${orderId}/update-status/`, {
      method: 'POST',
      body: JSON.stringify({ status, notes })
    })
  } catch (error) {
    throw new Error(error.message || 'Failed to update order status')
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

// User Status API (comprehensive user data with permissions)
export const fetchUserStatus = async () => {
  try {
    return await apiRequest('auth/status/')
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch user status')
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
    return await apiRequest('promos/promotions/')
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch promotions')
  }
}

export const validatePromoCode = async (code) => {
  try {
    return await apiRequest('promos/validate/', {
      method: 'POST',
      body: JSON.stringify({ code })
    })
  } catch (error) {
    throw new Error(error.message || 'Invalid promo code')
  }
}

// Product Offers API (Direct Discounts)
export const fetchSellerProductsForOffers = async () => {
  try {
    return await apiRequest('products/seller/products/for-offers/')
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch seller products for offers')
  }
}

export const createProductOffer = async (offerData) => {
  try {
    return await apiRequest('products/seller/offers/', {
      method: 'POST',
      body: JSON.stringify(offerData)
    })
  } catch (error) {
    throw new Error(error.message || 'Failed to create product offer')
  }
}

export const fetchSellerOffers = async () => {
  try {
    return await apiRequest('products/seller/offers/')
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch seller offers')
  }
}

export const fetchSellerActiveOffers = async () => {
  try {
    return await apiRequest('products/seller/offers/active/')
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch active offers')
  }
}

export const updateProductOffer = async (offerId, offerData) => {
  try {
    return await apiRequest(`products/seller/offers/${offerId}/`, {
      method: 'PATCH',
      body: JSON.stringify(offerData)
    })
  } catch (error) {
    throw new Error(error.message || 'Failed to update product offer')
  }
}

export const deleteProductOffer = async (offerId) => {
  try {
    return await apiRequest(`products/seller/offers/${offerId}/`, {
      method: 'DELETE'
    })
  } catch (error) {
    throw new Error(error.message || 'Failed to delete product offer')
  }
}

export const fetchStoreActiveOffers = async (sellerId) => {
  try {
    return await apiRequest(`products/stores/${sellerId}/offers/`)
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch store offers')
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

export const fetchUserShippingInfo = async () => {
  try {
    const response = await apiRequest('auth/shipping-info/', {
      method: 'GET'
    })
    return response
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch shipping information')
  }
}

export const fetchSellerHomepageProducts = async () => {
  try {
    return await apiRequest('users/seller/homepage-products/')
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch homepage products')
  }
}

export const updateSellerHomepageProducts = async (data) => {
  try {
    return await apiRequest('users/seller/homepage-products/', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  } catch (error) {
    throw new Error(error.message || 'Failed to update homepage products')
  }
}

export const fetchStoreHomepageProducts = async (storeId) => {
  try {
    return await apiRequest(`users/stores/${storeId}/homepage-products/`)
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch store homepage products')
  }
}

// Tags API
export const fetchTags = async () => {
  try {
    const response = await apiRequest('products/tags/', {
      method: 'GET',
      auth: false
    })
    return response
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch tags')
  }
}

// User preferences API
export const updateUserPreferences = async (preferences) => {
  try {
    const response = await apiRequest('auth/preferences/', {
      method: 'POST',
      body: JSON.stringify(preferences)
    })
    return response
  } catch (error) {
    throw new Error(error.message || 'Failed to update user preferences')
  }
}

export const fetchUserPreferences = async () => {
  try {
    const response = await apiRequest('auth/preferences/', {
      method: 'GET'
    })
    return response
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch user preferences')
  }
}

// Google OAuth Authentication
export const googleAuth = async (idToken) => {
  try {
    const response = await apiRequest('auth/google-auth/', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
      auth: false
    })
    
    // Store tokens in localStorage
    if (response.access) {
      localStorage.setItem('access_token', response.access)
      localStorage.setItem('refresh_token', response.refresh)
    }
    
    return response
  } catch (error) {
    throw new Error(error.message || 'Google authentication failed')
  }
}

// Seller Profile Management
export const updateSellerProfile = async (profileData) => {
  try {
    const formData = new FormData()
    
    // Add all fields to FormData
    Object.keys(profileData).forEach(key => {
      if (profileData[key] !== null && profileData[key] !== undefined) {
        formData.append(key, profileData[key])
      }
    })
    
    const response = await apiRequest('auth/seller/profile/', {
      method: 'PATCH',
      body: formData,
      auth: true
    })
    
    return response
  } catch (error) {
    throw new Error(error.message || 'Failed to update seller profile')
  }
}

export const fetchSellerProfile = async () => {
  try {
    return await apiRequest('auth/seller/profile/')
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch seller profile')
  }
}
