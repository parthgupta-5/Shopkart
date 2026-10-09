import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useWishlist } from '../context/WishlistContext'
import { useCart } from '../context/CartContext'

/**
 * Wishlist – protected page displaying customer's saved items.
 *
 * Supports removing items, viewing details, adding directly to cart via real cart API,
 * and handles loading, empty, and error states gracefully.
 */
function Wishlist() {
  const { wishlist, itemCount, isLoading, error, removeFromWishlist, fetchWishlist } = useWishlist()
  const { addToCart, getItemQuantity } = useCart()

  const [removingId, setRemovingId] = useState(null)
  const [addingCartId, setAddingCartId] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [addedCartIds, setAddedCartIds] = useState(new Set())

  async function handleRemove(productId) {
    if (removingId || addingCartId) return
    setRemovingId(productId)
    setActionError(null)
    try {
      await removeFromWishlist(productId)
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to remove item from wishlist')
    } finally {
      setRemovingId(null)
    }
  }

  async function handleAddToCart(product) {
    if (addingCartId || removingId) return
    setAddingCartId(product._id)
    setActionError(null)
    try {
      await addToCart(product._id)
      setAddedCartIds((prev) => new Set(prev).add(product._id))
      setTimeout(() => {
        setAddedCartIds((prev) => {
          const next = new Set(prev)
          next.delete(product._id)
          return next
        })
      }, 2000)
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to add item to cart')
    } finally {
      setAddingCartId(null)
    }
  }

  /* ── Loading State ── */
  if (isLoading && wishlist.length === 0) {
    return (
      <div className="wishlist-page" aria-label="Wishlist page">
        <div className="wishlist-header">
          <h1 className="wishlist-title">My Wishlist</h1>
          <p className="wishlist-subtitle">Items you’ve saved for later</p>
        </div>
        <div className="state-container" role="status">
          <div className="spinner" aria-label="Loading wishlist items" />
          <p className="state-body">Loading your saved items…</p>
        </div>
      </div>
    )
  }

  /* ── Error State ── */
  if (error && wishlist.length === 0) {
    return (
      <div className="wishlist-page" aria-label="Wishlist page">
        <div className="wishlist-header">
          <h1 className="wishlist-title">My Wishlist</h1>
        </div>
        <div className="state-container" role="alert">
          <p className="state-icon" aria-hidden="true">⚠️</p>
          <p className="state-title">Failed to load wishlist</p>
          <p className="state-body">{error}</p>
          <button
            className="btn btn--primary"
            type="button"
            onClick={fetchWishlist}
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  /* ── Empty State ── */
  if (wishlist.length === 0) {
    return (
      <div className="wishlist-page" aria-label="Wishlist page">
        <div className="wishlist-header">
          <h1 className="wishlist-title">My Wishlist</h1>
          <p className="wishlist-subtitle">Items you’ve saved for later</p>
        </div>
        <div className="state-container">
          <p className="state-icon" aria-hidden="true">💖</p>
          <p className="state-title">Your wishlist is empty</p>
          <p className="state-body">
            Save items you love by tapping the heart or &ldquo;Add to Wishlist&rdquo; button on any product.
          </p>
          <Link className="btn btn--primary" to="/products">
            Browse Products
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="wishlist-page" aria-label="Wishlist page">
      {/* Header */}
      <div className="wishlist-header">
        <div className="wishlist-header__content">
          <h1 className="wishlist-title">My Wishlist</h1>
          <p className="wishlist-subtitle">
            {itemCount} saved item{itemCount !== 1 ? 's' : ''} in your collection
          </p>
        </div>
        <Link className="btn btn--ghost btn--sm" to="/products">
          ← Continue Shopping
        </Link>
      </div>

      {actionError && (
        <div className="form-error wishlist-error-banner" role="alert">
          {actionError}
        </div>
      )}

      {/* Grid of Wishlist Items */}
      <div className="wishlist-grid">
        {wishlist.map((product) => {
          const isInStock = product.stock > 0
          const qtyInCart = getItemQuantity(product._id)
          const atMaxStock = qtyInCart >= product.stock
          const isRemoving = removingId === product._id
          const isAdding = addingCartId === product._id
          const isJustAdded = addedCartIds.has(product._id)

          return (
            <article
              key={product._id}
              className={`wishlist-card${isInStock ? '' : ' wishlist-card--oos'}`}
              aria-label={`${product.name}, ₹${product.price}`}
            >
              {/* Image with remove button overlay */}
              <div className="wishlist-card__image-wrap">
                <img
                  className="wishlist-card__image"
                  src={product.image}
                  alt={`Product image for ${product.name}`}
                  loading="lazy"
                />
                <span
                  className={`badge product-card__badge ${isInStock ? 'badge--in-stock' : 'badge--out-of-stock'}`}
                  aria-hidden="true"
                >
                  {isInStock ? 'In Stock' : 'Sold Out'}
                </span>

                <button
                  className="wishlist-card__remove-btn"
                  type="button"
                  onClick={() => handleRemove(product._id)}
                  disabled={isRemoving || isAdding}
                  aria-label={`Remove ${product.name} from wishlist`}
                  title="Remove from wishlist"
                >
                  {isRemoving ? '⌛' : '✕'}
                </button>
              </div>

              {/* Card Body */}
              <div className="wishlist-card__body">
                <span className="badge badge--category product-card__category">
                  {product.category}
                </span>

                <h2 className="wishlist-card__name">{product.name}</h2>

                <div className="wishlist-card__price-row">
                  <p className="wishlist-card__price" aria-label={`Price: ₹${product.price}`}>
                    ₹{product.price.toLocaleString('en-IN')}
                  </p>
                  {isInStock && (
                    <span className="wishlist-card__stock-text">
                      {product.stock} available
                    </span>
                  )}
                </div>

                {qtyInCart > 0 && (
                  <p className="product-card__in-cart" aria-live="polite">
                    ✓ {qtyInCart} in cart
                  </p>
                )}

                {/* Actions */}
                <div className="wishlist-card__actions">
                  <button
                    className={`btn btn--sm wishlist-card__cart-btn${isJustAdded ? ' btn--success' : ' btn--primary'}`}
                    type="button"
                    onClick={() => handleAddToCart(product)}
                    disabled={!isInStock || atMaxStock || isAdding}
                    aria-label={`Add ${product.name} to cart`}
                  >
                    {!isInStock
                      ? 'Out of Stock'
                      : isAdding
                      ? 'Adding…'
                      : atMaxStock
                      ? 'Max in Cart'
                      : isJustAdded
                      ? '✓ Added!'
                      : '🛒 Add to Cart'}
                  </button>

                  <Link
                    className="btn btn--secondary btn--sm wishlist-card__details-btn"
                    to={`/products/${product._id}`}
                    aria-label={`View details for ${product.name}`}
                  >
                    Details →
                  </Link>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

export default Wishlist
