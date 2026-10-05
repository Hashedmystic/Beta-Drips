import { prepareCart } from '../lib/carts.mjs';
const json = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
export function createHandler({ env = process.env, fetcher = fetch } = {}) {
  return async request => {
    if (!['GET', 'POST'].includes(request.method)) return json({ error: 'Use GET or POST.' }, 405);
    const { SUPABASE_URL: url, SUPABASE_SECRET_KEY: secret } = env;
    if (!url || !secret) return json({ error: 'Cart service is not configured.' }, 503);
    const token = request.headers.get('authorization')?.match(/^Bearer (\S+)$/i)?.[1];
    if (!token) return json({ error: 'Sign in to access your cart.' }, 401);
    let user;
    try {
      const response = await fetcher(url + '/auth/v1/user', { headers: { apikey: secret, Authorization: 'Bearer ' + token }, signal: AbortSignal.timeout(10000) });
      if ([401, 403].includes(response.status)) return json({ error: 'Your session expired.' }, 401);
      if (!response.ok) throw new Error();
      user = await response.json();
      if (!user.id) throw new Error();
    } catch { return json({ error: 'Unable to verify sign-in.' }, 503); }
    let body, prepared;
    if (request.method === 'POST') {
      try {
        const text = await request.text();
        if (Buffer.byteLength(text) > 32000) return json({ error: 'Cart request is too large.' }, 413);
        body = JSON.parse(text); prepared = prepareCart(body);
      } catch { return json({ error: 'Invalid cart operation, product, size or quantity.' }, 400); }
    }
    const headers = { apikey: secret, ...(secret.startsWith('sb_secret_') ? {} : { Authorization: 'Bearer ' + secret }), 'Content-Type': 'application/json' };
    try {
      const response = await fetcher(url + '/rest/v1/' + (body ? 'rpc/change_cart' : 'customer_carts?user_id=eq.' + encodeURIComponent(user.id) + '&select=items,revision'), {
        headers, signal: AbortSignal.timeout(10000), ...(body ? { method: 'POST', body: JSON.stringify({ p_user_id: user.id, p_operation_id: body.operationId, p_hash: prepared.hash, p_revision: body.revision, p_mode: body.mode, p_items: prepared.items }) } : {}),
      });
      const data = await response.json();
      if (!response.ok) {
        if (['CART_CONFLICT', 'IDEMPOTENCY_CONFLICT', 'CART_LIMIT'].includes(data.message)) return json({ error: data.message, code: data.message }, 409);
        throw new Error();
      }
      return json({ cart: body ? data : data[0] || { items: [], revision: 0 } });
    } catch { return json({ error: 'Cart saving or loading could not be confirmed. Retry.' }, 503); }
  };
}
export default createHandler();
