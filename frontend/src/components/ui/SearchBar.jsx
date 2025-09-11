import React, { useState, useCallback, useRef, useEffect } from "react"
import { Search } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useProductStore } from "../../store"

function SearchBar() {
  const [searchTerm, setSearchTerm] = useState("")
  const navigate = useNavigate()
  const { searchProducts, performClientSearch, searchTerm: storeSearchTerm } = useProductStore()
  const debounceTimer = useRef(null)

  // Sync with store search term
  useEffect(() => {
    if (storeSearchTerm !== searchTerm) {
      setSearchTerm(storeSearchTerm || '')
    }
  }, [storeSearchTerm, searchTerm])

  // Debounced server search + instant client search
  const debouncedSearch = useCallback(async (term) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
    
    // Instant client-side fuzzy search for immediate feedback
    performClientSearch(term)
    
    // Debounced server search for comprehensive results
    debounceTimer.current = setTimeout(async () => {
      await searchProducts(term)
      // Navigate to homepage to show search results
      if (term.trim() && window.location.pathname !== '/') {
        navigate('/')
      }
    }, 800)
  }, [searchProducts, performClientSearch, navigate])

  const handleInputChange = (e) => {
    const value = e.target.value
    setSearchTerm(value)
    debouncedSearch(value)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    await searchProducts(searchTerm)
    // Navigate to homepage to show search results
    if (window.location.pathname !== '/') {
      navigate('/')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-2xl">
      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
        <Search className="w-5 h-5 text-grey-400"/>
      </div>
      <input
        type="search"
        value={searchTerm}
        onChange={handleInputChange}
        className="block w-full p-3 pl-12 text-sm text-black border border-black-300 rounded-full bg-white/100 backdrop-blur-sm focus:ring-black focus:border-black placeholder-gray-400"
        placeholder="find your fit..."
      />
    </form>
  )
}

export default SearchBar
