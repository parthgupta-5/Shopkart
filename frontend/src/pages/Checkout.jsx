import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

/**
 * Loads the official Razorpay Checkout script dynamically.
 */
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      return resolve(true)
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

/**
 * Checkout – protected checkout page with shipping address form,
 * order summary snapshot, and Razorpay Standard Checkout integration.
 */
function Checkout() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { items, totalUnits, subtotal, refreshCart } = useCart()

  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
  })

  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState(null)

  function handleChange(e) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  function validate() {
    const errors = {}
    if (!formData.fullName.trim()) errors.fullName = 'Full name is required'
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required'
    } else if (!/^\d{10,12}$/.test(formData.phone.replace(/[\s-]/g, ''))) {
      errors.phone = 'Please enter a valid 10-digit phone number'
    }

    if (!formData.addressLine1.trim()) errors.addressLine1 = 'Address line 1 is required'
    if (!formData.city.trim()) errors.city = 'City is required'
    if (!formData.state.trim()) errors.state = 'State is required'
    if (!formData.pincode.trim()) {
      errors.pincode = 'Pincode is required'
    } else if (!/^\d{6}$/.test(formData.pincode.trim())) {
      errors.pincode = 'Enter a valid 6-digit pincode'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handlePayment(e) {
    e.preventDefault()
    if (!validate()) return
    if (isSubmitting) return

    setIsSubmitting(true)
    setApiError(null)

    try {
      // 1. Create payment order on backend
      const { data: orderData } = await api.post('/orders/create-payment-order', {
        shippingAddress: formData,
      })

      // 2. Load Razorpay Checkout SDK
      const isLoaded = await loadRazorpayScript()
      if (!isLoaded) {
        setApiError(
          'Unable to load Razorpay payment gateway. Please check your internet connection or disable ad blockers and try again.'
        )
        setIsSubmitting(false)
        return
      }

      if (!window.Razorpay) {
        setApiError('Razorpay payment gateway is unavailable. Please try again.')
        setIsSubmitting(false)
        return
      }

      const shopKartOrderId = orderData.shopKartOrderId || orderData.orderId

      // 3. Open Razorpay Checkout modal
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'ShopKart',
        description: `Order #${shopKartOrderId}`,
        order_id: orderData.razorpayOrderId,
        prefill: {
          name: formData.fullName,
          contact: formData.phone,
          email: user?.email || '',
        },
        theme: {
          color: '#2563eb',
        },
        handler: async function (response) {
          try {
            await api.post('/orders/verify-payment', {
              shopKartOrderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })
            // Clear shared CartContext so navbar updates immediately
            await refreshCart()
            navigate(`/orders/${shopKartOrderId}?success=true`)
          } catch (verifyErr) {
            setApiError(
              verifyErr.response?.data?.message || 'Payment signature verification failed. Your cart has been preserved.'
            )
            setIsSubmitting(false)
          }
        },
        modal: {
          ondismiss: function () {
            setIsSubmitting(false)
          },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', function (failRes) {
        setApiError(
          failRes.error?.description || 'Payment was declined or failed. Your cart has been preserved.'
        )
        setIsSubmitting(false)
      })
      rzp.open()
    } catch (err) {
      setApiError(
        err.response?.data?.message || 'Failed to initiate payment. Please review your cart.'
      )
      setIsSubmitting(false)
    }
  }

  /* Empty cart guard */
  if (totalUnits === 0 || items.length === 0) {
    return (
      <div className="cart-page" aria-label="Checkout">
        <div className="cart-page__header">
          <h1 className="cart-page__title">Checkout</h1>
        </div>
        <div className="state-container">
          <p className="state-icon" aria-hidden="true">🛒</p>
          <p className="state-title">Your cart is empty</p>
          <p className="state-body">
            You must have items in your cart before proceeding to checkout.
          </p>
          <Link className="btn btn--primary btn--lg" to="/products">
            Explore Products
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="checkout-page" aria-label="Checkout page">
      <div className="checkout-header">
        <div>
          <h1 className="checkout-title">Secure Checkout</h1>
          <p className="checkout-subtitle">Complete your shipping and payment information</p>
        </div>
        <Link className="btn btn--ghost btn--sm" to="/cart">
          ← Return to Cart
        </Link>
      </div>

      {apiError && (
        <div className="form-error checkout-error-banner" role="alert">
          {apiError}
        </div>
      )}

      <div className="checkout-layout">
        {/* Shipping Form */}
        <section className="checkout-form-card" aria-label="Shipping details">
          <h2 className="checkout-section-title">Shipping Address</h2>

          <form onSubmit={handlePayment} noValidate>
            <div className="checkout-form-grid">
              {/* Full Name */}
              <div className="form-group checkout-col-span-2">
                <label className="form-label" htmlFor="fullName">
                  Full Name *
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  className={`form-input${formErrors.fullName ? ' form-input--error' : ''}`}
                  type="text"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="e.g. John Doe"
                  required
                />
                {formErrors.fullName && (
                  <p className="form-field-error">{formErrors.fullName}</p>
                )}
              </div>

              {/* Phone */}
              <div className="form-group checkout-col-span-2">
                <label className="form-label" htmlFor="phone">
                  Phone Number *
                </label>
                <input
                  id="phone"
                  name="phone"
                  className={`form-input${formErrors.phone ? ' form-input--error' : ''}`}
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g. 9876543210"
                  required
                />
                {formErrors.phone && (
                  <p className="form-field-error">{formErrors.phone}</p>
                )}
              </div>

              {/* Address Line 1 */}
              <div className="form-group checkout-col-span-2">
                <label className="form-label" htmlFor="addressLine1">
                  Street Address (Line 1) *
                </label>
                <input
                  id="addressLine1"
                  name="addressLine1"
                  className={`form-input${formErrors.addressLine1 ? ' form-input--error' : ''}`}
                  type="text"
                  value={formData.addressLine1}
                  onChange={handleChange}
                  placeholder="House number, street name, area"
                  required
                />
                {formErrors.addressLine1 && (
                  <p className="form-field-error">{formErrors.addressLine1}</p>
                )}
              </div>

              {/* Address Line 2 */}
              <div className="form-group checkout-col-span-2">
                <label className="form-label" htmlFor="addressLine2">
                  Apartment, suite, landmark (Optional)
                </label>
                <input
                  id="addressLine2"
                  name="addressLine2"
                  className="form-input"
                  type="text"
                  value={formData.addressLine2}
                  onChange={handleChange}
                  placeholder="Apartment or landmark"
                />
              </div>

              {/* City */}
              <div className="form-group">
                <label className="form-label" htmlFor="city">
                  City *
                </label>
                <input
                  id="city"
                  name="city"
                  className={`form-input${formErrors.city ? ' form-input--error' : ''}`}
                  type="text"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g. Mumbai"
                  required
                />
                {formErrors.city && (
                  <p className="form-field-error">{formErrors.city}</p>
                )}
              </div>

              {/* State */}
              <div className="form-group">
                <label className="form-label" htmlFor="state">
                  State *
                </label>
                <input
                  id="state"
                  name="state"
                  className={`form-input${formErrors.state ? ' form-input--error' : ''}`}
                  type="text"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="e.g. Maharashtra"
                  required
                />
                {formErrors.state && (
                  <p className="form-field-error">{formErrors.state}</p>
                )}
              </div>

              {/* Pincode */}
              <div className="form-group checkout-col-span-2">
                <label className="form-label" htmlFor="pincode">
                  Pincode (Postal Code) *
                </label>
                <input
                  id="pincode"
                  name="pincode"
                  className={`form-input${formErrors.pincode ? ' form-input--error' : ''}`}
                  type="text"
                  value={formData.pincode}
                  onChange={handleChange}
                  placeholder="6-digit pincode"
                  maxLength={6}
                  required
                />
                {formErrors.pincode && (
                  <p className="form-field-error">{formErrors.pincode}</p>
                )}
              </div>
            </div>

            <button
              className="btn btn--primary btn--full btn--lg checkout-pay-btn"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing Payment…' : `🔒 Pay ₹${subtotal.toLocaleString('en-IN')} with Razorpay`}
            </button>
          </form>
        </section>

        {/* Order Summary Sidebar */}
        <aside className="checkout-summary-card" aria-label="Order summary">
          <h2 className="checkout-section-title">Order Summary</h2>

          <div className="checkout-items-list">
            {items.map((item) => {
              const product = item.product || {}
              const lineTotal = (product.price || 0) * item.quantity
              return (
                <div key={item._id || product._id} className="checkout-item-row">
                  <img
                    className="checkout-item-thumb"
                    src={product.image}
                    alt={product.name}
                  />
                  <div className="checkout-item-details">
                    <p className="checkout-item-name">{product.name}</p>
                    <p className="checkout-item-qty">
                      Qty: {item.quantity} × ₹{(product.price || 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <p className="checkout-item-price">
                    ₹{lineTotal.toLocaleString('en-IN')}
                  </p>
                </div>
              )
            })}
          </div>

          <hr className="checkout-divider" />

          <dl className="cart-summary__lines">
            <div className="cart-summary__line">
              <dt>Total Units</dt>
              <dd>{totalUnits}</dd>
            </div>
            <div className="cart-summary__line">
              <dt>Shipping</dt>
              <dd className="cart-summary__free">Free</dd>
            </div>
            <div className="cart-summary__line cart-summary__line--total">
              <dt>Total</dt>
              <dd>₹{subtotal.toLocaleString('en-IN')}</dd>
            </div>
          </dl>

          <div className="checkout-security-badge">
            <span aria-hidden="true">🛡️</span>
            <span>256-bit SSL encryption & secure Razorpay processing</span>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default Checkout
