import { useCartStore } from '../store'

function Cart() {
  const { items, removeItem, updateQuantity, getTotalPrice } = useCartStore()
  
  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Your Cart</h1>
        <p className="text-gray-500 mb-8">Your cart is empty</p>
        <a 
          href="/" 
          className="inline-block bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 transition-colors"
        >
          Continue Shopping
        </a>
      </div>
    )
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Your Cart</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center border-b border-gray-200 py-4">
              <div className="w-20 h-20 relative mr-4">
                <img
                  src={item.image || "/placeholder.svg"}
                  alt={item.name}
                  className="w-full h-full object-cover rounded"
                />
              </div>
              
              <div className="flex-1">
                <h3 className="font-medium">{item.name}</h3>
                <p className="text-sm text-gray-500">{item.category}</p>
                <p className="font-medium mt-1">£{item.price}</p>
              </div>
              
              <div className="flex items-center mr-4">
                <button 
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-l"
                >
                  -
                </button>
                <span className="w-10 h-8 flex items-center justify-center border-t border-b border-gray-300">
                  {item.quantity}
                </span>
                <button 
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-r"
                >
                  +
                </button>
              </div>
              
              <div className="text-right">
                <p className="font-medium">£{(item.price * item.quantity).toFixed(2)}</p>
                <button 
                  onClick={() => removeItem(item.id)}
                  className="text-sm text-red-500 hover:underline mt-1"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="bg-gray-50 p-6 rounded-lg h-fit">
          <h2 className="text-lg font-bold mb-4">Order Summary</h2>
          
          <div className="flex justify-between mb-2">
            <span>Subtotal</span>
            <span>£{getTotalPrice().toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between mb-2">
            <span>Shipping</span>
            <span>Free</span>
          </div>
          
          <div className="border-t border-gray-200 my-4"></div>
          
          <div className="flex justify-between font-bold mb-6">
            <span>Total</span>
            <span>£{getTotalPrice().toFixed(2)}</span>
          </div>
          
          <button className="w-full bg-black text-white py-3 rounded-full hover:bg-gray-800 transition-colors">
            Checkout
          </button>
        </div>
      </div>
    </div>
  )
}

export default Cart 