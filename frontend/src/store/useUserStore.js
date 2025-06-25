import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { login, register, logout, refreshToken, fetchUserStatus } from '../services/api'

// Create the user store with persistence
const useUserStore = create(
  persist(
    (set, get) => ({
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
      
      // Guest login functionality
      guestLogin: () => {
        set({
          user: {
            id: 'guest',
            username: 'Guest User',
            email: 'guest@example.com',
            isGuest: true
          },
          token: null,
          isAuthenticated: false, // Keep false for guest, but user object exists
          loading: false,
          error: null
        })
      },
      
      // Initialize auth state from localStorage
      initializeAuth: () => {
        const token = localStorage.getItem('access_token')
        if (token) {
          set({ 
            token, 
            isAuthenticated: true 
          })
          // Fetch user profile if token exists
          get().fetchUserProfile()
        }
      },
      
      // Async actions
      login: async (credentials) => {
        try {
          set({ loading: true, error: null })
          const response = await login(credentials)
          
          set({ 
            user: response.user || null, 
            token: response.access, 
            isAuthenticated: true, 
            loading: false 
          })
          
          // Fetch full user profile after login
          if (response.access) {
            await get().fetchUserProfile()
          }
          
          return response
        } catch (error) {
          set({ error: error.message, loading: false })
          throw error
        }
      },
      
      register: async (userData) => {
        try {
          set({ loading: true, error: null })
          const response = await register(userData)
          set({ loading: false })
          return response
        } catch (error) {
          set({ error: error.message, loading: false })
          throw error
        }
      },
      
      logout: async () => {
        try {
          set({ loading: true })
          await logout()
        } catch (error) {
          console.error('Logout error:', error)
        } finally {
          set({ 
            user: null, 
            token: null, 
            isAuthenticated: false, 
            error: null,
            loading: false 
          })
        }
      },
      
      refreshToken: async () => {
        try {
          const response = await refreshToken()
          set({ token: response.access })
          return response
        } catch (error) {
          // If refresh fails, logout user
          get().logout()
          throw error
        }
      },
      
      fetchUserProfile: async () => {
        try {
          if (!get().isAuthenticated) return
          
          // Use fetchUserStatus instead of fetchUserProfile for comprehensive data
          const userStatus = await fetchUserStatus()
          
          console.log('fetchUserStatus response:', userStatus)
          
          // Store the complete user data including permissions
          set({ 
            user: {
              ...userStatus.user,
              customer_profile: userStatus.customer_profile,
              seller_profile: userStatus.seller_profile,
              permissions: userStatus.permissions
            }
          })
          
          console.log('Updated user in store:', get().user)
          
          return userStatus
        } catch (error) {
          console.error('Failed to fetch user status:', error)
          // Don't set error state for profile fetch failures
        }
      },
      
      updateProfile: async (profileData) => {
        try {
          set({ loading: true, error: null })
          const updatedProfile = await updateUserProfile(profileData)
          set({ user: updatedProfile, loading: false })
          return updatedProfile
        } catch (error) {
          set({ error: error.message, loading: false })
          throw error
        }
      },

      // Update user data directly
      updateUser: (userData) => {
        set({ 
          user: { ...get().user, ...userData }
        })
      },

      // Check if user needs onboarding
      needsOnboarding: () => {
        const { user } = get()
        return user && !user.isGuest && !user.onboarding_completed
      },
      
      // Reset state
      reset: () => set({ 
        user: null, 
        token: null, 
        loading: false, 
        error: null, 
        isAuthenticated: false 
      })
    }),
    {
      name: 'user-store',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)

export default useUserStore 