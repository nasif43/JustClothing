import { useState, useEffect } from 'react'
import { fetchTags } from '../services/api'
import useProductStore from '../store/useProductStore'

function TagsDisplay() {
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showMoreTags, setShowMoreTags] = useState(false)
  const { fetchProductsByTags, clearTagFilter, currentTags } = useProductStore()

  useEffect(() => {
    const loadTags = async () => {
      try {
        setLoading(true)
        const response = await fetchTags()
        setTags(response.results || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadTags()
  }, [])

  const handleTagClick = (tagName) => {
    const isSelected = currentTags.includes(tagName)
    
    if (isSelected) {
      // Remove tag from filter
      const newTags = currentTags.filter(tag => tag !== tagName)
      if (newTags.length === 0) {
        clearTagFilter()
      } else {
        fetchProductsByTags(newTags)
      }
    } else {
      // Add tag to filter
      const newTags = [...currentTags, tagName]
      fetchProductsByTags(newTags)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-4 text-red-500">
        <p>Failed to load tags: {error}</p>
      </div>
    )
  }

  // Exclude main category tags that are already displayed prominently
  const mainTagNames = ["Streetwear", "Gym wear", "Formal wear", "Oversized fits"]
  const additionalTags = tags.filter(tag => !mainTagNames.includes(tag.name))

  if (additionalTags.length === 0) {
    return null
  }

  return (
    <div className="mb-8">
      <div className="text-center mb-4">
        <button
          onClick={() => setShowMoreTags(!showMoreTags)}
          className="text-sm font-medium text-gray-700 hover:text-black hover:underline transition-all duration-200"
        >
          {showMoreTags ? 'Hide More Tags' : 'More Tags'} {showMoreTags ? '▲' : '▼'}
        </button>
      </div>
      
      {showMoreTags && (
        <div className="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto">
          {additionalTags.slice(0, 16).map((tag) => {
            const isSelected = currentTags.includes(tag.name)
            return (
              <button
                key={tag.id}
                onClick={() => handleTagClick(tag.name)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
                  isSelected
                    ? 'bg-black text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-300 hover:underline'
                }`}
              >
                #{tag.name}
                {tag.usage_count > 0 && (
                  <span className="ml-1 text-xs opacity-70">
                    ({tag.usage_count})
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {currentTags.length > 0 && (
        <div className="text-center mt-4">
          <button
            onClick={clearTagFilter}
            className="text-xs bg-red-500 text-white px-3 py-1 rounded-full hover:bg-red-600 transition-colors"
          >
            Clear Tag Filter
          </button>
        </div>
      )}
    </div>
  )
}

export default TagsDisplay 