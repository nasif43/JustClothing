import { useNavigate } from "react-router-dom"
import CartItem from "./CartItem"

function CartItemList({ 
  items, 
  selectedItems, 
  toggleItemSelection, 
  updateQuantity, 
  removeItem 
}) {
  const navigate = useNavigate()

  if (items.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg text-center">
        <p className="text-gray-500 mb-4">Your cart is empty</p>
        <button 
          onClick={() => navigate("/")} 
          className="px-4 py-2 bg-black text-white rounded-full hover-effect hover:cursor-pointer"
        >
          Browse Products
        </button>
      </div>
    )
  }

  // Count selected items
  const selectedCount = items.filter(item => 
    selectedItems[`${item.id}-${item.selectedSize}-${item.selectedColor}`]
  ).length;

  // Check if all items are selected
  const isAllSelected = items.length > 0 && selectedCount === items.length;

  // Handle select all toggle
  const handleSelectAll = () => {
    const newSelectedState = !isAllSelected;
    
    items.forEach(item => {
      const key = `${item.id}-${item.selectedSize}-${item.selectedColor}`;
      if (selectedItems[key] !== newSelectedState) {
        toggleItemSelection(item.id, item.selectedSize, item.selectedColor);
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Select All Checkbox */}
      {items.length > 0 && (
        <div className="flex items-center p-4 bg-white rounded-lg">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={handleSelectAll}
              className="w-5 h-5 accent-black cursor-pointer"
            />
            <span className="ml-2 font-medium">Select All Items</span>
          </label>
          
          <div className="ml-auto text-sm">
            <span className="font-medium">{selectedCount}</span> of {items.length} selected
          </div>
        </div>
      )}
      
      {items.map((item) => (
        <CartItem
          key={`${item.id}-${item.selectedSize}-${item.selectedColor}`}
          item={item}
          isSelected={selectedItems[`${item.id}-${item.selectedSize}-${item.selectedColor}`]}
          toggleSelection={toggleItemSelection}
          updateQuantity={updateQuantity}
          removeItem={removeItem}
        />
      ))}
    </div>
  )
}

export default CartItemList 