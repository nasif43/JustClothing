"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useProductStore, useCartStore } from "../../store"
import { Star, ChevronUp, ChevronDown, User, ShoppingCart, CreditCard, CheckCircle, Check } from "lucide-react"
import QuickCheckoutPage from "./QuickCheckoutPage"
import Alert from "../../components/Alert"

function ProductDetailPage() {
  const { id } = useParams()
  const { products, selectedProduct, getStoreById, fetchProducts, loading, error } = useProductStore()
  const { addItem } = useCartStore()
  // Use selectedProduct from store for detailed data, fallback to products list
  const product = selectedProduct || products.find((p) => p.id === Number(id))
  const navigate = useNavigate()

  const [selectedSize, setSelectedSize] = useState(null)
  const [selectedColor, setSelectedColor] = useState(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [addedToCart, setAddedToCart] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false) // Prevent multiple clicks
  const [lastAddedSize, setLastAddedSize] = useState(null)
  const [lastAddedColor, setLastAddedColor] = useState(null)
  const [customMeasurements, setCustomMeasurements] = useState({})
  const [alertMessage, setAlertMessage] = useState("")
  const [isAlertOpen, setIsAlertOpen] = useState(false)

  // Fetch products if not already loaded
  useEffect(() => {
    if (products.length === 0) {
      fetchProducts()
    }
  }, [products.length, fetchProducts])

  // Fetch detailed product data using the product store
  useEffect(() => {
    if (id) {
      // Always fetch detailed product data for the product detail page
      // This ensures we get custom sizing fields and other detailed info
      const { fetchProductById } = useProductStore.getState()
      fetchProductById(id)
    }
  }, [id])

  // Also try to fetch the specific product if not found in the list
  useEffect(() => {
    if (!product && !loading && products.length > 0) {
      console.log('Product not found in list, refetching products...')
      fetchProducts()
    }
  }, [product, loading, products.length, fetchProducts])

  // Reset the added to cart state if size or color changes
  useEffect(() => {
    if (addedToCart && (selectedSize !== lastAddedSize || selectedColor !== lastAddedColor)) {
      setAddedToCart(false)
    }
  }, [selectedSize, selectedColor, addedToCart, lastAddedSize, lastAddedColor])

  if (loading) return <div className="text-center py-20">Loading product...</div>
  if (error) return <div className="text-center py-20 text-gray-700">Error: {error}</div>
  if (!product) return <div className="text-center py-20">Product not found</div>

  // Debug: Log product data
  console.log('Product data:', product)
  console.log('Stock quantity:', product.stock_quantity)
  console.log('Is in stock:', product.is_in_stock)
  console.log('Track inventory:', product.track_inventory)
  console.log('Offers custom sizes:', product.offers_custom_sizes)
  console.log('Custom size fields:', product.custom_size_fields)

  // Check if product is out of stock
  const isOutOfStock = !product.is_in_stock || product.stock_quantity === 0
  console.log('Is out of stock:', isOutOfStock)

  // Debug function to force refresh
  const forceRefresh = () => {
    console.log('Force refreshing product data...')
    fetchProducts()
  }

  // Get store information
  const store = getStoreById(product.storeId) || { 
    name: "Unknown Store", 
    bio: "Store information unavailable",
    rating: 0,
    verified: false
  }

  // Generate 4 thumbnail images (in a real app, you'd have multiple product images)
  const thumbnails = Array(4).fill(product.image)

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? thumbnails.length - 1 : prev - 1))
  }

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === thumbnails.length - 1 ? 0 : prev + 1))
  }

  const handleCustomMeasurementChange = (fieldName, value) => {
    setCustomMeasurements(prev => ({
      ...prev,
      [fieldName]: value
    }))
  }

  const validateCustomMeasurements = () => {
    if (product.offers_custom_sizes && product.custom_size_fields?.length > 0) {
      for (const field of product.custom_size_fields) {
        if (!customMeasurements[field] || customMeasurements[field].trim() === '') {
          setAlertMessage(`Please provide your ${field}`)
          setIsAlertOpen(true)
          return false
        }
      }
    }
    return true
  }

  const handleAddToCart = () => {
    console.log('🔘 handleAddToCart called')
    
    // Prevent multiple rapid clicks
    if (isAddingToCart) {
      console.warn('🔘 Already adding to cart, ignoring click')
      return
    }
    
    if (!selectedColor) {
      setAlertMessage("Please select a color")
      setIsAlertOpen(true)
      return
    }

    // For custom sizing, skip standard size validation
    if (!product.offers_custom_sizes && !selectedSize) {
      setAlertMessage("Please select a size")
      setIsAlertOpen(true)
      return
    }

    // Validate custom measurements if required
    if (!validateCustomMeasurements()) {
      return
    }

    setIsAddingToCart(true) // Set loading state
    console.log('🔘 Starting add to cart process...')

    // Add the product with size, color, and custom measurements to cart
    const productData = { 
      ...product, 
      price: product.has_active_offer ? product.discounted_price : product.price,
      selectedSize: product.offers_custom_sizes ? 'Custom' : selectedSize, 
      selectedColor,
      customMeasurements: product.offers_custom_sizes ? customMeasurements : undefined
    }
    
    console.log('🔘 Calling addItem with:', productData)
    addItem(productData, 1)
      .then(() => {
        console.log('🔘 addItem successful')
        // Set added to cart state and remember the selected options
        setAddedToCart(true)
        setLastAddedSize(selectedSize)
        setLastAddedColor(selectedColor)
      })
      .catch((error) => {
        console.error('🔘 addItem failed:', error)
        setAlertMessage(error.message || 'Failed to add item to cart')
        setIsAlertOpen(true)
      })
      .finally(() => {
        console.log('🔘 addItem process completed')
        setIsAddingToCart(false) // Reset loading state
      })
  }

  const handleQuickCheckout = () => {
    if (!selectedColor) {
      setAlertMessage("Please select a color")
      setIsAlertOpen(true)
      return
    }

    // For custom sizing, skip standard size validation
    if (!product.offers_custom_sizes && !selectedSize) {
      setAlertMessage("Please select a size")
      setIsAlertOpen(true)
      return
    }

    // Validate custom measurements if required
    if (!validateCustomMeasurements()) {
      return
    }
    
    // Navigate to quick checkout with product details
    navigate(`/quick-checkout`, {
      state: {
        product: {
          id: product.id,
          name: product.name,
          price: product.has_active_offer ? product.discounted_price : product.price,
          quantity: 1,
          color: selectedColor,
          size: product.offers_custom_sizes ? 'Custom' : selectedSize,
          customMeasurements: product.offers_custom_sizes ? customMeasurements : undefined,
          imageUrl: product.image
        }
      }
    });
  }

  // Available colors for the product (in a real app, this would come from the product data)
  const availableColors = [
    { name: "Black", value: "#000000" },
    { name: "White", value: "#FFFFFF" },
    { name: "Red", value: "#FF0000" },
    { name: "Blue", value: "#0000FF" },
    { name: "Green", value: "#00FF00" }
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Alert 
        message={alertMessage} 
        isOpen={isAlertOpen} 
        onClose={() => setIsAlertOpen(false)} 
      />
      
      <div className="grid grid-cols-12 gap-8">
        {/* Thumbnails and navigation - 2 columns */}
        <div className="col-span-1 flex flex-col items-center">
          <button onClick={handlePrevImage} className="p-2 mb-2" aria-label="Previous image">
            <ChevronUp className="h-6 w-6" />
          </button>

          <div className="space-y-3">
            {thumbnails.map((thumb, index) => (
              <div
                key={index}
                className={`w-full aspect-square border-2 rounded-lg overflow-hidden cursor-pointer ${
                  index === currentImageIndex ? "border-black" : "border-gray-200"
                }`}
                onClick={() => setCurrentImageIndex(index)}
              >
                <img
                  src={thumb}
                  alt={`${product.name} thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>

          <button onClick={handleNextImage} className="p-2 mt-2" aria-label="Next image">
            <ChevronDown className="h-6 w-6" />
          </button>
        </div>

        {/* Main product image - 6 columns (3x the thumbnails) */}
        <div className="col-span-6 bg-white rounded-lg p-4 shadow-sm">
          <img
            src={thumbnails[currentImageIndex]}
            alt={product.name}
            className="w-full h-auto object-contain aspect-square"
          />
        </div>

        {/* Product details - 4 columns */}
        <div className="col-span-4">
          <h1 className="text-3xl font-bold mb-1">{product.name}</h1>
          <p className="text-sm text-gray-500 mb-2">TAGS: {product.tags}</p>
          
          {/* Price Display */}
          <div className="mb-4">
            {product.has_active_offer ? (
              <div className="space-y-1">
                <div className="flex items-center space-x-3">
                  <span className="text-gray-500 line-through text-lg">৳{product.original_price}</span>
                  <span className="text-3xl font-bold text-black">৳{product.discounted_price}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="bg-black text-white px-2 py-1 rounded text-sm font-medium">
                    SALE
                  </span>
                  <span className="text-sm text-gray-600">
                    Save ৳{product.savings_amount}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-3xl font-bold text-black">৳{product.price}</div>
            )}
          </div>

          {/* Out of Stock Banner */}
          {isOutOfStock && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <div className="flex items-center">
                <span className="font-bold">⚠️ OUT OF STOCK</span>
                <span className="ml-2">This item is currently unavailable</span>
              </div>
            </div>
          )}


          {/* Size Selection - only show if not custom sizing */}
          {!product.offers_custom_sizes && (
            <div className="mb-6">
              <h2 className="text-lg font-medium mb-2">SIZE</h2>
              <div className="flex flex-wrap gap-2">
                {product.availableSizes.map((size) => (
                  <button
                    key={size}
                    className={`w-10 h-10 border ${
                      selectedSize === size ? "border-black bg-black text-white" : "border-gray-300 hover:border-gray-500"
                    }`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Custom Measurements - only show if custom sizing is offered */}
          {product.offers_custom_sizes && product.custom_size_fields?.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-medium mb-2">CUSTOM MEASUREMENTS</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-4">
                  Please provide your measurements below. Our team will use these to create your custom-sized product.
                </p>
                <div className="space-y-3">
                  {product.custom_size_fields.map((field, index) => (
                    <div key={index}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={customMeasurements[field] || ''}
                        onChange={(e) => handleCustomMeasurementChange(field, e.target.value)}
                        placeholder={`Enter your ${field.toLowerCase()} (e.g., 32 inches, 81 cm)`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  💡 Tip: Include units in your measurements (inches, cm, etc.) for best results
                </p>
              </div>
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-lg font-medium mb-2">COLOR</h2>
            <div className="flex flex-wrap gap-2">
              {product.availableColors?.map((color) => (
                <button
                  key={color}
                  className={`px-3 py-2 border ${
                    selectedColor === color ? "border-black bg-black text-white" : "border-gray-300 hover:border-gray-500"
                  }`}
                  onClick={() => setSelectedColor(color)}
                >
                  {color}
                </button>
              )) || availableColors.map((color) => (
                <button
                  key={color.name}
                  className={`px-3 py-2 border ${
                    selectedColor === color.name ? "border-black bg-black text-white" : "border-gray-300 hover:border-gray-500"
                  }`}
                  onClick={() => setSelectedColor(color.name)}
                >
                  {color.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <button
              onClick={handleAddToCart}
              disabled={addedToCart || isOutOfStock || isAddingToCart}
              className={`w-full py-3 border border-black rounded-full font-medium flex items-center justify-center gap-2 
                ${addedToCart 
                  ? 'bg-gray-200 text-black border-black' 
                  : isOutOfStock
                  ? 'bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed'
                  : isAddingToCart
                  ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
                  : 'bg-white hover:bg-gray-100'}`}
            >
              {addedToCart ? (
                <>
                  <Check className="h-5 w-5" />
                  ADDED TO CART
                </>
              ) : isOutOfStock ? (
                <>
                  OUT OF STOCK
                </>
              ) : isAddingToCart ? (
                <>
                  ADDING...
                </>
              ) : (
                <>
                  <ShoppingCart className="h-5 w-5" />
                  ADD TO CART
                </>
              )}
            </button>

            <button
              onClick={handleQuickCheckout}
              className="w-full py-3 bg-white border border-black rounded-full font-medium flex items-center justify-center gap-2 hover:bg-gray-100"
            >
              <CreditCard className="h-5 w-5" />
              QUICK CHECKOUT
            </button>
          </div>

          {/* Store information */}
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-6 w-6" />
              <Link to={`/store/${store.id}`} className="font-medium hover:underline">
                {store.name}
              </Link>
              {store.verified && <CheckCircle className="h-4 w-4 text-black" />}
            </div>

            <Link to={`/store/${store.id}`} className="block hover:underline">
              <p className="text-sm text-gray-600 mb-4">{store.bio}</p>
            </Link>

            <div className="flex items-center gap-2">
              <span className="font-medium">RATING</span>
              <span className="font-medium">{store.rating}</span>
              <div className="flex">
                {Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(store.rating) ? "text-black fill-black" : "text-gray-300"
                      }`}
                    />
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-xl font-bold mb-4">PRODUCT DETAILS</h2>
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h3 className="font-medium mb-2">Why Choose Us for Your Wardrobe Needs</h3>
            <ul className="list-disc pl-5 space-y-1">
              {product.features.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-medium mb-2">Product Description:</h3>
            <p>{product.description}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetailPage
