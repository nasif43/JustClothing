function ConfirmButton({ onClick, disabled, buttonText = "CONFIRM" }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-3 px-6 rounded-full text-white font-medium text-lg 
      ${disabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-gray-800'} 
      transition-colors`}
    >
      {buttonText}
    </button>
  );
}

export default ConfirmButton; 