import React from 'react'
import { Link } from 'react-router-dom'
import OfferBadge from './OfferBadge'
import OfferIcon from './OfferIcon'
import TimeRemaining from './TimeRemaining'
import PromoCodeList from './PromoCodeList'
import UsageProgress from './UsageProgress'

const OfferCard = ({ offer, className = "" }) => {
  const {
    id,
    name,
    description,
    promotion_type,
    discount_percentage,
    discount_amount,
    end_date,
    promo_codes = [],
    applicable_products = [],
    usage_count = 0,
    usage_limit
  } = offer

  const isExpired = new Date(end_date) < new Date()

  return (
    <div className={`relative bg-white rounded-lg shadow-md overflow-hidden border hover:shadow-lg transition-shadow duration-300 ${isExpired ? 'opacity-60' : ''} ${className}`}>
      {/* Header with discount badge */}
      <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="mb-2">
              <OfferBadge 
                promotion_type={promotion_type}
                discount_percentage={discount_percentage}
                discount_amount={discount_amount}
              />
            </div>
            <h3 className="text-lg font-bold leading-tight">{name}</h3>
          </div>
          
          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <OfferIcon promotion_type={promotion_type} className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{description}</p>

        {/* Promo codes */}
        <PromoCodeList promo_codes={promo_codes} className="mb-3" />

        {/* Products count */}
        {applicable_products.length > 0 && (
          <div className="text-sm text-gray-500 mb-3">
            Valid on {applicable_products.length} products
          </div>
        )}

        {/* Usage progress */}
        <UsageProgress 
          usage_count={usage_count} 
          usage_limit={usage_limit} 
          className="mb-3" 
        />

        {/* Time remaining and view details */}
        <div className="flex items-center justify-between">
          <TimeRemaining end_date={end_date} />
          
          <Link 
            to={`/offers/${id}`}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
          >
            View Details
          </Link>
        </div>
      </div>

      {/* Expired overlay */}
      {isExpired && (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center">
          <span className="bg-red-500 text-white px-4 py-2 rounded-full font-bold">
            EXPIRED
          </span>
        </div>
      )}
    </div>
  )
}

export default OfferCard