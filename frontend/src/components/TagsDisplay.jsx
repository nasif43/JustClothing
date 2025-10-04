import { useState, useEffect } from 'react'
import { fetchTags } from '../services/api'
import useProductStore from '../store/useProductStore'

function TagsDisplay() {
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showMoreTags, setShowMoreTags] = useState(false)
  const { fetchProductsByTags, clearTagFilter, currentTags } = useProductStore()

  const formatTagName = (tag) => {
    // Convert snake_case to Title Case
    return tag.replace(/_/g, ' ')
             .split(' ')
             .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
             .join(' ')
  }

  useEffect(() => {
    const loadTags = async () => {
      try {
        setLoading(true)
        const response = await fetchTags()
        console.log('Raw tags API response:', response)
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

  // Function to normalize tag names for comparison (remove case, spaces, special chars)
  const normalizeTagName = (name) => {
    return name.toLowerCase().replace(/[\s\-_]/g, '').trim()
  }

  // Process tags to handle arrays and normalize
  const processAndExpandTags = (tagList) => {
    const expandedTags = []
    
    tagList.forEach(tag => {
      let tagName = tag.name
      
      // Handle case where tag.name might be an array
      if (Array.isArray(tagName)) {
        // Split array into individual tags
        tagName.forEach((individualTagName, index) => {
          expandedTags.push({
            ...tag,
            id: `${tag.id}_${index}`,
            name: individualTagName.trim().replace(/["\[\]]/g, ''), // Remove quotes and brackets
            usage_count: tag.usage_count || 0
          })
        })
      } else if (typeof tagName === 'string') {
        // Handle string that looks like array: '["denim","jeans","jacket"]'
        if (tagName.startsWith('[') && tagName.endsWith(']')) {
          try {
            const parsedArray = JSON.parse(tagName)
            if (Array.isArray(parsedArray)) {
              parsedArray.forEach((individualTagName, index) => {
                expandedTags.push({
                  ...tag,
                  id: `${tag.id}_${index}`,
                  name: String(individualTagName).trim().replace(/["\[\]]/g, ''),
                  usage_count: tag.usage_count || 0
                })
              })
              return
            }
          } catch (e) {
            // If parsing fails, treat as regular string
          }
        }
        
        // Handle comma-separated strings
        const names = tagName.split(',').map(name => name.trim().replace(/["\[\]]/g, '')).filter(name => name.length > 0)
        if (names.length > 1) {
          names.forEach((individualTagName, index) => {
            expandedTags.push({
              ...tag,
              id: `${tag.id}_${index}`,
              name: individualTagName,
              usage_count: tag.usage_count || 0
            })
          })
        } else {
          expandedTags.push({
            ...tag,
            name: tagName.replace(/["\[\]]/g, '').trim() // Clean up any stray quotes/brackets
          })
        }
      }
    })
    
    return expandedTags
  }

  // Merge tags with same normalized names
  const mergeSimilarTags = (tagList) => {
    const mergedMap = new Map()
    
    tagList.forEach(tag => {
      const normalizedName = normalizeTagName(tag.name)
      
      if (mergedMap.has(normalizedName)) {
        // Merge with existing tag
        const existing = mergedMap.get(normalizedName)
        existing.usage_count = (existing.usage_count || 0) + (tag.usage_count || 0)
        // Keep the shorter/cleaner name
        if (tag.name.length < existing.name.length) {
          existing.name = tag.name
        }
      } else {
        // Add new tag
        mergedMap.set(normalizedName, { ...tag })
      }
    })
    
    return Array.from(mergedMap.values())
  }

  // First expand any array tags into individual tags
  const expandedTags = processAndExpandTags(tags)
  
  // Exclude main category tags that are already displayed prominently
  const mainTagNames = ["Streetwear", "Gym wear", "Formal wear", "Oversized fits"]
  const filteredTags = expandedTags.filter(tag => {
    const normalizedTagName = normalizeTagName(tag.name)
    return !mainTagNames.some(mainTag => normalizeTagName(mainTag) === normalizedTagName)
  })
  
  // Merge similar tags
  const additionalTags = mergeSimilarTags(filteredTags)

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
                className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 underline decoration-1 underline-offset-2 ${
                  isSelected
                    ? 'bg-black text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-300 hover:underline-offset-1'
                }`}
              >
                {formatTagName(tag.name)}
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