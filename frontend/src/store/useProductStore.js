import { create } from 'zustand'
import { fetchProducts, fetchProductById, fetchStores } from '../services/api'

// Create the product store
const useProductStore = create((set, get) => ({
  // State
  products: [],
  filteredProducts: [], // New state for filtered products
  selectedProduct: null,
  stores: [],
  loading: false,
  error: null,
  currentBusinessType: null, // Track current business type filter
  currentTags: [], // Track current tag filters
  
  // Actions
  setProducts: (products) => set({ products }),
  setFilteredProducts: (filteredProducts) => set({ filteredProducts }),
  setSelectedProduct: (product) => set({ selectedProduct: product }),
  setStores: (stores) => set({ stores }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setCurrentBusinessType: (businessType) => set({ currentBusinessType: businessType }),
  setCurrentTags: (tags) => set({ currentTags: tags }),
  
  // Async actions
  fetchProducts: async (params = {}) => {
    try {
      set({ loading: true, error: null })
      const response = await fetchProducts(params)
      // Handle paginated response from backend
      const products = response.results || response || []
      
      // Also fetch stores whenever products are fetched
      const storeResponse = await fetchStores()
      const stores = storeResponse.results || storeResponse || []
      
      set({ products, stores, loading: false })
      
      // If no filter is applied, show all products
      if (!get().currentBusinessType) {
        set({ filteredProducts: products })
      }
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },
  
  // New method to fetch products by business type
  fetchProductsByBusinessType: async (businessType) => {
    try {
      set({ loading: true, error: null, currentBusinessType: businessType })
      
      const params = businessType ? { business_type: businessType } : {}
      const response = await fetchProducts(params)
      const products = response.results || response || []
      
      set({ 
        filteredProducts: products, 
        currentBusinessType: businessType,
        loading: false 
      })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },
  
  // Method to clear filter and show all products
  clearBusinessTypeFilter: async () => {
    try {
      set({ loading: true, error: null, currentBusinessType: null })
      
      const response = await fetchProducts()
      const products = response.results || response || []
      
      set({ 
        products: products,
        filteredProducts: products, 
        currentBusinessType: null,
        loading: false 
      })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },

  // New method to fetch products by tags
  fetchProductsByTags: async (tags) => {
    try {
      set({ loading: true, error: null, currentTags: tags, currentBusinessType: null })
      
      // Clean tags before sending to API (remove extra spaces, normalize)
      const cleanedTags = tags.map(tag => tag.trim()).filter(tag => tag.length > 0)
      const params = cleanedTags.length > 0 ? { tags: cleanedTags.join(',') } : {}
      
      console.log('Searching for products with tags:', cleanedTags, 'params:', params)
      
      const response = await fetchProducts(params)
      const products = response.results || response || []
      
      console.log('Found products:', products.length)
      
      // Also log a few sample products to see their tags
      if (products.length === 0) {
        console.log('No products found. Let\'s check what products exist without filters...')
        try {
          const allProductsResponse = await fetchProducts({})
          const allProducts = allProductsResponse.results || allProductsResponse || []
          console.log('Total products in database:', allProducts.length)
          if (allProducts.length > 0) {
            console.log('Sample product tags:', allProducts.slice(0, 3).map(p => ({
              name: p.name,
              tags: p.tags
            })))
          }
        } catch (e) {
          console.log('Failed to fetch all products:', e)
        }
      }
      
      set({ 
        filteredProducts: products, 
        currentTags: tags,
        currentBusinessType: null, // Clear business type when filtering by tags
        loading: false 
      })
    } catch (error) {
      console.error('Tag search error:', error)
      set({ error: error.message, loading: false })
    }
  },

  // Method to clear tag filter
  clearTagFilter: async () => {
    try {
      set({ loading: true, error: null, currentTags: [] })
      
      const response = await fetchProducts()
      const products = response.results || response || []
      
      set({ 
        products: products,
        filteredProducts: products, 
        currentTags: [],
        loading: false 
      })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },

  // Search products by name or description
  searchProducts: async (searchTerm) => {
    try {
      set({ loading: true, error: null })
      
      if (!searchTerm || searchTerm.trim().length === 0) {
        // If search term is empty, fetch all products
        const response = await fetchProducts()
        const products = response.results || response || []
        set({ 
          products: products,
          filteredProducts: products, 
          currentBusinessType: null,
          currentTags: [],
          loading: false 
        })
        return
      }
      
      // Search products using the search parameter
      const params = { search: searchTerm.trim() }
      const response = await fetchProducts(params)
      const products = response.results || response || []
      
      set({ 
        filteredProducts: products, 
        currentBusinessType: null, // Clear business type when searching
        currentTags: [], // Clear tags when searching
        loading: false 
      })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },
  
  fetchStores: async () => {
    try {
      set({ loading: true, error: null })
      const response = await fetchStores()
      // Handle paginated response from backend
      const stores = response.results || response || []
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
  
  // Get current products to display (filtered or all)
  getCurrentProducts: () => {
    const state = get()
    // Show filtered products if any filter is active (business type, tags, or search)
    return (state.currentBusinessType || state.currentTags.length > 0 || state.filteredProducts.length !== state.products.length) ? state.filteredProducts : state.products
  },
  
  // Reset state
  reset: () => set({ 
    products: [], 
    filteredProducts: [],
    selectedProduct: null,
    stores: [],
    loading: false, 
    error: null,
    currentBusinessType: null,
    currentTags: []
  })
}))

export default useProductStore 