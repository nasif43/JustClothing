import React, { useState, useEffect, useRef } from 'react'
import SellerLayout from '../../components/layout/SellerLayout'
import { Plus, X, Upload } from 'lucide-react'
import { fetchSellerProducts, updateSellerHomepageProducts, fetchSellerHomepageProducts, fetchUserStatus, updateSellerProfile } from '../../services/api'

const ProductModal = ({ isOpen, onClose, onSelect, existingProducts = [] }) => {
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {
    if (isOpen) {
      loadProducts()
    }
  }, [isOpen])
  
  const loadProducts = async () => {
    try {
      setLoading(true)
      const response = await fetchSellerProducts()
      
      let productsData = []
      if (Array.isArray(response)) {
        productsData = response
      } else if (response && Array.isArray(response.results)) {
        productsData = response.results
      } else if (response && response.data && Array.isArray(response.data)) {
        productsData = response.data
      }
      
      // Filter out products that are already selected
      const existingProductIds = existingProducts.filter(p => p).map(p => p.id)
      const availableProducts = productsData.filter(p => !existingProductIds.includes(p.id))
      
      setProducts(availableProducts)
    } catch (error) {
      console.error('Failed to load products:', error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }
  
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
        
        {loading ? (
          <div className="text-center py-8">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No available products to add.</p>
            <p className="text-sm">Create some products first or all your products are already featured.</p>
          </div>
        ) : (
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
                <div className="bg-gray-200 aspect-square mb-2 rounded overflow-hidden">
                  {product.image ? (
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                      No Image
                    </div>
                  )}
                </div>
                <div className="text-sm font-medium truncate">{product.name}</div>
                <div className="text-sm text-gray-600">
                  {product.has_active_offer ? (
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1">
                        <span className="line-through text-xs">৳{product.original_price}</span>
                        <span className="font-medium">৳{product.discounted_price}</span>
                      </div>
                      <div className="text-xs text-green-600">
                        Save ৳{product.savings_amount}
                      </div>
                    </div>
                  ) : (
                    `৳${product.price}`
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
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
                setSelectedProduct(null)
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

const ProductPlaceholder = ({ onAddClick, product, onRemove }) => {
  return (
    <div 
      className="bg-gray-200 rounded aspect-square flex flex-col items-center justify-center cursor-pointer hover:bg-gray-300 transition-all relative"
      onClick={product ? undefined : onAddClick}
    >
      {product ? (
        <>
          <div className="w-full h-full flex items-center justify-center overflow-hidden rounded">
            {product.image ? (
              <img 
                src={product.image} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-sm text-gray-700 font-medium text-center p-2">
                {product.name}
              </div>
            )}
          </div>
          <button 
            className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-opacity-70"
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
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
  const [sellerData, setSellerData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)
  
  useEffect(() => {
    loadData()
  }, [])
  
  const loadData = async () => {
    try {
      setLoading(true)
      // Load both seller data and homepage products
      await Promise.all([
        loadSellerData(),
        loadHomepageProducts()
      ])
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const loadSellerData = async () => {
    try {
      const userStatus = await fetchUserStatus()
      if (userStatus.seller_profile) {
        console.log('🏪 Seller profile loaded:', userStatus.seller_profile)
        console.log('🏪 Seller ID:', userStatus.seller_profile.id)
        console.log('🏪 Seller business name:', userStatus.seller_profile.business_name)
        setSellerData(userStatus.seller_profile)
      }
    } catch (error) {
      console.error('Failed to fetch seller data:', error)
    }
  }
  
  const loadHomepageProducts = async () => {
    try {
      const response = await fetchSellerHomepageProducts()
      const productsArray = Array(6).fill(null)
      
      // Map the response to the correct positions
      response.forEach(item => {
        if (item.order >= 0 && item.order < 6 && item.product_data) {
          productsArray[item.order] = item.product_data
        }
      })
      
      setHomepageProducts(productsArray)
    } catch (error) {
      console.error('Failed to load homepage products:', error)
      // Don't throw error here, just log it
    }
  }
  
  const handleAddProduct = (index) => {
    setCurrentSlotIndex(index)
    setIsModalOpen(true)
  }
  
  const handleSelectProduct = (product) => {
    console.log('🎯 DEBUG: Product selected:', product)
    console.log('🎯 DEBUG: Current slot index:', currentSlotIndex)
    console.log('🎯 DEBUG: Current homepage products before update:', homepageProducts)
    
    if (currentSlotIndex !== null) {
      const updatedProducts = [...homepageProducts]
      updatedProducts[currentSlotIndex] = product
      console.log('🎯 DEBUG: Updated products array:', updatedProducts)
      
      setHomepageProducts(updatedProducts)
      setCurrentSlotIndex(null)
      saveHomepageProducts(updatedProducts)
    }
  }
  
  const handleRemoveProduct = (index) => {
    const updatedProducts = [...homepageProducts]
    updatedProducts[index] = null
    setHomepageProducts(updatedProducts)
    saveHomepageProducts(updatedProducts)
  }
  
  const saveHomepageProducts = async (products) => {
    try {
      setSaving(true)
      console.log('💾 DEBUG: Starting to save homepage products')
      console.log('💾 DEBUG: Input products array:', products)
      
      const productsData = products
        .map((product, index) => {
          console.log(`💾 DEBUG: Processing product at index ${index}:`, product)
          console.log(`💾 DEBUG: Product ID: ${product?.id}`)
          return product ? { product_id: product.id, order: index } : null
        })
        .filter(Boolean)
      
      console.log('💾 DEBUG: Final products data to send:', productsData)
      console.log('💾 DEBUG: Request payload:', { products: productsData })
      
      await updateSellerHomepageProducts({ products: productsData })
      console.log('💾 DEBUG: Save request completed successfully')
    } catch (error) {
      console.error('Failed to save homepage products:', error)
      // Show user-friendly error
      alert('Failed to save changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleCoverPhotoUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    try {
      setUploading(true)
      
      // Update seller profile with new banner image
      const response = await updateSellerProfile({ banner_image: file })
      
      // Update local state
      setSellerData(prev => ({
        ...prev,
        banner_image: response.banner_image
      }))

      alert('Cover photo updated successfully!')
    } catch (error) {
      console.error('Failed to upload cover photo:', error)
      alert('Failed to upload cover photo. Please try again.')
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }
  
  if (loading) {
    return (
      <SellerLayout>
        <div className="text-center py-8">Loading...</div>
      </SellerLayout>
    )
  }
  
  return (
    <SellerLayout>
      {/* Store Profile Section */}
      <div className="bg-white/90 rounded-lg overflow-hidden mb-6">
        <div className="relative w-full h-48 bg-gray-200">
          {sellerData?.banner_image ? (
            <img 
              src={sellerData.banner_image} 
              alt="Store banner"
              className="w-full h-full object-cover"
            />
          ) : null}
          
          {/* Upload cover photo button - always visible */}
          <div className="absolute top-4 right-4">
            <button 
              onClick={handleUploadClick}
              disabled={uploading}
              className="flex items-center gap-2 bg-black/80 hover:bg-black text-white px-4 py-2 rounded-full text-sm transition-colors disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              {uploading ? 'Uploading...' : (sellerData?.banner_image ? 'Change Cover Photo' : 'Upload Cover Photo')}
            </button>
          </div>
          
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleCoverPhotoUpload}
            className="hidden"
          />
        </div>
      
        <div className="relative px-6 pb-6">
          <div className="absolute -top-16 left-8">
            <div className="w-32 h-32 bg-gray-200 rounded-full border-4 border-white flex items-center justify-center overflow-hidden">
              {sellerData?.logo ? (
                <img 
                  src={sellerData.logo} 
                  alt={sellerData.business_name || 'Store logo'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-gray-600 text-xl font-medium">
                  {sellerData?.business_name?.charAt(0) || sellerData?.name?.charAt(0) || 'S'}
                </div>
              )}
            </div>
          </div>
          
          <div className="pt-20 flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold text-gray-700 uppercase">
                  {sellerData?.business_name || sellerData?.name || 'Store Name'}
                </h1>
                {sellerData?.verified && (
                  <div className="text-green-600">✓</div>
                )}
              </div>
              <p className="text-gray-500 text-sm max-w-md uppercase">
                {sellerData?.business_description || sellerData?.bio || 'No description available'}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Homepage Customization Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Home</h2>
          {saving && (
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
              Saving...
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {homepageProducts.map((product, index) => (
            <ProductPlaceholder 
              key={index}
              product={product}
              onAddClick={() => handleAddProduct(index)}
              onRemove={() => handleRemoveProduct(index)}
            />
          ))}
        </div>
      </div>
      
      {/* Product Selection Modal */}
      <ProductModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setCurrentSlotIndex(null)
        }}
        onSelect={handleSelectProduct}
        existingProducts={homepageProducts}
      />
    </SellerLayout>
  )
}

export default SellerHomepage 