import { Trash, Minus, Plus } from "lucide-react"

function CartItem({ 
  item, 
  isSelected, 
  toggleSelection, 
  updateQuantity, 
  removeItem 
}) {
  return (
    <div className="bg-gray-200 rounded-lg p-4 flex items-center">
      <div className="flex items-center mr-4">
        <input
          type="checkbox"
          checked={isSelected || false}
          onChange={() => toggleSelection(item.id, item.selectedSize, item.selectedColor)}
          className="w-5 h-5 border-gray-300 rounded accent-black hover-effect hover:cursor-pointer"
        />
      </div>

      <div className="w-16 h-16 bg-white border rounded overflow-hidden mr-4">
        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
      </div>

      <div className="flex-1">
        <h3 className="font-bold text-lg">{item.name}</h3>
        <p className="text-gray-600">Color: {item.selectedColor}, Size: {item.selectedSize}</p>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => updateQuantity(item.id, item.selectedSize, item.selectedColor, Math.max(1, item.quantity - 1))}
          className="bg-white p-1 rounded border hover-effect hover:cursor-pointer"
        >
          <Minus className="w-4 h-4" />
        </button>

        <span className="w-8 text-center">{item.quantity}</span>

        <button
          onClick={() => updateQuantity(item.id, item.selectedSize, item.selectedColor, item.quantity + 1)}
          className="bg-white p-1 rounded border hover-effect hover:cursor-pointer"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <button
        onClick={() => removeItem(item.id, item.selectedSize, item.selectedColor)}
        className="ml-4 text-black hover:text-gray-700 hover-effect hover:cursor-pointer"
        aria-label="Remove item"
      >
        <Trash className="w-5 h-5" />
      </button>
    </div>
  )
}

export default CartItem 