import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

/**
 * Orders – customer's order history page.
 * Lists orders sorted newest first with status badges and item previews.
 */
function Orders() {
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deletingOrderId, setDeletingOrderId] = useState(null)

  async function refetch() {
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.get('/orders')
      setOrders(response.data.orders || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load your orders')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isCancelled = false

    async function loadOrders() {
      try {
        const response = await api.get('/orders')
        if (!isCancelled) {
          setOrders(response.data.orders || [])
          setError(null)
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err.response?.data?.message || 'Failed to load your orders')
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    loadOrders()

    return () => {
      isCancelled = true
    }
  }, [])

  async function handleDeletePendingOrder(order) {
    const confirmed = window.confirm(
      `Delete pending order #${order._id}? This removes the unfinished order from your order history.`
    )

    if (!confirmed || deletingOrderId) return

    setDeletingOrderId(order._id)
    setError(null)
    try {
      await api.delete(`/orders/${order._id}`)
      setOrders((currentOrders) =>
        currentOrders.filter((currentOrder) => currentOrder._id !== order._id)
      )
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete pending order')
    } finally {
      setDeletingOrderId(null)
    }
  }

  /* ── Loading State ── */
  if (isLoading && orders.length === 0) {
    return (
      <div className="orders-page" aria-label="Orders page">
        <div className="orders-header">
          <h1 className="orders-title">My Orders</h1>
        </div>
        <div className="state-container" role="status">
          <div className="spinner" aria-label="Loading orders" />
          <p className="state-body">Loading your order history…</p>
        </div>
      </div>
    )
  }

  /* ── Error State ── */
  if (error && orders.length === 0) {
    return (
      <div className="orders-page" aria-label="Orders page">
        <div className="orders-header">
          <h1 className="orders-title">My Orders</h1>
        </div>
        <div className="state-container" role="alert">
          <p className="state-icon" aria-hidden="true">⚠️</p>
          <p className="state-title">Failed to load orders</p>
          <p className="state-body">{error}</p>
          <button className="btn btn--primary" type="button" onClick={refetch}>
            Try Again
          </button>
        </div>
      </div>
    )
  }

  /* ── Empty State ── */
  if (orders.length === 0) {
    return (
      <div className="orders-page" aria-label="Orders page">
        <div className="orders-header">
          <h1 className="orders-title">My Orders</h1>
          <p className="orders-subtitle">Review past purchases and order status</p>
        </div>
        <div className="state-container">
          <p className="state-icon" aria-hidden="true">📦</p>
          <p className="state-title">No orders yet</p>
          <p className="state-body">
            You haven’t placed any orders yet. Discover items in our catalog and place your first order.
          </p>
          <Link className="btn btn--primary btn--lg" to="/products">
            Browse Products
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="orders-page" aria-label="Orders page">
      <div className="orders-header">
        <div>
          <h1 className="orders-title">My Orders</h1>
          <p className="orders-subtitle">
            {orders.length} order{orders.length !== 1 ? 's' : ''} placed
          </p>
        </div>
        <Link className="btn btn--ghost btn--sm" to="/products">
          🛍️ Continue Shopping
        </Link>
      </div>

      <div className="orders-list">
        {orders.map((order) => {
          const dateStr = new Date(order.createdAt).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })

          const isPaid = order.paymentStatus === 'PAID'
          const isPendingPayment =
            order.paymentStatus === 'PENDING' && order.status === 'PENDING_PAYMENT'
          const isDeleting = deletingOrderId === order._id
          const itemCount = (order.items || []).reduce((acc, i) => acc + i.quantity, 0)

          return (
            <article key={order._id} className="order-card" aria-label={`Order #${order._id}`}>
              {/* Order Card Header */}
              <header className="order-card__header">
                <div>
                  <p className="order-card__id">
                    Order <span>#{order._id}</span>
                  </p>
                  <p className="order-card__date">{dateStr}</p>
                </div>

                <div className="order-card__badges">
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
              </header>

              {/* Items Preview */}
              <div className="order-card__body">
                <div className="order-card__items-preview">
                  {(order.items || []).slice(0, 4).map((item, idx) => (
                    <div key={idx} className="order-card__thumb-wrap" title={item.name}>
                      <img
                        className="order-card__thumb"
                        src={item.image}
                        alt={item.name}
                        loading="lazy"
                      />
                      <span className="order-card__thumb-qty">×{item.quantity}</span>
                    </div>
                  ))}
                  {(order.items || []).length > 4 && (
                    <div className="order-card__more-badge">
                      +{(order.items || []).length - 4} more
                    </div>
                  )}
                </div>

                {/* Summary & Details Link */}
                <div className="order-card__footer">
                  <div className="order-card__total-wrap">
                    <p className="order-card__units">{itemCount} items</p>
                    <p className="order-card__total">
                      ₹{order.totalAmount.toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div className="order-card__actions">
                    {isPendingPayment && (
                      <button
                        className="btn btn--danger btn--sm"
                        type="button"
                        onClick={() => handleDeletePendingOrder(order)}
                        disabled={isDeleting}
                        aria-label={`Delete pending order #${order._id}`}
                      >
                        {isDeleting ? 'Deleting…' : 'Delete Pending'}
                      </button>
                    )}
                    <Link
                      className="btn btn--secondary btn--sm"
                      to={`/orders/${order._id}`}
                      aria-label={`View details for order #${order._id}`}
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

export default Orders
