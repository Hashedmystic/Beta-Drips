import { brands, categories, products, filterProducts, formatPrice } from '../../src/data/catalogue.js';

export { brands, categories, products, formatPrice };
export const previewNotice = 'Preview catalogue. Products, prices and imagery are illustrative.';

export function productImageUrl(product) {
  return new URL(product.photo.image, 'https://betadrips.netlify.app').href;
}

export function searchProducts({ category = 'all', brandId = 'all', query = '' } = {}) {
  const search = query.trim().toLocaleLowerCase();
  return filterProducts(category, brandId).filter(product =>
    !search || [product.name, product.brand, product.category, product.description]
      .some(value => value.toLocaleLowerCase().includes(search)));
}
