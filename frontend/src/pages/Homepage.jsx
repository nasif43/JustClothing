import CategoryPills from "../components/category/CategoryPills"
import CategoryLinks from "../components/category/CategoryLinks"
import ProductGrid from "../components/product/ProductGrid"

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