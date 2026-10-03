import { prepareOrder, confirmationEmail } from '../lib/orders.mjs';

const json = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
export function createHandler({ env = process.env, fetcher = fetch } = {}) {
  return async (request) => {
    if (request.method !== 'POST') return json({ error: 'Use POST to submit an order.' }, 405);
    const { SUPABASE_URL: url, SUPABASE_SECRET_KEY: secret } = env;
    if (!url || !secret) return json({ error: 'Order service is not configured yet.' }, 503);
    const token = request.headers.get('authorization')?.match(/^Bearer (\S+)$/i)?.[1];
    if (!token) return json({ error: 'Sign in before placing your order.' }, 401);
    let user;
    try {
      const response = await fetcher(url + '/auth/v1/user', { headers: { apikey: secret, Authorization: 'Bearer ' + token }, signal: AbortSignal.timeout(10000) });
      if (response.status === 401 || response.status === 403) return json({ error: 'Your session expired. Sign in again.' }, 401);
      if (!response.ok) throw new Error();
      user = await response.json();
      if (!user.id) throw new Error();
    } catch { return json({ error: 'Unable to verify your session. Please retry.' }, 503); }
    let prepared;
    try {
      const text = await request.text();
      if (Buffer.byteLength(text) > 32000) return json({ error: 'Order request is too large.' }, 413);
      prepared = prepareOrder(JSON.parse(text));
    } catch (error) { return json({ error: error instanceof SyntaxError ? 'Invalid order request.' : error.message }, 400); }
    const headers = { apikey: secret, ...(secret.startsWith('sb_secret_') ? {} : { Authorization: 'Bearer ' + secret }), 'Content-Type': 'application/json' };
    const db = async (path, options = {}) => {
      const response = await fetcher(url + '/rest/v1/' + path, { ...options, headers: { ...headers, ...options.headers }, signal: AbortSignal.timeout(10000) });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message === 'IDEMPOTENCY_CONFLICT' ? 'IDEMPOTENCY_CONFLICT' : 'DATABASE_ERROR');
      }
      return response.status === 204 ? null : response.json();
    };
    let order;
    try {
      order = await db('rpc/save_order', { method: 'POST', body: JSON.stringify({ p_user_id: user.id, p_key: prepared.key, p_hash: prepared.hash, p_delivery: prepared.delivery, p_items: prepared.items }) });
      if (!order?.id || !Array.isArray(order.order_items) || !Number.isFinite(order.total_naira)) throw new Error('DATABASE_ERROR');
    } catch (error) {
      return json({ error: error.message === 'IDEMPOTENCY_CONFLICT' ? 'This retry key belongs to different checkout details. Restore the original details or start a new order.' : 'Order persistence could not be confirmed. Retry with the same checkout details.', }, error.message === 'IDEMPOTENCY_CONFLICT' ? 409 : 503);
    }
    // The order is already durable. Email problems must never turn it into failure.
    let emailStatus = order.order_emails?.status || 'pending';
    try {
      const claimed = await db('order_emails?order_id=eq.' + order.id + '&status=eq.pending', { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ status: 'processing', updated_at: new Date().toISOString() }) });
      if (claimed?.length) {
        emailStatus = 'not_configured';
        let providerId = null;
        if (env.MAILGUN_API_KEY && env.MAILGUN_DOMAIN && env.MAILGUN_FROM) {
          emailStatus = 'unknown';
          try {
            const email = confirmationEmail(order);
            const form = new FormData();
            for (const [key, value] of Object.entries({ from: env.MAILGUN_FROM, to: order.delivery.email, subject: 'Beta Drips order confirmation — ' + order.id, ...email })) form.set(key, value);
            const base = env.MAILGUN_REGION === 'EU' ? 'https://api.eu.mailgun.net' : 'https://api.mailgun.net';
            const response = await fetcher(base + '/v3/' + encodeURIComponent(env.MAILGUN_DOMAIN) + '/messages', { method: 'POST', headers: { Authorization: 'Basic ' + Buffer.from('api:' + env.MAILGUN_API_KEY).toString('base64') }, body: form, signal: AbortSignal.timeout(10000) });
            if (response.ok) { const result = await response.json(); emailStatus = 'accepted'; providerId = result.id || null; }
            else emailStatus = 'failed';
          } catch { emailStatus = 'unknown'; }
        }
        await db('order_emails?order_id=eq.' + order.id, { method: 'PATCH', body: JSON.stringify({ status: emailStatus, provider_message_id: providerId, updated_at: new Date().toISOString() }) });
      } else {
        const latest = await db('order_emails?order_id=eq.' + order.id + '&select=status');
        emailStatus = latest?.[0]?.status || 'unknown';
      }
    } catch { emailStatus = 'unknown'; }
    return json({ order: { id: order.id, created_at: order.created_at, total_naira: order.total_naira, order_items: order.order_items }, emailStatus });
  };
}
export default createHandler();
