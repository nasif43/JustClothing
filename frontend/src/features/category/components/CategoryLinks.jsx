import useProductStore from "../../../store/useProductStore"
import useUserStore from "../../../store/useUserStore"

function CategoryLinks() {
  const { fetchProductsByTags, clearTagFilter, currentTags } = useProductStore()
  const { user } = useUserStore()
  
  // Default tags if user hasn't completed onboarding
  const defaultTags = [
    { id: 1, name: "Streetwear" },
    { id: 2, name: "Gym wear" },
    { id: 3, name: "Formal wear" },
    { id: 4, name: "Oversized fits" },
  ]

  // Mapping from preference IDs to display names
  const preferenceToDisplayMap = {
    'formal': 'Formal wear',
    'casual': 'Casual wear',
    'streetwear': 'Streetwear',
    'ethnic': 'Ethnic wear',
    'activewear': 'Gym wear',
  }

  // Get user's preferred tags or use defaults
  const getDisplayTags = () => {
    if (user && user.onboarding_completed && user.preferred_tags && user.preferred_tags.length > 0) {
      // Convert user's preferred tags to display format
      return user.preferred_tags.map((prefTag, index) => ({
        id: index + 1,
        name: preferenceToDisplayMap[prefTag] || prefTag
      }))
    }
    return defaultTags
  }

  const mainTags = getDisplayTags()

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
      // Add tag to filter (replace current selection for main category tags)
      fetchProductsByTags([tagName])
    }
  }

  return (
    <div className="flex justify-center">
      <div className={`grid gap-4 text-center ${
        mainTags.length === 4 ? 'grid-cols-4' : 
        mainTags.length === 3 ? 'grid-cols-3' : 
        mainTags.length === 2 ? 'grid-cols-2' : 
        'grid-cols-1'
      }`}>
        {mainTags.map((tag) => {
          const isSelected = currentTags.includes(tag.name)
          return (
            <button
              key={tag.id}
              onClick={() => handleTagClick(tag.name)}
              className={`text-lg font-medium transition-all duration-200 py-2 px-4 ${
                isSelected
                  ? 'bg-black text-white shadow-md rounded-lg'
                  : 'text-black underline decoration-1 underline-offset-4 hover:underline-offset-2'
              }`}
            >
              {tag.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default CategoryLinks 