export const CALLBACK_URL = 'betadrips://auth/callback';
const PENDING_KEY = 'beta-drips-oauth-pending';
const MAX_AGE = 10 * 60 * 1000;

export function parseCallback(raw) {
  let url;
  try { url = new URL(raw); } catch { return null; }
  if (url.protocol !== 'betadrips:' || url.hostname !== 'auth' || url.pathname !== '/callback' || url.username || url.password || url.port) return null;
  if (url.hash || url.searchParams.getAll('code').length > 1) throw new Error('Invalid sign-in callback. Please try again.');
  if (url.searchParams.has('error')) throw new Error('Google sign-in was declined or failed. Please try again.');
  const code = url.searchParams.get('code');
  if (!code || code.length > 4096) throw new Error('The sign-in callback is missing its code. Please try again.');
  return code;
}

// Dependencies are injected so the actual controller can be tested without a phone.
export function createAuthController({ client, storage, browser, linking, appState, now = Date.now, onChange }) {
  let state = { session: null, status: client ? 'restoring' : 'unconfigured', message: '', sessionLost: false };
  let alive = true;
  let eventVersion = 0;
  let browserActive = false;
  let exchange = null;
  let completedCode = null;
  let cleanups = [];
  function update(patch) { state = { ...state, ...patch }; if (alive) onChange(state); }
  function failure(message) { update({ status: state.session ? 'signedIn' : 'signedOut', message }); }
  async function callback(raw) {
    let code;
    try { code = parseCallback(raw); } catch (error) {
      // Only a pending attempt may change the UI through a callback.
      if (await storage.getItem(PENDING_KEY)) {
        await storage.removeItem(PENDING_KEY);
        failure(error.message);
      }
      return;
    }
    if (!code || code === completedCode) return;
    if (exchange) return exchange;
    exchange = (async () => {
      const pendingRaw = await storage.getItem(PENDING_KEY);
      if (!pendingRaw) return; // unsolicited, canceled or already consumed callback
      const pending = JSON.parse(pendingRaw);
      if (!Number.isFinite(pending.startedAt) || now() - pending.startedAt > MAX_AGE || pending.startedAt > now()) {
        await storage.removeItem(PENDING_KEY);
        failure('Sign-in timed out. Please start again.');
        return;
      }
      update({ status: 'exchanging', message: '' });
      // Keep PKCE verifier and attempt across process termination; SDK owns verifier slots.
      const { data, error } = await client.auth.exchangeCodeForSession(code, pending.flowId ? { flowId: pending.flowId } : undefined);
      if (error || !data.session) throw new Error('exchange failed');
      completedCode = code;
      await storage.removeItem(PENDING_KEY);
      update({ session: data.session, status: 'signedIn', message: '', sessionLost: false });
    })();
    try { await exchange; } catch {
      // A failed exchange is not retried automatically: codes are single-use.
      await storage.removeItem(PENDING_KEY).catch(() => {});
      failure('Could not complete sign-in. Check your connection and start again.');
    } finally { exchange = null; }
  }
  async function start() {
    if (!client) { update({}); return; }
    const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
      eventVersion++;
      const lost = event === 'SIGNED_OUT' && state.session && state.status !== 'signingOut';
      const operation = ['openingBrowser', 'browser', 'exchanging', 'signingOut'].includes(state.status);
      update({ session, status: operation ? state.status : session ? 'signedIn' : 'signedOut', message: lost ? 'Your session expired. Please sign in again.' : state.message, sessionLost: session ? false : lost || state.sessionLost });
      // No awaited Supabase calls inside this SDK callback (avoids its auth lock).
    });
    cleanups.push(() => subscription.unsubscribe());
    function refresh(active) {
      const action = active === 'active' ? client.auth.startAutoRefresh() : client.auth.stopAutoRefresh();
      Promise.resolve(action).catch(() => failure('Session refresh is unavailable. Check your connection and reopen the app.'));
    }
    refresh(appState.currentState);
    const appSub = appState.addEventListener('change', refresh);
    const linkSub = linking.addEventListener('url', ({ url }) => { callback(url).catch(() => failure('Could not read sign-in data. Please try again.')); });
    cleanups.push(() => appSub.remove(), () => linkSub.remove(), () => client.auth.stopAutoRefresh());
    const version = eventVersion;
    try {
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      if (alive && eventVersion === version) update({ session: data.session, status: data.session ? 'signedIn' : 'signedOut' });
      const initial = await linking.getInitialURL();
      if (alive && initial) await callback(initial);
    } catch { if (!state.session) update({ sessionLost: true }); failure('Could not restore sign-in. Check your connection and reopen the app.'); }
  }
  async function signIn() {
    if (!client || browserActive || exchange || state.session || state.status === 'restoring') return;
    browserActive = true;
    update({ status: 'openingBrowser', message: '' });
    try {
      await storage.removeItem(PENDING_KEY);
      const { data, error } = await client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: CALLBACK_URL, skipBrowserRedirect: true } });
      if (error || !data.url) throw new Error('OAuth unavailable');
      const oauthURL = new URL(data.url);
      if (oauthURL.protocol !== 'https:' || oauthURL.searchParams.get('code_challenge_method') !== 's256') throw new Error('Secure PKCE unavailable');
      await storage.setItem(PENDING_KEY, JSON.stringify({ startedAt: now(), flowId: data.flowId }));
      update({ status: 'browser', message: 'Complete Google sign-in in your browser.' });
      const result = await browser.openAuthSessionAsync(data.url, CALLBACK_URL);
      if (!alive) return;
      if (result.type === 'success') {
        await callback(result.url);
        if (!state.session && state.status === 'browser') failure('No matching sign-in callback received. Please try again.');
      } else {
        if (exchange) await exchange.catch(() => {});
        if (!state.session) {
          await storage.removeItem(PENDING_KEY);
          failure('Sign-in canceled. You can try again.');
        }
      }
    } catch {
      await storage.removeItem(PENDING_KEY).catch(() => {});
      failure('Google sign-in could not complete. Check your connection and Supabase configuration, then retry.');
    } finally { browserActive = false; }
  }
  async function signOut() {
    if (!client || !state.session || state.status === 'signingOut') return;
    update({ status: 'signingOut', message: '' });
    try {
      const { error } = await client.auth.signOut({ scope: 'local' });
      if (error) throw error;
      await storage.removeItem(PENDING_KEY);
      update({ session: null, status: 'signedOut', message: 'Signed out of this app.', sessionLost: false });
    } catch { failure('Sign-out failed. Please try again.'); }
  }
  function markSessionLost(userId) {
    if (state.session?.user.id !== userId) return;
    eventVersion++;
    update({ session: null, status: 'signedOut', sessionLost: true, message: 'Your session expired. Sign in again. Your saved cart has not been deleted.' });
  }
  return { start, signIn, signOut, callback, markSessionLost, getState: () => state, dispose() { alive = false; cleanups.forEach(fn => fn()); cleanups = []; } };
}
