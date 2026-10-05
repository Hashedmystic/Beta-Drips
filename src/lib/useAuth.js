import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from './supabase.js';
import { isPermanentAuthError, SESSION_LOST, signOutThisBrowser } from './authClient.js';

export default function useAuth() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [error, setError] = useState('');
  const [sessionLost, setSessionLost] = useState(false);
  const currentSession = useRef(null);
  const rejectedToken = useRef(null);
  const explicitSignOut = useRef(false);
  const markSessionLost = useCallback(userId => {
    if (currentSession.current?.user.id !== userId) return;
    rejectedToken.current = currentSession.current.access_token;
    currentSession.current = null; setSession(null); setSessionLost(true); setError(SESSION_LOST); setLoading(false);
  }, []);
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, next) => {
      if (!active) return;
      // Do not resurrect a server-rejected session from SDK focus/storage events.
      if (next && rejectedToken.current === next.access_token) return;
      if (event === 'SIGNED_OUT' && !explicitSignOut.current) {
        rejectedToken.current = currentSession.current?.access_token || rejectedToken.current;
        setSessionLost(true); setError(SESSION_LOST);
      }
      if (next) { rejectedToken.current = null; setSessionLost(false); setError(''); }
      currentSession.current = next; setSession(next); setLoading(false);
    });
    supabase.auth.getSession().then(({ data, error: failure }) => {
      if (!active || (data.session && rejectedToken.current === data.session.access_token)) return;
      currentSession.current = data.session; setSession(data.session);
      if (failure && isPermanentAuthError(failure)) { setSessionLost(true); setError(SESSION_LOST); }
      else if (failure) setError('Unable to restore sign-in. Please try again.');
      setLoading(false);
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
    explicitSignOut.current = true;
    setLoading(true); setError('');
    try {
      const { error: failure } = await signOutThisBrowser(supabase);
      if (failure) throw failure;
      currentSession.current = null; setSession(null); setSessionLost(false);
    } catch { setError('Sign-out failed. Please retry.'); }
    finally { explicitSignOut.current = false; setLoading(false); }
  }
  return { session, sessionLost, markSessionLost, loading, error, signIn, signOut, configured: Boolean(supabase) };
}
