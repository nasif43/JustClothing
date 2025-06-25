import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { updateUserPreferences } from '../../services/api'
import useUserStore from '../../store/useUserStore'

function PreferencePage() {
  const navigate = useNavigate()
  const { user, updateUser } = useUserStore()
  const [selectedTags, setSelectedTags] = useState([])
  const [isPickForMe, setIsPickForMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const mainTags = [
    { id: 'formal', name: 'FORMAL' },
    { id: 'casual', name: 'CASUAL' },
    { id: 'streetwear', name: 'STREET WEAR' },
    { id: 'ethnic', name: 'ETHNIC' },
    { id: 'activewear', name: 'ACTIVE WEAR' },
  ]

  const handleTagClick = (tagId) => {
    if (isPickForMe) return // Don't allow selection if "Pick for me" is selected

    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(id => id !== tagId))
    } else if (selectedTags.length < 3) {
      setSelectedTags([...selectedTags, tagId])
    }
  }

  const handlePickForMe = () => {
    if (isPickForMe) {
      // Deselect pick for me
      setIsPickForMe(false)
      setSelectedTags([])
    } else {
      // Select pick for me and clear manual selections
      setIsPickForMe(true)
      setSelectedTags([])
    }
  }

  const handleSubmit = async () => {
    if (!isPickForMe && selectedTags.length === 0) {
      setError('Please select at least one preference or choose "Pick for me"')
      return
    }

    setLoading(true)
    setError(null)

    try {
      let finalTags = selectedTags

      if (isPickForMe) {
        // Randomly select 3 tags
        const shuffled = [...mainTags].sort(() => 0.5 - Math.random())
        finalTags = shuffled.slice(0, 3).map(tag => tag.id)
      }

      // Map IDs to actual tag names for backend
      const tagNames = finalTags.map(tagId => {
        const tag = mainTags.find(t => t.id === tagId)
        return tag?.name.replace(' ', '_').toLowerCase() || tagId
      })

      // Save preferences to backend
      await updateUserPreferences({
        preferred_tags: tagNames,
        onboarding_completed: true
      })

      // Update user state
      updateUser({
        ...user,
        preferred_tags: tagNames,
        onboarding_completed: true
      })

      // Navigate to homepage
      navigate('/home')
    } catch (err) {
      setError(err.message || 'Failed to save preferences')
    } finally {
      setLoading(false)
    }
  }

  const canProceed = isPickForMe || selectedTags.length > 0

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-black">JustClothing</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Marble Background */}
      <div className="flex-grow flex items-center justify-center p-4" 
           style={{ 
             backgroundImage: `url(/src/assets/marble-bg.jpg)`,
             backgroundSize: 'cover',
             backgroundPosition: 'center',
             backgroundRepeat: 'no-repeat'
           }}>
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 max-w-2xl w-full shadow-xl border border-white/20">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-black mb-4">
            LOVELY, LET US GET YOU SORTED!
          </h1>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-center">
            {error}
          </div>
        )}

        {/* Tag Selection Grid */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {mainTags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => handleTagClick(tag.id)}
              disabled={isPickForMe || (selectedTags.length >= 3 && !selectedTags.includes(tag.id))}
              className={`py-4 px-6 rounded-full text-lg font-bold transition-all duration-200 ${
                selectedTags.includes(tag.id)
                  ? 'bg-black text-white shadow-lg transform scale-105'
                  : isPickForMe || (selectedTags.length >= 3 && !selectedTags.includes(tag.id))
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-black text-white hover:shadow-lg hover:transform hover:scale-105'
              }`}
            >
              {tag.name}
            </button>
          ))}

          {/* Pick for Me Button */}
          <button
            onClick={handlePickForMe}
            disabled={selectedTags.length > 0}
            className={`py-4 px-6 rounded-full text-lg font-bold transition-all duration-200 ${
              isPickForMe
                ? 'bg-purple-600 text-white shadow-lg transform scale-105'
                : selectedTags.length > 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-black text-white hover:shadow-lg hover:transform hover:scale-105'
            }`}
          >
            PICK FOR ME
          </button>
        </div>

        {/* Selection Info */}
        <div className="text-center mb-8">
          <p className="text-gray-600">
            {isPickForMe 
              ? "We'll pick 3 perfect styles for you!" 
              : `(MAXIMUM 3) - Selected: ${selectedTags.length}/3`
            }
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={!canProceed || loading}
            className={`py-3 px-8 rounded-full text-lg font-bold transition-all duration-200 ${
              canProceed && !loading
                ? 'bg-black text-white hover:shadow-lg hover:transform hover:scale-105'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {loading ? 'SAVING...' : "I'M READY!"}
          </button>
        </div>

        {/* Selection Preview */}
        {(selectedTags.length > 0 || isPickForMe) && (
          <div className="mt-6 p-4 bg-gray-100 rounded-lg">
            <p className="text-sm text-gray-600 text-center">
              {isPickForMe 
                ? "Your homepage will show 3 randomly selected style categories"
                : `Your homepage will show: ${selectedTags.map(id => mainTags.find(t => t.id === id)?.name).join(', ')}`
              }
            </p>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}

export default PreferencePage 