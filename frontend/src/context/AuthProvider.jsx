import { useCallback, useEffect, useState } from 'react'
import api from '../services/api'
import { AuthContext } from './AuthContext'

/**
 * AuthProvider – single source of truth for authentication across the whole app.
 *
 * Status values:
 *   'checking'       – initial startup; GET /customers/me is in flight
 *   'authenticated'  – valid session confirmed; `user` holds the customer object
 *   'unauthenticated'– no valid session
 *
 * Exposed helpers:
 *   login(email, password) – POST /customers/login then refreshes session state
 *   logout()               – POST /customers/logout then clears session state
 *   refreshSession()       – re-fetches /customers/me (useful after any auth change)
 *
 * The JWT stays in the HttpOnly cookie managed by the browser. No localStorage used.
 */
export function AuthProvider({ children }) {
  const [status, setStatus] = useState('checking')
  const [user, setUser] = useState(null)

  /** Fetch /customers/me and update state. */
  const refreshSession = useCallback(async () => {
    try {
      const { data } = await api.get('/customers/me')
      setUser(data)
      setStatus('authenticated')
    } catch {
      setUser(null)
      setStatus('unauthenticated')
    }
  }, [])

  /** Run once on app startup to restore any existing session. */
  useEffect(() => {
    let cancelled = false
    api
      .get('/customers/me')
      .then(({ data }) => {
        if (!cancelled) {
          setUser(data)
          setStatus('authenticated')
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null)
          setStatus('unauthenticated')
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  /**
   * Log in: POST credentials → on success refresh the session so the whole app
   * instantly sees the new auth state without a page reload.
   */
  const login = useCallback(
    async (email, password) => {
      await api.post('/customers/login', { email, password })
      await refreshSession()
    },
    [refreshSession]
  )

  /**
   * Log out: POST to clear the cookie → reset local state immediately.
   */
  const logout = useCallback(async () => {
    try {
      await api.post('/customers/logout')
    } finally {
      setUser(null)
      setStatus('unauthenticated')
    }
  }, [])

  return (
    <AuthContext.Provider value={{ status, user, login, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  )
}
