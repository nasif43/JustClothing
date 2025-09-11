import React, { useState, useCallback, useRef, useEffect } from "react"
import { Search, X } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useProductStore } from "../../store"

function SearchBar() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const navigate = useNavigate()
  const debounceTimer = useRef(null)
  const searchRef = useRef(null)
  
  const { 
    searchProducts, 
    performClientSearch, 
    products, 
    getCurrentProducts,
    loading 
  } = useProductStore()

  // Smart search with hybrid approach
  const performSearch = useCallback(async (term) => {
    if (!term || term.length < 2) {
      setShowResults(false)
      return
    }

    setIsSearching(true)
    
    // Instant local filtering for immediate feedback
    performClientSearch(term)
    setShowResults(true)
    
    // Clear previous debounce
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
    
    // Debounced server search for comprehensive results
    debounceTimer.current = setTimeout(async () => {
      try {
        await searchProducts(term)
        setIsSearching(false)
      } catch (error) {
        console.error('Search error:', error)
        setIsSearching(false)
      }
    }, 300) // Fast 300ms debounce
  }, [searchProducts, performClientSearch])

  const handleInputChange = (e) => {
    const value = e.target.value
    setSearchTerm(value)
    
    // If user cleared the input, reset to show all products
    if (value.trim().length === 0) {
      clearSearch()
    } else {
      performSearch(value)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      setShowResults(false)
      await searchProducts(searchTerm.trim())
      if (window.location.pathname !== '/') {
        navigate('/')
      }
    }
  }

  const clearSearch = async () => {
    setSearchTerm("")
    setShowResults(false)
    setIsSearching(false)
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
    
    // Reset store search state to show all products
    await searchProducts("")
  }

  // Get current search results for dropdown
  const searchResults = getCurrentProducts().slice(0, 5) // Show top 5 results

  // Click outside to close results
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      <form onSubmit={handleSubmit} className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
          <Search className={`w-5 h-5 transition-colors ${isSearching ? 'text-blue-500 animate-pulse' : 'text-gray-400'}`}/>
        </div>
        <input
          type="search"
          value={searchTerm}
          onChange={handleInputChange}
          className="block w-full p-3 pl-12 pr-10 text-sm text-black border border-gray-300 rounded-full bg-white/100 backdrop-blur-sm focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 transition-all duration-200"
          placeholder="find your fit..."
          autoComplete="off"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </form>

      {/* Search Results Dropdown */}
      {showResults && searchTerm.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
          {isSearching && (
            <div className="p-3 text-sm text-gray-500 border-b">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                Searching...
              </div>
            </div>
          )}
          
          {searchResults.length > 0 ? (
            <div className="py-2">
              {searchResults.map((product) => (
                <button
                  key={product.id}
                  onClick={() => {
                    navigate(`/product/${product.id}`)
                    setShowResults(false)
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3"
                >
                  {product.image && (
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {product.name}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      ৳{product.price}
                    </div>
                  </div>
                </button>
              ))}
              
              {searchResults.length === 5 && (
                <button
                  onClick={() => {
                    handleSubmit({ preventDefault: () => {} })
                  }}
                  className="w-full px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 border-t"
                >
                  View all results →
                </button>
              )}
            </div>
          ) : !isSearching && (
            <div className="p-4 text-sm text-gray-500 text-center">
              No products found for "{searchTerm}"
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchBar
