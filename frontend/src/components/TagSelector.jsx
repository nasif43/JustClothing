import { useState, useEffect } from 'react'
import { X, Plus, Search } from 'lucide-react'
import { fetchTags } from '../services/api'

function TagSelector({ selectedTags = [], onTagsChange, placeholder = "Select or add tags..." }) {
  const [availableTags, setAvailableTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [customTagInput, setCustomTagInput] = useState('')

  useEffect(() => {
    const loadTags = async () => {
      try {
        setLoading(true)
        const response = await fetchTags()
        setAvailableTags(response.results || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadTags()
  }, [])

  // Filter available tags based on search term and exclude already selected ones
  const filteredTags = availableTags.filter(tag => 
    tag.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedTags.includes(tag.name)
  )

  const handleTagSelect = (tagName) => {
    if (!selectedTags.includes(tagName)) {
      onTagsChange([...selectedTags, tagName])
    }
    setSearchTerm('')
    setShowDropdown(false)
  }

  const handleTagRemove = (tagToRemove) => {
    onTagsChange(selectedTags.filter(tag => tag !== tagToRemove))
  }

  const handleCustomTagAdd = () => {
    const trimmedTag = customTagInput.trim()
    if (trimmedTag && !selectedTags.includes(trimmedTag)) {
      onTagsChange([...selectedTags, trimmedTag])
      setCustomTagInput('')
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredTags.length > 0) {
        handleTagSelect(filteredTags[0].name)
      } else if (searchTerm.trim()) {
        handleTagSelect(searchTerm.trim())
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false)
      setSearchTerm('')
    }
  }

  const handleCustomTagKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleCustomTagAdd()
    }
  }

  return (
    <div className="space-y-4">
      {/* Selected Tags Display */}
      {selectedTags.length > 0 && (
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">Selected Tags</label>
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 border border-blue-200"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => handleTagRemove(tag)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tag Search/Select */}
      <div className="relative">
        <label className="block mb-2 text-sm font-medium text-gray-700">Add Tags</label>
        <div className="relative">
          <div className="flex">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setShowDropdown(true)
                }}
                onFocus={() => setShowDropdown(true)}
                onKeyDown={handleKeyPress}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                placeholder="Search existing tags..."
              />
            </div>
            <button
              type="button"
              onClick={() => {
                if (searchTerm.trim()) {
                  handleTagSelect(searchTerm.trim())
                }
              }}
              disabled={!searchTerm.trim()}
              className="px-4 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
          
          {/* Dropdown */}
          {showDropdown && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {loading ? (
                <div className="p-3 text-center text-gray-500">Loading tags...</div>
              ) : error ? (
                <div className="p-3 text-center text-red-500">Error loading tags</div>
              ) : filteredTags.length > 0 ? (
                <>
                  <div className="p-2 text-xs text-gray-500 border-b border-gray-200">
                    Existing Tags
                  </div>
                  {filteredTags.slice(0, 10).map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleTagSelect(tag.name)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 border-b border-gray-100 last:border-b-0"
                    >
                      <span className="font-medium">#{tag.name}</span>
                      {tag.usage_count > 0 && (
                        <span className="ml-2 text-xs text-gray-500">
                          ({tag.usage_count} products)
                        </span>
                      )}
                    </button>
                  ))}
                </>
              ) : searchTerm.trim() ? (
                <div className="p-3">
                  <div className="text-xs text-gray-500 mb-2">Create new tag:</div>
                  <button
                    type="button"
                    onClick={() => handleTagSelect(searchTerm.trim())}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 border border-dashed border-gray-300 rounded"
                  >
                    <Plus className="inline h-4 w-4 mr-2" />
                    <span className="font-medium">#{searchTerm.trim()}</span>
                    <span className="ml-2 text-xs text-gray-500">(new tag)</span>
                  </button>
                </div>
              ) : (
                <div className="p-3 text-center text-gray-500">
                  Type to search or create tags
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Custom Tag Input */}
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700">Or add custom tag directly</label>
        <div className="flex">
          <input
            type="text"
            value={customTagInput}
            onChange={(e) => setCustomTagInput(e.target.value)}
            onKeyDown={handleCustomTagKeyPress}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
            placeholder="Enter custom tag name..."
          />
          <button
            type="button"
            onClick={handleCustomTagAdd}
            disabled={!customTagInput.trim()}
            className="px-4 py-2 bg-black text-white border border-black rounded-r-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  )
}

export default TagSelector 