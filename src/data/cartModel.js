import { products } from './catalogue.js';

// Stored and client-supplied cart data is untrusted. Keep only known IDs, sizes and bounded integers.
export function validateCart(value) {
  if (!Array.isArray(value)) return [];
  const result = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const product = products.find((entry) => entry.id === item.productId);
    if (!product?.sizes.includes(item.size) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) continue;
    const existing = result.find((entry) => entry.productId === product.id && entry.size === item.size);
    if (existing) existing.quantity = Math.min(99, existing.quantity + item.quantity);
    else result.push({ productId: product.id, size: item.size, quantity: item.quantity });
  }
  return result;
}

export function cartLines(cart) {
  return cart.map((item) => ({ ...item, product: products.find((product) => product.id === item.productId) }));
}

export function cartTotal(cart) {
  return cartLines(cart).reduce((total, item) => total + item.product.price * item.quantity, 0);
}
