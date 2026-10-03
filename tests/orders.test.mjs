import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { prepareOrder, confirmationEmail } from '../netlify/lib/orders.mjs';
import { createHandler } from '../netlify/functions/submit-order.mjs';

const userId = '11111111-1111-4111-8111-111111111111';
const key = '22222222-2222-4222-8222-222222222222';
const body = () => ({ idempotencyKey: key, userId: 'attacker-selected-user', delivery: { name: 'Ada Okafor', email: 'ada@example.com', phone: '+2348012345678', address: '12 Example Street, Lagos' }, items: [{ productId: 'bigger-tee', size: 'S', quantity: 2, price: 1 }] });
const env = { SUPABASE_URL: 'https://project.supabase.co', SUPABASE_SECRET_KEY: 'sb_secret_test', MAILGUN_API_KEY: 'test-only-key', MAILGUN_DOMAIN: 'example.com', MAILGUN_FROM: 'Beta Drips <orders@example.com>' };
const request = (value = body(), token = 'valid-token') => new Request('https://example.com/.netlify/functions/submit-order', { method: 'POST', headers: token ? { Authorization: 'Bearer ' + token } : {}, body: JSON.stringify(value) });

function fakeServices({ mailStatus = 200, mailThrow = false, dbFailure = false, authStatus = 200, emailRecordFailure = false } = {}) {
  const orders = new Map();
  let mailCalls = 0;
  let rpcInput;
  let emailState = 'pending';
  const fetcher = async (url, options = {}) => {
    if (url.endsWith('/auth/v1/user')) return Response.json({ id: userId }, { status: authStatus });
    if (url.includes('/rpc/save_order')) {
      rpcInput = JSON.parse(options.body);
      if (dbFailure) return Response.json({ message: 'database unavailable' }, { status: 500 });
      const existing = orders.get(rpcInput.p_user_id + rpcInput.p_key);
      if (existing && existing.request_hash !== rpcInput.p_hash) return Response.json({ message: 'IDEMPOTENCY_CONFLICT' }, { status: 400 });
      const order = existing || { id: '33333333-3333-4333-8333-333333333333', created_at: '2026-10-02T00:00:00Z', request_hash: rpcInput.p_hash, delivery: rpcInput.p_delivery, order_items: rpcInput.p_items, total_naira: rpcInput.p_items.reduce((sum, item) => sum + item.quantity * item.unit_price_naira, 0) };
      orders.set(rpcInput.p_user_id + rpcInput.p_key, order);
      return Response.json({ ...order, order_emails: { status: emailState } });
    }
    if (url.includes('order_emails')) {
      if (options.method === 'PATCH') {
        const change = JSON.parse(options.body);
        if (url.includes('status=eq.pending')) {
          if (emailState !== 'pending') return Response.json([]);
          emailState = 'processing';
          return Response.json([{ status: 'processing' }]);
        }
        if (emailRecordFailure) throw new Error('record failure');
        emailState = change.status;
        return new Response(null, { status: 204 });
      }
      return Response.json([{ status: emailState }]);
    }
    if (url.includes('mailgun.net')) {
      mailCalls++;
      assert.equal(options.body.get('to'), 'ada@example.com');
      assert.ok(options.body.get('html').includes('Your order has been saved'));
      assert.ok(options.body.get('text').includes('₦37,000.00'));
      if (mailThrow) throw new Error('timeout');
      return Response.json({ id: 'provider-id' }, { status: mailStatus });
    }
    throw new Error('Unexpected service');
  };
  return { fetcher, orders, get mailCalls() { return mailCalls; }, get rpcInput() { return rpcInput; } };
}

test('trusted catalogue overrides browser prices and rejects malformed delivery/items', () => {
  const prepared = prepareOrder(body());
  assert.equal(prepared.items[0].unit_price_naira, 18500);
  for (const items of [[], [null], [{ productId: 'fake', size: 'S', quantity: 1 }], [{ productId: 'bigger-tee', size: 'fake', quantity: 1 }], [{ productId: 'bigger-tee', size: 'S', quantity: 1.5 }], [{ productId: 'bigger-tee', size: 'S', quantity: 100 }], [body().items[0], body().items[0]]]) assert.throws(() => prepareOrder({ ...body(), items }));
  assert.throws(() => prepareOrder({ ...body(), delivery: { ...body().delivery, email: 'x@example.com\nBcc: attacker@example.com' } }));
  assert.throws(() => prepareOrder({ ...body(), delivery: { ...body().delivery, phone: 'abc' } }));
  assert.throws(() => prepareOrder({ ...body(), idempotencyKey: 'bad' }));
});

test('server verifies user and persists trusted prices; retry returns one order and one email', async () => {
  const services = fakeServices();
  const handler = createHandler({ env, fetcher: services.fetcher });
  const [first, retry] = await Promise.all([handler(request()), handler(request())]);
  assert.equal(first.status, 200); assert.equal(retry.status, 200);
  assert.equal(services.orders.size, 1); assert.equal(services.mailCalls, 1);
  assert.equal(services.rpcInput.p_user_id, userId);
  assert.equal((await first.json()).order.total_naira, 37000);
  const changed = body(); changed.items[0].quantity = 3;
  assert.equal((await handler(request(changed))).status, 409);
});

test('missing config, method, missing/expired token, invalid JSON and persistence failure do not confirm', async () => {
  assert.equal((await createHandler({ env: {} })(request())).status, 503);
  assert.equal((await createHandler({ env })(new Request('https://example.com'))).status, 405);
  assert.equal((await createHandler({ env })(request(body(), null))).status, 401);
  assert.equal((await createHandler({ env, fetcher: fakeServices({ authStatus: 401 }).fetcher })(request())).status, 401);
  const services = fakeServices({ dbFailure: true });
  const failed = await createHandler({ env, fetcher: services.fetcher })(request());
  assert.equal(failed.status, 503); assert.equal(services.mailCalls, 0);
  assert.equal((await failed.json()).order, undefined);
  const handler = createHandler({ env, fetcher: fakeServices().fetcher });
  assert.equal((await handler(new Request('https://example.com', { method: 'POST', headers: { Authorization: 'Bearer token' }, body: '{invalid' }))).status, 400);
});

test('email failure, timeout, missing configuration and status-write failure retain saved order', async () => {
  for (const [settings, expected] of [[{ mailStatus: 401 }, 'failed'], [{ mailThrow: true }, 'unknown'], [{ emailRecordFailure: true }, 'unknown']]) {
    const services = fakeServices(settings);
    const result = await createHandler({ env, fetcher: services.fetcher })(request());
    assert.equal(result.status, 200);
    const value = await result.json();
    assert.equal(value.emailStatus, expected); assert.ok(value.order.id);
    assert.equal(services.orders.size, 1);
  }
  const services = fakeServices();
  const result = await createHandler({ env: { ...env, MAILGUN_API_KEY: '' }, fetcher: services.fetcher })(request());
  assert.equal((await result.json()).emailStatus, 'not_configured'); assert.equal(services.mailCalls, 0);
});

test('confirmation email escapes customer text and includes HTML, plain text and saved totals', () => {
  const prepared = prepareOrder(body());
  const email = confirmationEmail({ id: key, delivery: { ...prepared.delivery, name: '<script>alert(1)</script>' }, order_items: prepared.items, total_naira: 37000 });
  assert.ok(!email.html.includes('<script>')); assert.ok(email.html.includes('&lt;script&gt;'));
  assert.ok(email.text.includes('₦37,000.00'));
});

test('migration declares owner-only reads and service-only atomic order RPC (static inspection)', () => {
  const sql = readFileSync(new URL('../supabase/migrations/202610020001_orders.sql', import.meta.url), 'utf8');
  assert.equal((sql.match(/enable row level security/g) || []).length, 3);
  assert.ok(sql.includes('grant usage on schema public to authenticated, service_role'));
  assert.ok(sql.includes('revoke all on public.orders, public.order_items, public.order_emails from public, anon, authenticated'));
  assert.ok(sql.includes('grant select on public.orders, public.order_items, public.order_emails to authenticated'));
  assert.ok(sql.includes('grant all on public.orders, public.order_items, public.order_emails to service_role'));
  assert.ok(sql.includes('create policy own_orders on public.orders for select to authenticated using ((select auth.uid()) = user_id)'));
  assert.ok(sql.includes('orders.id = order_items.order_id and orders.user_id = (select auth.uid())'));
  assert.ok(sql.includes('orders.id = order_emails.order_id and orders.user_id = (select auth.uid())'));
  assert.ok(sql.includes('unique (user_id, idempotency_key)'));
  assert.ok(sql.includes('pg_advisory_xact_lock'));
  assert.ok(sql.includes('security invoker set search_path = public, pg_temp'));
  assert.ok(sql.includes('revoke all on function public.save_order(uuid, uuid, text, jsonb, jsonb) from public, anon, authenticated'));
  assert.ok(sql.includes('grant execute on function public.save_order(uuid, uuid, text, jsonb, jsonb) to service_role'));
});
