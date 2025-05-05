"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useProductStore, useCartStore } from "../store"
import { Star, ChevronUp, ChevronDown, User, ShoppingCart, CreditCard, CheckCircle, Check } from "lucide-react"
import QuickCheckoutPage from "./QuickCheckoutPage"
import Alert from "../components/Alert"

function ProductDetailPage() {
  const { id } = useParams()
  const { products, getStoreById, fetchProducts, loading, error } = useProductStore()
  const { addItem } = useCartStore()
  const product = products.find((p) => p.id === Number(id))
  const navigate = useNavigate()

  const [selectedSize, setSelectedSize] = useState("")
  const [selectedColor, setSelectedColor] = useState("")
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [addedToCart, setAddedToCart] = useState(false)
  const [lastAddedSize, setLastAddedSize] = useState("")
  const [lastAddedColor, setLastAddedColor] = useState("")
  const [alertMessage, setAlertMessage] = useState("")
  const [isAlertOpen, setIsAlertOpen] = useState(false)

  // Fetch products if not already loaded
  useEffect(() => {
    if (products.length === 0) {
      fetchProducts()
    }
  }, [products.length, fetchProducts])

  // Reset the added to cart state if size or color changes
  useEffect(() => {
    if (addedToCart && (selectedSize !== lastAddedSize || selectedColor !== lastAddedColor)) {
      setAddedToCart(false)
    }
  }, [selectedSize, selectedColor, addedToCart, lastAddedSize, lastAddedColor])

  if (loading) return <div className="text-center py-20">Loading product...</div>
  if (error) return <div className="text-center py-20 text-gray-700">Error: {error}</div>
  if (!product) return <div className="text-center py-20">Product not found</div>

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

  const handleAddToCart = () => {
    if (!selectedSize) {
      setAlertMessage("Please select a size")
      setIsAlertOpen(true)
      return
    }
    if (!selectedColor) {
      setAlertMessage("Please select a color")
      setIsAlertOpen(true)
      return
    }
    // Add the product with size and color to cart using the cart store
    addItem({ ...product, selectedSize, selectedColor }, 1)
    
    // Set added to cart state and remember the selected options
    setAddedToCart(true)
    setLastAddedSize(selectedSize)
    setLastAddedColor(selectedColor)
  }

  const handleQuickCheckout = () => {
    if (!selectedSize) {
      setAlertMessage("Please select a size")
      setIsAlertOpen(true)
      return
    }
    if (!selectedColor) {
      setAlertMessage("Please select a color")
      setIsAlertOpen(true)
      return
    }
    
    // Navigate to quick checkout with product details
    navigate(`/quick-checkout`, {
      state: {
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          color: selectedColor,
          size: selectedSize,
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
          <p className="text-sm text-gray-500 mb-4">TAGS: {product.tags}</p>

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
              disabled={addedToCart}
              className={`w-full py-3 border border-black rounded-full font-medium flex items-center justify-center gap-2 
                ${addedToCart 
                  ? 'bg-gray-200 text-black border-black' 
                  : 'bg-white hover:bg-gray-100'}`}
            >
              {addedToCart ? (
                <>
                  <Check className="h-5 w-5" />
                  ADDED TO CART
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
