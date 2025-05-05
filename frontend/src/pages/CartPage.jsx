"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useCartStore } from "../store/useCartStore"
import {
  CartItemList,
  PaymentMethod,
  CostBreakdown,
  CouponApply,
  CheckoutButton
} from "../features/cart/components"
import Alert from "../components/Alert"

function CartPage() {
  const navigate = useNavigate()
  const { items, updateQuantity, removeItem, clearCart } = useCartStore()
  const [couponCode, setCouponCode] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [discount, setDiscount] = useState(0)
  const [selectedItems, setSelectedItems] = useState({})
  const [alertMessage, setAlertMessage] = useState("")
  const [isAlertOpen, setIsAlertOpen] = useState(false)

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

  const handleConfirmOrder = () => {
    const selectedCount = Object.values(selectedItems).filter(Boolean).length
    if (selectedCount === 0) {
      setAlertMessage("Please select at least one item to proceed")
      setIsAlertOpen(true)
      return
    }
    setAlertMessage("Order confirmed! Thank you for your purchase.")
    setIsAlertOpen(true)
    
    // Clear selected items from cart and navigate after alert is shown
    setTimeout(() => {
      const itemsToRemove = items.filter(item => 
        selectedItems[`${item.id}-${item.selectedSize}-${item.selectedColor}`]
      )
      itemsToRemove.forEach(item => {
        removeItem(item.id, item.selectedSize, item.selectedColor)
      })
      setSelectedItems({})
      navigate("/order-confirmation")
    }, 2000)
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

      <div className="grid md:grid-cols-3 gap-8">
        {/* Cart Items - Left Side */}
        <div className="md:col-span-2 space-y-4">
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
          <div className="md:col-span-1">
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
                buttonText={getButtonText()}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CartPage 