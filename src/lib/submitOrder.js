import { supabase } from './supabase.js';

// Persist only a digest and random retry key, never checkout personal details.
export async function submitOrder(cart, delivery, userId) {
  const fingerprint = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify({ cart, delivery })))), (byte) => byte.toString(16).padStart(2, '0')).join('');
  const storageKey = 'beta-drips-order-attempt-' + userId;
  let attempt;
  try {
    attempt = JSON.parse(localStorage.getItem(storageKey));
    if (!attempt || attempt.fingerprint !== fingerprint) {
      attempt = { fingerprint, key: crypto.randomUUID() };
      localStorage.setItem(storageKey, JSON.stringify(attempt));
    }
  } catch { throw new Error('Browser storage is needed to safely retry orders. Enable local storage before submitting.'); }
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) throw new Error('Your session expired. Sign in again.');
  const response = await fetch('/.netlify/functions/submit-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + data.session.access_token },
    body: JSON.stringify({ idempotencyKey: attempt.key, items: cart, delivery }),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.order?.id) throw new Error(result?.error || 'Order persistence could not be confirmed. Retry unchanged details. Use Netlify Dev when running locally.');
  // Keep the key until the cart is durably cleared by App; recover lost responses safely.
  return { ...result, attemptStorageKey: storageKey };
}
