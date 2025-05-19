function ProductSummary({ product }) {
  return (
    <div className="bg-gray-200 p-4 rounded-lg mb-4">
      <div className="flex items-center">
        <div className="flex-1">
          <h3 className="font-bold text-xl mb-2">{product.quantity}X {product.name}</h3>
          <p className="text-gray-600">
            Color: {product.color}, Size: {product.size}
          </p>
        </div>
        <div className="w-16 h-16 bg-white rounded flex items-center justify-center ml-4">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="max-h-14 max-w-14 object-contain"
          />
        </div>
      </div>
    </div>
  );
}

export default ProductSummary; 