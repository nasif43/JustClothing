import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchSellerActiveOffers } from '../../services/api'
import marbleBg from '../../assets/marble-bg.jpg'

const OffersPage = () => {
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadOffers = async () => {
      try {
        setLoading(true)
        // For now, we'll show a message about offers being managed by stores
        // When backend adds public offers API, we can replace this
        setOffers([])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadOffers()
  }, [])

  return (
    <div
      className="min-h-screen w-full py-4 sm:py-8 px-2 sm:px-4 md:px-8 flex flex-col items-center"
      style={{ backgroundImage: `url(${marbleBg})`, backgroundSize: 'cover' }}
    >
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 md:mb-12 mt-4 sm:mt-8">OFFERS</h1>
      
      <div className="w-full max-w-5xl">
        {loading ? (
          <div className="bg-white bg-opacity-80 p-6 sm:p-8 rounded-lg text-center">
            <p className="text-base sm:text-lg">Loading offers...</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p>Error: {error}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header with info */}
            <div className="bg-white bg-opacity-80 p-6 sm:p-8 rounded-lg text-center">
              <h2 className="text-xl font-semibold mb-4">Special Offers & Deals</h2>
              <p className="text-gray-600 mb-4">
                Discover amazing offers from our sellers! Visit individual stores to see their exclusive deals and discounts.
              </p>
              <Link 
                to="/" 
                className="inline-block px-6 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
              >
                Browse Products
              </Link>
            </div>

            {/* Future offers will be displayed here */}
            <div className="bg-white bg-opacity-80 p-6 sm:p-8 rounded-lg">
              <h3 className="text-lg font-medium mb-4">How to Find Offers</h3>
              <div className="space-y-3 text-gray-700">
                <p>• Browse products to see items with active discounts</p>
                <p>• Visit store pages to see all offers from specific sellers</p>
                <p>• Look for special pricing and "Save ৳X" labels on product cards</p>
                <p>• Check back regularly for new deals and limited-time offers</p>
              </div>
            </div>

            {/* Coming soon notice */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 sm:p-8 rounded-lg border border-blue-200">
              <h3 className="text-lg font-medium mb-2 text-blue-800">Coming Soon</h3>
              <p className="text-blue-700">
                We're working on a comprehensive offers page that will show all active deals from all stores in one place. 
                Stay tuned for this exciting feature!
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Smiley face at the bottom */}
      <div className="mt-auto mb-6 sm:mb-8 opacity-30">
        <div className="w-8 sm:w-12 h-8 sm:h-12 rounded-full border-2 border-gray-500 flex items-center justify-center">
          <div className="flex">
            <div className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-gray-500 mx-0.5 sm:mx-1"></div>
            <div className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-gray-500 mx-0.5 sm:mx-1"></div>
          </div>
          <div className="w-4 sm:w-6 h-2 sm:h-3 border-b-2 border-gray-500 rounded-b-full absolute mt-2 sm:mt-3"></div>
        </div>
      </div>
    </div>
  )
}

export default OffersPage