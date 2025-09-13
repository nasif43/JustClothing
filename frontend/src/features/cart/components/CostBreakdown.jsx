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
    <div className="bg-gray-200 rounded-lg p-4 lg:p-6 mb-6">
      <h2 className="text-lg lg:text-xl font-bold mb-4 lg:mb-6">COST BREAKDOWN</h2>

      <div className="space-y-3 lg:space-y-4 mb-4 lg:mb-6">
        {selectedItemsList.map((item) => (
          <div 
            key={`summary-${item.id}-${item.selectedSize}-${item.selectedColor}`} 
            className="flex justify-between items-start"
          >
            <div className="flex flex-col flex-1 pr-2">
              <span className="text-sm lg:text-base">{item.quantity}x {item.name}</span>
              <span className="text-xs text-gray-500">Size: {item.selectedSize}, Color: {item.selectedColor}</span>
            </div>
            <span className="font-medium text-sm lg:text-base whitespace-nowrap">{(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-300 pt-3 lg:pt-4 mb-3 lg:mb-4">
        <div className="flex justify-between mb-2">
          <span className="text-sm lg:text-base">DELIVERY</span>
          <span className="font-medium text-sm lg:text-base">{deliveryFee.toFixed(2)}</span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between mb-2">
            <span className="text-sm lg:text-base">DISCOUNT</span>
            <span className="font-medium text-gray-600 text-sm lg:text-base">-{discount.toFixed(2)}</span>
          </div>
        )}
      </div>

      <div className="border-t border-gray-300 pt-3 lg:pt-4">
        <div className="flex justify-between">
          <span className="font-bold text-sm lg:text-base">GRAND TOTAL</span>
          <span className="font-bold text-sm lg:text-base">{grandTotal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}

export default CostBreakdown 