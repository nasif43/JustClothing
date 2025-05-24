import React, { useState, useEffect } from 'react'
import SellerLayout from '../../components/layout/SellerLayout'

const SellerOffersPage = () => {
  const [discountType, setDiscountType] = useState('flat') // 'flat' or 'percentage'
  const [originalPrice, setOriginalPrice] = useState(550)
  const [discountAmount, setDiscountAmount] = useState(100)
  const [newPrice, setNewPrice] = useState(450)
  const [activePage, setActivePage] = useState(1)
  
  // Generate dummy product data for the grid
  const products = Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    name: `Product ${i + 1}`,
    imageUrl: null // Using gray placeholders instead of actual images
  }))

  // Calculate the new price when original price or discount changes
  useEffect(() => {
    if (discountType === 'flat') {
      setNewPrice(originalPrice - discountAmount)
    } else {
      setNewPrice(originalPrice - (originalPrice * discountAmount / 100))
    }
  }, [originalPrice, discountAmount, discountType])

  // Update the new price manually if needed
  const handleNewPriceChange = (e) => {
    const value = parseInt(e.target.value) || 0
    setNewPrice(value)
    // If the user changes the new price directly, recalculate the discount
    if (discountType === 'flat') {
      setDiscountAmount(originalPrice - value)
    } else {
      setDiscountAmount(Math.round(((originalPrice - value) / originalPrice) * 100))
    }
  }

  return (
    <SellerLayout>
      <div className="bg-white/90 p-6 rounded-lg">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Large preview area on the left */}
          <div className="lg:w-1/2">
            <div className="bg-gray-200 aspect-square w-full"></div>
            
            {/* Discount type tabs */}
            <div className="mt-4 flex">
              <button 
                className={`w-1/2 py-2 font-medium ${discountType === 'flat' ? 'bg-black text-white' : 'bg-white text-black border border-gray-300'}`}
                onClick={() => setDiscountType('flat')}
              >
                Flat
              </button>
              <button 
                className={`w-1/2 py-2 font-medium ${discountType === 'percentage' ? 'bg-black text-white' : 'bg-white text-black border border-gray-300'}`}
                onClick={() => setDiscountType('percentage')}
              >
                Percentage
              </button>
            </div>
            
            {/* Price inputs */}
            <div className="mt-4 space-y-4">
              <div className="flex border border-gray-300 rounded overflow-hidden">
                <label className="bg-white text-black px-4 py-2 min-w-[180px] border-r border-gray-300">
                  Original Price
                </label>
                <input 
                  type="number" 
                  value={originalPrice} 
                  onChange={(e) => setOriginalPrice(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 focus:outline-none text-right"
                />
              </div>
              
              <div className="flex border border-gray-300 rounded overflow-hidden">
                <label className="bg-white text-black px-4 py-2 min-w-[180px] border-r border-gray-300">
                  Discount amount
                </label>
                <input 
                  type="number" 
                  value={discountAmount} 
                  onChange={(e) => setDiscountAmount(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 focus:outline-none text-right"
                />
              </div>
              
              <div className="flex border border-gray-300 rounded overflow-hidden">
                <label className="bg-white text-black px-4 py-2 min-w-[180px] border-r border-gray-300">
                  New Price
                </label>
                <input 
                  type="number" 
                  value={newPrice} 
                  onChange={handleNewPriceChange}
                  className="w-full px-4 py-2 focus:outline-none text-right"
                />
              </div>
            </div>
          </div>
          
          {/* Product grid on the right */}
          <div className="lg:w-1/2">
            <div className="grid grid-cols-5 gap-2">
              {products.map(product => (
                <div 
                  key={product.id} 
                  className="aspect-square bg-gray-200 cursor-pointer hover:border-2 hover:border-black transition-all"
                ></div>
              ))}
            </div>
            
            {/* Pagination */}
            <div className="flex justify-end mt-6 gap-2">
              {[1, 2, 3, 4].map(page => (
                <button 
                  key={page}
                  onClick={() => setActivePage(page)}
                  className={`w-8 h-8 flex items-center justify-center ${
                    activePage === page 
                    ? 'bg-gray-300 text-black' 
                    : 'bg-gray-200 text-black'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Update button */}
        <div className="flex justify-end mt-6">
          <button
            className="bg-black text-white px-12 py-3 rounded font-medium hover:bg-gray-800 transition-colors"
          >
            update
          </button>
        </div>
      </div>
    </SellerLayout>
  )
}

export default SellerOffersPage 