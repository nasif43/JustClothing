function CategoryLinks() {
    const categories = [
      { id: 1, name: "Streetwear", href: "/category/streetwear" },
      { id: 2, name: "Gym wear", href: "/category/gym-wear" },
      { id: 3, name: "Formal wear", href: "/category/formal-wear" },
      { id: 4, name: "Oversized fits", href: "/category/oversized-fits" },
    ]
  
    return (
      <div className="grid grid-cols-4 gap-4 text-center">
        {categories.map((category) => (
          <a key={category.id} href={category.href} className="text-lg font-medium hover:underline">
            {category.name}
          </a>
        ))}
      </div>
    )
  }
  
  export default CategoryLinks 