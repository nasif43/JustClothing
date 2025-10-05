import React from 'react'
import OfferGrid from './OfferGrid'

const OfferSection = ({ 
  title, 
  offers, 
  icon, 
  description, 
  showAll = false, 
  maxItems = 6,
  className = "" 
}) => {
  const displayOffers = showAll ? offers : offers?.slice(0, maxItems)

  if (!offers || offers.length === 0) {
    return null
  }

  return (
    <div className={`mb-8 ${className}`}>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {icon && <div className="text-2xl">{icon}</div>}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            {description && (
              <p className="text-gray-600 text-sm mt-1">{description}</p>
            )}
          </div>
        </div>
        
        {!showAll && offers.length > maxItems && (
          <button className="text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline">
            View All ({offers.length})
          </button>
        )}
      </div>

      {/* Offers Grid */}
      <OfferGrid offers={displayOffers} />
    </div>
  )
}

export default OfferSection