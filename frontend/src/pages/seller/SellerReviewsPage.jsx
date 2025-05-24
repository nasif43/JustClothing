import React from 'react'
import SellerLayout from '../../components/layout/SellerLayout'

const SellerReviewsPage = () => {
  return (
    <SellerLayout>
      <div className="bg-white/90 rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4">Customer Reviews</h1>
        <p className="text-gray-600 mb-6">
          View and respond to customer reviews for your products and store.
        </p>
        
        <div className="bg-gray-100 p-8 rounded-lg text-center">
          <h2 className="text-xl font-semibold mb-2">No Reviews Yet</h2>
          <p className="text-gray-500">Customer reviews will appear here once they leave feedback.</p>
        </div>
      </div>
    </SellerLayout>
  )
}

export default SellerReviewsPage 