import { create } from 'zustand'
import { login } from '../services/api'

// Create the user store
const useUserStore = create((set, get) => ({
  // State
  user: null,
  token: null,
  loading: false,
  error: null,
  isAuthenticated: false,
  
  // Actions
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  
  // Async actions
  login: async (credentials) => {
    try {
      set({ loading: true, error: null })
      const response = await login(credentials)
      set({ 
        user: response.user, 
        token: response.token, 
        isAuthenticated: true, 
        loading: false 
      })
      return response
    } catch (error) {
      set({ error: error.message, loading: false })
      throw error
    }
  },
  
  logout: () => {
    set({ 
      user: null, 
      token: null, 
      isAuthenticated: false, 
      error: null 
    })
  },
  
  // Reset state
  reset: () => set({ 
    user: null, 
    token: null, 
    loading: false, 
    error: null, 
    isAuthenticated: false 
  })
}))

export default useUserStore 