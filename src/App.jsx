import Account, { emailStatusText } from './components/Account.jsx';
import useAuth from './lib/useAuth.js';
import { useEffect, useRef, useState } from 'react';
import Cart from './components/Cart.jsx';
import Checkout from './components/Checkout.jsx';
import { readCart, validateCart, CART_KEY } from './data/cart.js';
import ProductCard from './components/ProductCard.jsx';
import ProductDetails from './components/ProductDetails.jsx';
import { brands, categories, filterProducts, products } from './data/catalogue.js';

function getView() {
  return window.location.hash.slice(1) || (new URLSearchParams(window.location.search).get('view') === 'checkout' ? 'checkout' : new URLSearchParams(window.location.search).get('view') === 'account' ? 'account' : 'catalogue');
}

export default function App() {
  const [view, setView] = useState(getView);
  const auth = useAuth();
  const [confirmation, setConfirmation] = useState(null);
  const orderSaved = (result) => {
    setConfirmation({ ...result, userId: auth.session.user.id });
    setCart([]);
    setCheckoutDetails({ name: '', email: '', phone: '', address: '' });
    try { localStorage.setItem(CART_KEY, '[]'); localStorage.removeItem(result.attemptStorageKey); } catch { /* Persistence warning is handled by the cart effect. */ }
    window.location.hash = 'confirmation';
  };
  const [category, setCategory] = useState('all');
  const [brandId, setBrandId] = useState('all');
  const content = useRef(null);
  const [cart, setCart] = useState(readCart);
  const [storageError, setStorageError] = useState('');
  const [checkoutDetails, setCheckoutDetails] = useState({ name: '', email: '', phone: '', address: '' });
  useEffect(() => {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); setStorageError(''); }
    catch { setStorageError('Cart storage is unavailable. Your cart will last only for this page session.'); }
  }, [cart]);
  const addToCart = (product, size, quantity) => {
    setCart((current) => validateCart([...current, { productId: product.id, size, quantity }]));
  };
  const cartQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    const navigate = () => setView(getView());
    window.addEventListener('hashchange', navigate);
    return () => window.removeEventListener('hashchange', navigate);
  }, []);

  useEffect(() => {
    content.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [view]);

  const [kind, id] = view.split('/');
  const brand = kind === 'brand' ? brands.find((item) => item.id === id) : null;
  const product = kind === 'product' ? products.find((item) => item.id === id) : null;
  const isCatalogue = view === 'catalogue';
  const visibleProducts = brand ? filterProducts('all', brand.id) : filterProducts(category, brandId);

  return (
    <>
    <a className="skip-link" href="#main-content" onClick={(event) => {
      event.preventDefault();
      content.current?.focus();
    }}>Skip to content</a>
    <header className="site-header">
      <h1><a href="#catalogue">Beta Drips</a></h1>
      <p>Exceptional fashion. Nigerian brands.</p>
      <nav className="main-nav" aria-label="Main navigation">
        <a href="#catalogue" aria-current={isCatalogue || brand || product ? 'page' : undefined}>Catalogue</a>
        <a href="#cart" aria-current={view === 'cart' || view === 'checkout' ? 'page' : undefined}>Cart ({cartQuantity})<span className="sr-only"> items</span></a>
        <a href="#account" aria-current={view === 'account' ? 'page' : undefined}>Account</a>
      </nav>
    </header>
    <main id="main-content" ref={content} tabIndex={-1}>
      <p className="catalogue-notice">Preview catalogue. Products, prices and imagery are illustrative.</p>
      {!isCatalogue && <a className="back-link" href="#catalogue">← Back to catalogue</a>}
      {storageError && <p role="alert">{storageError}</p>}
      {view === 'cart' ? <Cart cart={cart} setCart={setCart} />
      : view === 'checkout' ? <Checkout cart={cart} details={checkoutDetails} setDetails={setCheckoutDetails} auth={auth} onSaved={orderSaved} />
      : view === 'account' ? <Account auth={auth} />
      : view === 'confirmation' ? <section><h2>Order confirmation</h2>{confirmation && confirmation.userId === auth.session?.user.id ? <><p>Your order has been saved. Reference: {confirmation.order.id}</p><p>{emailStatusText(confirmation.emailStatus)}</p><a href="#account">View saved orders</a></> : <><p>Sign in to your Account to view saved orders.</p><a href="#account">Go to Account</a></>}</section>
      : product ? (
        <ProductDetails key={product.id} product={product} onAdd={addToCart} />
      ) : isCatalogue || brand ? (
        <>
          <h2>{brand ? brand.name : 'Catalogue'}</h2>
          {brand && <p className="brand-description">{brand.description}</p>}
          {isCatalogue && (
            <>
              <div className="filters">
                <label htmlFor="category-filter">Browse category
                  <select id="category-filter" value={category} onChange={(event) => setCategory(event.target.value)}>
                    <option value="all">All categories</option>
                    {categories.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>
                <label htmlFor="brand-filter">Filter by brand
                  <select id="brand-filter" value={brandId} onChange={(event) => setBrandId(event.target.value)}>
                    <option value="all">All brands</option>
                    {brands.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </label>
                <button type="button" onClick={() => { setCategory('all'); setBrandId('all'); }}>Clear filters</button>
              </div>
              <nav className="brand-links" aria-label="Brand views">
                <span>View a brand:</span>
                {brands.map((item) => <a key={item.id} href={`#brand/${item.id}`}>{item.name}</a>)}
              </nav>
            </>
          )}
          <p className="result-count" role="status">{visibleProducts.length} {visibleProducts.length === 1 ? 'product' : 'products'}</p>
          {visibleProducts.length ? (
            <div className="product-grid">
              {visibleProducts.map((item) => <ProductCard key={item.id} product={item} />)}
            </div>
          ) : <p>No products match these filters. Choose another category or brand, or clear the filters.</p>}
        </>
      ) : <section><h2>Page not found</h2><p>This catalogue link is unavailable. Return to the catalogue to browse products.</p></section>}
    </main>
    </>
  );
}
