export const SESSION_LOST = 'Your session expired. Sign in again to load your saved cart. Your server cart has not been deleted.';
export const signOutThisBrowser = client => client.auth.signOut({ scope: 'local' });
export function isPermanentAuthError(error) {
  return error?.name === 'AuthSessionMissingError' || [400, 401, 403].includes(error?.status);
}
function failure(message, code) { return Object.assign(new Error(message), { code }); }

// Read SDK storage before EVERY send, including the one allowed retry.
// Never retry database/network errors as authentication errors.
export async function authenticatedRequest({ client, userId, active = () => true, onSessionLost = () => {}, fetcher = fetch, url, options = {} }) {
  const lost = () => {
    if (active()) onSessionLost(userId);
    return failure(SESSION_LOST, 'SESSION_LOST');
  };
  async function session() {
    const { data, error } = await client.auth.getSession();
    if (!active()) throw failure('Account changed.', 'ACCOUNT_CHANGED');
    if (error) {
      if (isPermanentAuthError(error)) throw lost();
      throw failure('Unable to refresh sign-in. Check your connection and retry.', 'AUTH_UNAVAILABLE');
    }
    if (!data.session) throw lost();
    if (data.session.user.id !== userId) throw failure('Account changed.', 'ACCOUNT_CHANGED');
    return data.session;
  }
  async function send(current) {
    if (!active()) throw failure('Account changed.', 'ACCOUNT_CHANGED');
    const response = await fetcher(url, { ...options, headers: { ...options.headers, Authorization: 'Bearer ' + current.access_token } });
    if (!active()) throw failure('Account changed.', 'ACCOUNT_CHANGED');
    return response;
  }
  const first = await session();
  let response = await send(first);
  if (response.status !== 401) return response;
  // Another tab or auto-refresh may already have rotated the rejected token.
  let latest = await session();
  if (latest.access_token === first.access_token) {
    const { error } = await client.auth.refreshSession();
    if (!active()) throw failure('Account changed.', 'ACCOUNT_CHANGED');
    if (error && !isPermanentAuthError(error)) throw failure('Unable to refresh sign-in. Check your connection and retry.', 'AUTH_UNAVAILABLE');
    // A different tab may have won a refresh race while this refresh was rejected.
    latest = await session();
    if (error && latest.access_token === first.access_token) throw lost();
  }
  response = await send(latest);
  if (response.status === 401) throw lost();
  return response;
}
