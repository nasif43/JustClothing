function CheckoutButton({ onClick, buttonText = "CONFIRM", disabled = false }) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-3 rounded-full font-bold transition-colors ${
        disabled 
          ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
          : 'bg-black text-white hover-effect hover:cursor-pointer'
      }`}
    >
      {buttonText}
    </button>
  )
}

export default CheckoutButton 