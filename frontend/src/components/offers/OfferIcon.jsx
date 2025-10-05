import React from 'react'
import { Gift, Tag, Truck } from 'lucide-react'

const OfferIcon = ({ promotion_type, className = "w-6 h-6" }) => {
  const getIcon = () => {
    switch (promotion_type) {
      case 'free_shipping':
        return <Truck className={className} />
      case 'buy_x_get_y':
        return <Gift className={className} />
      case 'percentage':
      case 'fixed_amount':
      default:
        return <Tag className={className} />
    }
  }

  return (
    <div className="flex-shrink-0">
      {getIcon()}
    </div>
  )
}

export default OfferIcon