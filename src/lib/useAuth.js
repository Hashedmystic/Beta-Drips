import { useEffect, useState } from 'react';
import { supabase } from './supabase.js';

export default function useAuth() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [error, setError] = useState('');
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => {
      if (active) { setSession(next); setLoading(false); }
    });
    supabase.auth.getSession().then(({ data, error: failure }) => {
      if (active) { setSession(data.session); setError(failure ? 'Unable to restore sign-in. Please try again.' : ''); setLoading(false); }
    }).catch(() => { if (active) { setError('Unable to restore sign-in.'); setLoading(false); } });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);
  async function signIn(returnView = 'account') {
    if (!supabase) return;
    setLoading(true); setError('');
    try {
      const { error: failure } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/?view=' + returnView } });
      if (failure) throw failure;
    } catch { setError('Google sign-in could not start. Check the provider and redirect configuration.'); setLoading(false); }
  }
  async function signOut() {
    setLoading(true); setError('');
    try {
      const { error: failure } = await supabase.auth.signOut();
      if (failure) throw failure;
      setSession(null);
    } catch { setError('Sign-out failed. Please retry.'); }
    finally { setLoading(false); }
  }
  return { session, loading, error, signIn, signOut, configured: Boolean(supabase) };
}
