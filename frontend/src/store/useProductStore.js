import { create } from 'zustand'
import { fetchProducts, fetchProductById, fetchStores } from '../services/api'

// Create the product store
const useProductStore = create((set, get) => ({
  // State
  products: [],
  selectedProduct: null,
  stores: [],
  loading: false,
  error: null,
  
  // Actions
  setProducts: (products) => set({ products }),
  setSelectedProduct: (product) => set({ selectedProduct: product }),
  setStores: (stores) => set({ stores }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  
  // Async actions
  fetchProducts: async () => {
    try {
      set({ loading: true, error: null })
      const products = await fetchProducts()
      // Also fetch stores whenever products are fetched
      const stores = await fetchStores()
      set({ products, stores, loading: false })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },
  
  fetchStores: async () => {
    try {
      set({ loading: true, error: null })
      const stores = await fetchStores()
      set({ stores, loading: false })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },
  
  fetchProductById: async (id) => {
    try {
      set({ loading: true, error: null })
      const product = await fetchProductById(id)
      set({ selectedProduct: product, loading: false })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },
  
  getStoreById: (id) => {
    const stores = get().stores
    if (!stores || stores.length === 0) return null
    return stores.find(store => store.id === Number(id)) || null
  },
  
  // Computed values
  getProductById: (id) => {
    return get().products.find(product => product.id === Number(id))
  },
  
  // Reset state
  reset: () => set({ 
    products: [], 
    selectedProduct: null,
    stores: [],
    loading: false, 
    error: null 
  })
}))

export default useProductStore 