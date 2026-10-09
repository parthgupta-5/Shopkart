import { createContext, useContext } from 'react'

/**
 * CartContext – React context instance and hook for shopping cart.
 * Separated from CartProvider to ensure Fast Refresh compliance.
 */
export const CartContext = createContext(null)

/** Convenience hook – throws if used outside <CartProvider>. */
export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used inside a CartProvider')
  }
  return context
}
