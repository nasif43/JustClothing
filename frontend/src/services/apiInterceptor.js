import useUserStore from '../store/useUserStore'

// API interceptor to handle token refresh automatically
export const createApiInterceptor = () => {
  const originalFetch = window.fetch

  window.fetch = async (...args) => {
    const [url, config = {}] = args
    
    // First attempt
    let response = await originalFetch(url, config)
    
    // If we get a 401 and we have a refresh token, try to refresh
    if (response.status === 401 && config.headers?.Authorization) {
      const { refreshToken, logout } = useUserStore.getState()
      
      try {
        await refreshToken()
        
        // Retry the original request with new token
        const newToken = localStorage.getItem('access_token')
        if (newToken) {
          const newConfig = {
            ...config,
            headers: {
              ...config.headers,
              Authorization: `Bearer ${newToken}`
            }
          }
          response = await originalFetch(url, newConfig)
        }
      } catch (error) {
        // Refresh failed, logout user
        logout()
        throw new Error('Session expired. Please login again.')
      }
    }
    
    return response
  }
}

// Initialize the interceptor
export const initializeApiInterceptor = () => {
  createApiInterceptor()
} 