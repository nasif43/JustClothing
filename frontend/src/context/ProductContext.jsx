"use client"

import { createContext, useState, useContext } from "react"
import storesData from "../data/stores"
import productsData from "../data/products"

const ProductContext = createContext()

export function ProductProvider({ children }) {
  const [products] = useState(productsData)
  const [stores] = useState(storesData)
  const [cart, setCart] = useState([])

  const addToCart = (product, size) => {
    setCart([...cart, { ...product, selectedSize: size }])
    alert(`Added ${product.name} (Size: ${size}) to cart!`)
  }

  const getStoreById = (storeId) => {
    return stores.find((store) => store.id === storeId)
  }

  return (
    <ProductContext.Provider value={{ products, stores, cart, addToCart, getStoreById }}>
      {children}
    </ProductContext.Provider>
  )
}

export function useProducts() {
  return useContext(ProductContext)
}
