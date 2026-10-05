import { authenticatedRequest } from '../../src/lib/authClient.js';
import { validateCart } from '../../src/data/cartModel.js';

export function apiBaseUrl(value = 'https://betadrips.netlify.app', development = false) {
  const url = new URL(value);
  const local = development && url.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(url.hostname) && url.port === '8888';
  if ((!local && url.protocol !== 'https:') || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('Use an HTTPS API origin, or localhost:8888 in a development build.');
  return url.origin;
}
export function checkedItems(items) {
  if (!Array.isArray(items) || items.length > 100) throw new Error('Invalid cart response.');
  const clean = validateCart(items);
  if (clean.length !== items.length || items.some((item, index) => !item || clean[index].productId !== item.productId || clean[index].size !== item.size || clean[index].quantity !== item.quantity)) throw new Error('Invalid cart response.');
  return clean;
}
export function checkedCart(cart) {
  if (!Number.isSafeInteger(cart?.revision) || cart.revision < 0) throw new Error('Invalid cart response.');
  return { items: checkedItems(cart.items), revision: cart.revision };
}
export function createCartApi({ client, baseUrl, fetcher = fetch, onSessionLost }) {
  return async ({ userId, active, operation }) => {
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), 15000);
    try {
      const response = await authenticatedRequest({ client, userId, active, onSessionLost, fetcher,
        url: baseUrl + '/.netlify/functions/cart', options: { signal: abort.signal, method: operation ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json' }, ...(operation ? { body: JSON.stringify(operation) } : {}) } });
      const result = await response.json();
      if (!response.ok) {
        const code = ['CART_CONFLICT', 'CART_LIMIT', 'IDEMPOTENCY_CONFLICT'].includes(result.code) ? result.code : 'API_UNAVAILABLE';
        throw Object.assign(new Error('Cart synchronization could not be confirmed. Check your connection and retry.'), { code });
      }
      return checkedCart(result.cart);
    } finally { clearTimeout(timer); }
  };
}
