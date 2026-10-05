import test from 'node:test';
import assert from 'node:assert/strict';
import { createOrderController, ORDER_STORAGE_KEY } from '../lib/orderController.mjs';
import { createOrderApi, checkedOrder, ORDER_SELECT } from '../lib/orderApi.mjs';
import { createCartController } from '../lib/cartController.mjs';
import { prepareOrder } from '../../netlify/lib/orders.mjs';
import { validateCheckout } from '../../src/lib/checkout.js';
import { emailStatusText } from '../../src/lib/orderStatus.js';

const A = '11111111-1111-4111-8111-111111111111', B = '22222222-2222-4222-8222-222222222222';
const delivery = { name: 'Demo Customer', email: 'customer@example.test', phone: '08012345678', address: '12 Example Street, Lagos' };
const line = (size = 'S', quantity = 1) => ({ productId: 'bigger-tee', size, quantity });
const copy = value => JSON.parse(JSON.stringify(value));
const identity = (userId = A, sessionLost = false) => ({ userId, loading: false, sessionLost });
let sequence = 0;
const uuid = () => `33333333-3333-4333-8333-${String(++sequence).padStart(12, '0')}`;
function storageMock() {
  const values = new Map(); let fail = false;
  return { values, failNext: () => { fail = true; }, getItem: async key => values.get(key) ?? null,
    setItem: async (key, value) => { if (fail) { fail = false; throw new Error('storage unavailable'); } values.set(key, value); } };
}
// In-memory contract model; this does NOT execute PostgreSQL, RLS or live Mailgun.
function model() {
  const carts = new Map([[A, { items: [line()], revision: 2 }], [B, { items: [line('M', 4)], revision: 7 }]]);
  const orders = new Map(), hashes = new Map(), sends = [], cartCalls = [];
  let lose = false, before = null, historyFailure = false, malformed = false, cartFailure = false;
  return { carts, orders, sends, cartCalls, loseNext: () => { lose = true; }, before: value => { before = value; }, historyFailure: value => { historyFailure = value; }, malformed: value => { malformed = value; }, cartFailure: value => { cartFailure = value; },
    cartRequest: async ({ userId, operation }) => { cartCalls.push({ userId, operation }); assert.equal(operation, undefined, 'Checkout confirmation must only GET cart'); if (cartFailure) throw new Error('cart offline'); return copy(carts.get(userId) || { items: [], revision: 0 }); },
    api: {
      submit: async ({ userId, attempt }) => {
        sends.push(copy({ userId, attempt }));
        if (before) await before({ userId, attempt });
        const prepared = prepareOrder({ idempotencyKey: attempt.key, delivery: attempt.delivery, items: attempt.items });
        const key = userId + ':' + attempt.key;
        let saved = orders.get(key);
        if (saved) assert.equal(hashes.get(key), prepared.hash);
        else {
          const cart = carts.get(userId);
          if (cart?.revision !== attempt.cartRevision || JSON.stringify(cart.items) !== JSON.stringify(attempt.items)) throw Object.assign(new Error(), { code: 'CART_CONFLICT' });
          saved = { id: uuid(), created_at: '2026-10-05T12:00:00Z', total_naira: prepared.items.reduce((sum, item) => sum + item.quantity * item.unit_price_naira, 0), order_items: prepared.items, order_emails: { status: 'failed' } };
          orders.set(key, saved); hashes.set(key, prepared.hash);
          carts.set(userId, { items: [], revision: cart.revision + 1 });
        }
        if (lose) { lose = false; throw new Error('response lost after atomic commit'); }
        return { order: malformed ? { ...copy(saved), total_naira: 1 } : copy(saved), emailStatus: 'failed' };
      },
      history: async ({ userId }) => { if (historyFailure) throw new Error('offline'); return [...orders.entries()].filter(([key]) => key.startsWith(userId + ':')).map(([, value]) => copy(value)); },
    } };
}
function fixture(storage = storageMock(), server = model()) {
  const changes = [];
  const cart = createCartController({ storage, request: server.cartRequest, uuid, onChange: () => {}, initialHold: true });
  const orders = createOrderController({ storage, api: server.api, uuid, cart, onChange: state => changes.push(copy(state)) });
  const account = async (userId = A, sessionLost = false) => { await cart.setIdentity(identity(userId, sessionLost)); await orders.setIdentity(identity(userId, sessionLost)); };
  return { cart, orders, storage, server, changes, account };
}
const stored = storage => JSON.parse(storage.values.get(ORDER_STORAGE_KEY));

test('shared customer validation rejects invalid contact fields before saving or posting an order', async () => {
  const f = fixture(); await f.account();
  assert.ok(validateCheckout({ ...delivery, email: 'bad' }).email);
  assert.equal(await f.orders.submit({ ...delivery, email: 'bad' }), false);
  assert.equal(f.server.sends.length, 0); assert.deepEqual(f.cart.getState().items, [line()]); assert.equal(f.cart.getState().checkoutPending, false);
});

test('double submission creates one order, confirms atomic clearing and keeps email failure separate', async () => {
  const f = fixture(); await f.account();
  const first = f.orders.submit(delivery); const second = f.orders.submit(delivery);
  assert.equal(await second, false); assert.equal(await first, true);
  assert.equal(f.server.orders.size, 1); assert.equal(f.server.sends.length, 1);
  assert.equal(f.orders.getState().status, 'success'); assert.equal(f.orders.getState().result.emailStatus, 'failed');
  assert.deepEqual(f.cart.getState().items, []); assert.equal(f.cart.getState().checkoutPending, false);
  assert.equal(f.orders.getState().orders.length, 1); assert.match(emailStatusText('failed'), /order remains saved/);
  assert.equal(await f.orders.submit(delivery), false);
});

test('lost response keeps original payload/key; retry cannot clear items added later on website', async () => {
  const f = fixture(); await f.account(); f.server.loseNext();
  assert.equal(await f.orders.submit(delivery), false); assert.equal(f.orders.getState().status, 'retry');
  assert.deepEqual(f.cart.getState().items, [line()]); assert.equal(f.cart.getState().checkoutPending, true);
  const attempt = copy(stored(f.storage)[A]);
  f.server.carts.set(A, { items: [line('M', 5)], revision: 4 });
  assert.equal(await f.orders.submit({ ...delivery, name: 'Changed details' }), true);
  assert.equal(f.server.orders.size, 1); assert.deepEqual(f.server.sends[1].attempt, attempt);
  assert.deepEqual(f.cart.getState().items, [line('M', 5)]); assert.deepEqual(f.server.carts.get(A).items, [line('M', 5)]);
});

test('reopening restores pending checkout and freezes cart edits until same-key retry succeeds', async () => {
  const f = fixture(); await f.account(); f.server.loseNext(); await f.orders.submit(delivery);
  const old = copy(stored(f.storage)[A]); f.orders.dispose(); f.cart.dispose();
  const reopened = fixture(f.storage, f.server); await reopened.account();
  assert.equal(reopened.orders.getState().status, 'pending'); assert.deepEqual(reopened.orders.getState().attempt, old);
  assert.equal(reopened.cart.getState().checkoutPending, true); assert.equal(await reopened.cart.add('bigger-tee', 'M'), false);
  assert.equal(await reopened.orders.submit({}), true); assert.equal(reopened.server.orders.size, 1);
  assert.equal(reopened.server.sends.at(-1).attempt.key, old.key);
});

test('failed durable attempt write prevents a network send and preserves the shared cart', async () => {
  const f = fixture(); await f.account(); f.storage.failNext();
  assert.equal(await f.orders.submit(delivery), false); assert.equal(f.server.sends.length, 0);
  assert.deepEqual(f.cart.getState().items, [line()]); assert.equal(f.orders.getState().status, 'ready');
});

test('failed local confirmation after server success retains retry state without duplicate order', async () => {
  const f = fixture(); await f.account(); f.server.before(() => f.storage.failNext());
  assert.equal(await f.orders.submit(delivery), false); assert.equal(f.server.orders.size, 1);
  assert.equal(stored(f.storage)[A].result, undefined); assert.equal(f.cart.getState().checkoutPending, true);
  f.server.before(null); assert.equal(await f.orders.submit(delivery), true); assert.equal(f.server.orders.size, 1);
});

test('confirmed order survives reopening without POSTing again, and reads new cart items', async () => {
  const f = fixture(); await f.account(); await f.orders.submit(delivery);
  f.server.carts.set(A, { items: [line('M', 6)], revision: 4 });
  const reopened = fixture(f.storage, f.server); await reopened.account();
  assert.equal(reopened.orders.getState().status, 'success'); assert.equal(f.server.sends.length, 1);
  assert.deepEqual(reopened.cart.getState().items, [line('M', 6)]);
  assert.equal(await reopened.orders.startAnother(), true); assert.equal(stored(f.storage)[A], undefined);
  assert.equal(reopened.orders.getState().status, 'ready');
});

test('revision conflict clears only the rejected attempt, preserves newer cart and requires review', async () => {
  const f = fixture(); await f.account(); f.server.carts.set(A, { items: [line('M', 2)], revision: 3 });
  assert.equal(await f.orders.submit(delivery), false); assert.equal(f.server.orders.size, 0);
  assert.equal(stored(f.storage)[A], undefined); assert.equal(f.orders.getState().status, 'ready');
  assert.match(f.orders.getState().error, /another device/); assert.deepEqual(f.cart.getState().items, [line('M', 2)]);
});

test('account changes and session loss isolate pending checkout details and histories', async () => {
  const f = fixture(); await f.account(); f.server.loseNext(); await f.orders.submit(delivery);
  const original = copy(stored(f.storage)[A]); await f.account(null, true);
  assert.equal(f.orders.getState().attempt, null); assert.deepEqual(f.orders.getState().orders, []);
  await f.account(B); assert.equal(f.orders.getState().attempt, null); assert.deepEqual(f.orders.getState().orders, []);
  assert.deepEqual(stored(f.storage)[A], original); assert.deepEqual(f.cart.getState().items, [line('M', 4)]);
  await f.account(A); assert.equal(f.orders.getState().attempt.key, original.key); await f.orders.submit(delivery);
  assert.equal(f.server.orders.size, 1);
});

test('late checkout response does not publish old-account order or clear new-account cart', async () => {
  const f = fixture(); await f.account(); let begin, finish;
  const began = new Promise(resolve => { begin = resolve; }); const held = new Promise(resolve => { finish = resolve; });
  f.server.before(async () => { begin(); await held; }); const pending = f.orders.submit(delivery); await began;
  await f.cart.setIdentity(identity(B)); const count = f.changes.length; const switched = f.orders.setIdentity(identity(B));
  assert.equal(f.orders.getState().result, null); finish(); assert.equal(await pending, false); await switched;
  assert.deepEqual(f.cart.getState().items, [line('M', 4)]); assert.equal(f.orders.getState().owner, B);
  assert.ok(f.changes.slice(count).every(state => state.owner === B && !state.result && state.attempt === null));
  assert.equal(stored(f.storage)[A].result, undefined);
});

test('history distinguishes real emptiness from network failure and retains last loaded entries', async () => {
  const f = fixture(); await f.account(); assert.equal(f.orders.getState().historyStatus, 'ready'); assert.deepEqual(f.orders.getState().orders, []);
  await f.orders.submit(delivery); f.server.historyFailure(true); await f.orders.refreshHistory();
  assert.equal(f.orders.getState().historyStatus, 'error'); assert.equal(f.orders.getState().orders.length, 1);
  f.server.historyFailure(false); await f.orders.refreshHistory(); assert.equal(f.orders.getState().historyStatus, 'ready');
});

test('malformed successful response does not confirm checkout or release the cart hold', async () => {
  const f = fixture(); await f.account(); f.server.malformed(true);
  assert.equal(await f.orders.submit(delivery), false); assert.equal(f.orders.getState().status, 'retry');
  assert.equal(f.cart.getState().checkoutPending, true); assert.deepEqual(f.cart.getState().items, [line()]);
  f.server.malformed(false); await f.orders.submit(delivery); assert.equal(f.server.orders.size, 1);
});

test('order API uses current customer JWT/public key and refreshes with unchanged POST body', async () => {
  const f = fixture(); await f.account(); await f.orders.submit(delivery); const saved = f.orders.getState().result;
  let token = 'old'; const calls = [];
  const client = { auth: { getSession: async () => ({ data: { session: { user: { id: A }, access_token: token } } }), refreshSession: async () => { token = 'new'; return {}; } } };
  const api = createOrderApi({ client, baseUrl: 'http://127.0.0.1:8888', supabaseUrl: 'https://public.example.test', publishableKey: 'sb_publishable_mock', fetcher: async (url, options) => {
    calls.push({ url, options });
    if (calls.length === 1) return Response.json({}, { status: 401 });
    return Response.json(url.includes('/orders?') ? [saved.order] : saved);
  } });
  await api.submit({ userId: A, active: () => true, attempt: stored(f.storage)[A] });
  assert.equal(calls[0].options.body, calls[1].options.body); assert.equal(calls[1].options.headers.Authorization, 'Bearer new');
  await api.history({ userId: A, active: () => true }); const query = new URL(calls.at(-1).url);
  assert.equal(query.searchParams.get('select'), ORDER_SELECT); assert.equal(query.searchParams.get('user_id'), 'eq.' + A);
  assert.equal(calls.at(-1).options.headers.apikey, 'sb_publishable_mock');
  assert.equal(calls.at(-1).options.headers.Authorization, 'Bearer new');
});

test('order API rejects wrong-account session before sending and rejects malformed/failed history', async () => {
  let sends = 0;
  const client = { auth: { getSession: async () => ({ data: { session: { user: { id: B }, access_token: 'mock' } } }) } };
  const api = createOrderApi({ client, fetcher: async () => { sends++; }, supabaseUrl: 'https://example.test', publishableKey: 'sb_publishable_mock' });
  await assert.rejects(api.history({ userId: A, active: () => true }), failure => failure.code === 'ACCOUNT_CHANGED'); assert.equal(sends, 0);
  for (const response of [Response.json({}, { status: 503 }), Response.json({}), Response.json([{ id: 'not-an-order' }])]) {
    const bad = createOrderApi({ client, fetcher: async () => response, supabaseUrl: 'https://example.test', publishableKey: 'sb_publishable_mock' });
    await assert.rejects(bad.history({ userId: B, active: () => true }));
  }
  assert.throws(() => checkedOrder({ id: '---' }));
});

test('checkout confirmation is guarded against a different current cart owner', async () => {
  const f = fixture(); await f.account(); await f.orders.submit(delivery); await f.account(B);
  const before = f.server.cartCalls.length;
  assert.equal(await f.cart.confirmCheckout(A), false); assert.equal(f.server.cartCalls.length, before);
  assert.deepEqual(f.cart.getState().items, [line('M', 4)]);
});

test('confirmed order remains successful when current cart reload fails; failure is not an empty success', async () => {
  const f = fixture(); await f.account(); f.server.before(() => f.server.cartFailure(true));
  assert.equal(await f.orders.submit(delivery), true); assert.equal(f.orders.getState().status, 'success');
  assert.equal(f.cart.getState().status, 'error'); assert.equal(f.server.orders.size, 1);
  f.server.cartFailure(false); await f.cart.refresh(); assert.equal(f.cart.getState().status, 'ready');
});

test('corrupted pending-checkout storage does not silently permit a new order or delete saved data', async () => {
  const f = fixture(); f.storage.values.set(ORDER_STORAGE_KEY, '{invalid'); await f.account();
  assert.equal(f.orders.getState().status, 'error'); assert.equal(f.cart.getState().checkoutPending, true);
  assert.equal(await f.orders.submit(delivery), false); assert.equal(f.server.sends.length, 0);
  assert.equal(f.storage.values.get(ORDER_STORAGE_KEY), '{invalid');
});

test('late history response is ignored after account switch and the new account is refreshed', async () => {
  const f = fixture(); await f.account(); await f.orders.submit(delivery);
  const original = f.server.api.history; let begin, finish;
  const began = new Promise(resolve => { begin = resolve; }); const held = new Promise(resolve => { finish = resolve; });
  f.server.api.history = async args => { const result = await original(args); if (args.userId === A) { begin(); await held; } return result; };
  const old = f.orders.refreshHistory(); await began; await f.account(B);
  assert.deepEqual(f.orders.getState().orders, []); finish(); await old;
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(f.orders.getState().owner, B); assert.equal(f.orders.getState().historyStatus, 'ready'); assert.deepEqual(f.orders.getState().orders, []);
});
