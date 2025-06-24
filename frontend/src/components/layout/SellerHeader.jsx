import { LayoutGrid } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import logo from "../../assets/logo.svg"
import SearchBar from "../ui/SearchBar"
import { useUserStore } from "../../store"

function SellerHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const buttonRef = useRef(null)
  const navigate = useNavigate()
  const { logout } = useUserStore()

  // Handle click outside to close menu
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target) && 
        buttonRef.current && 
        !buttonRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <header className="bg-black text-white p-4 relative sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex" onClick={() => navigate("/")}>
          <img src={logo} alt="logo" className="w-auto h-15 hover:cursor-pointer" />
        </div>
        <div className="w-xl flex justify-center">
          <SearchBar />
        </div>
        <div className="flex items-center gap-8">
          <span className="text-sm hover:underline">
            Store Dashboard
          </span>
          <div className="relative">
            <button 
              ref={buttonRef}
              onClick={toggleMenu} 
              className="flex items-center focus:outline-none transition-transform duration-300"
              style={{ transform: isMenuOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}
            >
              <LayoutGrid className="h-7 w-7" />
            </button>
            
            {isMenuOpen && (
              <div 
                ref={menuRef}
                className="absolute right-0 mt-2 w-48 bg-black rounded-md shadow-lg py-1 z-10 text-white menu-font"
              >
                <a href="/seller/dashboard" className="block px-4 py-2 text-sm hover:font-bold">
                  DASHBOARD
                </a>
                <a href="/seller/homepage" className="block px-4 py-2 text-sm hover:font-bold">
                  HOMEPAGE
                </a>
                <a href="/seller/products" className="block px-4 py-2 text-sm hover:font-bold">
                  PRODUCTS
                </a>
                <a href="/seller/orders" className="block px-4 py-2 text-sm hover:font-bold">
                  ORDERS
                </a>
                <a href="/seller/offers" className="block px-4 py-2 text-sm hover:font-bold">
                  ADD OFFER
                </a>
                <a href="/seller/reviews" className="block px-4 py-2 text-sm hover:font-bold">
                  REVIEWS
                </a>
                <button 
                  onClick={() => {
                    logout();
                    navigate('/');
                  }} 
                  className="block w-full text-left px-4 py-2 text-sm hover:font-bold"
                >
                  SIGN OUT
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default SellerHeader 