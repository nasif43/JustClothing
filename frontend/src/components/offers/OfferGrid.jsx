import React from 'react'
import OfferCard from './OfferCard'

const OfferGrid = ({ offers, title, className = "", emptyMessage = "No offers available" }) => {
  if (!offers || offers.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-gray-500 text-lg">{emptyMessage}</div>
      </div>
    )
  }

  return (
    <div className={className}>
      {title && (
        <h2 className="text-xl font-bold mb-4">{title}</h2>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {offers.map((offer) => (
          <OfferCard key={offer.id} offer={offer} />
        ))}
      </div>
    </div>
  )
}

export default OfferGrid