import test from 'node:test';
import assert from 'node:assert/strict';
import { authenticatedRequest, signOutThisBrowser } from '../src/lib/authClient.js';
import { cartEmptyMessage, cartView, guestAttempt } from '../src/lib/cartClient.js';
const userId = 'customer-a';
const session = token => ({ user: { id: userId }, access_token: token });
const success = { items: [], revision: 4 };
function setup({ sessions = [session('old')], refreshError = null, statuses = [200] } = {}) {
  let index = 0, refreshCalls = 0, lostCalls = 0;
  const sent = [];
  const client = { auth: {
    getSession: async () => ({ data: { session: sessions[Math.min(index++, sessions.length - 1)] }, error: null }),
    refreshSession: async () => { refreshCalls++; return { data: { session: session('new') }, error: refreshError }; },
  } };
  const execute = overrides => authenticatedRequest({ client, userId, url: '/cart',
    onSessionLost: owner => { assert.equal(owner, userId); lostCalls++; },
    fetcher: async (_url, options) => { sent.push(options); return Response.json({ cart: success }, { status: statuses[Math.min(sent.length - 1, statuses.length - 1)] }); }, ...overrides });
  return { client, sent, execute, get refreshCalls() { return refreshCalls; }, get lostCalls() { return lostCalls; } };
}
test('sign out explicitly targets this browser session instead of all browsers', async () => {
  let options;
  await signOutThisBrowser({ auth: { signOut: async value => { options = value; return { error: null }; } } });
  assert.deepEqual(options, { scope: 'local' });
});
test('cart reads latest SDK token each time rather than the render-time session', async () => {
  const mock = setup({ sessions: [session('first'), session('rotated')] });
  await mock.execute(); await mock.execute();
  assert.deepEqual(mock.sent.map(options => options.headers.Authorization), ['Bearer first', 'Bearer rotated']);
});
test('401 refreshes once and resends the exact guest merge with its latest token', async () => {
  const mock = setup({ sessions: [session('old'), session('old'), session('new')], statuses: [401, 200] });
  const body = JSON.stringify({ operationId: 'same-merge-id', items: [{ productId: 'bigger-tee', size: 'S', quantity: 2 }] });
  const response = await mock.execute({ options: { method: 'POST', body } });
  assert.equal(response.status, 200); assert.equal(mock.refreshCalls, 1); assert.equal(mock.lostCalls, 0);
  assert.deepEqual(mock.sent.map(options => options.body), [body, body]);
  assert.deepEqual(mock.sent.map(options => options.headers.Authorization), ['Bearer old', 'Bearer new']);
});
test('401 uses an already-rotated token without redundantly refreshing', async () => {
  const mock = setup({ sessions: [session('old'), session('new')], statuses: [401, 200] });
  await mock.execute(); assert.equal(mock.refreshCalls, 0);
  assert.equal(mock.sent[1].headers.Authorization, 'Bearer new');
});
test('revoked refresh token requires sign-in, never produces an empty cart, and preserves guest retry storage', async () => {
  const values = new Map();
  const storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) };
  const items = [{ productId: 'bigger-tee', size: 'S', quantity: 2 }];
  storage.setItem('guest', JSON.stringify(items));
  const attempt = guestAttempt(storage, 'retry', items, () => 'stable-id');
  const before = [...values];
  const mock = setup({ statuses: [401], refreshError: { status: 400, code: 'refresh_token_not_found' } });
  await assert.rejects(mock.execute({ options: { method: 'POST', body: JSON.stringify(attempt) } }), { code: 'SESSION_LOST' });
  assert.equal(mock.lostCalls, 1); assert.equal(mock.sent.length, 1);
  assert.deepEqual([...values], before);
  const hidden = cartView({ owner: userId, items, status: 'ready' }, userId, true);
  assert.deepEqual(hidden, { items: [], status: 'session-lost' });
  assert.match(cartEmptyMessage(hidden.status), /Sign in again/);
  assert.notEqual(cartEmptyMessage(hidden.status), 'Your cart is empty.');
});
test('second 401 stops after one retry; missing session sends no request', async () => {
  const mock = setup({ sessions: [session('old'), session('old'), session('new')], statuses: [401, 401] });
  await assert.rejects(mock.execute(), { code: 'SESSION_LOST' });
  assert.equal(mock.refreshCalls, 1); assert.equal(mock.sent.length, 2); assert.equal(mock.lostCalls, 1);
  const missing = setup({ sessions: [null] });
  await assert.rejects(missing.execute(), { code: 'SESSION_LOST' }); assert.equal(missing.sent.length, 0);
});
test('network/503/429 refresh failures preserve authentication and do not become empty cart success', async () => {
  for (const status of [503, 429]) {
    const mock = setup({ statuses: [401], refreshError: { status } });
    await assert.rejects(mock.execute(), { code: 'AUTH_UNAVAILABLE' }); assert.equal(mock.lostCalls, 0);
  }
  const unavailable = setup({ statuses: [503] });
  assert.equal((await unavailable.execute()).status, 503); assert.equal(unavailable.refreshCalls, 0); assert.equal(unavailable.lostCalls, 0);
  const network = setup();
  await assert.rejects(network.execute({ fetcher: async () => { throw new TypeError('Network unavailable'); } }), /Network unavailable/);
  assert.equal(network.lostCalls, 0);
});
test('account switch during refresh blocks retry and cannot sign out the new customer', async () => {
  const mock = setup({ statuses: [401] });
  let active = true;
  mock.client.auth.refreshSession = async () => { active = false; return { error: { status: 400 } }; };
  await assert.rejects(mock.execute({ active: () => active }), { code: 'ACCOUNT_CHANGED' });
  assert.equal(mock.sent.length, 1); assert.equal(mock.lostCalls, 0);
});
test('account switch during a response prevents using its cart', async () => {
  const mock = setup(); let active = true;
  await assert.rejects(mock.execute({ active: () => active, fetcher: async () => { active = false; return Response.json({ cart: success }); } }), { code: 'ACCOUNT_CHANGED' });
  assert.equal(mock.lostCalls, 0);
});
test('only confirmed ready data means empty; failed loads retain last known cart and ownership isolation', () => {
  const items = [{ productId: 'bigger-tee', size: 'S', quantity: 2 }];
  assert.deepEqual(cartView({ owner: userId, items, status: 'error' }, userId, false), { items, status: 'error' });
  assert.match(cartEmptyMessage('error'), /could not be loaded/);
  assert.match(cartEmptyMessage('loading'), /Loading/);
  assert.equal(cartEmptyMessage('ready'), 'Your cart is empty.');
  assert.deepEqual(cartView({ owner: userId, items, status: 'ready' }, 'customer-b', false), { items: [], status: 'loading' });
  assert.deepEqual(cartView({ owner: userId, items, status: 'ready' }, null, true), { items: [], status: 'session-lost' });
});

test('actual Cart and Checkout rendering distinguishes session loss, loading, errors and confirmed emptiness', async () => {
  const { createServer } = await import('vite');
  const { default: react } = await import('@vitejs/plugin-react');
  const { createElement } = await import('react');
  const { renderToStaticMarkup } = await import('react-dom/server');
  const server = await createServer({ configFile: false, logLevel: 'error', optimizeDeps: { noDiscovery: true, include: [] }, plugins: [react()], server: { middlewareMode: true, hmr: false, ws: false, watch: null } });
  try {
    const { default: Cart } = await server.ssrLoadModule('/src/components/Cart.jsx');
    const { default: Checkout } = await server.ssrLoadModule('/src/components/Checkout.jsx');
    for (const status of ['session-lost', 'loading', 'error', 'ready']) {
      const cartHtml = renderToStaticMarkup(createElement(Cart, { cart: [], status, setCart() {} }));
      const checkoutHtml = renderToStaticMarkup(createElement(Checkout, { cart: [], cartStatus: status }));
      for (const html of [cartHtml, checkoutHtml]) {
        if (status === 'ready') assert.match(html, /Your cart is empty/);
        else assert.doesNotMatch(html, /Your cart is empty/);
        if (status === 'session-lost') { assert.match(html, /Sign in again/); assert.match(html, /href="#account"/); }
      }
    }
  } finally { await server.close(); }
});

test('refresh-token rejection does not discard a newer session committed by another tab', async () => {
  const mock = setup({ sessions: [session('old'), session('old'), session('other-tab-new')], refreshError: { status: 400 }, statuses: [401, 200] });
  assert.equal((await mock.execute()).status, 200);
  assert.equal(mock.lostCalls, 0); assert.equal(mock.sent[1].headers.Authorization, 'Bearer other-tab-new');
});

test('getSession refresh errors distinguish definitive revocation from service failure', async () => {
  for (const [status, code] of [[400, 'SESSION_LOST'], [503, 'AUTH_UNAVAILABLE']]) {
    const mock = setup();
    mock.client.auth.getSession = async () => ({ data: { session: null }, error: { status } });
    await assert.rejects(mock.execute(), { code });
    assert.equal(mock.sent.length, 0); assert.equal(mock.lostCalls, status === 400 ? 1 : 0);
  }
});
