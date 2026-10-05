import { validateCheckout } from '../../src/lib/checkout.js';
import { checkedCart } from './cartApi.mjs';
import { checkedOrder } from './orderApi.mjs';

export const ORDER_STORAGE_KEY = 'beta-drips-mobile-orders-v1';
const copy = value => JSON.parse(JSON.stringify(value));
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function createOrderController({ storage, api, uuid, cart, onChange }) {
  let state = { owner: null, status: 'loading', attempt: null, result: null, error: '', orders: [], historyStatus: 'loading', historyError: '' };
  let identity = { userId: null, loading: true, sessionLost: false }, epoch = 0, alive = true;
  let journal, queue = Promise.resolve(), submitting = false, reading = false;
  const emit = patch => { state = { ...state, ...patch }; if (alive) onChange(state); };
  const active = generation => alive && generation === epoch;
  const enqueue = work => { const task = queue.catch(() => {}).then(work); queue = task; return task; };
  async function load() {
    if (journal) return;
    const raw = await storage.getItem(ORDER_STORAGE_KEY);
    const next = raw === null ? {} : JSON.parse(raw);
    if (!next || typeof next !== 'object' || Array.isArray(next)) throw new Error('Invalid saved checkout.');
    for (const attempt of Object.values(next)) {
      if (!UUID.test(attempt.key) || !attempt.items?.length || Object.keys(validateCheckout(attempt.delivery)).length) throw new Error('Invalid saved checkout.');
      checkedCart({ items: attempt.items, revision: attempt.cartRevision });
      if (attempt.result) checkedOrder(attempt.result.order);
    }
    journal = next;
  }
  async function save(next) { await storage.setItem(ORDER_STORAGE_KEY, JSON.stringify(next)); journal = next; }
  async function finish(attempt, generation) {
    if (!active(generation)) return false;
    // Confirmed record is durable before releasing the cart. This survives
    // termination during refresh without allowing a second order submission.
    emit({ status: 'success', attempt, result: attempt.result, error: '' });
    await cart.confirmCheckout(identity.userId);
    if (!active(generation)) return false;
    await refreshHistory();
    return true;
  }
  function setIdentity(next) {
    if (identity.userId === next.userId && identity.loading === next.loading && identity.sessionLost === next.sessionLost) return queue;
    identity = next; const generation = ++epoch;
    cart.holdCheckout(true);
    emit({ owner: next.userId, status: 'loading', attempt: null, result: null, error: '', orders: [], historyStatus: 'loading', historyError: '' });
    return enqueue(async () => {
      if (!active(generation) || next.loading) return;
      try {
        await load(); if (!active(generation)) return;
        if (!next.userId || next.sessionLost) {
          cart.holdCheckout(Boolean(next.sessionLost));
          emit({ status: next.sessionLost ? 'session-lost' : 'signed-out', historyStatus: next.sessionLost ? 'session-lost' : 'signed-out' });
          if (!next.sessionLost) await cart.refresh(false);
          return;
        }
        const attempt = journal[next.userId] || null;
        if (attempt?.result) await finish(attempt, generation);
        else {
          cart.holdCheckout(Boolean(attempt));
          emit({ status: attempt ? 'pending' : 'ready', attempt, error: attempt ? 'An order is awaiting confirmation. Retry the saved details to recover it safely.' : '' });
          if (!attempt) await cart.refresh(false);
          await refreshHistory();
        }
      } catch {
        if (active(generation)) emit({ status: 'error', error: 'Could not restore checkout safely. Reopen the app to retry. The saved attempt is preserved.', historyStatus: 'error', historyError: 'Order history is unavailable.' });
      }
    });
  }
  function submit(details) {
    // Synchronous gate prevents double taps even before React updates the UI.
    if (submitting || identity.loading || identity.sessionLost || !identity.userId || !['ready', 'pending', 'retry'].includes(state.status)) return Promise.resolve(false);
    submitting = true; const generation = epoch, userId = identity.userId;
    cart.holdCheckout(true); emit({ status: 'submitting', error: '' });
    return enqueue(async () => {
      try {
        await load(); if (!active(generation)) return false;
        let attempt = journal[userId];
        if (!attempt) {
          const delivery = Object.fromEntries(['name', 'email', 'phone', 'address'].map(key => [key, typeof details?.[key] === 'string' ? details[key].trim() : '']));
          if (Object.keys(validateCheckout(delivery)).length) throw Object.assign(new Error(), { code: 'VALIDATION' });
          const snapshot = cart.getState();
          if (snapshot.owner !== userId || snapshot.busy || snapshot.status !== 'ready' || !snapshot.items.length) throw Object.assign(new Error(), { code: 'CART_NOT_READY' });
          checkedCart(snapshot);
          attempt = { key: uuid(), items: copy(snapshot.items), delivery, cartRevision: snapshot.revision };
          const next = copy(journal); next[userId] = attempt; await save(next);
        }
        if (!active(generation)) return false;
        emit({ attempt });
        const result = await api.submit({ userId, active: () => active(generation), attempt });
        if (!active(generation)) return false;
        checkedOrder(result.order);
        const next = copy(journal); next[userId] = { ...attempt, result }; await save(next);
        return finish(next[userId], generation);
      } catch (failure) {
        if (!active(generation)) return false;
        if (failure.code === 'CART_CONFLICT') {
          try {
            const next = copy(journal); delete next[userId]; await save(next);
            cart.holdCheckout(false); emit({ status: 'ready', attempt: null, error: 'Your cart changed on another device. Refresh and review it before submitting again.' });
            await cart.refresh();
          } catch { emit({ status: 'retry', error: 'Could not finish conflict recovery. The saved attempt is preserved; retry.' }); }
        } else if (failure.code === 'SESSION_LOST') {
          emit({ status: 'session-lost', error: 'Sign in again with this account to recover the saved checkout.' });
        } else if (!journal?.[userId]) {
          cart.holdCheckout(false);
          emit({ status: 'ready', error: failure.code === 'VALIDATION' ? 'Correct your name, email, phone and delivery address.' : 'Checkout could not be saved safely. Your cart is preserved; refresh and retry.' });
        } else emit({ status: 'retry', attempt: journal[userId], error: 'Order creation could not be confirmed. Your saved details and retry key are preserved. Retry this same submission; do not start another order.' });
        return false;
      } finally { submitting = false; }
    });
  }
  async function refreshHistory() {
    const generation = epoch, userId = identity.userId;
    if (!userId || identity.loading || identity.sessionLost || reading || !alive) return;
    reading = true; emit({ historyStatus: 'loading', historyError: '' });
    try {
      const orders = await api.history({ userId, active: () => active(generation) });
      if (!Array.isArray(orders)) throw new Error('Invalid order history');
      orders.forEach(checkedOrder);
      if (active(generation)) emit({ orders, historyStatus: 'ready' });
    } catch (failure) {
      if (active(generation)) emit({ historyStatus: failure.code === 'SESSION_LOST' ? 'session-lost' : 'error', historyError: failure.code === 'SESSION_LOST' ? 'Sign in again to view your order history.' : 'Order history could not be loaded. Your saved orders have not been deleted. Refresh to retry.' });
    } finally {
      reading = false;
      if (!active(generation) && alive && identity.userId && !identity.loading && !identity.sessionLost) refreshHistory();
    }
  }
  function startAnother() {
    const generation = epoch, userId = identity.userId;
    if (state.status !== 'success' || submitting) return Promise.resolve(false);
    return enqueue(async () => {
      try {
        await load(); if (!active(generation)) return false;
        const next = copy(journal); delete next[userId]; await save(next);
        if (active(generation)) emit({ status: 'ready', attempt: null, result: null, error: '' });
        return active(generation);
      } catch { if (active(generation)) emit({ error: 'Could not acknowledge the saved order. Retry before starting another.' }); return false; }
    });
  }
  return { setIdentity, submit, refreshHistory, startAnother, getState: () => state, dispose() { alive = false; ++epoch; } };
}
