export function accountGuard(getUser, userId, generation, getGeneration) {
  return () => getUser() === userId && getGeneration() === generation;
}
export function guestAttempt(storage, key, items, uuid) {
  const saved = JSON.parse(storage.getItem(key) || 'null');
  if (saved) return saved;
  if (!items.length) return null;
  const attempt = { operationId: uuid(), mode: 'merge', revision: 0, items };
  storage.setItem(key, JSON.stringify(attempt));
  return attempt;
}

export function cartView(state, userId, sessionLost) {
  if (sessionLost) return { items: [], status: 'session-lost' };
  if (state.owner !== userId) return { items: [], status: 'loading' };
  return { items: state.items, status: state.status };
}
export function cartEmptyMessage(status) {
  if (status === 'session-lost') return 'Sign in again to view your saved cart.';
  if (status === 'loading') return 'Loading your cart…';
  if (status !== 'ready') return 'Your cart could not be loaded. Retry when your connection is available.';
  return 'Your cart is empty.';
}
