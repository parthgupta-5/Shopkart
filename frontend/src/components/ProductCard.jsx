import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { useAuth } from '../context/AuthContext'

/**
 * ProductCard – displays a single product summary in the grid.
 *
 * Supports:
 * - Real backend-backed "Add to Cart" with pending, stock ceiling, and live unit indicator
 * - Icon-only heart wishlist button with saved/pending/error states
 * - Deep link to ProductDetails
 */
function ProductCard({ product }) {
  const navigate = useNavigate()
  const { addToCart, getItemQuantity } = useCart()
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist()
  const { status } = useAuth()

  const [isWishlistPending, setIsWishlistPending] = useState(false)
  const [wishlistFeedback, setWishlistFeedback]   = useState(null)
  const [isCartPending, setIsCartPending]         = useState(false)
  const [cartFeedback, setCartFeedback]           = useState(null)

  const isInStock = product.stock > 0
  const isSaved   = isInWishlist(product._id)

  const qtyInCart  = getItemQuantity(product._id)
  const atMaxStock = qtyInCart >= product.stock

  async function handleAddToCart(e) {
    e.preventDefault()
    e.stopPropagation()

    if (status !== 'authenticated') {
      navigate('/login')
      return
    }

    if (isCartPending || !isInStock || atMaxStock) return

    setIsCartPending(true)
    setCartFeedback(null)
    try {
      await addToCart(product._id)
      setCartFeedback({ type: 'success', message: 'Added to cart!' })
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add to cart'
      setCartFeedback({ type: 'error', message: msg })
    } finally {
      setIsCartPending(false)
      setTimeout(() => setCartFeedback(null), 2500)
    }
  }

  async function handleToggleWishlist(e) {
    e.preventDefault()
    e.stopPropagation()

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
    <article
      className={`product-card${isInStock ? '' : ' product-card--oos'}`}
      aria-label={`${product.name}, ₹${product.price}${isInStock ? '' : ', out of stock'}`}
    >
      {/* Image & Badges */}
      <div className="product-card__image-wrap">
        <img
          className="product-card__image"
          src={product.image}
          alt={`Product image for ${product.name}`}
          loading="lazy"
        />

        {/* Stock badge */}
        <span
          className={`badge product-card__badge ${isInStock ? 'badge--in-stock' : 'badge--out-of-stock'}`}
          aria-hidden="true"
        >
          {isInStock ? 'In Stock' : 'Sold Out'}
        </span>

        {/* Icon-only Heart Wishlist Button */}
        <button
          className={`product-card__wishlist-btn${isSaved ? ' is-saved' : ''}${isWishlistPending ? ' is-pending' : ''}`}
          type="button"
          onClick={handleToggleWishlist}
          disabled={isWishlistPending}
          aria-label={
            isWishlistPending
              ? 'Saving to wishlist…'
              : isSaved
              ? `Remove ${product.name} from wishlist`
              : `Add ${product.name} to wishlist`
          }
          title={isSaved ? 'In your wishlist — click to remove' : 'Add to wishlist'}
        >
          <Heart
            size={16}
            aria-hidden="true"
            className="product-card__wishlist-icon"
            fill={isSaved ? 'currentColor' : 'none'}
          />
        </button>
      </div>

      {/* Body */}
      <div className="product-card__body">
        <span className="badge badge--category product-card__category">
          {product.category}
        </span>

        <h2 className="product-card__name">{product.name}</h2>

        <div className="product-card__price-row">
          <p className="product-card__price" aria-label={`Price: ₹${product.price}`}>
            ₹{product.price.toLocaleString('en-IN')}
          </p>
          {isInStock ? (
            <p className="product-card__stock-text" aria-label={`${product.stock} units available`}>
              {product.stock} left
            </p>
          ) : null}
        </div>

        {/* Inline wishlist feedback message */}
        {wishlistFeedback && (
          <p
            className={`product-card__feedback product-card__feedback--${wishlistFeedback.type}`}
            aria-live="polite"
          >
            {wishlistFeedback.message}
          </p>
        )}

        {/* Inline cart feedback message */}
        {cartFeedback && (
          <p
            className={`product-card__feedback product-card__feedback--${cartFeedback.type}`}
            aria-live="polite"
          >
            {cartFeedback.message}
          </p>
        )}

        {/* Cart quantity indicator */}
        {qtyInCart > 0 && (
          <p className="product-card__in-cart" aria-live="polite">
            {qtyInCart} in cart
          </p>
        )}

        {/* Actions */}
        <div className="product-card__actions">
          <button
            className="product-card__add-btn"
            type="button"
            onClick={handleAddToCart}
            disabled={!isInStock || atMaxStock || isCartPending}
            aria-label={
              !isInStock
                ? `${product.name} is out of stock`
                : atMaxStock
                ? `Maximum stock reached for ${product.name}`
                : isCartPending
                ? `Adding ${product.name} to cart`
                : qtyInCart > 0
                ? `Add another ${product.name} to cart`
                : `Add ${product.name} to cart`
            }
          >
            {!isInStock
              ? 'Out of Stock'
              : isCartPending
              ? 'Adding…'
              : atMaxStock
              ? 'Max Stock'
              : qtyInCart > 0
              ? 'Add Another'
              : '+ Add to Cart'}
          </button>
          <Link
            className="product-card__action"
            to={`/products/${product._id}`}
            aria-label={`View details for ${product.name}`}
          >
            Details
          </Link>
        </div>
      </div>
    </article>
  )
}

export default ProductCard
