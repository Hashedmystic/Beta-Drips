import { authenticatedRequest } from '../../src/lib/authClient.js';

export const ORDER_SELECT = 'id,created_at,total_naira,order_items(product_id,name,brand,size,quantity,unit_price_naira),order_emails(status)';
export const DEMO_NOTICE = 'Demo order — no payment taken';
export function checkedOrder(order) {
  if (typeof order?.id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(order.id) || !Number.isFinite(Date.parse(order.created_at)) || !Number.isSafeInteger(order.total_naira) || order.total_naira <= 0 || !Array.isArray(order.order_items) || !order.order_items.length || order.order_items.length > 100) throw new Error('Invalid saved order.');
  let total = 0;
  for (const item of order.order_items) {
    if (!['product_id', 'name', 'brand', 'size'].every(key => typeof item[key] === 'string' && item[key]) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99 || !Number.isSafeInteger(item.unit_price_naira) || item.unit_price_naira <= 0) throw new Error('Invalid saved order item.');
    total += item.quantity * item.unit_price_naira;
  }
  if (total !== order.total_naira) throw new Error('Invalid order total.');
  return order;
}
export function createOrderApi({ client, baseUrl, supabaseUrl, publishableKey, onSessionLost, fetcher = fetch }) {
  async function request(userId, active, url, options, timeout) {
    const abort = new AbortController(); const timer = setTimeout(() => abort.abort(), timeout);
    try {
      const response = await authenticatedRequest({ client, userId, active, onSessionLost, fetcher, url, options: { ...options, signal: abort.signal } });
      const data = await response.json();
      if (!response.ok) throw Object.assign(new Error('Could not confirm the request.'), { code: data.code === 'CART_CONFLICT' ? 'CART_CONFLICT' : 'ORDER_UNAVAILABLE' });
      return data;
    } finally { clearTimeout(timer); }
  }
  return {
    async submit({ userId, active, attempt }) {
      // Includes server Mailgun work: allow longer than the cart read deadline.
      const result = await request(userId, active, baseUrl + '/.netlify/functions/submit-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idempotencyKey: attempt.key, items: attempt.items, delivery: attempt.delivery, cartRevision: attempt.cartRevision }) }, 45000);
      return { order: checkedOrder(result.order), emailStatus: typeof result.emailStatus === 'string' ? result.emailStatus : 'unknown' };
    },
    async history({ userId, active }) {
      // Same projection as website Account, with an additional own-account filter.
      // The public key + user JWT access existing SELECT grants/RLS; no server key.
      const query = new URLSearchParams({ select: ORDER_SELECT, user_id: 'eq.' + userId, order: 'created_at.desc' });
      const result = await request(userId, active, supabaseUrl + '/rest/v1/orders?' + query, { method: 'GET', headers: { apikey: publishableKey } }, 15000);
      if (!Array.isArray(result)) throw new Error('Invalid order history.');
      return result.map(checkedOrder);
    },
  };
}
