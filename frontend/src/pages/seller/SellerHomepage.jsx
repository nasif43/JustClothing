import React, { useState } from 'react'
import SellerLayout from '../../components/layout/SellerLayout'
import { Plus, X } from 'lucide-react'

const ProductModal = ({ isOpen, onClose, onSelect }) => {
  const [selectedProduct, setSelectedProduct] = useState(null)
  
  // Sample products - in a real app, these would come from an API or state
  const products = Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    name: `Product ${i + 1}`,
    price: Math.floor(Math.random() * 100) + 20,
    image: null // Would be image URL in real app
  }))
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-3xl p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Select a Product</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
          {products.map(product => (
            <div 
              key={product.id}
              onClick={() => setSelectedProduct(product)}
              className={`
                border rounded-lg p-2 cursor-pointer transition-all
                ${selectedProduct?.id === product.id ? 'border-black ring-2 ring-black' : 'border-gray-200 hover:border-gray-400'}
              `}
            >
              <div className="bg-gray-200 aspect-square mb-2"></div>
              <div className="text-sm font-medium">{product.name}</div>
              <div className="text-sm text-gray-600">${product.price}</div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded mr-2"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (selectedProduct) {
                onSelect(selectedProduct)
                onClose()
              }
            }}
            disabled={!selectedProduct}
            className={`px-4 py-2 rounded ${
              selectedProduct 
                ? 'bg-black text-white' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Add Product
          </button>
        </div>
      </div>
    </div>
  )
}

const ProductPlaceholder = ({ onAddClick, product }) => {
  return (
    <div className="bg-gray-200 rounded aspect-square flex flex-col items-center justify-center cursor-pointer hover:bg-gray-300 transition-all relative">
      {product ? (
        <>
          <div className="w-full h-full flex items-center justify-center">
            {/* In a real app, this would be an actual product image */}
            <div className="text-sm text-gray-700 font-medium">{product.name}</div>
          </div>
          <button 
            className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full w-6 h-6 flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation();
              onAddClick(null);
            }}
          >
            <X size={14} />
          </button>
        </>
      ) : (
        <>
          <Plus className="w-12 h-12 text-gray-500 mb-2" />
          <p className="text-gray-600 text-sm">Add item to home</p>
        </>
      )}
    </div>
  )
}

const SellerHomepage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentSlotIndex, setCurrentSlotIndex] = useState(null)
  const [homepageProducts, setHomepageProducts] = useState(Array(6).fill(null))
  
  const handleAddProduct = (index) => {
    setCurrentSlotIndex(index)
    setIsModalOpen(true)
  }
  
  const handleSelectProduct = (product) => {
    if (currentSlotIndex !== null) {
      const updatedProducts = [...homepageProducts]
      updatedProducts[currentSlotIndex] = product
      setHomepageProducts(updatedProducts)
      setCurrentSlotIndex(null)
    }
  }
  
  return (
    <SellerLayout>
      <div className="bg-white/90 rounded-lg overflow-hidden mb-6">
        {/* Store Profile Section - Similar to the one in the screenshot */}
        <div className="relative w-full h-48 bg-gray-200">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <button className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full text-sm">
              <Plus className="h-4 w-4" />
              Upload New Cover Photo
            </button>
          </div>
        </div>
      
        <div className="relative px-6 pb-6">
          <div className="absolute -top-16 left-8">
            <div className="w-32 h-32 bg-yellow-200 rounded-full border-4 border-white flex items-center justify-center">
              <div className="text-gray-600 text-xl font-medium">
                ad<span className="border border-gray-500 px-1">Lead</span>
              </div>
            </div>
          </div>
          
          <div className="pt-20 flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold text-gray-700">ADLEAD STORE</h1>
              </div>
              <p className="text-gray-500 text-sm max-w-md uppercase">
                SIMPLE, MINIMALISTIC, AND FASHIONABLE STREETWEAR ITEMS- CREATED USING THE BEST FABRIC IN THE MARKET.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Homepage Customization Section */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-center mb-8">Home</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {homepageProducts.map((product, index) => (
            <ProductPlaceholder 
              key={index}
              product={product}
              onAddClick={() => handleAddProduct(index)}
            />
          ))}
        </div>
      </div>
      
      {/* Product Selection Modal */}
      <ProductModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSelectProduct}
      />
    </SellerLayout>
  )
}

export default SellerHomepage 