import { CategoryPills, CategoryLinks } from "../../features/category/components"
import { ProductGrid } from "../../features/product/components"
import useProductStore from "../../store/useProductStore"
import TagsDisplay from "../../components/TagsDisplay"
import { CategoryPillsSkeleton, ProductGridSkeleton } from "../../components/ui/SkeletonLoader"

function Homepage() {
    const { currentBusinessType, currentTags, clearBusinessTypeFilter, loading } = useProductStore()
    
    const getFilterDisplayName = (businessType) => {
        if (!businessType) return null
        switch (businessType) {
            case "General Clothing": return "General Clothing"
            case "Thrifted Clothing": return "Thrifted Clothing"  
            case "Loose Fabric": return "Loose Fabric"
            default: return businessType
        }
    }

    const formatTagName = (tag) => {
        // Convert snake_case to Title Case
        return tag.replace(/_/g, ' ')
                 .split(' ')
                 .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                 .join(' ')
    }

    return(
        <div className="mt-6 sm:mt-10 px-4 sm:px-0">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-center gap-4 mb-8 sm:mb-12">
                    {loading ? <CategoryPillsSkeleton /> : <CategoryPills />}
                </div>

                {/* Filter Status Indicator */}
                {(currentBusinessType || currentTags.length > 0) && (
                    <div className="text-center mb-6 px-2">
                        <div className="inline-flex flex-col sm:flex-row items-center gap-2 bg-white/80 backdrop-blur px-3 sm:px-4 py-2 rounded-full shadow-sm max-w-full">
                            <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
                                <span className="text-xs sm:text-sm text-gray-700">
                                    Showing: {currentBusinessType && <span className="font-medium">{getFilterDisplayName(currentBusinessType)}</span>}
                                </span>
                                {currentTags.length > 0 && (
                                    <>
                                        {currentBusinessType && <span className="text-xs sm:text-sm text-gray-700">+</span>}
                                        <span className="text-xs sm:text-sm text-gray-700">Tags:</span>
                                        <div className="flex flex-wrap gap-1">
                                            {currentTags.map((tag, index) => (
                                                <span key={index} className="text-xs sm:text-sm font-medium bg-gray-100 px-2 py-1 rounded-full border">
                                                    {formatTagName(tag)}
                                                </span>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                            <button 
                                onClick={clearBusinessTypeFilter}
                                disabled={loading}
                                className="text-xs bg-black text-white px-2 py-1 rounded-full hover:bg-gray-800 transition-colors disabled:opacity-50 whitespace-nowrap"
                            >
                                Clear Filter
                            </button>
                        </div>
                    </div>
                )}

                <div className="text-center mb-6 sm:mb-8 px-2">
                    <h2 className="text-base sm:text-lg font-medium bg-white py-2 px-3 sm:px-4 rounded-lg inline-block">• DISCOVER YOUR OOTD •</h2>
                </div>

                <CategoryLinks />

                {/* Additional Tags Display */}
                <div className="mt-6 sm:mt-8">
                    <TagsDisplay />
                </div>

                <div className="mt-6 sm:mt-8">
                    <ProductGrid className="mx-2 sm:m-10" />
                </div>
            </div>
        </div>
    )
}

export default Homepage