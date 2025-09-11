import { CategoryPills, CategoryLinks } from "../../features/category/components"
import { ProductGrid } from "../../features/product/components"
import useProductStore from "../../store/useProductStore"
import TagsDisplay from "../../components/TagsDisplay"

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

    return(
        <div className="mt-10">
            <div className="flex justify-center gap-4 mb-12">
                <CategoryPills />
            </div>

            {/* Filter Status Indicator */}
            {(currentBusinessType || currentTags.length > 0) && (
                <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur px-4 py-2 rounded-full shadow-sm">
                        <span className="text-sm text-gray-700">
                            Showing: {currentBusinessType && <span className="font-medium">{getFilterDisplayName(currentBusinessType)}</span>}
                            {currentTags.length > 0 && (
                                <span className="font-medium">
                                    {currentBusinessType ? ' + ' : ''}
                                    Tags: {currentTags.map((tag, index) => (
                                        <span key={index} className="underline decoration-1 underline-offset-2 mr-2">
                                            {tag}
                                        </span>
                                    ))}
                                </span>
                            )}
                        </span>
                        <button 
                            onClick={clearBusinessTypeFilter}
                            disabled={loading}
                            className="text-xs bg-black text-white px-2 py-1 rounded-full hover:bg-gray-800 transition-colors disabled:opacity-50"
                        >
                            Clear Filter
                        </button>
                    </div>
                </div>
            )}

            <div className="text-center mb-8">
                <h2 className="text-lg font-medium bg-white py-2 px-4 rounded-lg inline-block">• DISCOVER YOUR OOTD •</h2>
            </div>

            <CategoryLinks />

            {/* Additional Tags Display */}
            <div className="mt-8">
                <TagsDisplay />
            </div>

            <div className="mt-8">
                <ProductGrid />
            </div>
        </div>
    )
}

export default Homepage