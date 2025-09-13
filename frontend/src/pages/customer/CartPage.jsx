"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useCartStore } from "../../store/useCartStore"
import {
  CartItemList,
  PaymentMethod,
  CostBreakdown,
  CouponApply,
  CheckoutButton,
  ShippingAddressModal
} from "../../features/cart/components"
import Alert from "../../components/Alert"
import { createOrder, fetchUserShippingInfo } from "../../services/api"

function CartPage() {
  const navigate = useNavigate()
  const { items, updateQuantity, removeItem, clearCart, refreshCart } = useCartStore()
  const [couponCode, setCouponCode] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [discount, setDiscount] = useState(0)
  const [selectedItems, setSelectedItems] = useState({})
  const [alertMessage, setAlertMessage] = useState("")
  const [isAlertOpen, setIsAlertOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isShippingModalOpen, setIsShippingModalOpen] = useState(false)
  const [shippingInfo, setShippingInfo] = useState({
    address: '',
    phone: ''
  })

  // Fetch user's shipping info when component mounts
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetchUserShippingInfo();
        setShippingInfo({
          address: response.address_line_1 || '',
          phone: response.phone || ''
        });
      } catch (error) {
        console.error('Failed to fetch user info:', error);
        setAlertMessage('Failed to fetch shipping information. You can still add it during checkout.');
        setIsAlertOpen(true);
      }
    };

    fetchUserInfo();
    // Removed refreshCart() as it's already called in App.jsx when user is authenticated
  }, [])

  // Calculate totals
  const subtotal = items.reduce((total, item) => {
    return selectedItems[`${item.id}-${item.selectedSize}-${item.selectedColor}`] 
      ? total + item.price * item.quantity 
      : total
  }, 0)

  const deliveryFee = subtotal > 0 ? 80 : 0
  const grandTotal = subtotal + deliveryFee - discount

  const handleApplyCoupon = () => {
    if (couponCode.toLowerCase() === "discount20") {
      const newDiscount = Math.round(subtotal * 0.2)
      setDiscount(newDiscount)
      setAlertMessage("Coupon applied successfully!")
      setIsAlertOpen(true)
    } else {
      setAlertMessage("Invalid coupon code")
      setIsAlertOpen(true)
    }
  }

  const handleConfirmOrder = async () => {
    const selectedCount = Object.values(selectedItems).filter(Boolean).length
    if (selectedCount === 0) {
      setAlertMessage("Please select at least one item to proceed")
      setIsAlertOpen(true)
      return
    }

    // Open shipping modal
    setIsShippingModalOpen(true)
  }

  const handleShippingConfirm = async (shippingData) => {
    if (loading) return

    try {
      setLoading(true)
      
      // Update shipping info state
      setShippingInfo(shippingData)
      
      // Prepare order data
      const orderData = {
        payment_method: paymentMethod === "cash" ? "cod" : "card",
        customer_phone: shippingData.phone,
        customer_address: shippingData.address
      }

      // Create order via API
      const response = await createOrder(orderData)
      
      setAlertMessage("Order confirmed! Thank you for your purchase.")
      setIsAlertOpen(true)
      setIsShippingModalOpen(false)
      
      // Clear the entire cart after successful order creation
      setTimeout(async () => {
        try {
          await clearCart() // Clear the entire cart
          setSelectedItems({})
          
          // Handle response - it's an array of orders
          const orders = Array.isArray(response) ? response : [response]
          const firstOrder = orders[0]
          
          navigate("/order-confirmation", {
            state: {
              orders: orders,
              order: firstOrder,
              orderNumber: firstOrder?.id,
              totalOrders: orders.length
            }
          })
        } catch (clearError) {
          console.error('Failed to clear cart after order:', clearError)
          // Still navigate even if cart clearing fails
          const orders = Array.isArray(response) ? response : [response]
          const firstOrder = orders[0]
          
          navigate("/order-confirmation", {
            state: {
              orders: orders,
              order: firstOrder,
              orderNumber: firstOrder?.id,
              totalOrders: orders.length
            }
          })
        }
      }, 2000)
      
    } catch (error) {
      console.error('Order creation failed:', error)
      setAlertMessage(error.message || 'Failed to create order. Please try again.')
      setIsAlertOpen(true)
    } finally {
      setLoading(false)
    }
  }

  const toggleItemSelection = (itemId, selectedSize, selectedColor) => {
    const key = `${itemId}-${selectedSize}-${selectedColor}`
    setSelectedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  // Get button text based on payment method
  const getButtonText = () => {
    return paymentMethod === "cash" ? "CONFIRM" : "PAY AND CONFIRM"
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <Alert 
        message={alertMessage}
        isOpen={isAlertOpen}
        onClose={() => setIsAlertOpen(false)}
      />
      
      <button onClick={() => navigate("/")} className="mb-6 flex items-center text-sm hover:underline">
        ← Continue Shopping
      </button>

      <h1 className="text-2xl font-bold mb-6">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items - Left Side */}
        <div className="lg:col-span-2 space-y-4">
          <CartItemList
            items={items}
            selectedItems={selectedItems}
            toggleItemSelection={toggleItemSelection}
            updateQuantity={updateQuantity}
            removeItem={removeItem}
          />
          
          {/* Payment Method */}
          {items.length > 0 && (
            <PaymentMethod
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
            />
          )}
        </div>

        {/* Cost Breakdown and Checkout - Right Side */}
        {items.length > 0 && (
          <div className="lg:col-span-1">
            <CostBreakdown
              items={items}
              selectedItems={selectedItems}
              subtotal={subtotal}
              deliveryFee={deliveryFee}
              discount={discount}
              grandTotal={grandTotal}
            />

            {/* Coupon and Confirm Button */}
            <div className="space-y-4">
              <CouponApply
                couponCode={couponCode}
                setCouponCode={setCouponCode}
                handleApplyCoupon={handleApplyCoupon}
              />

              <CheckoutButton 
                onClick={handleConfirmOrder} 
                buttonText={loading ? "Processing..." : getButtonText()}
                disabled={loading}
              />
            </div>
          </div>
        )}
      </div>

      {/* Shipping Address Modal */}
      <ShippingAddressModal
        isOpen={isShippingModalOpen}
        onClose={() => setIsShippingModalOpen(false)}
        onConfirm={handleShippingConfirm}
        initialAddress={shippingInfo.address}
        initialPhone={shippingInfo.phone}
        loading={loading}
      />
    </div>
  )
}

export default CartPage 