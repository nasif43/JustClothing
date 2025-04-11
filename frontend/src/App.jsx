import { Routes, Route } from "react-router-dom"
import Header from "./components/layout/Header"
import Footer from "./components/layout/Footer"
import marbleBg from '../src/assets/marble-bg.jpg'
import Homepage from "../src/pages/Homepage"
import ProductDetailPage from "./pages/ProductDetailPage"
import { ProductProvider } from "./context/ProductContext"
import "./App.css"

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <ProductProvider>
        <Header />
        <div className="flex-grow w-full" style={{ backgroundImage: `url(${marbleBg})`, backgroundSize: "cover" }}>
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/product/:id" element={<ProductDetailPage />} />
          </Routes>
        </div>
        <Footer />
      </ProductProvider>
    </div>
  )
}

export default App