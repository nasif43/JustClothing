import React, { useState, useRef, useEffect, Suspense } from "react"
import { ShoppingCart, LayoutGrid } from "lucide-react"
import { useCartStore, useUserStore } from "../../store"
import { useNavigate } from "react-router-dom"
import logo from "../../assets/logo.svg"
import { HeaderSkeleton } from "../ui/SkeletonLoader"

// Lazy load SearchBar for faster initial header render
const SearchBar = React.lazy(() => import("../ui/SearchBar"))

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const menuRef = useRef(null)
  const buttonRef = useRef(null)
  
  // Use lazy selectors to avoid blocking render
  const cartItems = useCartStore(state => state.items)
  const itemCount = cartItems?.reduce((total, item) => total + item.quantity, 0) || 0
  const { isAuthenticated, user, logout } = useUserStore()
  const navigate = useNavigate()

  useEffect(() => {
    // Mark as loaded after initial render
    setIsLoaded(true)
  }, [])

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

  const handleSellerButtonClick = (e) => {
    e.preventDefault()
    
    if (!isAuthenticated) {
      // Redirect to login with seller signup intent
      navigate('/login', { 
        state: { 
          from: '/seller/signup',
          message: 'Please log in to continue with seller registration.' 
        } 
      });
      return
    }

    // Check seller status and navigate accordingly
    const hasSellerProfile = user?.seller_profile
    const isSellerApproved = user?.permissions?.seller_approved
    
    if (hasSellerProfile && isSellerApproved) {
      // Approved seller - go to dashboard
      navigate('/seller/dashboard')
    } else if (hasSellerProfile) {
      // Has seller profile but not approved - go to seller onboarding
      navigate('/seller')
    } else {
      // No seller profile - go to seller onboarding
      navigate('/seller')
    }
  }

  // Determine button text and behavior
  const getSellerButtonText = () => {
    if (!isAuthenticated || !user?.seller_profile) {
      return "Become a seller"
    }
    
    const isSellerApproved = user?.permissions?.seller_approved
    return isSellerApproved ? "Seller Dashboard" : "Seller Application"
  }

  return (
    <header className="bg-black text-white p-4 relative sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex" onClick={() => navigate("/home")}>
          <img src={logo} alt="logo" className="w-auto h-15 hover:cursor-pointer" />
        </div>
        <div className="w-xl flex justify-center">
          <Suspense fallback={
            <div className="w-full max-w-2xl">
              <div className="animate-pulse bg-gray-700 h-12 rounded-full"></div>
            </div>
          }>
            <SearchBar />
          </Suspense>
        </div>
        <div className="flex items-center gap-8">
          {isAuthenticated ? (
            <span className="text-sm">Hello, {user?.first_name || user?.username}</span>
          ) : user?.isGuest ? (
            <span className="text-sm">Hello, Guest</span>
          ) : (
            <a href="/login" className="text-sm hover:underline">
              Log in/ Sign up
            </a>
          )}
          <button 
            onClick={handleSellerButtonClick} 
            className="text-sm hover:underline"
          >
            {getSellerButtonText()}
          </button>
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
                <a href="/home" className="block px-4 py-2 text-sm hover:font-bold">
                  Home
                </a>
                {(isAuthenticated || user?.isGuest) && (
                  <>
                    <a href="/orders" className="block px-4 py-2 text-sm hover:font-bold">
                      Orders
                    </a>
                    <a href="/cart" className="block px-4 py-2 text-sm hover:font-bold">
                      Cart {itemCount > 0 && `(${itemCount})`}
                    </a>
                  </>
                )}
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
                ) : user?.isGuest ? (
                  <button 
                    onClick={() => navigate('/welcome')} 
                    className="block w-full text-left px-4 py-2 text-sm hover:font-bold"
                  >
                    Sign In
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
