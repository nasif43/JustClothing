function CheckoutCostBreakdown({ productPrice, deliveryFee, discount, grandTotal }) {
  return (
    <div className="bg-gray-200 p-4 rounded-lg">
      <h2 className="font-bold text-lg mb-4">COST BREAKDOWN</h2>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>PRODUCT PRICE</span>
          <span className="font-medium">{productPrice.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between">
          <span>DELIVERY</span>
          <span className="font-medium">{deliveryFee.toFixed(2)}</span>
        </div>
        
        {discount > 0 && (
          <div className="flex justify-between">
            <span>DISCOUNT</span>
            <span className="font-medium text-gray-600">-{discount.toFixed(2)}</span>
          </div>
        )}
        
        <div className="border-t border-gray-300 pt-2 mt-2">
          <div className="flex justify-between font-bold">
            <span>GRAND TOTAL</span>
            <span>{grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutCostBreakdown;
