import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'

function Register() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '', phone: '' })
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setFormData({ ...formData, [name]: value })
    // Clear error when user starts typing again
    if (message) setMessage('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    setIsSubmitting(true)
    try {
      await api.post('/customers/register', formData)
      navigate('/login')
    } catch (error) {
      setMessage(error.response?.data?.message || error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="auth-page" aria-label="Registration page">
      <div className="auth-card fade-in-up">
        {/* Header */}
        <div className="auth-card__header">
          <p className="eyebrow">Create your account</p>
          <h1 className="auth-card__title">Join ShopKart</h1>
          <p className="auth-card__subtitle">Sign up and start your shopping journey today.</p>
        </div>

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label className="field__label" htmlFor="fullName">Full name</label>
            <input
              className="field__input"
              id="fullName"
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Your full name"
              autoComplete="name"
              required
              disabled={isSubmitting}
            />
          </div>

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
            />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="phone">Phone number</label>
            <input
              className="field__input"
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+91 98765 43210"
              autoComplete="tel"
              required
              disabled={isSubmitting}
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
              placeholder="Minimum 6 characters"
              autoComplete="new-password"
              minLength="6"
              required
              disabled={isSubmitting}
              aria-describedby={message ? 'register-error' : undefined}
            />
          </div>

          {/* Error message */}
          {message && (
            <p id="register-error" className="alert alert--error" role="alert" aria-live="polite">
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
                Creating account…
              </>
            ) : 'Create account'}
          </button>
        </form>

        {/* Footer */}
        <p className="auth-card__footer">
          Already have an account?{' '}
          <Link to="/login">Log in</Link>
        </p>
      </div>
    </section>
  )
}

export default Register
