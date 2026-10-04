import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { prepareCart } from '../netlify/lib/carts.mjs';
import { createHandler } from '../netlify/functions/cart.mjs';
import { createHandler as orderHandler } from '../netlify/functions/submit-order.mjs';
import { guestAttempt, accountGuard } from '../src/lib/cartClient.js';
const user = '11111111-1111-4111-8111-111111111111';
const id = '22222222-2222-4222-8222-222222222222';
const line = { productId: 'bigger-tee', size: 'S', quantity: 2 };
const operation = (overrides = {}) => ({ operationId: id, mode: 'merge', revision: 0, items: [line], ...overrides });
const env = { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SECRET_KEY: 'sb_secret_mock' };
const req = (body, token = 'valid') => new Request('https://example.com/cart', { method: body ? 'POST' : 'GET', headers: token ? { Authorization: 'Bearer ' + token } : {}, ...(body ? { body: JSON.stringify(body) } : {}) });

// In-memory contract model, NOT a PostgreSQL/RLS execution test.
function services() {
  let cart = { items: [], revision: 0 }, input, dbCalls = 0;
  const receipts = new Map();
  return {
    get cart() { return cart; }, get input() { return input; }, get dbCalls() { return dbCalls; },
    fetcher: async (url, options = {}) => {
      if (url.endsWith('/auth/v1/user')) return Response.json({ id: user }, { status: options.headers.Authorization === 'Bearer expired' ? 401 : 200 });
      dbCalls++;
      if (url.includes('customer_carts?')) { assert.ok(url.includes(user)); return Response.json([cart]); }
      input = JSON.parse(options.body);
      assert.equal(input.p_user_id, user);
      const prior = receipts.get(input.p_operation_id);
      if (prior) return prior === input.p_hash ? Response.json(cart) : Response.json({ message: 'IDEMPOTENCY_CONFLICT' }, { status: 400 });
      if (input.p_mode === 'replace' && input.p_revision !== cart.revision) return Response.json({ message: 'CART_CONFLICT' }, { status: 400 });
      let items = structuredClone(input.p_items);
      if (input.p_mode === 'merge') {
        items = structuredClone(cart.items);
        for (const line of input.p_items) {
          const found = items.find(item => item.productId === line.productId && item.size === line.size);
          if (found) found.quantity += line.quantity; else items.push(line);
        }
      }
      if (items.some(item => item.quantity > 99)) return Response.json({ message: 'CART_LIMIT' }, { status: 400 });
      cart = { items, revision: cart.revision + 1 }; receipts.set(input.p_operation_id, input.p_hash);
      return Response.json(cart);
    },
  };
}

test('cart endpoint rejects missing/expired auth and uses verified ownership for reads and writes', async () => {
  const mock = services(), handle = createHandler({ env, fetcher: mock.fetcher });
  assert.equal((await handle(req(operation(), null))).status, 401);
  assert.equal((await handle(req(operation(), 'expired'))).status, 401);
  assert.equal((await handle(req(undefined, 'expired'))).status, 401);
  assert.equal(mock.dbCalls, 0); assert.deepEqual(mock.cart, { items: [], revision: 0 });
  assert.equal((await handle(req(operation({ userId: 'another-customer' })))).status, 200);
  assert.equal(mock.input.p_user_id, user);
  assert.equal((await handle(req())).status, 200);
});
test('server rejects unknown products, invalid sizes, fractions, bounds and duplicate lines', () => {
  for (const items of [[null], [{ ...line, productId: 'fake' }], [{ ...line, size: 'fake' }], [{ ...line, quantity: 1.5 }], [{ ...line, quantity: 0 }], [{ ...line, quantity: 100 }], [line, line]]) assert.throws(() => prepareCart(operation({ items })));
  assert.throws(() => prepareCart(operation({ revision: -1 })));
  assert.equal(prepareCart(operation({ items: [{ ...line, price: 1 }] })).items[0].price, undefined);
});
test('merge retry after lost response adds once, keeps distinct sizes and rejects changed retry payload', async () => {
  const mock = services(), handle = createHandler({ env, fetcher: mock.fetcher });
  await handle(req(operation())); // Pretend the browser lost this response.
  await handle(req(operation()));
  assert.equal(mock.cart.items[0].quantity, 2); assert.equal(mock.cart.revision, 1);
  assert.equal((await handle(req(operation({ items: [{ ...line, quantity: 3 }] })))).status, 409);
  await handle(req(operation({ operationId: '33333333-3333-4333-8333-333333333333', items: [line, { ...line, size: 'M' }] })));
  assert.deepEqual(mock.cart.items.map(item => item.quantity), [4, 2]);
});
test('stale replacement cannot overwrite newer cart; over-limit merge changes nothing', async () => {
  const mock = services(), handle = createHandler({ env, fetcher: mock.fetcher });
  await handle(req(operation()));
  const stale = operation({ operationId: '33333333-3333-4333-8333-333333333333', mode: 'replace', items: [] });
  assert.equal((await handle(req(stale))).status, 409); assert.equal(mock.cart.items[0].quantity, 2);
  assert.equal((await handle(req({ ...stale, mode: 'merge', items: [{ ...line, quantity: 99 }] }))).status, 409);
  assert.equal(mock.cart.revision, 1);
});
test('guest snapshot survives a failed merge and reuses the same retry ID', () => {
  const values = new Map([['guest', JSON.stringify([line])]]);
  const storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) };
  const first = guestAttempt(storage, 'attempt', [line], () => id);
  const retry = guestAttempt(storage, 'attempt', [], () => 'different');
  assert.deepEqual(first, retry); assert.deepEqual(JSON.parse(values.get('guest')), [line]);
});
test('late cart responses are rejected after account switch or same-account generation change', () => {
  let owner = user, generation = 1;
  const active = accountGuard(() => owner, user, 1, () => generation);
  assert.equal(active(), true); owner = null; assert.equal(active(), false);
  owner = user; generation++; assert.equal(active(), false);
});
test('checkout passes revision and verified owner; conflicts do not start email sending', async () => {
  let calls = 0;
  const fetcher = async (url, options) => {
    calls++;
    if (url.endsWith('/auth/v1/user')) return Response.json({ id: user });
    assert.ok(url.endsWith('/rpc/save_cart_order'));
    const input = JSON.parse(options.body); assert.equal(input.p_user_id, user); assert.equal(input.p_revision, 7);
    return Response.json({ message: 'CART_CONFLICT' }, { status: 400 });
  };
  const body = { idempotencyKey: id, cartRevision: 7, items: [line], delivery: { name: 'Ada', email: 'ada@example.com', phone: '08012345678', address: '12 Example Street, Lagos' } };
  assert.equal((await orderHandler({ env, fetcher })(req(body))).status, 409); assert.equal(calls, 2);
});
test('new SQL declares owner-only grants and atomic retry-before-clear checkout (static inspection)', () => {
  const sql = readFileSync(new URL('../supabase/migrations/202610040001_customer_carts.sql', import.meta.url), 'utf8');
  assert.equal((sql.match(/enable row level security/g) || []).length, 2);
  assert.ok(sql.includes('revoke all on public.customer_carts, public.cart_operations from public, anon, authenticated'));
  assert.ok(sql.includes('grant select on public.customer_carts to authenticated'));
  assert.ok(sql.includes('using ((select auth.uid()) = user_id)'));
  assert.ok(sql.includes('primary key (user_id, operation_id)'));
  assert.equal((sql.match(/pg_advisory_xact_lock\(hashtextextended\('cart:'/g) || []).length, 2);
  const checkout = sql.slice(sql.indexOf('create function public.save_cart_order'));
  assert.ok(checkout.indexOf('return public.save_order') < checkout.indexOf('cart.revision <> p_revision'));
  assert.ok(checkout.indexOf('saved := public.save_order') < checkout.indexOf("set items = '[]'"));
  assert.ok(checkout.includes('is distinct from expected'));
  assert.ok(sql.includes('revoke all on function public.save_cart_order(uuid, uuid, text, jsonb, jsonb, bigint) from public, anon, authenticated'));
});
