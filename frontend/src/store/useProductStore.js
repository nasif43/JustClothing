import { create } from 'zustand'
import { fetchProducts, fetchProductById, fetchStores, fetchProductsPaginated } from '../services/api'
import Fuse from 'fuse.js'

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
  
  // Pagination state
  currentPage: 1,
  totalPages: 1,
  hasMore: true,
  isLoadingMore: false,
  
  // Search state
  searchTerm: '',
  clientSearchResults: [],
  fuse: null, // Fuse.js instance for client-side fuzzy search
  
  // Actions
  setProducts: (products) => set({ products }),
  setFilteredProducts: (filteredProducts) => set({ filteredProducts }),
  setSelectedProduct: (product) => set({ selectedProduct: product }),
  setStores: (stores) => set({ stores }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setCurrentBusinessType: (businessType) => set({ currentBusinessType: businessType }),
  setCurrentTags: (tags) => set({ currentTags: tags }),
  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setIsLoadingMore: (isLoadingMore) => set({ isLoadingMore }),
  
  // Initialize optimized Fuse.js for fast fuzzy search
  initializeFuse: () => {
    const { products, fuse } = get()
    if (products.length > 0 && !fuse) {
      const newFuse = new Fuse(products, {
        keys: [
          { name: 'name', weight: 0.8 },
          { name: 'tags', weight: 0.3 },
          { name: 'description', weight: 0.2 }
        ],
        threshold: 0.4, // Balanced sensitivity
        includeScore: true,
        ignoreLocation: true,
        findAllMatches: false,
        minMatchCharLength: 2
      })
      set({ fuse: newFuse })
    }
  },
  
  // Async actions - Updated for pagination
  fetchProducts: async (params = {}, reset = true) => {
    try {
      set({ loading: true, error: null })
      const response = await fetchProducts(params)
      
      // Handle paginated response from backend
      const newProducts = response.results || response || []
      const totalPages = response.total_pages || 1
      const currentPage = response.current_page || 1
      const hasMore = response.has_next || false
      
      // Also fetch stores whenever products are fetched
      const storeResponse = await fetchStores()
      const stores = storeResponse.results || storeResponse || []
      
      if (reset) {
        set({ 
          products: newProducts, 
          stores, 
          loading: false,
          currentPage,
          totalPages,
          hasMore,
          filteredProducts: newProducts 
        })
        // Initialize Fuse.js with new products
        get().initializeFuse()
      } else {
        // Append products for infinite scroll
        const existingProducts = get().products
        const allProducts = [...existingProducts, ...newProducts]
        set({ 
          products: allProducts, 
          stores, 
          loading: false,
          currentPage,
          totalPages,
          hasMore,
          filteredProducts: allProducts 
        })
        // Re-initialize Fuse.js with all products
        get().initializeFuse()
      }
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },

  // Load more products for infinite scroll
  loadMoreProducts: async (additionalParams = {}) => {
    const { currentPage, hasMore, isLoadingMore } = get()
    
    if (!hasMore || isLoadingMore) return
    
    try {
      set({ isLoadingMore: true, error: null })
      const nextPage = currentPage + 1
      
      const response = await fetchProductsPaginated(nextPage, 20, additionalParams)
      const newProducts = response.results || response || []
      const totalPages = response.total_pages || 1
      const hasMorePages = response.has_next || false
      
      const existingProducts = get().products
      const allProducts = [...existingProducts, ...newProducts]
      
      set({
        products: allProducts,
        filteredProducts: allProducts,
        currentPage: nextPage,
        totalPages,
        hasMore: hasMorePages,
        isLoadingMore: false
      })
      
      // Re-initialize Fuse.js with all products
      get().initializeFuse()
      
    } catch (error) {
      set({ error: error.message, isLoadingMore: false })
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

  // Smart hybrid search: server + client fuzzy search
  searchProducts: async (searchTerm) => {
    try {
      set({ loading: true, error: null, searchTerm })
      
      if (!searchTerm || searchTerm.trim().length === 0) {
        await get().fetchProducts({}, true)
        set({ 
          currentBusinessType: null,
          currentTags: [],
          clientSearchResults: [],
          loading: false 
        })
        return
      }
      
      // Server search for comprehensive results
      const params = { search: searchTerm.trim() }
      const response = await fetchProducts(params)
      const searchResults = response.results || response || []
      
      set({ 
        filteredProducts: searchResults, 
        currentBusinessType: null,
        currentTags: [],
        loading: false 
      })
      
      // Re-initialize fuzzy search if needed
      get().initializeFuse()
      
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },

  // Fast client-side fuzzy search for instant feedback
  performClientSearch: (searchTerm) => {
    const { fuse, products } = get()
    
    if (!searchTerm || searchTerm.length < 2) {
      set({ clientSearchResults: [] })
      return
    }
    
    // Fallback to simple filter if Fuse.js not ready
    if (!fuse) {
      const simpleResults = products.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.tags?.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 10)
      
      set({ clientSearchResults: simpleResults })
      return
    }
    
    // Use fuzzy search for better matching
    const results = fuse.search(searchTerm)
    const clientSearchResults = results
      .map(result => result.item)
      .slice(0, 10) // Limit for performance
    
    set({ clientSearchResults })
  },

  // Get search results (combines server and client results) - memoized
  getSearchResults: (() => {
    let cachedResults = null
    let lastSearchTerm = null
    let lastFilteredProducts = null
    let lastClientSearchResults = null
    
    return () => {
      const { searchTerm, filteredProducts, clientSearchResults } = get()
      
      // Return cached results if nothing changed
      if (
        cachedResults && 
        lastSearchTerm === searchTerm && 
        lastFilteredProducts === filteredProducts &&
        lastClientSearchResults === clientSearchResults
      ) {
        return cachedResults
      }
      
      if (!searchTerm || searchTerm.length === 0) {
        cachedResults = filteredProducts
      } else if (clientSearchResults.length > 0) {
        const combinedResults = [...filteredProducts]
        clientSearchResults.forEach(clientResult => {
          if (!combinedResults.find(product => product.id === clientResult.id)) {
            combinedResults.push(clientResult)
          }
        })
        cachedResults = combinedResults
      } else {
        cachedResults = filteredProducts
      }
      
      // Update cache keys
      lastSearchTerm = searchTerm
      lastFilteredProducts = filteredProducts
      lastClientSearchResults = clientSearchResults
      
      return cachedResults
    }
  })(),
  
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
  
  // Get current products to display (includes search results, filters, etc.)
  getCurrentProducts: () => {
    const state = get()
    
    // If searching, return search results (hybrid server + client)
    if (state.searchTerm && state.searchTerm.length > 0) {
      return state.getSearchResults()
    }
    
    // Show filtered products if any filter is active
    if (state.currentBusinessType || state.currentTags.length > 0) {
      return state.filteredProducts
    }
    
    // Default to all products
    return state.products
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
    currentTags: [],
    // Reset pagination
    currentPage: 1,
    totalPages: 1,
    hasMore: true,
    isLoadingMore: false,
    // Reset search
    searchTerm: '',
    clientSearchResults: [],
    fuse: null
  })
}))

export default useProductStore 