import { formatPrice } from '../data/catalogue.js';
import ImageCredit from './ImageCredit.jsx';

export default function ProductCard({ product }) {
  return (
    <article className="product-card">
      <figure>
        <a href={`#product/${product.id}`} tabIndex={-1}>
          <img src={product.photo.image} alt={product.imageAlt} width="720" height="900" loading="lazy" />
        </a>
        {product.photo.license === 'CC BY-SA 4.0' && <ImageCredit photo={product.photo} />}
      </figure>
      <div className="product-card__body">
        <h3><a href={`#product/${product.id}`}>{product.name}</a></h3>
        <p className="product-card__brand"><a href={`#brand/${product.brandId}`}>{product.brand}</a></p>
        <p>{product.description}</p>
        <p className="product-card__price">{formatPrice(product.price)}</p>
        <a className="detail-link" href={`#product/${product.id}`}>View details<span className="sr-only"> for {product.name}</span> →</a>
      </div>
    </article>
  );
}
