import test from 'node:test';
import assert from 'node:assert/strict';
import { createCartController, CART_STORAGE_KEY } from '../lib/cartController.mjs';
import { apiBaseUrl, checkedCart, createCartApi } from '../lib/cartApi.mjs';
import { cartTotal } from '../../src/data/cartModel.js';
import { startCartRefresh } from '../lib/cartRefresh.mjs';

const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const line = (quantity = 1, size = 'S') => ({ productId: 'bigger-tee', size, quantity });
const clone = value => JSON.parse(JSON.stringify(value));
function memory() {
  const values = new Map(); let fail = false;
  return { values, failNext: () => { fail = true; }, getItem: async key => values.get(key) ?? null,
    setItem: async (key, value) => { if (fail) { fail = false; throw new Error('storage failure'); } values.set(key, value); } };
}
// Contract model only: these are not PostgreSQL/RLS tests.
function service() {
  const carts = new Map(), receipts = new Map(), calls = [];
  let loseNext = false, before = null;
  return { carts, receipts, calls, loseNext: () => { loseNext = true; }, before: value => { before = value; },
    request: async args => {
      calls.push(clone({ userId: args.userId, operation: args.operation || null }));
      if (before) await before(args);
      let cart = clone(carts.get(args.userId) || { items: [], revision: 0 });
      const op = args.operation;
      if (op) {
        const key = args.userId + op.operationId, hash = JSON.stringify(op);
        if (receipts.has(key)) { assert.equal(receipts.get(key), hash); return cart; }
        if (op.mode === 'replace' && op.revision !== cart.revision) throw Object.assign(new Error(), { code: 'CART_CONFLICT' });
        let items = clone(op.items);
        if (op.mode === 'merge') {
          items = clone(cart.items);
          for (const item of op.items) { const existing = items.find(old => old.productId === item.productId && old.size === item.size); if (existing) existing.quantity += item.quantity; else items.push(clone(item)); }
        }
        if (items.length > 100 || items.some(item => item.quantity > 99)) throw Object.assign(new Error(), { code: 'CART_LIMIT' });
        cart = { items, revision: cart.revision + 1 }; carts.set(args.userId, clone(cart)); receipts.set(key, hash);
        if (loseNext) { loseNext = false; throw new Error('Lost response after commit'); }
      }
      return cart;
    } };
}
let sequence = 0;
const uuid = () => `33333333-3333-4333-8333-${String(++sequence).padStart(12, '0')}`;
const identity = (userId = null, sessionLost = false) => ({ userId, loading: false, sessionLost });
function controller(storage = memory(), server = service()) {
  const changes = [];
  const cart = createCartController({ storage, request: server.request, uuid, onChange: state => changes.push(clone(state)) });
  return { cart, storage, server, changes };
}
const journal = storage => JSON.parse(storage.values.get(CART_STORAGE_KEY));

test('guest edits persist across reopen, keep distinct sizes, validate bounds and calculate trusted totals', async () => {
  const { cart, storage, server } = controller(); await cart.setIdentity(identity());
  await Promise.all([cart.add('bigger-tee', 'S'), cart.add('bigger-tee', 'S')]);
  await cart.add('bigger-tee', 'M');
  assert.deepEqual(cart.getState().items, [line(2), line(1, 'M')]);
  assert.ok(cartTotal(cart.getState().items) > 0);
  assert.equal(await cart.add('fake', 'S'), false);
  assert.equal(await cart.quantity('bigger-tee', 'S', 100), false);
  assert.equal(cart.getState().items[0].quantity, 2);
  const reopened = controller(storage, server).cart; await reopened.setIdentity(identity());
  assert.deepEqual(reopened.getState().items, cart.getState().items);
  await reopened.remove('bigger-tee', 'S'); assert.deepEqual(reopened.getState().items, [line(1, 'M')]);
  assert.equal(server.calls.length, 0);
});

test('guest merge combines matching sizes once and survives reopen/refresh without duplication', async () => {
  const { cart, storage, server } = controller(); server.carts.set(A, { items: [line(2)], revision: 4 });
  await cart.setIdentity(identity()); await cart.add('bigger-tee', 'S'); await cart.add('bigger-tee', 'M');
  await cart.setIdentity(identity(A)); assert.deepEqual(cart.getState().items, [line(3), line(1, 'M')]);
  assert.deepEqual(journal(storage).guest, []); assert.equal(journal(storage).claim, null);
  await cart.refresh(); const reopened = controller(storage, server).cart; await reopened.setIdentity(identity(A));
  assert.equal(server.calls.filter(call => call.operation?.mode === 'merge').length, 1);
  assert.deepEqual(reopened.getState().items, [line(3), line(1, 'M')]);
});

test('lost merge response preserves guest snapshot and receipt; retry returns newer server contents', async () => {
  const { cart, storage, server } = controller(); await cart.setIdentity(identity()); await cart.add('bigger-tee', 'S');
  server.loseNext(); await cart.setIdentity(identity(A));
  assert.equal(cart.getState().status, 'error'); assert.deepEqual(journal(storage).guest, [line()]);
  const operationId = journal(storage).claim.operation.operationId;
  server.carts.set(A, { items: [line(4), line(2, 'M')], revision: 2 }); // website changed after the merge
  const reopened = controller(storage, server).cart; await reopened.setIdentity(identity(A));
  assert.deepEqual(reopened.getState().items, [line(4), line(2, 'M')]);
  assert.equal(server.calls.at(-1).operation.operationId, operationId);
  assert.deepEqual(journal(storage).guest, []);
});

test('failure to finalize local merge after server success retries the same ID safely', async () => {
  const { cart, storage, server } = controller(); await cart.setIdentity(identity()); await cart.add('bigger-tee', 'S');
  server.before(async ({ operation }) => { if (operation) storage.failNext(); });
  await cart.setIdentity(identity(A)); assert.equal(cart.getState().status, 'error');
  const id = journal(storage).claim.operation.operationId; assert.deepEqual(journal(storage).guest, [line()]);
  server.before(null); await cart.refresh();
  assert.equal(server.calls.at(-1).operation.operationId, id); assert.equal(server.carts.get(A).items[0].quantity, 1);
  assert.deepEqual(journal(storage).guest, []);
});

test('pending merge is reserved for its initiating account; late responses never populate another account', async () => {
  const { cart, storage, server } = controller(); await cart.setIdentity(identity()); await cart.add('bigger-tee', 'S');
  let release, started; const pending = new Promise(resolve => { release = resolve; }); const observed = new Promise(resolve => { started = resolve; });
  server.before(async args => { if (args.userId === A) { started(); await pending; } });
  const first = cart.setIdentity(identity(A)); await observed;
  server.carts.set(B, { items: [line(7, 'M')], revision: 3 });
  const switched = cart.setIdentity(identity(B)); assert.deepEqual(cart.getState().items, []);
  release(); await first; await switched;
  assert.deepEqual(cart.getState().items, [line(7, 'M')]); assert.equal(journal(storage).claim.userId, A);
  await cart.setIdentity(identity()); assert.equal(cart.getState().status, 'reserved'); assert.deepEqual(cart.getState().items, []);
  assert.equal(await cart.add('bigger-tee', 'M'), false);
  server.before(null); await cart.setIdentity(identity(A)); assert.deepEqual(cart.getState().items, [line()]); assert.deepEqual(journal(storage).guest, []);
});

test('stale replacement refreshes newer cart and requires a new user intent', async () => {
  const { cart, server, storage } = controller(); server.carts.set(A, { items: [line()], revision: 1 });
  await cart.setIdentity(identity(A)); server.carts.set(A, { items: [line(4)], revision: 2 });
  assert.equal(await cart.add('bigger-tee', 'S'), false);
  assert.deepEqual(cart.getState().items, [line(4)]); assert.match(cart.getState().error, /another device/);
  assert.equal(journal(storage).pending[A], undefined);
  assert.equal(await cart.add('bigger-tee', 'S'), true); assert.deepEqual(server.carts.get(A).items, [line(5)]);
});

test('lost replacement retries identical payload before accepting further edits', async () => {
  const { cart, server, storage } = controller(); await cart.setIdentity(identity(A)); server.loseNext();
  assert.equal(await cart.add('bigger-tee', 'S'), false);
  const saved = clone(journal(storage).pending[A]);
  await cart.refresh(); assert.deepEqual(server.calls.at(-1).operation, saved); assert.deepEqual(cart.getState().items, [line()]);
  await cart.add('bigger-tee', 'M'); assert.deepEqual(cart.getState().items, [line(), line(1, 'M')]);
});

test('merge limit preserves guest cart without endlessly retrying while active', async () => {
  const { cart, storage, server } = controller(); await cart.setIdentity(identity()); await cart.add('bigger-tee', 'S');
  server.carts.set(A, { items: [line(99)], revision: 1 }); await cart.setIdentity(identity(A));
  assert.equal(cart.getState().items[0].quantity, 99); assert.deepEqual(journal(storage).guest, [line()]);
  const count = server.calls.filter(call => call.operation?.mode === 'merge').length;
  await cart.refresh(false); assert.equal(server.calls.filter(call => call.operation?.mode === 'merge').length, count);
  server.carts.set(A, { items: [line(98)], revision: 2 }); await cart.refresh(true);
  assert.equal(cart.getState().items[0].quantity, 99); assert.deepEqual(journal(storage).guest, []);
});

test('network failure retains confirmed items; session loss hides them without creating a guest cart', async () => {
  const { cart, server, storage } = controller(); server.carts.set(A, { items: [line(3)], revision: 1 }); await cart.setIdentity(identity(A));
  server.before(() => { throw new Error('offline'); }); await cart.refresh();
  assert.equal(cart.getState().status, 'error'); assert.deepEqual(cart.getState().items, [line(3)]);
  server.before(() => { throw Object.assign(new Error(), { code: 'SESSION_LOST' }); }); await cart.refresh();
  assert.equal(cart.getState().status, 'session-lost'); assert.deepEqual(cart.getState().items, []);
  await cart.setIdentity(identity(null, true)); assert.deepEqual(cart.getState().items, []);
  assert.equal(storage.values.has(CART_STORAGE_KEY), false); assert.deepEqual(server.carts.get(A).items, [line(3)]);
  server.before(null); await cart.setIdentity(identity(A)); assert.deepEqual(cart.getState().items, [line(3)]);
});

test('storage failure prevents sending a write and preserves previous guest data; corrupt data is an error', async () => {
  const { cart, storage, server } = controller(); await cart.setIdentity(identity()); await cart.add('bigger-tee', 'S');
  storage.failNext(); assert.equal(await cart.add('bigger-tee', 'M'), false); assert.deepEqual(cart.getState().items, [line()]);
  storage.failNext(); await cart.setIdentity(identity(A)); assert.equal(server.calls.length, 0); assert.deepEqual(journal(storage).guest, [line()]);
  storage.values.set(CART_STORAGE_KEY, '{corrupt'); const reopened = controller(storage, server).cart; await reopened.setIdentity(identity());
  assert.equal(reopened.getState().status, 'error'); assert.equal(await reopened.add('bigger-tee', 'S'), false); assert.equal(storage.values.get(CART_STORAGE_KEY), '{corrupt');
});

test('API configuration permits HTTPS and development USB localhost only; rejects malformed success', () => {
  assert.equal(apiBaseUrl(), 'https://betadrips.netlify.app'); assert.equal(apiBaseUrl('http://127.0.0.1:8888', true), 'http://127.0.0.1:8888');
  for (const [url, dev] of [['http://127.0.0.1:8888', false], ['http://192.168.1.2:8888', true], ['https://user:password@example.com', false], ['https://example.com/path', true]]) assert.throws(() => apiBaseUrl(url, dev));
  for (const cart of [undefined, { items: [], revision: -1 }, { items: [line(), line()], revision: 0 }, { items: [line(100)], revision: 0 }, { items: [{ ...line(), size: 'fake' }], revision: 1 }]) assert.throws(() => checkedCart(cart));
});

test('API reads current tokens and refreshes a rejected token; 503 and malformed responses are failures', async () => {
  let token = 'first', refreshed = 0, lost = 0; const sent = [];
  const client = { auth: { getSession: async () => ({ data: { session: { user: { id: A }, access_token: token } } }), refreshSession: async () => { refreshed++; token = 'fresh'; return {}; } } };
  const request = createCartApi({ client, baseUrl: apiBaseUrl(), onSessionLost: () => lost++, fetcher: async (_, options) => { sent.push(options.headers.Authorization); return sent.length === 1 ? Response.json({}, { status: 401 }) : Response.json({ cart: { items: [line()], revision: 1 } }); } });
  assert.deepEqual(await request({ userId: A, active: () => true }), { items: [line()], revision: 1 }); assert.deepEqual(sent, ['Bearer first', 'Bearer fresh']); assert.equal(refreshed, 1); assert.equal(lost, 0);
  for (const response of [Response.json({}, { status: 503 }), Response.json({ cart: { items: [], revision: '1' } })]) {
    const fail = createCartApi({ client, baseUrl: apiBaseUrl(), fetcher: async () => response, onSessionLost: () => lost++ }); await assert.rejects(fail({ userId: A, active: () => true }));
  }
  const reject = createCartApi({ client, baseUrl: apiBaseUrl(), fetcher: async () => Response.json({}, { status: 401 }), onSessionLost: () => lost++ });
  await assert.rejects(reject({ userId: A, active: () => true }), error => error.code === 'SESSION_LOST'); assert.equal(lost, 1);
});

test('foreground refresh and polling stop in background and clean up on disposal', () => {
  let change, tick, signedIn = true, calls = 0, cleared = 0, removed = false;
  const appState = { currentState: 'active', addEventListener: (_, callback) => { change = callback; return { remove: () => { removed = true; } }; } };
  const timers = { setInterval: (callback, delay) => { assert.equal(delay, 15000); tick = callback; return 1; }, clearInterval: () => cleared++ };
  const stop = startCartRefresh({ appState, refresh: () => calls++, isSignedIn: () => signedIn, timers });
  tick(); assert.equal(calls, 1); signedIn = false; tick(); assert.equal(calls, 1);
  appState.currentState = 'background'; change('background'); tick(); assert.equal(calls, 1);
  appState.currentState = 'active'; change('active'); assert.equal(calls, 2); signedIn = true; tick(); assert.equal(calls, 3);
  stop(); assert.ok(cleared >= 2); assert.equal(removed, true);
});

test('late GET after account switching cannot expose old items or mark the new cart empty', async () => {
  const { cart, server, changes } = controller(); server.carts.set(A, { items: [line(8)], revision: 2 }); server.carts.set(B, { items: [line(6, 'M')], revision: 1 });
  let finish, begin; const held = new Promise(resolve => { finish = resolve; }); const began = new Promise(resolve => { begin = resolve; });
  server.before(async args => { if (args.userId === A) { begin(); await held; } });
  const old = cart.setIdentity(identity(A)); await began;
  const firstNew = changes.length; const switched = cart.setIdentity(identity(B));
  finish(); await old; await switched;
  assert.deepEqual(cart.getState().items, [line(6, 'M')]);
  assert.ok(changes.slice(firstNew).every(state => state.owner === B && !state.items.some(item => item.quantity === 8)));
});

test('failed pending merge stays owned by the account after actual session loss and sign-in', async () => {
  const { cart, server, storage } = controller(); await cart.setIdentity(identity()); await cart.add('bigger-tee', 'S');
  server.loseNext(); await cart.setIdentity(identity(A)); const saved = clone(journal(storage).claim);
  await cart.setIdentity(identity(null, true)); assert.deepEqual(cart.getState().items, []); assert.deepEqual(journal(storage).claim, saved);
  await cart.setIdentity(identity(B)); assert.deepEqual(cart.getState().items, []); assert.deepEqual(journal(storage).claim, saved);
  await cart.setIdentity(identity(A)); assert.deepEqual(cart.getState().items, [line()]); assert.equal(server.carts.get(A).revision, 1);
});

test('POST authentication retry reuses the same operation body and future requests read newer tokens', async () => {
  let token = 'old'; const sent = []; const operation = { operationId: uuid(), mode: 'replace', revision: 2, items: [line()] };
  const client = { auth: { getSession: async () => ({ data: { session: { user: { id: A }, access_token: token } } }), refreshSession: async () => { token = 'rotated'; return {}; } } };
  const request = createCartApi({ client, baseUrl: apiBaseUrl(), fetcher: async (_, options) => { sent.push({ token: options.headers.Authorization, body: options.body }); return sent.length === 1 ? Response.json({}, { status: 401 }) : Response.json({ cart: { items: [line()], revision: 3 } }); } });
  await request({ userId: A, active: () => true, operation });
  assert.equal(sent[0].body, sent[1].body); assert.deepEqual(JSON.parse(sent[1].body), operation);
  token = 'latest'; await request({ userId: A, active: () => true }); assert.equal(sent.at(-1).token, 'Bearer latest');
});

test('failed sign-out loading preserves same-account snapshot on network failure; actual sign-out clears it', async () => {
  const { cart, server } = controller(); server.carts.set(A, { items: [line(5)], revision: 2 }); await cart.setIdentity(identity(A));
  await cart.setIdentity({ userId: A, loading: true, sessionLost: false });
  server.before(() => { throw new Error('offline'); });
  await cart.setIdentity(identity(A)); assert.equal(cart.getState().status, 'error'); assert.deepEqual(cart.getState().items, [line(5)]);
  await cart.setIdentity(identity()); assert.deepEqual(cart.getState().items, []); assert.equal(cart.getState().status, 'ready');
});
