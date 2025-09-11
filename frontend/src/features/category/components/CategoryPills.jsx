import { useState } from 'react'
import useProductStore from '../../../store/useProductStore'

function CategoryPills() {
  const { 
    fetchProductsByBusinessType, 
    clearBusinessTypeFilter, 
    currentBusinessType, 
    loading 
  } = useProductStore()
  
  const categories = [
    { id: 1, name: "GENERAL CLOTHING", businessType: "General Clothing" },
    { id: 2, name: "THRIFTED CLOTHING", businessType: "Thrifted Clothing" },
    { id: 3, name: "LOOSE FABRIC", businessType: "Loose Fabric" },
  ]

  const handleCategoryClick = async (category) => {
    if (currentBusinessType === category.businessType) {
      // If clicking the same category, clear the filter
      await clearBusinessTypeFilter()
    } else {
      // Filter by the selected business type
      await fetchProductsByBusinessType(category.businessType)
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-8 items-center">
      {categories.map((category) => {
        const isActive = currentBusinessType === category.businessType
        return (
          <button
            key={category.id}
            onClick={() => handleCategoryClick(category)}
            disabled={loading}
            className={`w-full sm:w-auto px-6 sm:px-10 py-3 sm:py-4 border-1 rounded-full font-medium text-sm sm:text-base transition-all delay-50 whitespace-nowrap ${
              isActive
                ? 'bg-white text-black border-black' // Active style
                : 'bg-black text-white hover:bg-white hover:text-black hover:border-black' // Inactive style
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {category.name}
          </button>
        )
      })}
    </div>
  )
}

export default CategoryPills 