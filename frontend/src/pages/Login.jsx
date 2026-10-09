import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [formData, setFormData]       = useState({ email: '', password: '' })
  const [message, setMessage]         = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error when the user starts correcting input
    if (message) setMessage('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    setIsSubmitting(true)
    try {
      // context.login() → POST /customers/login → GET /customers/me
      // After it resolves, AuthContext is fully updated ('authenticated' + user object),
      // so the Navbar and PrivateRoute see the new state without any refresh.
      await login(formData.email, formData.password)
      navigate('/products')
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to log in. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="auth-page" aria-label="Login page">
      <div className="auth-card fade-in-up">
        {/* Header */}
        <div className="auth-card__header">
          <p className="eyebrow">Welcome back</p>
          <h1 className="auth-card__title">Log in to ShopKart</h1>
          <p className="auth-card__subtitle">Enter your credentials to continue shopping.</p>
        </div>

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label className="field__label" htmlFor="email">Email address</label>
            <input
              className="field__input"
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
              required
              disabled={isSubmitting}
              aria-describedby={message ? 'login-error' : undefined}
            />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="password">Password</label>
            <input
              className="field__input"
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              autoComplete="current-password"
              minLength="6"
              required
              disabled={isSubmitting}
              aria-describedby={message ? 'login-error' : undefined}
            />
          </div>

          {/* Error message */}
          {message && (
            <p id="login-error" className="alert alert--error" role="alert" aria-live="polite">
              {message}
            </p>
          )}

          <button
            className="btn btn--primary btn--full auth-form__submit"
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner spinner--sm" aria-hidden="true" />
                Logging in…
              </>
            ) : 'Log in'}
          </button>
        </form>

        {/* Footer */}
        <p className="auth-card__footer">
          New to ShopKart?{' '}
          <Link to="/register">Create an account</Link>
        </p>
      </div>
    </section>
  )
}

export default Login
