"use client"

import { createContext, useState, useContext } from "react"

const ProductContext = createContext()

export function ProductProvider({ children }) {
  const [products] = useState([]) // TODO: Replace with API call to fetchProducts()
  const [stores] = useState([]) // TODO: Replace with API call to fetchStores()
  const [cart, setCart] = useState([])
  const [notification, setNotification] = useState({ message: "", isVisible: false })

  const addToCart = (product, size) => {
    setCart([...cart, { ...product, selectedSize: size }])
    
    // Set notification instead of alert
    setNotification({
      message: `Added ${product.name} (Size: ${size}) to cart!`,
      isVisible: true
    })
    
    // Hide notification after 3 seconds
    setTimeout(() => {
      setNotification({ message: "", isVisible: false })
    }, 3000)
  }

  const getStoreById = (storeId) => {
    return stores.find((store) => store.id === storeId)
  }

  return (
    <ProductContext.Provider 
      value={{ 
        products, 
        stores, 
        cart, 
        addToCart, 
        getStoreById, 
        notification,
        dismissNotification: () => setNotification({ message: "", isVisible: false })
      }}
    >
      {children}
    </ProductContext.Provider>
  )
}

export function useProducts() {
  return useContext(ProductContext)
}
