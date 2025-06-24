import React, { useState, useEffect } from 'react'
import SellerLayout from '../../components/layout/SellerLayout'
import { 
  fetchSellerProductsForOffers, 
  createProductOffer,
  fetchSellerOffers,
  fetchSellerActiveOffers,
  updateProductOffer 
} from '../../services/api'

const SellerOffersPage = () => {
  const [activeTab, setActiveTab] = useState('create') // 'create' or 'ongoing'
  const [discountType, setDiscountType] = useState('flat') // 'flat' or 'percentage'
  const [originalPrice, setOriginalPrice] = useState('')
  const [discountAmount, setDiscountAmount] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [activePage, setActivePage] = useState(1)
  const [products, setProducts] = useState([])
  const [selectedProducts, setSelectedProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [previewProduct, setPreviewProduct] = useState(null)
  
  // Form data for creating offers
  const [offerName, setOfferName] = useState('')
  const [offerDescription, setOfferDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  
  // Ongoing offers data
  const [ongoingOffers, setOngoingOffers] = useState([])
  const [loadingOffers, setLoadingOffers] = useState(false)

  useEffect(() => {
    if (activeTab === 'create') {
      loadProducts()
    } else if (activeTab === 'ongoing') {
      loadOngoingOffers()
    }
  }, [activeTab])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const response = await fetchSellerProductsForOffers()
      setProducts(response.products || [])
    } catch (error) {
      console.error('Error loading products:', error)
      alert('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const loadOngoingOffers = async () => {
    try {
      setLoadingOffers(true)
      const response = await fetchSellerActiveOffers()
      setOngoingOffers(response.offers || [])
    } catch (error) {
      console.error('Error loading ongoing offers:', error)
      alert('Failed to load ongoing offers')
    } finally {
      setLoadingOffers(false)
    }
  }

  const stopOffer = async (offerId) => {
    if (!confirm('Are you sure you want to stop this offer?')) {
      return
    }

    try {
      setLoadingOffers(true)
      await updateProductOffer(offerId, { status: 'inactive' })
      alert('Offer stopped successfully!')
      loadOngoingOffers() // Reload the offers
    } catch (error) {
      console.error('Error stopping offer:', error)
      alert('Failed to stop offer: ' + (error.message || 'Unknown error'))
    } finally {
      setLoadingOffers(false)
    }
  }

  // Helper function to get product image
  const getProductImage = (product) => {
    if (product.images && product.images.length > 0) {
      const image = product.images[0]
      if (typeof image === 'object' && image.image) {
        return image.image.startsWith('http') ? image.image : `http://localhost:8000${image.image}`
      }
      return typeof image === 'string' ? image : null
    }
    return null
  }

  // Calculate new price based on discount type and amount
  const calculateNewPrice = (originalPrice, discountType, discountAmount) => {
    const price = parseFloat(originalPrice) || 0
    const discount = parseFloat(discountAmount) || 0
    
    if (discountType === 'flat') {
      return Math.max(0, price - discount)
    } else {
      return Math.max(0, price - (price * discount / 100))
    }
  }

  // Update new price when discount changes
  const handleDiscountChange = (e) => {
    const value = parseFloat(e.target.value) || 0
    setDiscountAmount(value)
    
    const originalPriceFloat = parseFloat(originalPrice) || 0
    if (originalPriceFloat > 0) {
      const calculated = calculateNewPrice(originalPriceFloat, discountType, value)
      setNewPrice(calculated.toFixed(2))
    }
  }

  // Update discount type
  const handleDiscountTypeChange = (type) => {
    setDiscountType(type)
    
    const originalPriceFloat = parseFloat(originalPrice) || 0
    const discountValue = parseFloat(discountAmount) || 0
    
    if (originalPriceFloat > 0 && discountValue > 0) {
      const calculated = calculateNewPrice(originalPriceFloat, type, discountValue)
      setNewPrice(calculated.toFixed(2))
    }
  }

  // Update the original price manually
  const handleOriginalPriceChange = (e) => {
    const value = parseFloat(e.target.value) || 0
    setOriginalPrice(value)
    
    const discountValue = parseFloat(discountAmount) || 0
    if (value > 0 && discountValue > 0) {
      const calculated = calculateNewPrice(value, discountType, discountValue)
      setNewPrice(calculated.toFixed(2))
    }
  }

  // Update the new price manually if needed
  const handleNewPriceChange = (e) => {
    const value = parseFloat(e.target.value) || 0
    setNewPrice(value)
    // If the user changes the new price directly, recalculate the discount
    const originalPriceFloat = parseFloat(originalPrice) || 0
    if (originalPriceFloat > 0) {
      if (discountType === 'flat') {
        setDiscountAmount(Math.max(0, originalPriceFloat - value))
      } else {
        setDiscountAmount(Math.round(Math.max(0, ((originalPriceFloat - value) / originalPriceFloat) * 100)))
      }
    }
  }

  const toggleProductSelection = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
    
    // Update preview to show the clicked product and set its price
    const product = products.find(p => p.id === productId)
    if (product) {
      setPreviewProduct(product)
      // Set the original price from the selected product
      const productPrice = parseFloat(product.price) || 0
      setOriginalPrice(productPrice)
      // Recalculate new price based on current discount
      if (discountAmount > 0) {
        const calculated = calculateNewPrice(productPrice, discountType, parseFloat(discountAmount))
        setNewPrice(calculated.toFixed(2))
      } else {
        setNewPrice(productPrice)
      }
    }
  }

  const handleCreateOffer = async () => {
    if (!offerName.trim()) {
      alert('Please enter an offer name')
      return
    }
    
    if (selectedProducts.length === 0) {
      alert('Please select at least one product')
      return
    }
    
    if (!discountAmount || discountAmount <= 0) {
      alert('Please enter a valid discount amount')
      return
    }
    
    if (!startDate || !endDate) {
      alert('Please set start and end dates for the offer')
      return
    }

    try {
      setLoading(true)
      
      // Create offers for each selected product
      for (const productId of selectedProducts) {
        const offerData = {
          product: productId,
          name: offerName,
          description: offerDescription || `${discountType === 'flat' ? '৳' : ''}${discountAmount}${discountType === 'percentage' ? '%' : ''} off`,
          offer_type: discountType,
          discount_percentage: discountType === 'percentage' ? parseFloat(discountAmount) : null,
          discount_amount: discountType === 'flat' ? parseFloat(discountAmount) : null,
          start_date: new Date(startDate).toISOString(),
          end_date: new Date(endDate).toISOString()
        }
        
        await createProductOffer(offerData)
      }
      
      alert(`Successfully created offers for ${selectedProducts.length} product(s)!`)
      
      // Reset form
      setOfferName('')
      setOfferDescription('')
      setDiscountAmount('')
      setOriginalPrice('')
      setNewPrice('')
      setSelectedProducts([])
      setPreviewProduct(null)
      setStartDate('')
      setEndDate('')
      
    } catch (error) {
      console.error('Error creating offers:', error)
      alert('Failed to create offers: ' + (error.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <SellerLayout>
      <div className="max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manage Offers</h1>
          <div className="text-sm text-gray-500">
            Create and manage product discounts
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-8">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'create'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Create Offers
          </button>
          <button
            onClick={() => setActiveTab('ongoing')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'ongoing'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Ongoing Offers
          </button>
        </div>

        {/* Create Offers Tab */}
        {activeTab === 'create' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column - Form */}
            <div className="lg:col-span-5 space-y-6">
              {/* Offer Details */}
              <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Offer Details</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Offer Name *
                    </label>
                    <input
                      type="text"
                      value={offerName}
                      onChange={(e) => setOfferName(e.target.value)}
                      placeholder="e.g., Winter Sale, Flash Discount"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      value={offerDescription}
                      onChange={(e) => setOfferDescription(e.target.value)}
                      placeholder="Brief description of the offer"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date *
                      </label>
                      <input
                        type="datetime-local"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Date *
                      </label>
                      <input
                        type="datetime-local"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Discount Settings */}
              <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Discount Settings</h3>
                
                {/* Discount Type Toggle */}
                <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
                  <button
                    onClick={() => handleDiscountTypeChange('flat')}
                    className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                      discountType === 'flat'
                        ? 'bg-white text-black shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Flat Discount (৳)
                  </button>
                  <button
                    onClick={() => handleDiscountTypeChange('percentage')}
                    className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                      discountType === 'percentage'
                        ? 'bg-white text-black shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Percentage (%)
                  </button>
                </div>

                {/* Price Inputs */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Original Price (৳)
                    </label>
                    <input
                      type="number"
                      value={originalPrice}
                      onChange={handleOriginalPriceChange}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discount {discountType === 'flat' ? 'Amount (৳)' : 'Percentage (%)'}
                    </label>
                    <input
                      type="number"
                      value={discountAmount}
                      onChange={handleDiscountChange}
                      placeholder={discountType === 'flat' ? '0.00' : '0'}
                      min="0"
                      max={discountType === 'percentage' ? '100' : undefined}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Price (৳)
                    </label>
                    <input
                      type="number"
                      value={newPrice}
                      onChange={handleNewPriceChange}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    />
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleCreateOffer}
                disabled={loading}
                className="w-full bg-black text-white py-3 px-4 rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creating Offers...' : 'Create Offer'}
              </button>
            </div>

            {/* Right Column - Preview and Products */}
            <div className="lg:col-span-7 space-y-6">
              {/* Preview Section */}
              {previewProduct && (
                <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Preview</h3>
                  <div className="flex items-start space-x-4">
                    <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      {getProductImage(previewProduct) ? (
                        <img
                          src={getProductImage(previewProduct)}
                          alt={previewProduct.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          No Image
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{previewProduct.name}</h4>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-500 line-through">৳{originalPrice}</span>
                          <span className="text-black font-medium">৳{newPrice}</span>
                          {discountAmount > 0 && (
                            <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                              -{discountType === 'flat' ? '৳' : ''}{discountAmount}{discountType === 'percentage' ? '%' : ''} OFF
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Products Grid */}
              <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">
                  Select Products ({selectedProducts.length} selected)
                </h3>
                
                {loading ? (
                  <div className="text-center py-8">
                    <div className="text-gray-500">Loading products...</div>
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No products available. Create some products first.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map(product => (
                      <div
                        key={product.id}
                        onClick={() => toggleProductSelection(product.id)}
                        className={`cursor-pointer p-3 rounded-lg border-2 transition-colors ${
                          selectedProducts.includes(product.id)
                            ? 'border-black bg-gray-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden mb-3">
                          {getProductImage(product) ? (
                            <img
                              src={getProductImage(product)}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              No Image
                            </div>
                          )}
                        </div>
                        <h4 className="font-medium text-sm text-gray-900 mb-1 line-clamp-2">
                          {product.name}
                        </h4>
                        <p className="text-sm text-gray-600">৳{product.price}</p>
                        <p className="text-xs text-gray-500">Stock: {product.stock_quantity}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Ongoing Offers Tab */}
        {activeTab === 'ongoing' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Active Offers</h3>
              
              {loadingOffers ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">Loading active offers...</div>
                </div>
              ) : ongoingOffers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No active offers found.
                </div>
              ) : (
                <div className="space-y-4">
                  {ongoingOffers.map(offer => (
                    <div key={offer.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">{offer.name}</h4>
                          {offer.description && (
                            <p className="text-sm text-gray-600 mb-2">{offer.description}</p>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>
                              Discount: {offer.offer_type === 'percentage' ? `${offer.discount_percentage}%` : `৳${offer.discount_amount}`}
                            </span>
                            <span>
                              Until: {new Date(offer.end_date).toLocaleDateString()}
                            </span>
                            <span className="text-black font-medium">
                              Status: Active
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => stopOffer(offer.id)}
                          disabled={loadingOffers}
                          className="ml-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 transition-colors"
                        >
                          Stop Offer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </SellerLayout>
  )
}

export default SellerOffersPage 