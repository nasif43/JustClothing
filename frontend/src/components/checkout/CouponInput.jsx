function CouponInput({ couponCode, setCouponCode, handleApplyCoupon }) {
  return (
    <div className="flex mb-4">
      <input
        type="text"
        placeholder="APPLY A COUPON"
        value={couponCode}
        onChange={(e) => setCouponCode(e.target.value)}
        className="flex-grow p-3 bg-gray-200 rounded-l-lg focus:outline-none"
      />
      <button
        onClick={handleApplyCoupon}
        className="bg-black text-white px-6 py-3 rounded-r-lg hover:bg-gray-800 transition-colors"
      >
        APPLY
      </button>
    </div>
  );
}

export default CouponInput; 