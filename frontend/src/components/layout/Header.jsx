import { ShoppingCart, LayoutGrid } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { useCartStore, useUserStore } from "../../store"
import { useNavigate } from "react-router-dom"
import logo from "../../assets/logo.svg"
import SearchBar from "../ui/SearchBar"
  function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const buttonRef = useRef(null)
  const cartItems = useCartStore(state => state.items)
  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0)
  const { isAuthenticated, user, logout } = useUserStore()
  const navigate = useNavigate()

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
          {isAuthenticated ? (
            <span className="text-sm">Hello, {user?.name}</span>
          ) : (
            <a href="/login" className="text-sm hover:underline">
              Log in/ Sign up
            </a>
          )}
          <a href="/seller" className="text-sm hover:underline">
            Become a seller
          </a>
          <a href="/cart" className="flex items-center relative">
            <ShoppingCart className="h-7 w-7" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full h-5 w-5 flex items-center justify-center border border-white">
                {itemCount}
              </span>
            )}
          </a>
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
                <a href="/" className="block px-4 py-2 text-sm hover:font-bold">
                  Home
                </a>
                <a href="/orders" className="block px-4 py-2 text-sm hover:font-bold">
                  Orders
                </a>
                <a href="/cart" className="block px-4 py-2 text-sm hover:font-bold">
                  Cart {itemCount > 0 && `(${itemCount})`}
                </a>
                <a href="/trending" className="block px-4 py-2 text-sm hover:font-bold">
                  Trending
                </a>
                <a href="/offers" className="block px-4 py-2 text-sm hover:font-bold">
                  Offers
                </a>
                <a href="/blog" className="block px-4 py-2 text-sm hover:font-bold">
                  Blog
                </a>
                {isAuthenticated ? (
                  <button 
                    onClick={logout} 
                    className="block w-full text-left px-4 py-2 text-sm hover:font-bold"
                  >
                    Sign Out
                  </button>
                ) : (
                  <a href="/signout" className="block px-4 py-2 text-sm hover:font-bold">
                    Sign Out
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
