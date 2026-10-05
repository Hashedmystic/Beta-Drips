import { validateCart } from './cartModel.js';
export { validateCart, cartLines, cartTotal } from './cartModel.js';

export const CART_KEY = 'beta-drips-cart-v1';

export function readCart() {
  try { return validateCart(JSON.parse(localStorage.getItem(CART_KEY))); }
  catch { return []; }
}
