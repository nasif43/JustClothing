import React from 'react'

const UsageProgress = ({ usage_count = 0, usage_limit, className = "" }) => {
  if (!usage_limit) {
    return null
  }

  const percentage = Math.min((usage_count / usage_limit) * 100, 100)
  const isAlmostUsedUp = percentage > 80
  const isNearlyFull = percentage > 90

  return (
    <div className={className}>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>Used: {usage_count}</span>
        <span>Limit: {usage_limit}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${
            isNearlyFull ? 'bg-red-500' : 
            isAlmostUsedUp ? 'bg-yellow-500' : 
            'bg-green-500'
          }`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      
      {isAlmostUsedUp && (
        <div className="text-xs mt-1">
          <span className={isNearlyFull ? 'text-red-500' : 'text-yellow-600'}>
            {isNearlyFull ? '🔥 Almost gone!' : '⚡ Limited remaining!'}
          </span>
        </div>
      )}
    </div>
  )
}

export default UsageProgress