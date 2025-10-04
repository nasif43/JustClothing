function PaymentMethod({ paymentMethod, setPaymentMethod }) {
  return (
    <div className="mt-8">
      <h2 className="text-xl font-medium mb-4">Payment Method</h2>
      <div className="space-y-3">
        <label className="flex items-center space-x-2">
          <input
            type="radio"
            name="payment"
            value="cash"
            checked={paymentMethod === "cash"}
            onChange={() => setPaymentMethod("cash")}
            className="w-4 h-4 accent-black hover-effect hover:cursor-pointer"
          />
          <span>Cash on Delivery</span>
        </label>

        <label className="flex items-center space-x-2 cursor-not-allowed opacity-50">
          <input
            type="radio"
            name="payment"
            value="mobile"
            checked={paymentMethod === "mobile"}
            onChange={() => setPaymentMethod("mobile")}
            className="w-4 h-4 accent-gray-400 cursor-not-allowed"
            disabled
          />
          <div className="flex flex-col">
            <span className="text-gray-500">Mobile Payment (Card/Bkash/Nagad)</span>
            <span className="text-xs text-gray-400">Coming Soon</span>
          </div>
        </label>
      </div>
    </div>
  )
}

export default PaymentMethod 