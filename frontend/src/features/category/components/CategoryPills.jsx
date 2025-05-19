function CategoryPills() {
    const categories = [
      { id: 1, name: "GENERAL CLOTHING" },
      { id: 2, name: "THRIFTED CLOTHING" },
      { id: 3, name: "LOOSE FABRIC" },
    ]
  
    return (
      <div className="flex gap-8">
        {categories.map((category) => (
          <button
            key={category.id}
            className="px-10 py-4 border-1 bg-black text-white rounded-full font-medium text-base hover:bg-white hover:text-black hover:border-1 hover:border-black transition-all delay-50"
          >
            {category.name}
          </button>
        ))}
      </div>
    )
  }
  
  export default CategoryPills 