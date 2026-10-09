import { useCallback, useEffect, useMemo, useState } from 'react'
import api from '../services/api'
import { useAuth } from './AuthContext'
import { WishlistContext } from './WishlistContext'

/**
 * WishlistProvider – manages customer wishlist state across the frontend.
 *
 * Automatically synchronizes with GET /wishlist when the user is authenticated.
 * Clears on logout.
 */
export function WishlistProvider({ children }) {
  const { status } = useAuth()
  const [wishlist, setWishlist] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchWishlist = useCallback(async () => {
    if (status !== 'authenticated') {
      setWishlist([])
      setError(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const response = await api.get('/wishlist')
      setWishlist(response.data.wishlist || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load wishlist')
    } finally {
      setIsLoading(false)
    }
  }, [status])

  useEffect(() => {
    let cancelled = false

    async function syncWishlist() {
      if (status === 'authenticated') {
        setIsLoading(true)
        try {
          const res = await api.get('/wishlist')
          if (!cancelled) {
            setWishlist(res.data.wishlist || [])
            setError(null)
          }
        } catch (err) {
          if (!cancelled) {
            setError(err.response?.data?.message || 'Failed to load wishlist')
          }
        } finally {
          if (!cancelled) {
            setIsLoading(false)
          }
        }
      } else {
        setWishlist([])
        setError(null)
        setIsLoading(false)
      }
    }

    syncWishlist()

    return () => {
      cancelled = true
    }
  }, [status])

  // Set of wishlist IDs for fast lookup
  const wishlistIds = useMemo(() => {
    return new Set(wishlist.map((item) => (typeof item === 'string' ? item : item._id)))
  }, [wishlist])

  const isInWishlist = useCallback(
    (productId) => {
      if (!productId) return false
      return wishlistIds.has(productId)
    },
    [wishlistIds]
  )

  const addToWishlist = useCallback(
    async (productId) => {
      const response = await api.post(`/wishlist/${productId}`)
      // Re-fetch to get complete populated product object
      await fetchWishlist()
      return response.data
    },
    [fetchWishlist]
  )

  const removeFromWishlist = useCallback(
    async (productId) => {
      const response = await api.delete(`/wishlist/${productId}`)
      // Optimistically or immediately filter local list
      setWishlist((prev) => prev.filter((item) => (item._id || item) !== productId))
      return response.data
    },
    []
  )

  const value = useMemo(
    () => ({
      wishlist,
      itemCount: wishlist.length,
      isLoading,
      error,
      isInWishlist,
      addToWishlist,
      removeFromWishlist,
      fetchWishlist,
    }),
    [wishlist, isLoading, error, isInWishlist, addToWishlist, removeFromWishlist, fetchWishlist]
  )

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}
