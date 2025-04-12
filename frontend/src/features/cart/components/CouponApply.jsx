function CouponApply({ couponCode, setCouponCode, handleApplyCoupon }) {
  return (
    <div className="flex items-center">
      <input
        type="text"
        placeholder="APPLY A COUPON"
        value={couponCode}
        onChange={(e) => setCouponCode(e.target.value)}
        className="flex-1 p-2 rounded-l-lg border-0 bg-gray-200"
      />
      <button 
        onClick={handleApplyCoupon} 
        className="bg-black text-white px-4 py-2 rounded-r-lg hover-effect hover:cursor-pointer"
      >
        APPLY
      </button>
    </div>
  )
}

export default CouponApply 