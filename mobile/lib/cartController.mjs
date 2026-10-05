import { products } from '../../src/data/catalogue.js';
import { checkedCart, checkedItems } from './cartApi.mjs';

export const CART_STORAGE_KEY = 'beta-drips-mobile-cart-v1';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const blankJournal = () => ({ guest: [], claim: null, pending: {}, mergeBlockedFor: null });
function operationCheck(operation) {
  if (!UUID.test(operation?.operationId) || !['merge', 'replace'].includes(operation.mode) || !Number.isSafeInteger(operation.revision) || operation.revision < 0) throw new Error('Invalid saved cart operation.');
  checkedItems(operation.items);
}
function journalCheck(value) {
  checkedItems(value.guest);
  if (!value.pending || typeof value.pending !== 'object' || Array.isArray(value.pending)) throw new Error('Invalid saved cart.');
  for (const operation of Object.values(value.pending)) operationCheck(operation);
  if (value.claim) {
    if (typeof value.claim.userId !== 'string' || !value.claim.userId) throw new Error('Invalid guest claim.');
    operationCheck(value.claim.operation);
    if (value.claim.operation.mode !== 'merge' || JSON.stringify(value.claim.operation.items) !== JSON.stringify(value.guest)) throw new Error('Invalid guest snapshot.');
  }
  for (const [userId, operation] of Object.entries(value.pending)) {
    if (operation.mode === 'merge' && (value.claim?.userId !== userId || JSON.stringify(value.claim.operation) !== JSON.stringify(operation))) throw new Error('Invalid pending guest merge.');
  }
  return value;
}

// One serialized controller owns the local journal and network sends. Identity
// changes hide data synchronously; old tasks may finish but cannot publish it.
export function createCartController({ storage, request, uuid, onChange }) {
  let journal, state = { owner: null, items: [], revision: 0, status: 'loading', busy: false, error: '' };
  let identity = { userId: null, loading: true, sessionLost: false };
  let epoch = 0, alive = true, queue = Promise.resolve();
  const emit = patch => { state = { ...state, ...patch }; if (alive) onChange(state); };
  const active = generation => alive && epoch === generation;
  const enqueue = work => { const task = queue.catch(() => {}).then(work); queue = task; return task; };
  async function load() {
    if (journal) return;
    const raw = await storage.getItem(CART_STORAGE_KEY);
    journal = raw === null ? blankJournal() : journalCheck(JSON.parse(raw));
  }
  async function save(next) {
    await storage.setItem(CART_STORAGE_KEY, JSON.stringify(next));
    journal = next;
  }
  const clone = () => structuredCloneJournal(journal);
  function structuredCloneJournal(value) { return JSON.parse(JSON.stringify(value)); }
  function visible(cart, generation, error = '') {
    if (active(generation)) emit({ owner: identity.userId, ...checkedCart(cart), status: 'ready', error });
  }
  async function synchronize(generation, manual = false) {
    if (!active(generation) || identity.loading || identity.sessionLost) return false;
    const userId = identity.userId;
    emit({ busy: true });
    try {
      await load();
      if (!active(generation)) return false;
      if (!userId) {
        if (journal.claim) emit({ owner: null, items: [], revision: 0, status: 'reserved', error: 'Your guest cart has a pending merge. Sign back into the account that started it to confirm safely.' });
        else visible({ items: journal.guest, revision: 0 }, generation);
        return true;
      }
      if (manual && journal.mergeBlockedFor === userId) { const next = clone(); next.mergeBlockedFor = null; await save(next); }
      let operation = journal.pending[userId];
      if (!operation && journal.claim?.userId === userId) operation = journal.claim.operation;
      if (!operation && !journal.claim && journal.guest.length && journal.mergeBlockedFor !== userId) {
        operation = { operationId: uuid(), mode: 'merge', revision: 0, items: journal.guest };
        const next = clone(); next.claim = { userId, operation }; next.pending[userId] = operation;
        // Claim and operation are persisted atomically BEFORE sending anything.
        await save(next);
      }
      if (!active(generation)) return false;
      const cart = await request({ userId, active: () => active(generation), operation });
      if (!active(generation)) return false;
      if (operation) {
        const next = clone(); delete next.pending[userId];
        if (operation.mode === 'merge') { next.guest = []; next.claim = null; next.mergeBlockedFor = null; }
        // A local failure here retains the receipt ID and guest snapshot for retry.
        await save(next);
      }
      if (!active(generation)) return false;
      const warning = journal.claim && journal.claim.userId !== userId ? 'A guest merge is waiting for another account. That cart is kept separate.' : journal.mergeBlockedFor === userId ? 'Guest merge exceeds cart limits. Your guest cart is preserved. Reduce the account cart and refresh, or sign out to adjust the guest cart.' : '';
      visible(cart, generation, warning);
      return true;
    } catch (failure) {
      if (!active(generation)) return false;
      if (failure.code === 'SESSION_LOST') { emit({ items: [], revision: 0, status: 'session-lost', error: 'Sign in again to view your saved cart. Its server data has not been deleted.' }); return false; }
      let message = 'Cart synchronization could not be confirmed. Your cart and saved retry are preserved. Check your connection and refresh.';
      if (failure.code === 'CART_CONFLICT' || failure.code === 'CART_LIMIT') {
        try {
          const next = clone(); delete next.pending[userId];
          if (failure.code === 'CART_LIMIT' && next.claim?.userId === userId) { next.claim = null; next.mergeBlockedFor = userId; }
          await save(next);
          if (!active(generation)) return false;
          const cart = await request({ userId, active: () => active(generation) });
          message = failure.code === 'CART_CONFLICT' ? 'Your cart changed on another device. Review the refreshed cart and repeat your change.' : 'Guest merge exceeds cart limits. Your guest cart is preserved. Reduce this cart and refresh, or sign out to adjust the guest cart.';
          visible(cart, generation, message);
          return false;
        } catch (readFailure) {
          if (!active(generation)) return false;
          if (readFailure.code === 'SESSION_LOST') { emit({ items: [], status: 'session-lost', error: 'Sign in again to view your saved cart.' }); return false; }
        }
      }
      if (active(generation)) emit({ status: 'error', error: message });
      return false;
    } finally { if (active(generation)) emit({ busy: false }); }
  }
  function setIdentity(next) {
    if (identity.userId === next.userId && identity.loading === next.loading && identity.sessionLost === next.sessionLost) return queue;
    const sameOwner = identity.userId === next.userId && !identity.sessionLost && !next.sessionLost;
    identity = next;
    const generation = ++epoch;
    emit({ owner: next.userId, items: sameOwner ? state.items : [], revision: sameOwner ? state.revision : 0, busy: false, status: next.sessionLost ? 'session-lost' : 'loading', error: next.sessionLost ? 'Sign in again to view your saved cart. Its server data has not been deleted.' : '' });
    return enqueue(() => synchronize(generation));
  }
  function mutate(updater) {
    const generation = epoch;
    return enqueue(async () => {
      if (!active(generation) || identity.loading || identity.sessionLost || state.status !== 'ready') return false;
      emit({ busy: true });
      try {
        await load();
        if (!active(generation)) return false;
        if (!identity.userId && journal.claim) return false;
        if (identity.userId && (journal.pending[identity.userId] || journal.claim?.userId === identity.userId)) {
          await synchronize(generation); return false; // Confirm earlier change; never silently apply a second intent.
        }
        const items = checkedItems(updater(state.items));
        const next = clone();
        if (!identity.userId) {
          next.guest = items; next.mergeBlockedFor = null; await save(next);
          if (!active(generation)) return false;
          visible({ items, revision: 0 }, generation); return true;
        }
        next.pending[identity.userId] = { operationId: uuid(), mode: 'replace', revision: state.revision, items };
        await save(next);
        return synchronize(generation);
      } catch (failure) {
        if (active(generation)) emit({ error: failure.code === 'LOCAL_LIMIT' ? 'Cart limits are 99 per product size and 100 different lines. Your previous cart is preserved.' : 'This change could not be saved safely. Your previous cart is preserved. Retry or refresh.' });
        return false;
      } finally { if (active(generation)) emit({ busy: false }); }
    });
  }
  function add(productId, size) {
    const product = products.find(item => item.id === productId);
    if (!product?.sizes.includes(size)) return Promise.resolve(false);
    return mutate(items => {
      const found = items.find(item => item.productId === productId && item.size === size);
      if (found && found.quantity >= 99) throw Object.assign(new Error('Quantity limit'), { code: 'LOCAL_LIMIT' });
      if (!found && items.length >= 100) throw Object.assign(new Error('Line limit'), { code: 'LOCAL_LIMIT' });
      return found ? items.map(item => item === found ? { ...item, quantity: item.quantity + 1 } : item) : [...items, { productId, size, quantity: 1 }];
    });
  }
  return { setIdentity, add,
    quantity: (productId, size, quantity) => mutate(items => items.map(item => item.productId === productId && item.size === size ? { ...item, quantity } : item)),
    remove: (productId, size) => mutate(items => items.filter(item => item.productId !== productId || item.size !== size)),
    refresh: (manual = true) => { if (state.busy) return Promise.resolve(false); const generation = epoch; return enqueue(() => synchronize(generation, manual)); },
    getState: () => state, dispose: () => { alive = false; ++epoch; } };
}
