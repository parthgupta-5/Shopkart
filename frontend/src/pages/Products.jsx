import { useEffect, useState } from 'react'
import ProductCard from '../components/ProductCard'
import api from '../services/api'

/**
 * Products – public catalog page.
 *
 * Two independent useEffects:
 *   1) Fetch all categories once on mount for the filter dropdown.
 *   2) Fetch (filtered) products whenever search or category changes.
 *
 * All API routes and query-param shapes are unchanged.
 */
function Products() {
  const [products, setProducts]               = useState([])
  const [categories, setCategories]           = useState([])
  const [search, setSearch]                   = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [isLoading, setIsLoading]             = useState(true)
  const [hasError, setHasError]               = useState(false)

  // Fetch the full category list once when the page first loads.
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await api.get('/products')
        const allCategories = [...new Set(response.data.products.map((product) => product.category))]
        setCategories(allCategories)
      } catch {
        // If this fails the dropdown simply stays empty; it is not critical.
      }
    }
    fetchCategories()
  }, [])

  // Fetch products whenever the search term or selected category changes.
  useEffect(() => {
    async function fetchProducts() {
      const queryParameters = new URLSearchParams()
      if (search.trim()) queryParameters.set('search', search.trim())
      if (selectedCategory) queryParameters.set('category', selectedCategory)
      const queryString = queryParameters.toString()

      setIsLoading(true)
      setHasError(false)

      try {
        const response = await api.get(`/products${queryString ? `?${queryString}` : ''}`)
        setProducts(response.data.products)
      } catch {
        setHasError(true)
      } finally {
        setIsLoading(false)
      }
    }
    fetchProducts()
  }, [search, selectedCategory])

  const hasResults = !isLoading && !hasError && products.length > 0
  const isEmpty    = !isLoading && !hasError && products.length === 0

  return (
    <div className="products-page">
      {/* ── Compact Editorial Header ── */}
      <section className="products-hero" aria-label="Products header">
        <div className="products-hero__inner">
          <p className="products-hero__eyebrow">ShopKart Catalog</p>
          <h1 className="products-hero__title">Curated essentials.</h1>
          <p className="products-hero__subtitle">Selected for you.</p>
        </div>
      </section>

      {/* ── Filters / Controls ── */}
      <div className="products-controls" aria-label="Product filter controls">
        <div className="products-controls__inner">
          {/* Search */}
          <div className="field products-controls__search">
            <label className="field__label" htmlFor="product-search">Search</label>
            <input
              className="field__input"
              id="product-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="e.g. wireless headphones…"
              aria-controls="products-grid"
            />
          </div>

          {/* Category */}
          <div className="field products-controls__category">
            <label className="field__label" htmlFor="product-category">Category</label>
            <select
              className="field__input"
              id="product-category"
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              aria-controls="products-grid"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Result count */}
          {hasResults && (
            <p className="products-controls__count" aria-live="polite" aria-atomic="true">
              {products.length} {products.length === 1 ? 'product' : 'products'}
            </p>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="products-body">
        {/* Loading */}
        {isLoading && (
          <div className="state-container" role="status" aria-live="polite">
            <div className="spinner" aria-label="Loading products" />
            <p className="state-body">Fetching products…</p>
          </div>
        )}

        {/* Error */}
        {hasError && (
          <div className="state-container">
            <div className="state-icon-svg" aria-hidden="true">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <p className="state-title">Failed to load products</p>
            <p className="state-body">There was a problem connecting to the server. Check your connection and try again.</p>
          </div>
        )}

        {/* Empty */}
        {isEmpty && (
          <div className="state-container">
            <div className="state-icon-svg" aria-hidden="true">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <p className="state-title">No products found</p>
            <p className="state-body">
              {search || selectedCategory
                ? 'Try a different search term or clear the filters.'
                : 'The catalog is empty right now — check back soon.'}
            </p>
            {(search || selectedCategory) && (
              <button
                className="btn btn--outline"
                type="button"
                onClick={() => { setSearch(''); setSelectedCategory('') }}
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Product grid */}
        {hasResults && (
          <div
            id="products-grid"
            className="products-grid"
            role="list"
            aria-label={`${products.length} products`}
          >
            {products.map((product) => (
              <div key={product._id} role="listitem">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Products
