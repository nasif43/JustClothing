function ReviewSorter({ activeSorting, onSortChange }) {
  const sortOptions = [
    { id: 'default', label: 'DEFAULT' },
    { id: 'newest', label: 'NEWEST' },
    { id: 'oldest', label: 'OLDEST' }
  ]

  return (
    <div className="flex items-center gap-4">
      <span className="font-medium text-gray-500">SORT BY</span>
      <div className="flex gap-2">
        {sortOptions.map(option => (
          <button
            key={option.id}
            className={`px-4 py-2 rounded-full text-sm transition-colors ${
              activeSorting === option.id
                ? 'bg-black text-white'
                : 'bg-white text-black border border-gray-200 hover:bg-gray-100'
            }`}
            onClick={() => onSortChange(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default ReviewSorter 