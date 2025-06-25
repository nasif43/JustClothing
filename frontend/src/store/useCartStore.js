import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { 
  fetchCart, 
  addToCart as apiAddToCart, 
  updateCartItem, 
  removeFromCart as apiRemoveFromCart,
  clearCart as apiClearCart
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
          const { isAuthenticated, user } = useUserStore.getState()
          if (!isAuthenticated || user?.isGuest) {
            set({ items: [] })
            return
          }
          
          set({ loading: true, error: null })
          const cartData = await fetchCart()
          // Backend returns cart object with items array
          const rawItems = cartData?.items || []
          
          // Normalize items to match frontend expectations
          const items = rawItems.map(item => ({
            ...item,
            // Map backend fields to frontend expectations
            name: item.product_name,
            image: item.product_image,
            price: parseFloat(item.unit_price),
            selectedSize: item.size,
            selectedColor: item.color,
            // Keep original backend fields for API calls
            product_id: item.product,
            unit_price: item.unit_price,
            total_price: item.total_price
          }))
          
          set({ items, loading: false })
        } catch (error) {
          set({ error: error.message, loading: false, items: [] })
          console.error('Failed to fetch cart:', error)
        }
      },
      
      // Add item to cart (backend + local state)
      addItem: async (product, quantity = 1) => {
        try {
          console.log('🛒 addItem called with:', { 
            productId: product.id, 
            quantity, 
            selectedSize: product.selectedSize, 
            selectedColor: product.selectedColor 
          })
          
          // Check if product is in stock before adding
          if (!product.is_in_stock || product.stock_quantity === 0) {
            throw new Error('This product is out of stock')
          }
          
          if (quantity > product.stock_quantity) {
            throw new Error(`Only ${product.stock_quantity} items available in stock`)
          }
          
          // Check if we're already loading to prevent duplicate calls
          if (get().loading) {
            console.warn('🛒 addItem called while already loading, ignoring...')
            return
          }
          
          const { isAuthenticated, user } = useUserStore.getState()
          
          if (isAuthenticated && !user?.isGuest) {
            // Add to backend cart for authenticated users
            set({ loading: true, error: null })
            
            try {
              console.log('🛒 Calling API addToCart...')
              await apiAddToCart(
                product.id, 
                quantity, 
                product.selectedSize, 
                product.selectedColor
              )
              
              console.log('🛒 API addToCart successful, refreshing cart...')
              // Refresh cart from backend to get updated state
              await get().fetchCart()
              console.log('🛒 Cart refreshed successfully')
            } catch (apiError) {
              console.error('🛒 API addToCart failed:', apiError)
              set({ loading: false })
              throw apiError
            }
          } else {
            // Add to local cart for non-authenticated users or guests
            console.log('🛒 Adding to local cart...')
            const currentItems = get().items
            const existingItem = currentItems.find(
              (item) => 
                item.product_id === product.id && 
                item.selectedSize === product.selectedSize &&
                item.selectedColor === product.selectedColor
            )
            
            if (existingItem) {
              console.log('🛒 Item exists, updating quantity...')
              set({
                items: currentItems.map((item) =>
                  item.product_id === product.id && 
                  item.selectedSize === product.selectedSize &&
                  item.selectedColor === product.selectedColor
                    ? { ...item, quantity: item.quantity + quantity }
                    : item
                ),
              })
            } else {
              console.log('🛒 New item, adding to cart...')
              set({
                items: [...currentItems, { 
                  ...product, 
                  product_id: product.id,
                  quantity,
                  selectedSize: product.selectedSize,
                  selectedColor: product.selectedColor
                }],
              })
            }
            console.log('🛒 Local cart updated')
          }
        } catch (error) {
          console.error('🛒 addItem failed:', error)
          set({ error: error.message, loading: false })
          throw error
        }
      },
      
      // Update item quantity
      updateQuantity: async (itemId, size, color, quantity) => {
        try {
          const { isAuthenticated, user } = useUserStore.getState()
          
          if (isAuthenticated && !user?.isGuest) {
            set({ loading: true, error: null })
            await updateCartItem(itemId, quantity)
            await get().fetchCart()
          } else {
            // Update local cart
            set({
              items: get().items.map((item) =>
                item.id === itemId && 
                item.selectedSize === size && 
                item.selectedColor === color
                  ? { ...item, quantity } 
                  : item
              ),
            })
          }
        } catch (error) {
          set({ error: error.message, loading: false })
          throw error
        }
      },
      
      // Remove item from cart
      removeItem: async (itemId, size = null, color = null) => {
        try {
          const { isAuthenticated, user } = useUserStore.getState()
          
          if (isAuthenticated && !user?.isGuest) {
            // For authenticated users, find the correct cart item ID
            const currentItems = get().items
            
            // First try to find by exact ID match
            let targetItem = currentItems.find((item) => 
              item.id === itemId && 
              item.selectedSize === size && 
              item.selectedColor === color
            )
            
            // If not found, try to find by product_id (in case itemId is actually product_id)
            if (!targetItem) {
              targetItem = currentItems.find((item) => 
                item.product_id === itemId && 
                item.selectedSize === size && 
                item.selectedColor === color
              )
            }
            
            if (targetItem) {
              // Immediately remove from local state for instant UI feedback
              const filteredItems = currentItems.filter((item) => 
                !(item.id === targetItem.id)
              )
              set({ items: filteredItems, loading: true, error: null })
              
              try {
                await apiRemoveFromCart(targetItem.id)
                
                // Refresh cart from backend to ensure consistency
                await get().fetchCart()
              } catch (apiError) {
                // If backend removal fails, restore the item
                console.error('Backend removal failed, restoring item:', apiError)
                set({ items: currentItems, error: 'Failed to remove item', loading: false })
                throw apiError
              }
            } else {
              console.error('Cart item not found for removal:', { itemId, size, color })
              set({ error: 'Item not found in cart', loading: false })
            }
          } else {
            // Remove from local cart
            set({
              items: get().items.filter((item) => 
                !(item.id === itemId && 
                  item.selectedSize === size && 
                  item.selectedColor === color)
              ),
            })
          }
        } catch (error) {
          set({ error: error.message, loading: false })
          console.error('Failed to remove cart item:', error)
          throw error
        }
      },
      
      // Clear cart
      clearCart: async () => {
        try {
          const { isAuthenticated, user } = useUserStore.getState()
          
          if (isAuthenticated && !user?.isGuest) {
            set({ loading: true, error: null })
            await apiClearCart() // Use the renamed API function
            set({ items: [], loading: false }) // Clear local state after API call
          } else {
            set({ items: [], error: null })
          }
        } catch (error) {
          set({ error: error.message, loading: false })
          console.error('Failed to clear cart:', error)
          throw error
        }
      },
      
      // Force refresh cart from backend
      refreshCart: async () => {
        try {
          const { isAuthenticated, user } = useUserStore.getState()
          if (isAuthenticated && !user?.isGuest) {
            set({ loading: true, error: null })
            await get().fetchCart()
          }
        } catch (error) {
          set({ error: error.message, loading: false })
          console.error('Failed to refresh cart:', error)
        }
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
              try {
                await apiAddToCart(
                  item.product_id || item.id,
                  item.quantity,
                  item.selectedSize,
                  item.selectedColor
                )
              } catch (error) {
                console.error('Failed to sync item:', item, error)
              }
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