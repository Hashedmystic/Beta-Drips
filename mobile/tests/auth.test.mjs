import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { createSecureStorage } from '../lib/secureStorage.mjs';
import { createAuthController, CALLBACK_URL, parseCallback } from '../lib/authController.mjs';
import { validPublicConfig } from '../lib/publicConfig.mjs';

const session = { access_token: 'test-access', refresh_token: 'test-refresh', user: { id: 'customer-a', email: 'customer@example.test' } };
const oauthURL = 'https://project.supabase.co/auth/v1/authorize?code_challenge_method=s256';
const pendingKey = 'beta-drips-oauth-pending';
function memoryNative() {
  const values = new Map();
  return { values, getItemAsync: async key => values.get(key) ?? null, setItemAsync: async (key, value) => { values.set(key, value); }, deleteItemAsync: async key => { values.delete(key); } };
}
function fixture(overrides = {}) {
  const values = new Map();
  const storage = { getItem: async key => values.get(key) ?? null, setItem: async (key, value) => { values.set(key, value); }, removeItem: async key => { values.delete(key); } };
  const calls = { exchange: [], signOut: [], start: 0, stop: 0 };
  let authListener, linkListener, appListener;
  const auth = {
    onAuthStateChange(fn) { authListener = fn; return { data: { subscription: { unsubscribe() { authListener = null; } } } }; },
    getSession: async () => ({ data: { session: null }, error: null }),
    signInWithOAuth: async args => { calls.oauth = args; return { data: { url: oauthURL, flowId: 'flow12345678' }, error: null }; },
    exchangeCodeForSession: async (...args) => { calls.exchange.push(args); return { data: { session }, error: null }; },
    signOut: async args => { calls.signOut.push(args); return { error: null }; },
    startAutoRefresh() { calls.start++; }, stopAutoRefresh() { calls.stop++; }, ...overrides.auth,
  };
  const browser = { openAuthSessionAsync: async (...args) => { calls.browser = args; return { type: 'success', url: `${CALLBACK_URL}?code=valid` }; }, ...overrides.browser };
  const linking = { getInitialURL: async () => overrides.initialURL || null, addEventListener(_, fn) { linkListener = fn; return { remove() { linkListener = null; } }; }, ...overrides.linking };
  const appState = { currentState: 'active', addEventListener(_, fn) { appListener = fn; return { remove() { appListener = null; } }; } };
  const updates = [];
  const controller = createAuthController({ client: { auth }, storage, browser, linking, appState, now: () => 1000000, onChange: state => updates.push(state) });
  return { controller, values, calls, updates, emit: (event, next) => authListener?.(event, next), app: state => appListener?.(state), link: url => linkListener?.({ url }) };
}

test('public configuration accepts publishable keys and rejects server/legacy secret keys', () => {
  assert.equal(validPublicConfig('https://project.supabase.co', 'sb_publishable_publictest'), true);
  for (const key of ['sb_secret_private', 'eyJhbGciOiJIUzI1NiJ9.service-role', 'sb_publishable_YOUR_KEY']) assert.equal(validPublicConfig('https://project.supabase.co', key), false);
  for (const url of ['http://project.supabase.co', 'https://user:pass@project.supabase.co', 'https://YOUR_PROJECT.supabase.co']) assert.equal(validPublicConfig(url, 'sb_publishable_publictest'), false);
});

test('callback is exact, code-only and does not trust tokens or provider error descriptions', () => {
  assert.equal(parseCallback(`${CALLBACK_URL}?code=valid`), 'valid');
  for (const url of ['https://auth/callback?code=x', 'betadrips://other/callback?code=x', 'betadrips://auth/other?code=x']) assert.equal(parseCallback(url), null);
  for (const suffix of ['#access_token=secret', '?code=a&code=b', '?error=denied&error_description=untrusted', '']) assert.throws(() => parseCallback(CALLBACK_URL + suffix));
});

test('secure storage supports large Unicode sessions and restoration with bounded chunks', async () => {
  const native = memoryNative();
  const value = JSON.stringify({ token: 'a'.repeat(9000), name: 'Nigerian style 👕'.repeat(200) });
  await createSecureStorage(native, randomUUID).setItem('session', value);
  assert.ok([...native.values.values()].every(chunk => Buffer.byteLength(chunk) < 2048));
  const restored = createSecureStorage(native, randomUUID);
  assert.equal(await restored.getItem('session'), value);
  await restored.removeItem('session');
  assert.equal(await restored.getItem('session'), null);
  assert.equal(native.values.size, 0);
});

test('interrupted secure write preserves previous session and removes partial chunks', async () => {
  const native = memoryNative();
  const storage = createSecureStorage(native, randomUUID);
  await storage.setItem('session', 'original');
  const original = native.setItemAsync;
  let writes = 0;
  native.setItemAsync = async (...args) => { if (++writes === 2) throw new Error('native failure'); await original(...args); };
  await assert.rejects(storage.setItem('session', 'a'.repeat(5000)));
  assert.equal(await storage.getItem('session'), 'original');
  assert.equal(native.values.size, 2);
});

test('real installed Supabase SDK produces S256 PKCE and persists verifier in adapter (no network)', async () => {
  const native = memoryNative();
  const storage = createSecureStorage(native, randomUUID);
  const client = createClient('https://project.supabase.co', 'sb_publishable_publictest', { auth: { storage, storageKey: 'test-auth', flowType: 'pkce', detectSessionInUrl: false, autoRefreshToken: false } });
  const { data, error } = await client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: CALLBACK_URL, skipBrowserRedirect: true } });
  assert.equal(error, null);
  const url = new URL(data.url);
  assert.equal(url.searchParams.get('redirect_to'), CALLBACK_URL);
  assert.equal(url.searchParams.get('code_challenge_method'), 's256');
  const slot = data.flowId ? `test-auth-flow-${data.flowId}-code-verifier` : 'test-auth-code-verifier';
  const verifier = JSON.parse(await storage.getItem(slot)).split('/')[0];
  assert.equal(url.searchParams.get('code_challenge'), createHash('sha256').update(verifier).digest('base64url'));
  await client.auth.stopAutoRefresh();
});

test('Google system-browser flow uses PKCE exchange and correct mobile callback', async () => {
  const f = fixture(); await f.controller.start(); await f.controller.signIn();
  assert.deepEqual(f.calls.oauth, { provider: 'google', options: { redirectTo: CALLBACK_URL, skipBrowserRedirect: true } });
  assert.equal(f.calls.browser[1], CALLBACK_URL);
  assert.deepEqual(f.calls.exchange, [['valid', { flowId: 'flow12345678' }]]);
  assert.equal(f.controller.getState().session, session);
  assert.equal(f.values.has(pendingKey), false);
  await f.controller.callback(`${CALLBACK_URL}?code=valid`);
  assert.equal(f.calls.exchange.length, 1);
});

test('browser cancellation clears pending attempt and ignores late callback', async () => {
  const f = fixture({ browser: { openAuthSessionAsync: async () => ({ type: 'cancel' }) } });
  await f.controller.start(); await f.controller.signIn();
  assert.match(f.controller.getState().message, /canceled/);
  await f.controller.callback(`${CALLBACK_URL}?code=late`);
  assert.equal(f.calls.exchange.length, 0);
  assert.equal(f.controller.getState().session, null);
});

test('plain PKCE is refused before opening browser', async () => {
  const f = fixture({ auth: { signInWithOAuth: async () => ({ data: { url: oauthURL.replace('s256', 'plain') } }) } });
  await f.controller.start(); await f.controller.signIn();
  assert.equal(f.calls.browser, undefined);
  assert.equal(f.controller.getState().status, 'signedOut');
  assert.match(f.controller.getState().message, /could not complete/);
});

test('cold-start callback uses persisted pending attempt; unsolicited callback cannot sign in', async () => {
  const f = fixture({ initialURL: `${CALLBACK_URL}?code=cold` });
  f.values.set(pendingKey, JSON.stringify({ startedAt: 999000, flowId: 'savedflow123' }));
  await f.controller.start();
  assert.deepEqual(f.calls.exchange, [['cold', { flowId: 'savedflow123' }]]);
  assert.equal(f.controller.getState().session, session);
  const untrusted = fixture({ initialURL: `${CALLBACK_URL}?code=untrusted` });
  await untrusted.controller.start();
  assert.equal(untrusted.calls.exchange.length, 0);
});

test('expired attempt and failed exchange show recoverable errors without a session', async () => {
  const f = fixture({ initialURL: `${CALLBACK_URL}?code=old` });
  f.values.set(pendingKey, JSON.stringify({ startedAt: 0 }));
  await f.controller.start();
  assert.match(f.controller.getState().message, /timed out/);
  assert.equal(f.calls.exchange.length, 0);
  const failed = fixture({ auth: { exchangeCodeForSession: async () => ({ data: {}, error: new Error('do not expose this') }) } });
  await failed.controller.start(); await failed.controller.signIn();
  assert.match(failed.controller.getState().message, /Could not complete sign-in/);
  assert.doesNotMatch(failed.controller.getState().message, /do not expose/);
  assert.equal(failed.controller.getState().session, null);
});

test('restores existing session, refreshes only in foreground, cleans listeners on dispose', async () => {
  const f = fixture({ auth: { getSession: async () => ({ data: { session } }) } });
  await f.controller.start();
  assert.equal(f.controller.getState().session, session);
  f.app('background'); f.app('active');
  assert.equal(f.calls.start, 2); assert.equal(f.calls.stop, 1);
  f.emit('TOKEN_REFRESHED', { ...session, access_token: 'new-access' });
  assert.equal(f.controller.getState().session.access_token, 'new-access');
  f.emit('SIGNED_OUT', null);
  assert.equal(f.controller.getState().session, null);
  assert.match(f.controller.getState().message, /expired/);
  const count = f.updates.length;
  f.controller.dispose(); f.emit('SIGNED_IN', session);
  assert.equal(f.updates.length, count);
  assert.equal(f.calls.stop, 2);
});

test('local sign-out preserves other sessions; failed sign-out retains account and shows retry', async () => {
  const f = fixture({ auth: { getSession: async () => ({ data: { session } }) } });
  await f.controller.start(); await f.controller.signOut();
  assert.deepEqual(f.calls.signOut, [{ scope: 'local' }]);
  assert.equal(f.controller.getState().session, null);
  const failed = fixture({ auth: { getSession: async () => ({ data: { session } }), signOut: async () => ({ error: new Error('network') }) } });
  await failed.controller.start(); await failed.controller.signOut();
  assert.equal(failed.controller.getState().session, session);
  assert.match(failed.controller.getState().message, /Sign-out failed/);
});

test('late restoration cannot overwrite a newer account event', async () => {
  let resolve;
  const f = fixture({ auth: { getSession: () => new Promise(r => { resolve = r; }) } });
  const loading = f.controller.start();
  f.emit('SIGNED_IN', session);
  resolve({ data: { session: null } });
  await loading;
  assert.equal(f.controller.getState().session, session);
});

test('simultaneous Android callback deliveries exchange a code only once', async () => {
  let finish;
  let exchanges = 0;
  const f = fixture({ auth: { exchangeCodeForSession: () => { exchanges++; return new Promise(resolve => { finish = resolve; }); } } });
  await f.controller.start();
  f.values.set(pendingKey, JSON.stringify({ startedAt: 999000 }));
  const first = f.controller.callback(`${CALLBACK_URL}?code=duplicate`);
  await new Promise(resolve => setImmediate(resolve));
  const second = f.controller.callback(`${CALLBACK_URL}?code=duplicate`);
  finish({ data: { session }, error: null });
  await Promise.all([first, second]);
  assert.equal(exchanges, 1);
});

test('SDK sign-in event keeps controls busy until code exchange finishes', async () => {
  let f;
  let finish;
  f = fixture({ auth: { exchangeCodeForSession: () => {
    f.emit('SIGNED_IN', session);
    return new Promise(resolve => { finish = resolve; });
  } } });
  await f.controller.start();
  const flow = f.controller.signIn();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(f.controller.getState().status, 'exchanging');
  finish({ data: { session }, error: null });
  await flow;
  assert.equal(f.controller.getState().status, 'signedIn');
});

test('missing secure chunk is an explicit storage failure, not an empty session', async () => {
  const native = memoryNative();
  const storage = createSecureStorage(native, randomUUID);
  await storage.setItem('session', 'important-session');
  const chunk = [...native.values.keys()].find(key => !key.endsWith('.manifest'));
  native.values.delete(chunk);
  await assert.rejects(storage.getItem('session'), /Incomplete/);
});

test('browser startup failure and restoration failure have clear recoverable states', async () => {
  const f = fixture({ browser: { openAuthSessionAsync: async () => { throw new Error('native browser unavailable'); } } });
  await f.controller.start(); await f.controller.signIn();
  assert.equal(f.controller.getState().status, 'signedOut');
  assert.equal(f.values.has(pendingKey), false);
  assert.match(f.controller.getState().message, /could not complete/);
  const restore = fixture({ auth: { getSession: async () => { throw new Error('secure store unavailable'); } } });
  await restore.controller.start();
  assert.equal(restore.controller.getState().session, null);
  assert.match(restore.controller.getState().message, /Could not restore/);
});

test('secure session refresh writes and reads are serialized without mixed generations', async () => {
  const native = memoryNative();
  const storage = createSecureStorage(native, randomUUID);
  await storage.setItem('session', 'old'.repeat(2000));
  const writing = storage.setItem('session', 'new'.repeat(2000));
  const reading = storage.getItem('session');
  await writing;
  assert.equal(await reading, 'new'.repeat(2000));
});

test('cart-auth session loss hides only its current account and permits a fresh Google sign-in', async () => {
  const f = fixture({ auth: { getSession: async () => ({ data: { session } }) } });
  await f.controller.start();
  f.controller.markSessionLost('another-customer'); assert.equal(f.controller.getState().session, session);
  f.controller.markSessionLost(session.user.id); assert.equal(f.controller.getState().session, null); assert.equal(f.controller.getState().sessionLost, true);
  assert.match(f.controller.getState().message, /not been deleted/); assert.equal(f.calls.signOut.length, 0);
  await f.controller.signIn(); assert.equal(f.controller.getState().session, session); assert.equal(f.controller.getState().sessionLost, false);
});

test('unexpected SDK sign-out and failed restoration stay distinct from intentional guest browsing', async () => {
  const f = fixture({ auth: { getSession: async () => ({ data: { session } }) } }); await f.controller.start();
  f.emit('SIGNED_OUT', null); assert.equal(f.controller.getState().sessionLost, true);
  const failed = fixture({ auth: { getSession: async () => ({ data: { session: null }, error: new Error('storage') }) } }); await failed.controller.start();
  assert.equal(failed.controller.getState().sessionLost, true);
  const normal = fixture({ auth: { getSession: async () => ({ data: { session } }) } }); await normal.controller.start(); await normal.controller.signOut();
  assert.equal(normal.controller.getState().sessionLost, false);
});


test('a failed native initial-link lookup does not mark a successfully restored session lost', async () => {
  const f = fixture({ auth: { getSession: async () => ({ data: { session } }) }, linking: { getInitialURL: async () => { throw new Error('native link unavailable'); } } });
  await f.controller.start();
  assert.equal(f.controller.getState().session, session);
  assert.equal(f.controller.getState().sessionLost, false);
});
