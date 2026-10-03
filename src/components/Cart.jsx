import { useState } from 'react';
import { cartLines, cartTotal } from '../data/cart.js';
import { formatPrice } from '../data/catalogue.js';

function CartLine({ item, onQuantity, onRemove }) {
  const [draft, setDraft] = useState(String(item.quantity));
  const [error, setError] = useState('');
  const inputId = 'cart-quantity-' + item.productId + '-' + item.size.replaceAll(' ', '-');
  return (
    <li className="cart-line">
      <div>
        <h3><a href={'#product/' + item.productId}>{item.product.name}</a></h3>
        <p>{item.product.brand} · {item.size}</p>
        <p>{formatPrice(item.product.price)} each</p>
      </div>
      <div>
        <label htmlFor={inputId}>Quantity for {item.product.name}, {item.size}</label>
        <input id={inputId} type="number" min="1" max="99" step="1" value={draft} aria-invalid={Boolean(error)} aria-describedby={error ? inputId + '-error' : undefined}
          onChange={(event) => {
            const value = event.target.value;
            setDraft(value);
            const quantity = Number(value);
            if (value && Number.isInteger(quantity) && quantity >= 1 && quantity <= 99) {
              setError('');
              onQuantity(quantity);
            } else setError('Enter a whole quantity from 1 to 99. The last valid quantity is used in totals.');
          }}
          onBlur={() => { setDraft(String(item.quantity)); setError(''); }} />
        {error && <p id={inputId + '-error'} role="alert">{error}</p>}
        <p className="product-card__price">{formatPrice(item.product.price * item.quantity)}</p>
        <button type="button" onClick={onRemove}>Remove<span className="sr-only"> {item.product.name}, {item.size}</span></button>
      </div>
    </li>
  );
}

export default function Cart({ cart, setCart }) {
  const [message, setMessage] = useState('');
  const update = (target, quantity) => setCart((items) => items.map((item) => item.productId === target.productId && item.size === target.size ? { ...item, quantity } : item));
  return (
    <section aria-labelledby="cart-title">
      <h2 id="cart-title">Cart</h2>
      <p role="status">{message}</p>
      {cart.length ? <>
        <ul className="cart-list">{cartLines(cart).map((item) => <CartLine key={item.productId + '/' + item.size} item={item}
          onQuantity={(quantity) => update(item, quantity)}
          onRemove={() => {
            setCart((items) => items.filter((entry) => entry.productId !== item.productId || entry.size !== item.size));
            setMessage(item.product.name + ' (' + item.size + ') removed.');
          }} />)}</ul>
        <p className="product-card__price" role="status">Product total: {formatPrice(cartTotal(cart))}</p>
        <p>Delivery fees and payment are not configured.</p>
        <a className="primary-button" href="#checkout">Continue to checkout</a>
      </> : <><p>Your cart is empty.</p><a className="detail-link" href="#catalogue">Browse the catalogue</a></>}
    </section>
  );
}
