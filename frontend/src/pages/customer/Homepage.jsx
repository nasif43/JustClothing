import { CategoryPills, CategoryLinks } from "../../features/category/components"
import { ProductGrid } from "../../features/product/components"

function Homepage() {
    return(
        <div className="mt-10">
        <div className="flex justify-center gap-4 mb-12">
          <CategoryPills />
        </div>

        <div className="text-center mb-8">
          <h2 className="text-lg font-medium bg-white py-2 px-4 rounded-lg inline-block">• DISCOVER YOUR OOTD •</h2>
        </div>

        <CategoryLinks />

        <div className="mt-8">
          <ProductGrid />
        </div>
        </div>
    )
}

export default Homepage