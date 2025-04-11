import { create } from 'zustand'
import { addToCart } from '../services/api'

// Create the cart store
const useCartStore = create((set, get) => ({
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
    const existingItem = currentItems.find(item => item.id === product.id)
    
    if (existingItem) {
      // Update quantity if item already exists
      set({
        items: currentItems.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      })
    } else {
      // Add new item
      set({
        items: [...currentItems, { ...product, quantity }]
      })
    }
  },
  
  removeItem: (productId) => {
    set({
      items: get().items.filter(item => item.id !== productId)
    })
  },
  
  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId)
      return
    }
    
    set({
      items: get().items.map(item => 
        item.id === productId 
          ? { ...item, quantity }
          : item
      )
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
  getItemCount: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0)
  },
  
  getTotalPrice: () => {
    return get().items.reduce((total, item) => total + (item.price * item.quantity), 0)
  },
  
  // Reset state
  reset: () => set({ 
    items: [], 
    loading: false, 
    error: null 
  })
}))

export default useCartStore 