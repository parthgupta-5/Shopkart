import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import api from '../services/api'

/**
 * OrderDetails – detailed order view showing items snapshots,
 * shipping address, payment status, Razorpay references, and confirmation notice.
 */
function OrderDetails() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const isJustConfirmed = searchParams.get('success') === 'true'

  const [order, setOrder] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isCancelled = false

    async function fetchOrder() {
      try {
        const response = await api.get(`/orders/${id}`)
        if (!isCancelled) {
          setOrder(response.data.order)
          setError(null)
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err.response?.data?.message || 'Order not found or unauthorized')
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchOrder()

    return () => {
      isCancelled = true
    }
  }, [id])

  /* ── Loading State ── */
  if (isLoading) {
    return (
      <div className="order-details-page" aria-label="Order details">
        <div className="state-container" role="status">
          <div className="spinner" aria-label="Loading order details" />
          <p className="state-body">Loading order details…</p>
        </div>
      </div>
    )
  }

  /* ── Error / Not Found ── */
  if (error || !order) {
    return (
      <div className="order-details-page" aria-label="Order details">
        <Link className="details-page__back" to="/orders">
          <span className="details-page__back-icon" aria-hidden="true">←</span>
          Back to My Orders
        </Link>
        <div className="state-container" role="alert">
          <p className="state-icon" aria-hidden="true">🔍</p>
          <p className="state-title">Order Not Found</p>
          <p className="state-body">
            {error || 'The requested order could not be located or belongs to another account.'}
          </p>
          <Link className="btn btn--primary" to="/orders">
            View All Orders
          </Link>
        </div>
      </div>
    )
  }

  const dateStr = new Date(order.createdAt).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const isPaid = order.paymentStatus === 'PAID'
  const addr = order.shippingAddress || {}

  return (
    <div className="order-details-page" aria-label={`Details for order #${order._id}`}>
      {/* Back button */}
      <div className="order-details-nav">
        <Link className="btn btn--ghost btn--sm" to="/orders">
          ← Back to My Orders
        </Link>
      </div>

      {/* Confirmation Celebration Banner */}
      {isJustConfirmed && (
        <div className="order-confirmation-banner" role="status">
          <div className="order-confirmation-icon">🎉</div>
          <div>
            <h2 className="order-confirmation-title">Payment Successful!</h2>
            <p className="order-confirmation-body">
              Thank you for your purchase. Your order #{order._id} has been placed and is being prepared.
            </p>
          </div>
        </div>
      )}

      {/* Main Order Container */}
      <div className="order-details-layout">
        {/* Left Column: Items */}
        <section className="order-details-card">
          <div className="order-details-card__header">
            <div>
              <h1 className="order-details-title">Order #{order._id}</h1>
              <p className="order-details-date">Placed on {dateStr}</p>
            </div>

            <div className="order-details-status-group">
              <span
                className={`badge badge--status ${
                  isPaid ? 'badge--in-stock' : 'badge--out-of-stock'
                }`}
              >
                {order.paymentStatus}
              </span>
              <span className="badge badge--category">
                {order.status.replace('_', ' ')}
              </span>
            </div>
          </div>

          <hr className="order-divider" />

          {/* Items list */}
          <h2 className="order-section-subtitle">Purchased Items</h2>
          <div className="order-items-table">
            {(order.items || []).map((item, index) => {
              const lineTotal = item.price * item.quantity
              return (
                <div key={index} className="order-item-detail-row">
                  <img
                    className="order-item-detail-image"
                    src={item.image}
                    alt={item.name}
                  />
                  <div className="order-item-detail-info">
                    <p className="order-item-detail-name">{item.name}</p>
                    <p className="order-item-detail-sub">
                      ₹{item.price.toLocaleString('en-IN')} × {item.quantity}
                    </p>
                  </div>
                  <p className="order-item-detail-total">
                    ₹{lineTotal.toLocaleString('en-IN')}
                  </p>
                </div>
              )
            })}
          </div>

          <hr className="order-divider" />

          {/* Pricing Breakdown */}
          <div className="order-pricing-breakdown">
            <div className="cart-summary__line">
              <dt>Subtotal</dt>
              <dd>₹{order.totalAmount.toLocaleString('en-IN')}</dd>
            </div>
            <div className="cart-summary__line">
              <dt>Shipping</dt>
              <dd className="cart-summary__free">Free</dd>
            </div>
            <div className="cart-summary__line cart-summary__line--total">
              <dt>Total Paid</dt>
              <dd>₹{order.totalAmount.toLocaleString('en-IN')}</dd>
            </div>
          </div>
        </section>

        {/* Right Column: Address & Payment Info */}
        <aside className="order-details-sidebar">
          {/* Shipping Address */}
          <div className="order-info-panel">
            <h2 className="order-panel-title">📍 Shipping Address</h2>
            <div className="order-address-box">
              <p className="order-address-name">{addr.fullName}</p>
              <p className="order-address-line">{addr.addressLine1}</p>
              {addr.addressLine2 && (
                <p className="order-address-line">{addr.addressLine2}</p>
              )}
              <p className="order-address-line">
                {addr.city}, {addr.state} - {addr.pincode}
              </p>
              <p className="order-address-phone">📞 {addr.phone}</p>
            </div>
          </div>

          {/* Payment Information */}
          <div className="order-info-panel">
            <h2 className="order-panel-title">💳 Payment Details</h2>
            <dl className="order-meta-list">
              <div>
                <dt>Method</dt>
                <dd>Razorpay Standard Checkout</dd>
              </div>
              {order.razorpayPaymentId && (
                <div>
                  <dt>Payment ID</dt>
                  <dd className="order-meta-code">{order.razorpayPaymentId}</dd>
                </div>
              )}
              {order.razorpayOrderId && (
                <div>
                  <dt>Razorpay Order</dt>
                  <dd className="order-meta-code">{order.razorpayOrderId}</dd>
                </div>
              )}
              <div>
                <dt>Payment Status</dt>
                <dd>{order.paymentStatus}</dd>
              </div>
            </dl>
          </div>

          <Link className="btn btn--primary btn--full" to="/products">
            🛍️ Continue Shopping
          </Link>
        </aside>
      </div>
    </div>
  )
}

export default OrderDetails
