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
      <div className="max-w-7xl mx-auto">
        {/* Mobile Layout */}
        <div className="lg:hidden">
          {/* Top row - Logo and Menu */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex" onClick={() => navigate("/")}>
              <img src={logo} alt="logo" className="w-auto h-12 hover:cursor-pointer" />
            </div>
            <div className="relative">
              <button 
                ref={buttonRef}
                onClick={toggleMenu} 
                className="flex items-center focus:outline-none transition-transform duration-300 p-2"
                style={{ transform: isMenuOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}
              >
                <LayoutGrid className="h-6 w-6" />
              </button>
              
              {isMenuOpen && (
                <div 
                  ref={menuRef}
                  className="absolute right-0 mt-2 w-48 sm:w-48 max-w-xs bg-black rounded-md shadow-lg py-1 z-50 text-white menu-font border border-gray-700"
                  style={{ 
                    minWidth: '200px',
                    maxWidth: 'calc(100vw - 2rem)'
                  }}
                >
                  <button 
                    onClick={() => {
                      navigate('/seller/dashboard')
                      setIsMenuOpen(false)
                    }}
                    className="block w-full text-left px-4 py-2 text-sm hover:font-bold"
                  >
                    DASHBOARD
                  </button>
                  <button 
                    onClick={() => {
                      navigate('/seller/homepage')
                      setIsMenuOpen(false)
                    }}
                    className="block w-full text-left px-4 py-2 text-sm hover:font-bold"
                  >
                    HOMEPAGE
                  </button>
                  <button 
                    onClick={() => {
                      navigate('/seller/products')
                      setIsMenuOpen(false)
                    }}
                    className="block w-full text-left px-4 py-2 text-sm hover:font-bold"
                  >
                    PRODUCTS
                  </button>
                  <button 
                    onClick={() => {
                      navigate('/seller/orders')
                      setIsMenuOpen(false)
                    }}
                    className="block w-full text-left px-4 py-2 text-sm hover:font-bold"
                  >
                    ORDERS
                  </button>
                  <button 
                    onClick={() => {
                      navigate('/seller/offers')
                      setIsMenuOpen(false)
                    }}
                    className="block w-full text-left px-4 py-2 text-sm hover:font-bold"
                  >
                    ADD OFFER
                  </button>
                  <button 
                    onClick={() => {
                      navigate('/seller/reviews')
                      setIsMenuOpen(false)
                    }}
                    className="block w-full text-left px-4 py-2 text-sm hover:font-bold"
                  >
                    REVIEWS
                  </button>
                  <button 
                    onClick={() => {
                      logout();
                      navigate('/');
                      setIsMenuOpen(false)
                    }} 
                    className="block w-full text-left px-4 py-2 text-sm hover:font-bold"
                  >
                    SIGN OUT
                  </button>
                </div>
              )}
            </div>
          </div>
          {/* Bottom row - Search bar */}
          <div className="w-full">
            <SearchBar />
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:flex items-center justify-between">
          <div className="flex" onClick={() => navigate("/")}>
            <img src={logo} alt="logo" className="w-auto h-15 hover:cursor-pointer" />
          </div>
          <div className="w-xl flex justify-center">
            <SearchBar />
          </div>
          <div className="flex items-center gap-8">
            <button 
              onClick={() => navigate('/seller/dashboard')}
              className="text-sm hover:underline"
            >
              Store Dashboard
            </button>
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
                  <button 
                    onClick={() => {
                      navigate('/seller/dashboard')
                      setIsMenuOpen(false)
                    }}
                    className="block w-full text-left px-4 py-2 text-sm hover:font-bold"
                  >
                    DASHBOARD
                  </button>
                  <button 
                    onClick={() => {
                      navigate('/seller/homepage')
                      setIsMenuOpen(false)
                    }}
                    className="block w-full text-left px-4 py-2 text-sm hover:font-bold"
                  >
                    HOMEPAGE
                  </button>
                  <button 
                    onClick={() => {
                      navigate('/seller/products')
                      setIsMenuOpen(false)
                    }}
                    className="block w-full text-left px-4 py-2 text-sm hover:font-bold"
                  >
                    PRODUCTS
                  </button>
                  <button 
                    onClick={() => {
                      navigate('/seller/orders')
                      setIsMenuOpen(false)
                    }}
                    className="block w-full text-left px-4 py-2 text-sm hover:font-bold"
                  >
                    ORDERS
                  </button>
                  <button 
                    onClick={() => {
                      navigate('/seller/offers')
                      setIsMenuOpen(false)
                    }}
                    className="block w-full text-left px-4 py-2 text-sm hover:font-bold"
                  >
                    ADD OFFER
                  </button>
                  <button 
                    onClick={() => {
                      navigate('/seller/reviews')
                      setIsMenuOpen(false)
                    }}
                    className="block w-full text-left px-4 py-2 text-sm hover:font-bold"
                  >
                    REVIEWS
                  </button>
                  <button 
                    onClick={() => {
                      logout();
                      navigate('/');
                      setIsMenuOpen(false)
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
      </div>
    </header>
  )
}

export default SellerHeader 