import React, { useState, useRef, useEffect, Suspense } from "react"
import { ShoppingCart, LayoutGrid } from "lucide-react"
import { useCartStore, useUserStore, useProductStore } from "../../store"
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
  const { searchProducts } = useProductStore()
  const navigate = useNavigate()

  useEffect(() => {
    // Mark as loaded after initial render
    setIsLoaded(true)
  }, [])


  // Disable all page interactions when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      // Disable all page interactions except header
      document.body.classList.add('mobile-menu-open')
    } else {
      document.body.classList.remove('mobile-menu-open')
    }
    
    return () => {
      document.body.classList.remove('mobile-menu-open')
    }
  }, [isMenuOpen])

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
    setIsMenuOpen(false) // Close menu on mobile
    
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
    <header className="bg-black text-white relative sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Mobile Layout */}
        <div className="lg:hidden">
          {/* Top row - Logo, Cart, Menu */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center flex-shrink-0" onClick={async () => {
              await searchProducts("")
              navigate("/home")
            }}>
              <img src={logo} alt="JustClothing" className="w-auto h-10 sm:h-12 md:h-14 hover:cursor-pointer" />
            </div>
            <div className="flex items-center gap-4">
              <a href="/cart" className="flex items-center relative">
                <ShoppingCart className="h-6 w-6" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full h-4 w-4 flex items-center justify-center border border-white">
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
                  <LayoutGrid className="h-6 w-6" />
                </button>
                
                {isMenuOpen && (
                  <div 
                    ref={menuRef}
                    className="absolute right-0 mt-2 w-48 bg-black rounded-md shadow-lg py-1 z-50 text-white menu-font"
                  >
                    <a 
                      href="/home" 
                      className="block px-4 py-2 text-sm hover:font-bold"
                      onClick={async (e) => {
                        e.preventDefault()
                        await searchProducts("")
                        navigate("/home")
                        setIsMenuOpen(false)
                      }}
                    >
                      Home
                    </a>
                    {!isAuthenticated && !user?.isGuest && (
                      <button 
                        onClick={() => {
                          navigate('/login')
                          setIsMenuOpen(false)
                        }}
                        className="block w-full text-left px-4 py-3 text-sm hover:font-bold active:bg-gray-800 transition-colors"
                      >
                        Log in/ Sign up
                      </button>
                    )}
                    {isAuthenticated && (
                      <div className="block px-4 py-2 text-xs text-gray-400 border-b border-gray-700">
                        Hello, {user?.first_name || user?.username}
                      </div>
                    )}
                    {user?.isGuest && (
                      <div className="block px-4 py-2 text-xs text-gray-400 border-b border-gray-700">
                        Hello, Guest
                      </div>
                    )}
                    <button 
                      onClick={handleSellerButtonClick}
                      onTouchEnd={handleSellerButtonClick}
                      className="block w-full text-left px-4 py-3 text-sm hover:font-bold active:bg-gray-800 transition-colors"
                      style={{ touchAction: 'manipulation' }}
                      data-menu-item="true"
                    >
                      {getSellerButtonText()}
                    </button>
                    
                    {(isAuthenticated || user?.isGuest) && (
                      <>
                        <button 
                          onClick={() => {
                            navigate('/orders')
                            setIsMenuOpen(false)
                          }}
                          onTouchEnd={() => {
                            navigate('/orders')
                            setIsMenuOpen(false)
                          }}
                          className="block w-full text-left px-4 py-2 text-sm hover:font-bold"
                          style={{ touchAction: 'manipulation' }}
                          data-menu-item="true"
                        >
                          Orders
                        </button>
                        <button 
                          onClick={() => {
                            navigate('/cart')
                            setIsMenuOpen(false)
                          }}
                          onTouchEnd={() => {
                            navigate('/cart')
                            setIsMenuOpen(false)
                          }}
                          className="block w-full text-left px-4 py-3 text-sm hover:font-bold active:bg-gray-800 transition-colors"
                          style={{ touchAction: 'manipulation' }}
                          data-menu-item="true"
                        >
                          Cart {itemCount > 0 && `(${itemCount})`}
                        </button>
                      </>
                    )}
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate('/trending')
                        setIsMenuOpen(false)
                      }}
                      className="block w-full text-left px-4 py-3 text-sm hover:font-bold active:bg-gray-800 transition-colors"
                    >
                      Trending
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate('/offers')
                        setIsMenuOpen(false)
                      }}
                      className="block w-full text-left px-4 py-3 text-sm hover:font-bold active:bg-gray-800 transition-colors"
                    >
                      Offers
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate('/blog')
                        setIsMenuOpen(false)
                      }}
                      className="block w-full text-left px-4 py-3 text-sm hover:font-bold active:bg-gray-800 transition-colors"
                    >
                      Blog
                    </button>
                    {isAuthenticated ? (
                      <button 
                        onClick={() => {
                          logout()
                          setIsMenuOpen(false)
                          navigate('/welcome')
                        }}
                        onTouchEnd={() => {
                          logout()
                          setIsMenuOpen(false)
                          navigate('/welcome')
                        }}
                        className="block w-full text-left px-4 py-3 text-sm hover:font-bold active:bg-gray-800 transition-colors"
                        style={{ touchAction: 'manipulation' }}
                        data-menu-item="true"
                      >
                        Sign Out
                      </button>
                    ) : user?.isGuest ? (
                      <button 
                        onClick={() => {
                          navigate('/welcome')
                          setIsMenuOpen(false)
                        }} 
                        className="block w-full text-left px-4 py-3 text-sm hover:font-bold active:bg-gray-800 transition-colors"
                      >
                        Sign In
                      </button>
                    ) : (
                      <button 
                        onClick={() => {
                          navigate('/welcome')
                          setIsMenuOpen(false)
                        }}
                        className="block w-full text-left px-4 py-3 text-sm hover:font-bold active:bg-gray-800 transition-colors"
                      >
                        Sign In
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Bottom row - Search bar */}
          <div className="w-full">
            <Suspense fallback={
              <div className="w-full">
                <div className="animate-pulse bg-gray-300 h-10 rounded-full"></div>
              </div>
            }>
              <SearchBar />
            </Suspense>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:flex items-center justify-between">
          <div className="flex items-center flex-shrink-0 mr-8" onClick={async () => {
            await searchProducts("")
            navigate("/home")
          }}>
            <img src={logo} alt="JustClothing" className="w-auto h-12 lg:h-14 xl:h-16 hover:cursor-pointer" />
          </div>
          <div className="w-xl flex justify-center">
            <Suspense fallback={
              <div className="w-full max-w-2xl">
                <div className="animate-pulse bg-gray-300 h-12 rounded-full"></div>
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
              <button 
                onClick={() => navigate('/login')}
                className="text-sm hover:underline"
              >
                Log in/ Sign up
              </button>
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
                  className="absolute right-0 mt-2 w-48 bg-black rounded-md shadow-lg py-1 z-50 text-white menu-font"
                >
                  <a 
                    href="/home" 
                    className="block px-4 py-2 text-sm hover:font-bold"
                    onClick={async (e) => {
                      e.preventDefault()
                      await searchProducts("")
                      navigate("/home")
                      setIsMenuOpen(false)
                    }}
                  >
                    Home
                  </a>
                  {(isAuthenticated || user?.isGuest) && (
                    <>
                      <button 
                        onClick={() => {
                          navigate('/orders')
                          setIsMenuOpen(false)
                        }}
                        className="block w-full text-left px-4 py-2 text-sm hover:font-bold"
                      >
                        Orders
                      </button>
                      <button 
                        onClick={() => {
                          navigate('/cart')
                          setIsMenuOpen(false)
                        }}
                        className="block w-full text-left px-4 py-2 text-sm hover:font-bold"
                      >
                        Cart {itemCount > 0 && `(${itemCount})`}
                      </button>
                    </>
                  )}
                  <button 
                    onClick={() => {
                      navigate('/trending')
                      setIsMenuOpen(false)
                    }}
                    className="block w-full text-left px-4 py-2 text-sm hover:font-bold"
                  >
                    Trending
                  </button>
                  <button 
                    onClick={() => {
                      navigate('/offers')
                      setIsMenuOpen(false)
                    }}
                    className="block w-full text-left px-4 py-2 text-sm hover:font-bold"
                  >
                    Offers
                  </button>
                  <button 
                    onClick={() => {
                      navigate('/blog')
                      setIsMenuOpen(false)
                    }}
                    className="block w-full text-left px-4 py-2 text-sm hover:font-bold"
                  >
                    Blog
                  </button>
                  {isAuthenticated ? (
                    <button 
                      onClick={() => {
                        logout()
                        navigate('/welcome')
                      }} 
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
                    <button 
                      onClick={() => {
                        navigate('/welcome')
                        setIsMenuOpen(false)
                      }}
                      className="block w-full text-left px-4 py-2 text-sm hover:font-bold"
                    >
                      Sign In
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
