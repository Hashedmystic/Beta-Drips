import { useState } from 'react';
import { formatPrice } from '../data/catalogue.js';
import ImageCredit from './ImageCredit.jsx';

export default function ProductDetails({ product, onAdd, cartBusy }) {
  const [size, setSize] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [message, setMessage] = useState('');

  return (
    <section aria-labelledby="product-title" className="product-details">
      <figure>
        <img src={product.photo.image} alt={product.imageAlt} width="720" height="900" />
        <ImageCredit photo={product.photo} />
      </figure>
      <div>
        <h2 id="product-title">{product.name}</h2>
        <p><a href={`#brand/${product.brandId}`}>{product.brand}</a> · {product.category}</p>
        <p>{product.description}</p>
        <p className="product-card__price">{formatPrice(product.price)}</p>
        <form onSubmit={(event) => {
          event.preventDefault();
          const amount = Number(quantity);
          if (!product.sizes.includes(size) || !Number.isInteger(amount) || amount < 1 || amount > 99) return;
          onAdd(product, size, amount);
          setMessage('Cart update requested for ' + product.name + ' (' + size + '). Maximum 99 per product size.');
        }}>
        <label className="size-field" htmlFor="product-size">
          {product.sizeLabel}
          <select required id="product-size" value={size} onChange={(event) => setSize(event.target.value)}>
            <option value="">Choose a size</option>
            {product.sizes.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        {size && <p>Selected: {size}</p>}
        <label className="size-field" htmlFor="product-quantity">Quantity (1–99)
          <input id="product-quantity" type="number" min="1" max="99" step="1" required value={quantity} onChange={(event) => setQuantity(event.target.value)} />
        </label>
        <button className="primary-button" type="submit" disabled={cartBusy}>Add to cart</button>
        </form>
        <p role="status">{message}</p>
      </div>
    </section>
  );
}
