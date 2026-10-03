import { createHash } from 'node:crypto';
import { products } from '../../src/data/catalogue.js';
import { validateCheckout } from '../../src/lib/checkout.js';

export function prepareOrder(body) {
  if (!body || typeof body !== 'object' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.idempotencyKey)) throw new Error('A valid retry key is required.');
  const delivery = Object.fromEntries(['name', 'email', 'phone', 'address'].map((key) => [key, typeof body.delivery?.[key] === 'string' ? body.delivery[key].trim() : '']));
  if (Object.keys(validateCheckout(delivery)).length || /[\r\n]/.test(delivery.email)) throw new Error('Check your name, email, phone and delivery address.');
  if (!Array.isArray(body.items) || !body.items.length || body.items.length > 100) throw new Error('Your cart must contain 1–100 items.');
  const items = [];
  for (const item of body.items) {
    const product = products.find((entry) => entry.id === item?.productId);
    if (!product || !product.sizes.includes(item.size) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) throw new Error('A cart item has an invalid product, size or quantity.');
    if (items.some((entry) => entry.product_id === product.id && entry.size === item.size)) throw new Error('Duplicate cart lines are not allowed.');
    items.push({ product_id: product.id, name: product.name, brand: product.brand, size: item.size, quantity: item.quantity, unit_price_naira: product.price });
  }
  items.sort((a, b) => (a.product_id + '/' + a.size).localeCompare(b.product_id + '/' + b.size));
  // Hash the request identity, not current prices, so retries recover saved snapshots.
  const hash = createHash('sha256').update(JSON.stringify({ delivery, items: items.map(({ product_id, size, quantity }) => ({ product_id, size, quantity })) })).digest('hex');
  return { key: body.idempotencyKey, delivery, items, hash };
}

export const money = (value) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(value);
const escape = (value) => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
export function confirmationEmail(order) {
  const rows = order.order_items.map((item) => '<tr><td style="padding:12px;border-bottom:1px solid #ddd">' + escape(item.name) + '<br><small>' + escape(item.brand) + ' · ' + escape(item.size) + '</small></td><td style="padding:12px">' + item.quantity + '</td><td style="padding:12px">' + money(item.quantity * item.unit_price_naira) + '</td></tr>').join('');
  return {
    text: 'Beta Drips — Exceptional fashion. Nigerian brands.\nOrder saved: ' + order.id + '\nHello ' + order.delivery.name + '\n' + order.order_items.map((item) => item.name + ' (' + item.size + ') × ' + item.quantity + ': ' + money(item.quantity * item.unit_price_naira)).join('\n') + '\nProduct total: ' + money(order.total_naira) + '\nDelivery address: ' + order.delivery.address + '\nPreview catalogue. Products, prices and imagery are illustrative. No payment has been collected.',
    html: '<!doctype html><html><body style="margin:0;background:#faf8f5;color:#242424;font-family:Arial,sans-serif"><main style="max-width:620px;margin:auto;padding:28px"><h1>Beta Drips</h1><p>Exceptional fashion. Nigerian brands.</p><h2>Your order has been saved</h2><p>Hello ' + escape(order.delivery.name) + ',</p><p>Order reference: ' + escape(order.id) + '</p><table style="width:100%;border-collapse:collapse;background:white"><thead><tr><th align="left">Product / size</th><th>Quantity</th><th>Amount</th></tr></thead><tbody>' + rows + '</tbody></table><p style="font-size:20px"><strong>Product total: ' + money(order.total_naira) + '</strong></p><h3>Delivery details</h3><p>' + escape(order.delivery.address).replace(/\n/g, '<br>') + '</p><p>No payment has been collected. Delivery fees are not configured.</p><p style="font-size:12px;color:#555">Preview catalogue. Products, prices and imagery are illustrative.</p></main></body></html>',
  };
}
