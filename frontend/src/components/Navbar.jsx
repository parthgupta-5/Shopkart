import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  Grid2x2,
  Heart,
  ShoppingBag,
  User,
  X,
  Package,
  LogOut,
  Menu,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'

/**
 * Navbar – sticky, dark-glass, auth-aware.
 *
 * Authenticated state shows icon-only nav: Products, Wishlist, Cart, Profile.
 * Profile opens a polished popover with user details + Orders / Log out actions.
 * Guest state shows Log in / Register text links.
 */
function Navbar() {
  const navigate   = useNavigate()
  const { status, user, logout } = useAuth()
  const { totalUnits: cartCount } = useCart()
  const { itemCount: wishlistCount } = useWishlist()

  const [menuOpen,    setMenuOpen]    = useState(false)   // mobile drawer
  const [profileOpen, setProfileOpen] = useState(false)   // profile popover
  const [scrolled,    setScrolled]    = useState(false)

  const profileRef = useRef(null)

  /* Shadow on scroll */
  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 6) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* Close profile popover on outside click or Escape */
  useEffect(() => {
    if (!profileOpen) return
    function onKeyDown(e) { if (e.key === 'Escape') setProfileOpen(false) }
    function onPointerDown(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [profileOpen])

  /* Close mobile drawer when route changes */
  function closeMenu() { setMenuOpen(false) }

  async function handleLogout() {
    setProfileOpen(false)
    closeMenu()
    await logout()
    navigate('/login')
  }

  function handleOrders() {
    setProfileOpen(false)
    closeMenu()
    navigate('/orders')
  }

  const isChecking  = status === 'checking'
  const isLoggedIn  = status === 'authenticated'

  /* Compute user initials for avatar */
  const initials = user?.fullName
    ? user.fullName.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
    : '?'

  /* ── Guest nav links ── */
  const guestLinks = (
    <>
      <li>
        <NavLink className="navbar__guest-link" to="/login" onClick={closeMenu}>
          Log in
        </NavLink>
      </li>
      <li>
        <NavLink className="navbar__guest-link navbar__guest-link--accent" to="/register" onClick={closeMenu}>
          Register
        </NavLink>
      </li>
    </>
  )

  /* ── Authenticated icon nav ── */
  const memberIcons = (
    <>
      <li>
        <NavLink
          to="/products"
          onClick={closeMenu}
          className={({ isActive }) => `navbar__icon-btn${isActive ? ' active' : ''}`}
          aria-label="Products catalog"
          title="Products"
        >
          <Grid2x2 size={20} aria-hidden="true" />
        </NavLink>
      </li>
      <li className="navbar__icon-item">
        <NavLink
          to="/wishlist"
          onClick={closeMenu}
          className={({ isActive }) => `navbar__icon-btn${isActive ? ' active' : ''}`}
          aria-label={`Wishlist${wishlistCount > 0 ? `, ${wishlistCount} items` : ''}`}
          title="Wishlist"
        >
          <Heart size={20} aria-hidden="true" />
          {wishlistCount > 0 && (
            <span className="navbar__badge" aria-hidden="true">
              {wishlistCount > 99 ? '99+' : wishlistCount}
            </span>
          )}
        </NavLink>
      </li>
      <li className="navbar__icon-item">
        <NavLink
          to="/cart"
          onClick={closeMenu}
          className={({ isActive }) => `navbar__icon-btn${isActive ? ' active' : ''}`}
          aria-label={`Cart${cartCount > 0 ? `, ${cartCount} items` : ''}`}
          title="Cart"
        >
          <ShoppingBag size={20} aria-hidden="true" />
          {cartCount > 0 && (
            <span className="navbar__badge" aria-hidden="true">
              {cartCount > 99 ? '99+' : cartCount}
            </span>
          )}
        </NavLink>
      </li>
    </>
  )

  return (
    <>
      <header className={`navbar${scrolled ? ' scrolled' : ''}`}>
        {/* Brand */}
        <Link
          className="navbar__brand"
          to={isLoggedIn ? '/products' : '/login'}
          aria-label="ShopKart – go to products"
        >
          <span className="navbar__brand-mark" aria-hidden="true">
            <ShoppingBag size={18} />
          </span>
          ShopKart
        </Link>

        {/* Desktop navigation */}
        {!isChecking && (
          <nav aria-label="Main navigation">
            <ul className="navbar__links">
              {isLoggedIn ? memberIcons : guestLinks}

              {/* Profile icon + dropdown (authenticated only) */}
              {isLoggedIn && (
                <li ref={profileRef} className="navbar__profile-wrap">
                  <button
                    className={`navbar__icon-btn navbar__profile-btn${profileOpen ? ' active' : ''}`}
                    type="button"
                    aria-label="Open profile menu"
                    aria-expanded={profileOpen}
                    aria-haspopup="true"
                    title="Profile"
                    onClick={() => setProfileOpen(prev => !prev)}
                  >
                    <User size={20} aria-hidden="true" />
                  </button>

                  {/* Profile popover */}
                  {profileOpen && (
                    <div
                      className="navbar__profile-popover"
                      role="dialog"
                      aria-label="Profile menu"
                    >
                      {/* Close */}
                      <button
                        className="navbar__popover-close"
                        type="button"
                        aria-label="Close profile menu"
                        onClick={() => setProfileOpen(false)}
                      >
                        <X size={16} aria-hidden="true" />
                      </button>

                      {/* User info */}
                      <div className="navbar__popover-user">
                        <div className="navbar__popover-avatar" aria-hidden="true">
                          {initials}
                        </div>
                        <div className="navbar__popover-info">
                          <p className="navbar__popover-name">{user?.fullName}</p>
                          <p className="navbar__popover-email">{user?.email}</p>
                          {user?.phone && (
                            <p className="navbar__popover-phone">{user.phone}</p>
                          )}
                        </div>
                      </div>

                      <div className="navbar__popover-divider" aria-hidden="true" />

                      {/* Actions */}
                      <ul className="navbar__popover-actions" role="menu">
                        <li role="none">
                          <button
                            className="navbar__popover-action"
                            type="button"
                            role="menuitem"
                            onClick={handleOrders}
                          >
                            <Package size={16} aria-hidden="true" />
                            My Orders
                          </button>
                        </li>
                        <li role="none">
                          <button
                            className="navbar__popover-action navbar__popover-action--danger"
                            type="button"
                            role="menuitem"
                            onClick={handleLogout}
                          >
                            <LogOut size={16} aria-hidden="true" />
                            Log out
                          </button>
                        </li>
                      </ul>
                    </div>
                  )}
                </li>
              )}
            </ul>
          </nav>
        )}

        {/* Mobile hamburger */}
        {!isChecking && (
          <button
            className="navbar__hamburger"
            type="button"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-drawer"
            onClick={() => setMenuOpen(prev => !prev)}
          >
            {menuOpen
              ? <X size={22} aria-hidden="true" />
              : <Menu size={22} aria-hidden="true" />
            }
          </button>
        )}
      </header>

      {/* Mobile drawer */}
      <nav
        id="mobile-drawer"
        className={`navbar__drawer${menuOpen ? ' open' : ''}`}
        aria-label="Mobile navigation"
        aria-hidden={!menuOpen}
      >
        {isLoggedIn ? (
          <>
            {/* Mobile user info */}
            {user && (
              <div className="navbar__drawer-user">
                <div className="navbar__popover-avatar navbar__popover-avatar--sm" aria-hidden="true">
                  {initials}
                </div>
                <div>
                  <p className="navbar__popover-name">{user.fullName}</p>
                  <p className="navbar__popover-email">{user.email}</p>
                </div>
              </div>
            )}
            <div className="navbar__popover-divider" />
            <ul className="navbar__drawer-list">
              <li>
                <NavLink to="/products" onClick={closeMenu} className={({ isActive }) => isActive ? 'active' : ''}>
                  <Grid2x2 size={18} aria-hidden="true" />
                  Products
                </NavLink>
              </li>
              <li>
                <NavLink to="/wishlist" onClick={closeMenu} className={({ isActive }) => isActive ? 'active' : ''}>
                  <Heart size={18} aria-hidden="true" />
                  Wishlist
                  {wishlistCount > 0 && (
                    <span className="navbar__drawer-badge">{wishlistCount > 99 ? '99+' : wishlistCount}</span>
                  )}
                </NavLink>
              </li>
              <li>
                <NavLink to="/cart" onClick={closeMenu} className={({ isActive }) => isActive ? 'active' : ''}>
                  <ShoppingBag size={18} aria-hidden="true" />
                  Cart
                  {cartCount > 0 && (
                    <span className="navbar__drawer-badge">{cartCount > 99 ? '99+' : cartCount}</span>
                  )}
                </NavLink>
              </li>
              <li>
                <button type="button" className="navbar__drawer-action" onClick={handleOrders}>
                  <Package size={18} aria-hidden="true" />
                  My Orders
                </button>
              </li>
            </ul>
            <div className="navbar__popover-divider" />
            <button
              className="navbar__drawer-logout"
              type="button"
              onClick={handleLogout}
            >
              <LogOut size={18} aria-hidden="true" />
              Log out
            </button>
          </>
        ) : (
          <ul className="navbar__drawer-list">
            <li><NavLink to="/login" onClick={closeMenu}>Log in</NavLink></li>
            <li><NavLink to="/register" onClick={closeMenu}>Register</NavLink></li>
          </ul>
        )}
      </nav>
    </>
  )
}

export default Navbar
