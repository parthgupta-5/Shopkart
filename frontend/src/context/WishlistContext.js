import { createContext, useContext } from 'react'

/**
 * WishlistContext – React context instance and hook for wishlist.
 * Separated from WishlistProvider to ensure Fast Refresh compliance.
 */
export const WishlistContext = createContext(null)

/** Convenience hook – throws if used outside <WishlistProvider>. */
export function useWishlist() {
  const context = useContext(WishlistContext)
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider')
  }
  return context
}
