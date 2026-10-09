import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * PrivateRoute – guards routes that require authentication.
 *
 * Reads from AuthContext, which already ran GET /customers/me once at startup
 * via AuthProvider. This means:
 *   - No extra network call is made here.
 *   - While the startup check is still in flight ('checking'), we render nothing
 *     so there is never a flash of protected content or a premature redirect.
 *   - 'unauthenticated' → redirect to /login.
 *   - 'authenticated'   → render children normally.
 */
function PrivateRoute({ children }) {
  const { status } = useAuth()

  if (status === 'checking') {
    // Still verifying — return null to avoid any flash or incorrect redirect.
    return null
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />
  }

  return children
}

export default PrivateRoute
