import React from 'react'

const OfferBadge = ({ promotion_type, discount_percentage, discount_amount }) => {
  const getDiscountText = () => {
    if (promotion_type === 'percentage' && discount_percentage) {
      return `${discount_percentage}% OFF`
    } else if (promotion_type === 'fixed_amount' && discount_amount) {
      return `৳${discount_amount} OFF`
    } else if (promotion_type === 'free_shipping') {
      return 'FREE SHIPPING'
    } else if (promotion_type === 'buy_x_get_y') {
      return 'BUY X GET Y'
    }
    return 'SPECIAL OFFER'
  }

  const getBadgeColor = () => {
    switch (promotion_type) {
      case 'percentage':
        return 'bg-green-500'
      case 'fixed_amount':
        return 'bg-blue-500'
      case 'free_shipping':
        return 'bg-purple-500'
      case 'buy_x_get_y':
        return 'bg-orange-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className={`inline-block ${getBadgeColor()} text-white rounded-full px-3 py-1 text-sm font-bold`}>
      {getDiscountText()}
    </div>
  )
}

export default OfferBadge