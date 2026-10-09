import { useCallback, useEffect, useMemo, useState } from 'react'
import api from '../services/api'
import { useAuth } from './AuthContext'
import { CartContext } from './CartContext'

/**
 * CartProvider – backend-persisted shopping cart.
 *
 * Synchronizes with GET /cart when authenticated.
 * All mutations (POST, PATCH, DELETE) hit the backend and update the shared state.
 */
export function CartProvider({ children }) {
  const { status } = useAuth()
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  /** Fetch the live populated cart from the backend. */
  const refreshCart = useCallback(async () => {
    if (status !== 'authenticated') {
      setItems([])
      setError(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const response = await api.get('/cart')
      setItems(response.data.cart || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch cart')
    } finally {
      setIsLoading(false)
    }
  }, [status])

  /* Sync with backend on authentication state change */
  useEffect(() => {
    let cancelled = false

    async function syncCart() {
      if (status === 'authenticated') {
        setIsLoading(true)
        try {
          const res = await api.get('/cart')
          if (!cancelled) {
            setItems(res.data.cart || [])
            setError(null)
          }
        } catch (err) {
          if (!cancelled) {
            setError(err.response?.data?.message || 'Failed to load cart')
          }
        } finally {
          if (!cancelled) {
            setIsLoading(false)
          }
        }
      } else {
        setItems([])
        setError(null)
        setIsLoading(false)
      }
    }

    syncCart()

    return () => {
      cancelled = true
    }
  }, [status])

  /**
   * Add a product to the cart (quantity 1, or +1 if already in cart).
   * Rejects if exceeding stock or out of stock.
   */
  const addToCart = useCallback(async (productId) => {
    const id = typeof productId === 'object' && productId?._id ? productId._id : productId
    setError(null)
    const response = await api.post(`/cart/${id}`)
    setItems(response.data.cart || [])
    return response.data
  }, [])

  /**
   * Update the quantity of a product in the cart.
   * Quantity must be an integer >= 1 and <= stock.
   */
  const updateQuantity = useCallback(async (productId, quantity) => {
    const id = typeof productId === 'object' && productId?._id ? productId._id : productId
    setError(null)
    const response = await api.patch(`/cart/${id}`, { quantity })
    setItems(response.data.cart || [])
    return response.data
  }, [])

  /**
   * Remove a product completely from the cart.
   */
  const removeFromCart = useCallback(async (productId) => {
    const id = typeof productId === 'object' && productId?._id ? productId._id : productId
    setError(null)
    const response = await api.delete(`/cart/${id}`)
    setItems(response.data.cart || [])
    return response.data
  }, [])

  /**
   * Helper to get the quantity of a specific product currently in the cart.
   */
  const getItemQuantity = useCallback(
    (productId) => {
      if (!productId) return 0
      const targetId = typeof productId === 'object' && productId?._id ? productId._id : productId
      const item = items.find((i) => {
        const pId = i.product?._id || i.product
        return pId === targetId
      })
      return item ? item.quantity : 0
    },
    [items]
  )

  /* Derived calculations */
  const totalUnits = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.quantity || 0), 0)
  }, [items])

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const price = item.product?.price || 0
      return sum + price * (item.quantity || 0)
    }, 0)
  }, [items])

  const value = useMemo(
    () => ({
      items,
      cart: items,
      loading: isLoading,
      isLoading,
      error,
      addToCart,
      addItem: addToCart, // Backwards-compatible alias
      removeFromCart,
      removeItem: removeFromCart, // Backwards-compatible alias
      updateQuantity,
      refreshCart,
      totalUnits,
      itemCount: totalUnits, // Backwards-compatible alias for navbar & pages
      subtotal,
      total: subtotal, // Backwards-compatible alias
      getItemQuantity,
    }),
    [
      items,
      isLoading,
      error,
      addToCart,
      removeFromCart,
      updateQuantity,
      refreshCart,
      totalUnits,
      subtotal,
      getItemQuantity,
    ]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
