function StoreNavigation({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'home', label: 'HOME' },
    { id: 'top-picks', label: 'TOP PICKS' },
    { id: 'offers', label: 'OFFERS' },
    { id: 'reviews', label: 'REVIEWS' },
    { id: 'social-media', label: 'SOCIAL MEDIA' },
  ]

  return (
    <div className="mb-8">
      {/* Mobile: Horizontal scrollable pills */}
      <div className="lg:hidden">
        <div className="flex space-x-2 overflow-x-auto scrollbar-hide px-4 pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white text-black border-2 border-black shadow-sm'
                  : 'bg-black text-white hover:bg-gray-800 border-2 border-transparent'
              }`}
              style={{ minWidth: 'fit-content' }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Desktop: Centered pills */}
      <div className="hidden lg:flex justify-center space-x-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-white text-black border-2 border-black shadow-sm'
                : 'bg-black text-white hover:bg-gray-800 hover:scale-105 border-2 border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default StoreNavigation 