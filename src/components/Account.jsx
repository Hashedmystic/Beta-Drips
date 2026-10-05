import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { formatPrice } from '../data/catalogue.js';

import { emailStatusText } from '../lib/orderStatus.js';
export { emailStatusText } from '../lib/orderStatus.js';

export default function Account({ auth }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    setOrders([]); setError('');
    if (!auth.session) return;
    setLoading(true);
    supabase.from('orders').select('id,created_at,total_naira,order_items(product_id,name,brand,size,quantity,unit_price_naira),order_emails(status)')
      .order('created_at', { ascending: false }).then(({ data, error: failure }) => {
        if (active) { setOrders(data || []); setError(failure ? 'Unable to load orders. Check database setup or retry.' : ''); setLoading(false); }
      }).catch(() => { if (active) { setError('Unable to load orders. Please retry.'); setLoading(false); } });
    return () => { active = false; };
  }, [auth.session?.user.id, refresh]);
  return <section><h2>Account</h2>
    {!auth.configured ? <p>Sign-in is not configured. Add the public Supabase settings described in README.</p>
    : auth.loading ? <p role="status">Checking your account…</p>
    : auth.session ? <>
      <p>Signed in as {auth.session.user.email}</p>
      <button type="button" onClick={auth.signOut}>Sign out</button>
      <h3>Order history</h3>
      <button type="button" disabled={loading} onClick={() => setRefresh((value) => value + 1)}>Refresh orders</button>
      {loading ? <p role="status">Loading saved orders…</p> : error ? <p role="alert">{error}</p> : !orders.length ? <p>No saved orders yet.</p>
      : <ul className="saved-orders">{orders.map((order) => <li key={order.id}>
        <h4>Order {order.id}</h4><p>{new Date(order.created_at).toLocaleString('en-NG')}</p>
        <p>Demo order — no payment taken</p>
        <ul>{order.order_items.map((item) => <li key={item.product_id + '/' + item.size}>{item.name} · {item.size} × {item.quantity} — {formatPrice(item.unit_price_naira * item.quantity)}</li>)}</ul>
        <p className="product-card__price">{formatPrice(order.total_naira)}</p>
        <p>{emailStatusText(order.order_emails?.status)}</p>
      </li>)}</ul>}
    </> : <><p>Sign in to place orders and view your saved order history.</p><button type="button" onClick={() => auth.signIn()}>Sign in with Google</button></>}
    {auth.error && <p role="alert">{auth.error}</p>}
  </section>;
}
