import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'

/**
 * Cart – backend-persisted shopping cart page.
 *
 * Displays live cart items, line totals, quantity steppers bounded by stock,
 * item removal, and order summary.
 */
function Cart() {
  const {
    items,
    isLoading,
    error,
    updateQuantity,
    removeFromCart,
    refreshCart,
    totalUnits,
    subtotal,
  } = useCart()

  const [busyProductId, setBusyProductId] = useState(null)
  const [actionError, setActionError] = useState(null)

  async function handleQtyChange(productId, newQty, stock) {
    if (newQty < 1 || newQty > stock || busyProductId) return
    setBusyProductId(productId)
    setActionError(null)
    try {
      await updateQuantity(productId, newQty)
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to update item quantity')
    } finally {
      setBusyProductId(null)
    }
  }

  async function handleRemove(productId) {
    if (busyProductId) return
    setBusyProductId(productId)
    setActionError(null)
    try {
      await removeFromCart(productId)
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to remove item from cart')
    } finally {
      setBusyProductId(null)
    }
  }

  /* ── Loading State ── */
  if (isLoading && items.length === 0) {
    return (
      <div className="cart-page" aria-label="Shopping cart">
        <div className="cart-page__header">
          <h1 className="cart-page__title">Your Cart</h1>
        </div>
        <div className="state-container" role="status">
          <div className="spinner" aria-label="Loading cart" />
          <p className="state-body">Loading your shopping cart…</p>
        </div>
      </div>
    )
  }

  /* ── Error State ── */
  if (error && items.length === 0) {
    return (
      <div className="cart-page" aria-label="Shopping cart">
        <div className="cart-page__header">
          <h1 className="cart-page__title">Your Cart</h1>
        </div>
        <div className="state-container" role="alert">
          <p className="state-icon" aria-hidden="true">⚠️</p>
          <p className="state-title">Failed to load cart</p>
          <p className="state-body">{error}</p>
          <button
            className="btn btn--primary"
            type="button"
            onClick={refreshCart}
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  /* ── Empty State ── */
  if (items.length === 0) {
    return (
      <div className="cart-page" aria-label="Shopping cart">
        <div className="cart-page__header">
          <h1 className="cart-page__title">Your Cart</h1>
        </div>
        <div className="state-container">
          <p className="state-icon" aria-hidden="true">🛒</p>
          <p className="state-title">Your cart is empty</p>
          <p className="state-body">
            You don’t have any items in your cart yet. Explore our curated catalog and discover something you love.
          </p>
          <Link className="btn btn--primary btn--lg" to="/products">
            Start Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="cart-page" aria-label="Shopping cart">
      {/* Page header */}
      <div className="cart-page__header">
        <div>
          <h1 className="cart-page__title">Your Cart</h1>
          <p className="cart-page__subtitle">
            {totalUnits} {totalUnits === 1 ? 'unit' : 'units'} across {items.length}{' '}
            {items.length === 1 ? 'item' : 'items'}
          </p>
        </div>
        <Link className="btn btn--ghost btn--sm" to="/products">
          ← Continue Shopping
        </Link>
      </div>

      {actionError && (
        <div className="form-error cart-error-banner" role="alert">
          {actionError}
        </div>
      )}

      <div className="cart-layout">
        {/* Items list */}
        <section className="cart-items" aria-label="Cart items">
          <ul className="cart-list">
            {items.map((item) => {
              const product = item.product || {}
              const isBusy = busyProductId === product._id
              const isAtMaxStock = item.quantity >= product.stock
              const isAtMinQty = item.quantity <= 1
              const lineTotal = (product.price || 0) * item.quantity

              return (
                <li
                  key={item._id || product._id}
                  className={`cart-item${isBusy ? ' cart-item--busy' : ''}`}
                >
                  {/* Product image */}
                  <div className="cart-item__image-wrap">
                    <img
                      className="cart-item__image"
                      src={product.image}
                      alt={`Product image for ${product.name}`}
                      loading="lazy"
                    />
                  </div>

                  {/* Info */}
                  <div className="cart-item__info">
                    <p className="cart-item__category">{product.category}</p>
                    <Link
                      className="cart-item__name"
                      to={`/products/${product._id}`}
                      aria-label={`View details for ${product.name}`}
                    >
                      {product.name}
                    </Link>
                    <p className="cart-item__unit-price">
                      ₹{(product.price || 0).toLocaleString('en-IN')} each
                    </p>
                    {isAtMaxStock && (
                      <p className="cart-item__stock-notice">
                        Max available stock ({product.stock}) reached
                      </p>
                    )}
                  </div>

                  {/* Quantity stepper */}
                  <div className="cart-item__qty">
                    <button
                      className="cart-item__qty-btn"
                      type="button"
                      onClick={() => handleQtyChange(product._id, item.quantity - 1, product.stock)}
                      disabled={isAtMinQty || isBusy}
                      aria-label={`Decrease quantity of ${product.name}`}
                      title="Decrease quantity"
                    >
                      −
                    </button>
                    <span
                      className="cart-item__qty-value"
                      aria-label={`Quantity: ${item.quantity}`}
                    >
                      {item.quantity}
                    </span>
                    <button
                      className="cart-item__qty-btn"
                      type="button"
                      onClick={() => handleQtyChange(product._id, item.quantity + 1, product.stock)}
                      disabled={isAtMaxStock || isBusy}
                      aria-label={`Increase quantity of ${product.name}`}
                      title={isAtMaxStock ? 'Maximum stock reached' : 'Increase quantity'}
                    >
                      +
                    </button>
                  </div>

                  {/* Line total */}
                  <p
                    className="cart-item__line-total"
                    aria-label={`Line total: ₹${lineTotal.toLocaleString('en-IN')}`}
                  >
                    ₹{lineTotal.toLocaleString('en-IN')}
                  </p>

                  {/* Remove */}
                  <button
                    className="cart-item__remove"
                    type="button"
                    onClick={() => handleRemove(product._id)}
                    disabled={isBusy}
                    aria-label={`Remove ${product.name} from cart`}
                    title="Remove item"
                  >
                    {isBusy ? '⌛' : '✕'}
                  </button>
                </li>
              )
            })}
          </ul>
        </section>

        {/* Order summary */}
        <aside className="cart-summary" aria-label="Order summary">
          <h2 className="cart-summary__title">Order Summary</h2>

          <dl className="cart-summary__lines">
            <div className="cart-summary__line">
              <dt>
                Total Units ({totalUnits} {totalUnits === 1 ? 'unit' : 'units'})
              </dt>
              <dd>₹{subtotal.toLocaleString('en-IN')}</dd>
            </div>
            <div className="cart-summary__line">
              <dt>Shipping</dt>
              <dd className="cart-summary__free">Free</dd>
            </div>
            <div className="cart-summary__line cart-summary__line--total">
              <dt>Subtotal</dt>
              <dd>₹{subtotal.toLocaleString('en-IN')}</dd>
            </div>
          </dl>

          {/* Proceed to Checkout */}
          <Link
            className="btn btn--primary btn--full btn--lg cart-summary__checkout"
            to="/checkout"
            aria-label="Proceed to secure checkout"
          >
            Proceed to Checkout →
          </Link>

          <Link className="btn btn--secondary btn--full" to="/products">
            ← Continue Shopping
          </Link>
        </aside>
      </div>
    </div>
  )
}

export default Cart
