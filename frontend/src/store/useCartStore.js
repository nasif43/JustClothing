import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { 
  fetchCart, 
  addToCart as apiAddToCart, 
  updateCartItem, 
  removeFromCart as apiRemoveFromCart 
} from '../services/api'
import useUserStore from './useUserStore'

// Create the cart store
export const useCartStore = create(
  persist(
    (set, get) => ({
      // State
      items: [],
      loading: false,
      error: null,
      
      // Actions
      setItems: (items) => set({ items }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      
      // Fetch cart from backend
      fetchCart: async () => {
        try {
          const { isAuthenticated } = useUserStore.getState()
          if (!isAuthenticated) {
            set({ items: [] })
            return
          }
          
          set({ loading: true, error: null })
          const cartData = await fetchCart()
          set({ items: cartData.items || [], loading: false })
        } catch (error) {
          set({ error: error.message, loading: false })
          console.error('Failed to fetch cart:', error)
        }
      },
      
      // Add item to cart (backend + local state)
      addItem: async (product, quantity = 1) => {
        try {
          const { isAuthenticated } = useUserStore.getState()
          
          if (isAuthenticated) {
            // Add to backend cart
            set({ loading: true, error: null })
            await apiAddToCart(
              product.id, 
              quantity, 
              product.selectedSize, 
              product.selectedColor
            )
            
            // Refresh cart from backend
            await get().fetchCart()
          } else {
            // Add to local cart for non-authenticated users
            const currentItems = get().items
            const existingItem = currentItems.find(
              (item) => 
                item.id === product.id && 
                item.selectedSize === product.selectedSize &&
                item.selectedColor === product.selectedColor
            )
            
            if (existingItem) {
              set({
                items: currentItems.map((item) =>
                  item.id === product.id && 
                  item.selectedSize === product.selectedSize &&
                  item.selectedColor === product.selectedColor
                    ? { ...item, quantity: item.quantity + quantity }
                    : item
                ),
              })
            } else {
              set({
                items: [...currentItems, { ...product, quantity }],
              })
            }
          }
        } catch (error) {
          set({ error: error.message, loading: false })
          throw error
        }
      },
      
      // Update item quantity
      updateQuantity: async (itemId, quantity) => {
        try {
          const { isAuthenticated } = useUserStore.getState()
          
          if (isAuthenticated) {
            set({ loading: true, error: null })
            await updateCartItem(itemId, quantity)
            await get().fetchCart()
          } else {
            // Update local cart
            set({
              items: get().items.map((item) =>
                item.id === itemId ? { ...item, quantity } : item
              ),
            })
          }
        } catch (error) {
          set({ error: error.message, loading: false })
          throw error
        }
      },
      
      // Remove item from cart
      removeItem: async (itemId) => {
        try {
          const { isAuthenticated } = useUserStore.getState()
          
          if (isAuthenticated) {
            set({ loading: true, error: null })
            await apiRemoveFromCart(itemId)
            await get().fetchCart()
          } else {
            // Remove from local cart
            set({
              items: get().items.filter((item) => item.id !== itemId),
            })
          }
        } catch (error) {
          set({ error: error.message, loading: false })
          throw error
        }
      },
      
      // Clear cart
      clearCart: () => {
        set({ items: [], error: null })
      },
      
      // Get cart totals
      getCartTotals: () => {
        const items = get().items
        const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
        const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        
        return {
          totalItems,
          totalPrice: Number(totalPrice.toFixed(2))
        }
      },
      
      // Sync local cart with backend after login
      syncCartAfterLogin: async () => {
        try {
          const localItems = get().items
          
          if (localItems.length > 0) {
            set({ loading: true })
            
            // Add each local item to backend cart
            for (const item of localItems) {
              await apiAddToCart(
                item.id,
                item.quantity,
                item.selectedSize,
                item.selectedColor
              )
            }
            
            // Clear local cart and fetch from backend
            set({ items: [] })
            await get().fetchCart()
          } else {
            // Just fetch backend cart
            await get().fetchCart()
          }
        } catch (error) {
          console.error('Failed to sync cart:', error)
          set({ error: error.message, loading: false })
        }
      },
      
      // Reset state
      reset: () => set({ 
        items: [], 
        loading: false, 
        error: null 
      })
    }),
    {
      name: 'cart-store',
      partialize: (state) => ({
        items: state.items
      })
    }
  )
)

export default useCartStore 