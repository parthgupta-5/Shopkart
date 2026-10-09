import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { useAuth } from '../context/AuthContext'

/**
 * ProductDetails – full retail-style product page.
 *
 * Fetches single product from GET /products/:id.
 * "Add to Cart" hits backend cart API with live stock constraints and pending feedback.
 * "Wishlist" hits backend wishlist API.
 */
function ProductDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart, getItemQuantity } = useCart()
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist()
  const { status } = useAuth()

  const [product, setProduct] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const [isCartPending, setIsCartPending] = useState(false)
  const [cartFeedback, setCartFeedback] = useState(null)

  const [isWishlistPending, setIsWishlistPending] = useState(false)
  const [wishlistFeedback, setWishlistFeedback] = useState(null)

  useEffect(() => {
    async function getProduct() {
      try {
        const response = await api.get(`/products/${id}`)
        setProduct(response.data.product)
      } catch {
        setHasError(true)
      } finally {
        setIsLoading(false)
      }
    }

    getProduct()
  }, [id])

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="details-page" aria-label="Product details page">
        <div className="state-container" role="status">
          <div className="spinner" aria-label="Loading product details" />
          <p className="state-body">Fetching product details…</p>
        </div>
      </div>
    )
  }

  /* ── Error / not found ── */
  if (hasError || !product) {
    return (
      <div className="details-page" aria-label="Product details page">
        <Link className="details-page__back" to="/products">
          <span className="details-page__back-icon" aria-hidden="true">←</span>
          Back to products
        </Link>
        <div className="state-container">
          <p className="state-icon" aria-hidden="true">😕</p>
          <p className="state-title">Product not found</p>
          <p className="state-body">
            This product may have been removed or the link is incorrect.
          </p>
          <Link className="btn btn--primary" to="/products">
            Browse all products
          </Link>
        </div>
      </div>
    )
  }

  const isInStock = product.stock > 0
  const isSaved = isInWishlist(product._id)
  const qtyInCart = getItemQuantity(product._id)
  const atMaxStock = qtyInCart >= product.stock

  async function handleAddToCart() {
    if (status !== 'authenticated') {
      navigate('/login')
      return
    }

    if (isCartPending || !isInStock || atMaxStock) return

    setIsCartPending(true)
    setCartFeedback(null)

    try {
      await addToCart(product._id)
      setCartFeedback({ type: 'success', message: '✓ Added to Cart!' })
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add to cart'
      setCartFeedback({ type: 'error', message: msg })
    } finally {
      setIsCartPending(false)
      setTimeout(() => setCartFeedback(null), 2500)
    }
  }

  async function handleToggleWishlist() {
    if (status !== 'authenticated') {
      navigate('/login')
      return
    }

    if (isWishlistPending) return

    setIsWishlistPending(true)
    setWishlistFeedback(null)

    try {
      if (isSaved) {
        await removeFromWishlist(product._id)
        setWishlistFeedback({ type: 'info', message: 'Removed from wishlist' })
      } else {
        await addToWishlist(product._id)
        setWishlistFeedback({ type: 'success', message: 'Saved to wishlist!' })
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update wishlist'
      setWishlistFeedback({ type: 'error', message: msg })
    } finally {
      setIsWishlistPending(false)
      setTimeout(() => setWishlistFeedback(null), 2500)
    }
  }

  return (
    <div className="details-page" aria-label={`Product details: ${product.name}`}>
      {/* Back navigation */}
      <Link className="details-page__back" to="/products" aria-label="Return to product catalog">
        <span className="details-page__back-icon" aria-hidden="true">←</span>
        Back to products
      </Link>

      {/* Product card */}
      <article className="details-card fade-in-up">
        {/* Image column */}
        <div className="details-card__image-col">
          <img
            className="details-card__image"
            src={product.image}
            alt={`Full view of ${product.name}`}
          />
          {/* Stock badge overlaid on image */}
          <span
            className={`badge details-card__image-badge ${isInStock ? 'badge--in-stock' : 'badge--out-of-stock'}`}
            aria-hidden="true"
          >
            {isInStock ? '✓ In Stock' : '✗ Sold Out'}
          </span>
        </div>

        {/* Content column */}
        <div className="details-card__content">
          {/* Category */}
          <span className="badge badge--category details-card__category">
            {product.category}
          </span>

          {/* Title */}
          <h1 className="details-card__title">{product.name}</h1>

          {/* Description */}
          {product.description && (
            <p className="details-card__description">{product.description}</p>
          )}

          <hr className="details-card__divider" aria-hidden="true" />

          {/* Price */}
          <div className="details-card__price-section">
            <p className="details-card__price-label">Price</p>
            <p className="details-card__price" aria-label={`Price: ₹${product.price}`}>
              ₹{product.price.toLocaleString('en-IN')}
            </p>
          </div>

          {/* Stock info */}
          <div className="details-card__stock-info">
            <span
              className={`badge ${isInStock ? 'badge--in-stock' : 'badge--out-of-stock'}`}
              role="status"
            >
              {isInStock ? 'In Stock' : 'Out of Stock'}
            </span>
            {isInStock && (
              <span className="details-card__stock-count">
                {product.stock} unit{product.stock !== 1 ? 's' : ''} available
              </span>
            )}
          </div>

          {/* Cart quantity indicator */}
          {qtyInCart > 0 && (
            <p className="details-card__in-cart" aria-live="polite">
              ✓ You have {qtyInCart} in your cart.{' '}
              <Link to="/cart">View Cart →</Link>
            </p>
          )}

          {/* Cart feedback notice */}
          {cartFeedback && (
            <div
              className={`product-details__feedback product-details__feedback--${cartFeedback.type}`}
              role="status"
            >
              {cartFeedback.message}
            </div>
          )}

          {/* Wishlist feedback notice */}
          {wishlistFeedback && (
            <div
              className={`product-details__feedback product-details__feedback--${wishlistFeedback.type}`}
              role="status"
            >
              {wishlistFeedback.message}
            </div>
          )}

          {/* Actions */}
          <div className="details-card__actions">
            <button
              className="btn btn--primary btn--lg"
              type="button"
              onClick={handleAddToCart}
              disabled={!isInStock || atMaxStock || isCartPending}
              aria-disabled={!isInStock || atMaxStock || isCartPending}
              aria-live="polite"
            >
              {!isInStock
                ? 'Out of Stock'
                : isCartPending
                ? 'Adding…'
                : atMaxStock
                ? 'Max Stock Reached'
                : '🛒 Add to Cart'}
            </button>

            {/* Wishlist Action Button */}
            <button
              className={`btn btn--lg${isSaved ? ' btn--wishlist-saved' : ' btn--secondary'}`}
              type="button"
              onClick={handleToggleWishlist}
              disabled={isWishlistPending}
              aria-label={
                isWishlistPending
                  ? 'Saving to wishlist…'
                  : isSaved
                  ? 'Remove from wishlist'
                  : 'Add to wishlist'
              }
            >
              {isWishlistPending
                ? '⏳ Saving…'
                : isSaved
                ? '❤️ In Wishlist'
                : '🤍 Add to Wishlist'}
            </button>

            <Link className="btn btn--secondary btn--lg" to="/cart">
              View Cart
            </Link>
          </div>
        </div>
      </article>
    </div>
  )
}

export default ProductDetails
