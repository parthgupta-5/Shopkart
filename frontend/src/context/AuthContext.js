import { createContext, useContext } from 'react'

/**
 * AuthContext – React context instance and hook.
 * Separated from AuthProvider to ensure Fast Refresh compliance.
 */
export const AuthContext = createContext(null)

/** Convenience hook – throws if used outside <AuthProvider>. */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return ctx
}
