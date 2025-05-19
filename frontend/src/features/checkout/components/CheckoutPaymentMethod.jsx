function CheckoutPaymentMethod({ paymentMethod, setPaymentMethod }) {
  return (
    <div className="mb-4">
      <h3 className="font-medium mb-2">Payment Method</h3>
      <div className="space-y-2">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="radio"
            name="payment"
            value="cash"
            checked={paymentMethod === "cash"}
            onChange={() => setPaymentMethod("cash")}
            className="w-4 h-4 accent-black cursor-pointer"
          />
          <span>Cash on Delivery</span>
        </label>
        
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="radio"
            name="payment"
            value="mobile"
            checked={paymentMethod === "mobile"}
            onChange={() => setPaymentMethod("mobile")}
            className="w-4 h-4 accent-black cursor-pointer"
          />
          <span>Mobile Payment (Card/Bkash/Nagad)</span>
        </label>
      </div>
    </div>
  );
}

export default CheckoutPaymentMethod; 