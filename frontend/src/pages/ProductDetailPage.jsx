"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useProductStore, useCartStore } from "../store"
import { Star, ChevronUp, ChevronDown, User, ShoppingCart, CreditCard, CheckCircle, Check } from "lucide-react"
import QuickCheckoutPage from "./QuickCheckoutPage"

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
  if (error) return <div className="text-center py-20 text-red-500">Error: {error}</div>
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
      alert("Please select a size")
      return
    }
    if (!selectedColor) {
      alert("Please select a color")
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
      alert("Please select a size")
      return
    }
    if (!selectedColor) {
      alert("Please select a color")
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
              {availableColors.map((color) => (
                <button
                  key={color.name}
                  className={`w-10 h-10 border rounded-full ${
                    selectedColor === color.name ? "border-black ring-2 ring-black ring-offset-2" : "border-gray-300 hover:border-gray-500"
                  }`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => setSelectedColor(color.name)}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <button
              onClick={handleAddToCart}
              disabled={addedToCart}
              className={`w-full py-3 border border-black rounded-full font-medium flex items-center justify-center gap-2 
                ${addedToCart 
                  ? 'bg-green-50 text-green-700 border-green-700' 
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
              <span className="font-medium">{store.name}</span>
              {store.verified && <CheckCircle className="h-4 w-4 text-green-500" />}
            </div>

            <p className="text-sm text-gray-600 mb-4">{store.bio}</p>

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
                        i < Math.floor(store.rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
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
