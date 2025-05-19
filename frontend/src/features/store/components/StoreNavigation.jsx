function StoreNavigation({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'home', label: 'HOME' },
    { id: 'top-picks', label: 'TOP PICKS' },
    { id: 'offers', label: 'OFFERS' },
    { id: 'reviews', label: 'REVIEWS' },
    { id: 'social-media', label: 'SOCIAL MEDIA' },
  ]

  return (
    <div className="flex justify-center space-x-4 mb-8 overflow-x-auto pb-2">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`px-6 py-3 rounded-full text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? 'bg-white text-black border-2 border-black'
              : 'bg-black text-white hover:bg-white hover:text-black hover:border-1 hover:border-black transition-all delay-50'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export default StoreNavigation 