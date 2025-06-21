function CheckoutCostBreakdown({ productPrice, deliveryFee, discount, grandTotal }) {
  // Ensure all values are numbers
  const safeProductPrice = Number(productPrice) || 0;
  const safeDeliveryFee = Number(deliveryFee) || 0;
  const safeDiscount = Number(discount) || 0;
  const safeGrandTotal = Number(grandTotal) || 0;

  return (
    <div className="bg-gray-200 p-4 rounded-lg">
      <h2 className="font-bold text-lg mb-4">COST BREAKDOWN</h2>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>PRODUCT PRICE</span>
          <span className="font-medium">{safeProductPrice.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between">
          <span>DELIVERY</span>
          <span className="font-medium">{safeDeliveryFee.toFixed(2)}</span>
        </div>
        
        {safeDiscount > 0 && (
          <div className="flex justify-between">
            <span>DISCOUNT</span>
            <span className="font-medium text-gray-600">-{safeDiscount.toFixed(2)}</span>
          </div>
        )}
        
        <div className="border-t border-gray-300 pt-2 mt-2">
          <div className="flex justify-between font-bold">
            <span>GRAND TOTAL</span>
            <span>{safeGrandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutCostBreakdown;
