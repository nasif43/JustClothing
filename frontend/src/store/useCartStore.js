import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { addToCart } from '../services/api'

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
      
      // Cart operations
      addItem: (product, quantity = 1) => {
        const currentItems = get().items
        const existingItem = currentItems.find(
          (item) => 
            item.id === product.id && 
            item.selectedSize === product.selectedSize &&
            item.selectedColor === product.selectedColor
        )
        
        if (existingItem) {
          // Update quantity if item exists
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
          // Add new item
          set({
            items: [...currentItems, { ...product, quantity }],
          })
        }
      },
      
      removeItem: (productId, selectedSize, selectedColor) => {
        set({
          items: get().items.filter(
            (item) => !(
              item.id === productId && 
              item.selectedSize === selectedSize &&
              item.selectedColor === selectedColor
            )
          ),
        })
      },
      
      updateQuantity: (productId, selectedSize, selectedColor, quantity) => {
        if (quantity < 1) {
          get().removeItem(productId, selectedSize, selectedColor)
          return
        }
        
        set({
          items: get().items.map((item) =>
            item.id === productId && 
            item.selectedSize === selectedSize &&
            item.selectedColor === selectedColor
              ? { ...item, quantity }
              : item
          ),
        })
      },
      
      // Clear cart
      clearCart: () => {
        set({ items: [] })
      },
      
      // Get cart total
      getTotal: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        )
      },
      
      // Get item count
      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0)
      },
      
      // Check if item is in cart
      isInCart: (productId, selectedSize, selectedColor) => {
        return get().items.some(
          (item) => 
            item.id === productId && 
            item.selectedSize === selectedSize &&
            item.selectedColor === selectedColor
        )
      },
      
      // Reset store
      reset: () => {
        set({
          items: [],
          loading: false,
          error: null,
        })
      },
      
      // Async actions
      addToCart: async (productId, quantity = 1) => {
        try {
          set({ loading: true, error: null })
          await addToCart(productId, quantity)
          const product = get().getProductById(productId)
          if (product) {
            get().addItem(product, quantity)
          }
          set({ loading: false })
        } catch (error) {
          set({ error: error.message, loading: false })
        }
      },
      
      // Computed values
      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + (item.price * item.quantity), 0)
      },
    }),
    {
      name: "cart-storage", // unique name for localStorage key
      partialize: (state) => ({ items: state.items }), // only persist items
    }
  )
)

export default useCartStore 