const RevenueProgress = () => {
  const currentRevenue = 10000
  const targetRevenue = 40000
  const nextTierRevenue = 10000
  const progressPercentage = (currentRevenue / targetRevenue) * 100

  return (
    <div className="bg-white/90 rounded-lg p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">Revenue this month [April]</h2>
      
      <div className="relative">
        {/* Progress bar background */}
        <div className="w-full h-4 bg-gray-300 rounded-full overflow-hidden">
          {/* Progress bar fill */}
          <div 
            className="h-full bg-gradient-to-r from-gray-400 to-black rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        
        {/* Progress text */}
        <div className="flex justify-between items-center mt-2 text-sm text-gray-600">
          <span>Tk. {targetRevenue.toLocaleString()} (Tk. {nextTierRevenue.toLocaleString()} till next tier)</span>
        </div>
      </div>
    </div>
  )
}

export default RevenueProgress 