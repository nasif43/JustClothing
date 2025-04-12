function CheckoutButton({ onClick, buttonText = "CONFIRM" }) {
  return (
    <button 
      onClick={onClick}
      className="w-full bg-black text-white py-3 rounded-full font-bold hover-effect hover:cursor-pointer"
    >
      {buttonText}
    </button>
  )
}

export default CheckoutButton 