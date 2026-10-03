import { submitOrder } from '../lib/submitOrder.js';
import { validateCheckout } from '../lib/checkout.js';
import { useRef, useState } from 'react';
import { cartLines, cartTotal } from '../data/cart.js';
import { formatPrice } from '../data/catalogue.js';

const fields = [
  { key: 'name', label: 'Full name', type: 'text', autoComplete: 'name', maxLength: 100 },
  { key: 'email', label: 'Email', type: 'email', autoComplete: 'email', maxLength: 254 },
  { key: 'phone', label: 'Phone', type: 'tel', autoComplete: 'tel', maxLength: 30 },
  { key: 'address', label: 'Delivery address', autoComplete: 'street-address', maxLength: 500 },
];

export default function Checkout({ cart, details, setDetails, auth, onSaved }) {
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const form = useRef(null);
  if (!cart.length) return <section><h2>Checkout</h2><p>Your cart is empty. Add a product before checking out.</p><a href="#catalogue">Browse the catalogue</a></section>;
  return (
    <section>
      <h2>Checkout</h2>
      <a href="#cart">← Back to cart</a>
      <p>Your order is confirmed only after it is saved. No payment will be collected.</p>
      <div className="checkout-layout">
        <form ref={form} noValidate onSubmit={async (event) => {
          event.preventDefault();
          const next = validateCheckout(details);
          setErrors(next);
          if (Object.keys(next).length) {
            setMessage('Please correct the highlighted fields.');
            form.current.elements.namedItem(Object.keys(next)[0])?.focus();
            return;
          }
          if (!auth.session || auth.loading || submittingRef.current) return;
          submittingRef.current = true; setSubmitting(true); setMessage('Saving your order…');
          try { onSaved(await submitOrder(cart, details, auth.session.user.id)); }
          catch (error) { setMessage(error.message); }
          finally { submittingRef.current = false; setSubmitting(false); }
        }}>
          <fieldset disabled={submitting}>
          {fields.map((field) => {
            const { key, label, ...attributes } = field;
            const props = { ...attributes, id: 'checkout-' + key, name: key, required: true, value: details[key],
              'aria-invalid': Boolean(errors[key]), 'aria-describedby': errors[key] ? 'error-' + key : undefined,
              onChange: (event) => { setDetails((current) => ({ ...current, [key]: event.target.value })); setMessage(''); setErrors((current) => ({ ...current, [key]: undefined })); } };
            return <div className="checkout-field" key={key}><label htmlFor={props.id}>{label} (required)</label>
              {key === 'address' ? <textarea {...props} rows="4" /> : <input {...props} />}
              {errors[key] && <p className="field-error" id={'error-' + key}>{errors[key]}</p>}
            </div>;
          })}
          </fieldset>
          {!auth.configured ? <p>Ordering is not configured. See the Supabase setup in README.</p>
          : auth.loading ? <p role="status">Checking sign-in…</p>
          : !auth.session ? <><p>Sign in before placing your order. Google sign-in reloads the page, so you will need to re-enter contact details; your cart is saved.</p><button type="button" onClick={() => auth.signIn('checkout')}>Sign in with Google</button></>
          : <p>Signed in as {auth.session.user.email}</p>}
          {auth.error && <p role="alert">{auth.error}</p>}
          <button type="submit" disabled={!auth.session || auth.loading || submitting} className="primary-button">{submitting ? 'Saving order…' : 'Place order'}</button>
          <p role="status">{message}</p>
        </form>
        <aside className="order-summary" aria-labelledby="summary-title">
          <h3 id="summary-title">Order summary</h3>
          <ul>{cartLines(cart).map((item) => <li key={item.productId + '/' + item.size}>
            {item.product.name} · {item.size} · Quantity {item.quantity}<br />{formatPrice(item.product.price * item.quantity)}
          </li>)}</ul>
          <p className="product-card__price">Product total: {formatPrice(cartTotal(cart))}</p>
          <p>Delivery fees and payment are not configured.</p>
        </aside>
      </div>
    </section>
  );
}
