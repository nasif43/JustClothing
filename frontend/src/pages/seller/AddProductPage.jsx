import React, { useState, useEffect } from 'react'
import SellerLayout from '../../components/layout/SellerLayout'
import { Plus, Search, ChevronDown, ChevronUp, X } from 'lucide-react'

const AddProductPage = () => {
  const [customSizes, setCustomSizes] = useState(false)
  const [days, setDays] = useState(3)
  const [selectedSizes, setSelectedSizes] = useState({
    '2XS': false,
    'XS': false,
    'S': false,
    'M': false,
    'L': false,
    'XL': false,
    '2XL': false,
    '3XL': false
  })
  const [selectedColors, setSelectedColors] = useState([
    { id: 1, name: 'Dark Green' },
    { id: 2, name: 'Baby Pink' }
  ])
  const [colorInput, setColorInput] = useState('')
  const [quantities, setQuantities] = useState({})
  const [skuCombinations, setSkuCombinations] = useState([])

  // Generate SKU combinations when selected colors or sizes change
  useEffect(() => {
    generateSkuCombinations()
  }, [selectedColors, selectedSizes])

  const handleSizeChange = (size) => {
    setSelectedSizes({
      ...selectedSizes,
      [size]: !selectedSizes[size]
    })
  }

  const addColor = () => {
    if (colorInput.trim() !== '') {
      const newColor = {
        id: Date.now(),
        name: colorInput.trim()
      }
      setSelectedColors([...selectedColors, newColor])
      setColorInput('')
    }
  }

  const removeColor = (colorId) => {
    setSelectedColors(selectedColors.filter(color => color.id !== colorId))
  }

  const generateSkuCombinations = () => {
    const activeSizes = Object.entries(selectedSizes)
      .filter(([_, isSelected]) => isSelected)
      .map(([size]) => size)

    if (activeSizes.length === 0 || selectedColors.length === 0) {
      setSkuCombinations([])
      return
    }

    const combinations = []
    selectedColors.forEach(color => {
      activeSizes.forEach(size => {
        combinations.push({
          id: `${color.id}-${size}`,
          color: color.name,
          size: size,
          quantity: quantities[`${color.id}-${size}`] || 0
        })
      })
    })

    setSkuCombinations(combinations)
  }

  const handleQuantityChange = (combinationId, value) => {
    const newQuantities = {
      ...quantities,
      [combinationId]: parseInt(value) || 0
    }
    setQuantities(newQuantities)
  }

  const incrementDays = () => {
    setDays(prev => prev + 1)
  }

  const decrementDays = () => {
    if (days > 1) {
      setDays(prev => prev - 1)
    }
  }

  return (
    <SellerLayout>
      <div className="bg-white/90 rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold mb-8 text-center uppercase">LIST YOUR PRODUCT</h1>
        
        <form className="space-y-6">
          {/* Product Title */}
          <div>
            <label htmlFor="productTitle" className="block mb-2 font-medium text-gray-700">Product Title</label>
            <input 
              type="text" 
              id="productTitle" 
              className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>
          
          {/* Add Photos */}
          <div>
            <label className="block mb-2 font-medium text-gray-700">
              Add Photos <span className="text-xs text-gray-500">(Max 6)</span>
            </label>
            <div className="border border-gray-300 rounded-lg p-4 min-h-[150px] flex items-start">
              <div className="w-16 h-16 bg-gray-200 flex items-center justify-center rounded">
                <Plus className="w-8 h-8 text-gray-500" />
              </div>
            </div>
          </div>
          
          {/* Select Tags */}
          <div>
            <label className="block mb-2 font-medium text-gray-700">
              Select Tags <span className="text-xs text-gray-500">(Max 5)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map(index => (
                <input 
                  key={index}
                  type="text" 
                  className={`border ${index === 2 || index === 3 ? 'bg-red-100 border-red-200' : 'border-gray-300'} rounded p-2 w-full sm:w-[calc(20%-10px)] focus:outline-none focus:ring-1 focus:ring-black`}
                  placeholder=""
                />
              ))}
            </div>
          </div>
          
          {/* Custom Tags */}
          <div>
            <label className="block mb-2 font-medium text-gray-700">
              Custom Tags <span className="text-xs text-gray-500">(Optional) (Max 5)</span>
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                className="w-full border border-gray-300 rounded p-2 pl-10 focus:outline-none focus:ring-1 focus:ring-black"
                placeholder="Search for tags"
              />
            </div>
            <div className="flex gap-2 mt-2">
              <span className="bg-gray-200 text-gray-700 rounded px-2 py-1 text-sm flex items-center">
                Floral Print
              </span>
              <span className="bg-gray-200 text-gray-700 rounded px-2 py-1 text-sm flex items-center">
                Beach wear
              </span>
            </div>
          </div>
          
          {/* Size Options */}
          <div>
            <label className="block mb-2 font-medium text-gray-700">Size Options</label>
            <div className="flex flex-wrap gap-2">
              {Object.keys(selectedSizes).map(size => (
                <button
                  key={size}
                  type="button"
                  onClick={() => handleSizeChange(size)}
                  className={`px-4 py-2 rounded border transition-colors ${
                    selectedSizes[size] 
                      ? 'bg-black text-white border-black' 
                      : 'bg-white text-black border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
          
          {/* Offer Custom sizes */}
          <div className="flex items-center">
            <input 
              type="checkbox" 
              id="customSizes" 
              checked={customSizes}
              onChange={() => setCustomSizes(!customSizes)}
              className="mr-2"
            />
            <label htmlFor="customSizes" className="font-medium text-gray-700">
              Offer Custom sizes
            </label>
          </div>
          
          {/* Custom Sizes Fields */}
          {customSizes && (
            <div className="border border-gray-300 rounded-lg p-4">
              <div className="flex flex-wrap gap-2">
                <div className="bg-gray-200 rounded px-4 py-2 text-sm">Waist Size</div>
                <div className="bg-gray-200 rounded px-4 py-2 text-sm">Top Length</div>
                <div className="bg-gray-200 rounded px-4 py-2 text-sm">Top Width</div>
                <input 
                  type="text" 
                  className="flex-1 border border-gray-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
            </div>
          )}
          
          {/* Colour Options */}
          <div>
            <label className="block mb-2 font-medium text-gray-700">Colour Options</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                value={colorInput}
                onChange={(e) => setColorInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addColor())}
                className="w-full border border-gray-300 rounded p-2 pl-10 focus:outline-none focus:ring-1 focus:ring-black"
                placeholder="Add a color and press Enter"
              />
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedColors.map(color => (
                <span 
                  key={color.id} 
                  className="bg-gray-200 text-gray-700 rounded px-2 py-1 text-sm flex items-center"
                >
                  {color.name}
                  <button 
                    type="button" 
                    onClick={() => removeColor(color.id)}
                    className="ml-1 text-gray-500 hover:text-gray-700"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>
          
          {/* Product Description */}
          <div>
            <label htmlFor="productDescription" className="block mb-2 font-medium text-gray-700">Product Description</label>
            <textarea 
              id="productDescription" 
              className="w-full border border-gray-300 rounded p-2 min-h-[100px] focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>
          
          {/* SKU - Dynamic based on selected colors and sizes */}
          <div>
            <label className="block mb-2 font-medium text-gray-700">SKU</label>
            {skuCombinations.length === 0 ? (
              <div className="bg-gray-100 rounded-lg p-6 text-center text-gray-500">
                Please select at least one size and one color to generate combinations
              </div>
            ) : (
              <div className="bg-black rounded-lg p-4">
                <div className="space-y-2">
                  {skuCombinations.map((combination) => (
                    <div key={combination.id} className="flex gap-2">
                      <div className="bg-gray-200 rounded-full flex-1 py-2 px-4 text-center text-gray-700">
                        {combination.color}
                      </div>
                      <div className="bg-gray-200 rounded-full flex-1 py-2 px-4 text-center text-gray-700">
                        {combination.size}
                      </div>
                      <div className="bg-gray-200 rounded-full flex-1 py-2 px-2 flex items-center justify-center">
                        <input
                          type="number"
                          min="0"
                          value={quantities[combination.id] || ''}
                          onChange={(e) => handleQuantityChange(combination.id, e.target.value)}
                          className="w-full bg-transparent text-center focus:outline-none"
                          placeholder="Quantity"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Requires Advance Payment */}
          <div className="flex items-center">
            <input 
              type="checkbox" 
              id="advancePayment" 
              className="mr-2"
            />
            <label htmlFor="advancePayment" className="font-medium text-gray-700">
              Requires Advance Payment
            </label>
          </div>
          
          {/* Estimated Pick up Time */}
          <div>
            <label className="block mb-2 font-medium text-gray-700">Estimated Pick up Time</label>
            <div className="flex items-center">
              <div className="relative border border-gray-300 rounded flex items-center mr-2">
                <button 
                  type="button"
                  onClick={decrementDays}
                  className="p-1 border-r border-gray-300 focus:outline-none"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <input 
                  type="number" 
                  value={days}
                  onChange={(e) => setDays(parseInt(e.target.value) || 1)}
                  className="w-12 text-center p-1 border-none focus:outline-none"
                  min="1"
                />
                <button 
                  type="button"
                  onClick={incrementDays}
                  className="p-1 border-l border-gray-300 focus:outline-none"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
              </div>
              <div className="border border-gray-300 rounded p-2">
                Days
              </div>
            </div>
          </div>
          
          {/* Agreement */}
          <div className="flex items-center">
            <input 
              type="checkbox" 
              id="agreement" 
              className="mr-2"
            />
            <label htmlFor="agreement" className="text-sm text-gray-700">
              I agree to the terms and conditions and bear full responsibility for my actions
            </label>
          </div>
          
          {/* Submit Button */}
          <div className="text-right">
            <button 
              type="submit" 
              className="bg-black text-white px-8 py-3 rounded uppercase font-bold transition-colors hover:bg-gray-800"
            >
              Complete Listing
            </button>
          </div>
        </form>
      </div>
    </SellerLayout>
  )
}

export default AddProductPage 