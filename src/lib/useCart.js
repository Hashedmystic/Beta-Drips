import { useCallback, useEffect, useRef, useState } from 'react';
import { authenticatedRequest } from './authClient.js';
import { supabase } from './supabase.js';
import { CART_KEY, readCart, validateCart } from '../data/cart.js';
import { accountGuard, cartView, guestAttempt } from './cartClient.js';

export default function useCart(auth) {
  const userId = auth.session?.user.id || null;
  const owner = useRef(userId); owner.current = userId;
  const loading = useRef(auth.loading); loading.current = auth.loading;
  const authRef = useRef(auth); authRef.current = auth;
  const epoch = useRef(0);
  const current = useRef({ owner: null, items: readCart(), revision: 0, status: 'loading' });
  const [state, setState] = useState(current.current);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [checkoutPending, setCheckoutPending] = useState(false);
  const publish = useCallback(value => { current.current = value; setState(value); }, []);
  const refreshRef = useRef(() => {});
  const checkoutHeld = useRef(false);
  const mutateRef = useRef(() => {});
  useEffect(() => {
    checkoutHeld.current = false; setCheckoutPending(false);
    const generation = ++epoch.current;
    const active = accountGuard(() => owner.current, userId, generation, () => epoch.current);
    let running = false;
    const pendingKey = userId ? 'beta-drips-cart-operation-' + userId : null;
    publish({ owner: userId, items: [], revision: 0, status: auth.sessionLost ? 'session-lost' : 'loading' }); setError(''); setBusy(false);
    async function request(operation) {
      const response = await authenticatedRequest({
        client: supabase, userId, active, onSessionLost: id => authRef.current.markSessionLost(id),
        url: '/.netlify/functions/cart', options: {
          signal: AbortSignal.timeout(15000), method: operation ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json' },
          ...(operation ? { body: JSON.stringify(operation) } : {}),
        },
      });
      const result = await response.json();
      if (!response.ok) { const failure = new Error(result.error || 'Unable to synchronize cart.'); failure.code = result.code; throw failure; }
      if (!Array.isArray(result.cart?.items) || !Number.isSafeInteger(result.cart.revision)) throw new Error('Invalid cart response.');
      return result.cart;
    }
    async function refresh() {
      if (navigator.locks) return navigator.locks.request('beta-drips-cart-sync', synchronize);
      if (userId) { setError('This browser needs Web Locks support for safe shared-cart synchronization.'); return; }
      return synchronize();
    }
    async function synchronize() {
      if (!active() || running || loading.current || authRef.current.sessionLost || checkoutHeld.current) return;
      if (!userId) {
        try { publish({ owner: null, items: localStorage.getItem('beta-drips-guest-claim') ? [] : readCart(), revision: 0, status: 'ready' }); }
        catch { setError('Guest storage is unavailable.'); }
        return;
      }
      running = true; setBusy(true);
      try {
        // Freeze the guest snapshot before the network call. A lost response retries the same ID.
        let operation = JSON.parse(localStorage.getItem(pendingKey) || 'null');
        if (!operation) {
          const claimKey = 'beta-drips-guest-claim';
          let claim = JSON.parse(localStorage.getItem(claimKey) || 'null');
          if (claim && claim.userId !== userId) throw new Error('A guest merge is awaiting confirmation for another account. Sign back into that account to retry.');
          if (!claim && readCart().length) {
            const attempt = guestAttempt(localStorage, pendingKey, readCart(), () => crypto.randomUUID());
            claim = { userId, operation: attempt };
            localStorage.setItem(claimKey, JSON.stringify(claim));
          }
          if (claim) { operation = claim.operation; localStorage.setItem(pendingKey, JSON.stringify(operation)); }
        }
        if (operation?.mode === 'merge') {
          const claim = JSON.parse(localStorage.getItem('beta-drips-guest-claim') || 'null');
          if (claim && claim.userId !== userId) throw new Error('Guest merge belongs to another account. Sign back into that account to retry.');
          if (!claim) localStorage.setItem('beta-drips-guest-claim', JSON.stringify({ userId, operation }));
        }
        let cart;
        if (operation) {
          cart = await request(operation);
          if (!active()) return;
          if (operation.mode === 'merge') {
            localStorage.setItem(CART_KEY, '[]');
            localStorage.removeItem('beta-drips-guest-claim');
          }
          localStorage.removeItem(pendingKey);
        } else cart = await request();
        if (active()) { publish({ owner: userId, ...cart, status: 'ready' }); setError(''); }
      } catch (failure) {
        if (active()) {
          if (failure.code === 'SESSION_LOST') {
            publish({ owner: userId, items: [], revision: 0, status: 'session-lost' });
            return;
          }
          publish({ ...current.current, status: 'error' });
          setError(failure.code === 'CART_CONFLICT' ? 'Your cart changed on another device. Review the refreshed cart and repeat your change.' : failure.code === 'CART_LIMIT' ? 'Guest merge exceeds the 99-per-size or 100-line limit. Your guest cart is preserved.' : failure.message);
          if (failure.code === 'CART_CONFLICT' || failure.code === 'CART_LIMIT') {
            localStorage.removeItem(pendingKey);
            if (failure.code === 'CART_LIMIT') localStorage.removeItem('beta-drips-guest-claim');
          }
          if (failure.code === 'CART_CONFLICT' || failure.code === 'CART_LIMIT') {
            try { const cart = await request(); if (active()) publish({ owner: userId, ...cart, status: 'ready' }); }
            catch (readFailure) { if (active() && readFailure.code === 'SESSION_LOST') publish({ owner: userId, items: [], revision: 0, status: 'session-lost' }); }
          }
        }
      } finally { running = false; if (active()) setBusy(false); }
    }
    async function mutate(updater) {
      if (!active() || running || loading.current || authRef.current.sessionLost || checkoutHeld.current) return;
      if (!userId) {
        try {
          if (localStorage.getItem('beta-drips-guest-claim')) { setError('Sign into the account with the pending guest merge to recover it.'); return; }
        } catch { /* Retain a page-session cart when storage is unavailable. */ }
        const items = validateCart(typeof updater === 'function' ? updater(current.current.items) : updater);
        try { localStorage.setItem(CART_KEY, JSON.stringify(items)); setError(''); }
        catch { setError('Guest cart storage is unavailable; this cart lasts for this page session.'); }
        publish({ owner: null, items, revision: 0, status: 'ready' }); return;
      }
      try { if (localStorage.getItem(pendingKey)) { await refresh(); return; } }
      catch { setError('Browser storage is required for safe cart retries.'); return; }
      const items = validateCart(typeof updater === 'function' ? updater(current.current.items) : updater);
      try { localStorage.setItem(pendingKey, JSON.stringify({ operationId: crypto.randomUUID(), mode: 'replace', revision: current.current.revision, items })); }
      catch { setError('Browser storage is required for safe cart retries.'); return; }
      await refresh();
    }
    refreshRef.current = refresh;
    mutateRef.current = mutate;
    refresh();
    const focus = () => { if (userId && document.visibilityState === 'visible') refresh(); };
    const tick = setInterval(() => { if (document.visibilityState === 'visible' && userId) refresh(); }, 15000);
    window.addEventListener('focus', focus);
    document.addEventListener('visibilitychange', focus);
    return () => { ++epoch.current; clearInterval(tick); window.removeEventListener('focus', focus); document.removeEventListener('visibilitychange', focus); };
  }, [userId, auth.sessionLost, publish]);
  useEffect(() => { if (!auth.loading) refreshRef.current(); }, [auth.loading]);
  const visible = cartView(state, userId, auth.sessionLost);
  return { cart: visible.items, status: visible.status, revision: state.revision, busy: busy || auth.loading || state.owner !== userId, error,
    checkoutPending, holdCheckout: value => { checkoutHeld.current = value; setCheckoutPending(value); },
    setCart: updater => mutateRef.current(updater), refresh: () => refreshRef.current() };
}
