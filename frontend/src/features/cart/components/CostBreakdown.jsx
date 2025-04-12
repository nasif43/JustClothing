function CostBreakdown({ 
  items, 
  selectedItems, 
  subtotal, 
  deliveryFee, 
  discount, 
  grandTotal 
}) {
  const selectedItemsList = items.filter(
    item => selectedItems[`${item.id}-${item.selectedSize}-${item.selectedColor}`]
  )

  return (
    <div className="bg-gray-200 rounded-lg p-6 mb-6">
      <h2 className="text-xl font-bold mb-6">COST BREAKDOWN</h2>

      <div className="space-y-4 mb-6">
        {selectedItemsList.map((item) => (
          <div 
            key={`summary-${item.id}-${item.selectedSize}-${item.selectedColor}`} 
            className="flex justify-between"
          >
            <span>{item.quantity}x {item.name}</span>
            <span className="font-medium">{(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-300 pt-4 mb-4">
        <div className="flex justify-between mb-2">
          <span>DELIVERY</span>
          <span className="font-medium">{deliveryFee.toFixed(2)}</span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between mb-2">
            <span>DISCOUNT</span>
            <span className="font-medium text-green-600">-{discount.toFixed(2)}</span>
          </div>
        )}
      </div>

      <div className="border-t border-gray-300 pt-4">
        <div className="flex justify-between">
          <span className="font-bold">GRAND TOTAL</span>
          <span className="font-bold">{grandTotal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}

export default CostBreakdown 