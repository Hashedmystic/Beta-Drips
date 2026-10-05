import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as Crypto from 'expo-crypto';
import { storage, supabase, publicSupabaseConfig } from './supabase';
import { apiBaseUrl } from './cartApi.mjs';
import { createOrderApi } from './orderApi.mjs';
import { createOrderController } from './orderController.mjs';
import { startCartRefresh } from './cartRefresh.mjs';

export default function useMobileOrders(auth, cart) {
  const authRef = useRef(auth); authRef.current = auth;
  const cartRef = useRef(cart); cartRef.current = cart;
  const controller = useRef(null);
  const [state, setState] = useState({ owner: null, status: 'loading', attempt: null, result: null, error: '', orders: [], historyStatus: 'loading', historyError: '' });
  const userId = auth.session?.user.id || null;
  const loading = ['restoring', 'openingBrowser', 'browser', 'exchanging', 'signingOut'].includes(auth.status);
  useEffect(() => {
    let api;
    try {
      api = createOrderApi({ client: supabase, baseUrl: apiBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL || 'https://betadrips.netlify.app', __DEV__), supabaseUrl: publicSupabaseConfig.url, publishableKey: publicSupabaseConfig.key, onSessionLost: id => authRef.current.markSessionLost(id) });
    } catch { api = { submit: async () => { throw new Error('Invalid API configuration'); }, history: async () => { throw new Error('Invalid API configuration'); } }; }
    const current = createOrderController({ storage, api, uuid: Crypto.randomUUID,
      cart: { getState: () => cartRef.current.getState(), holdCheckout: value => cartRef.current.holdCheckout(value), confirmCheckout: (...args) => cartRef.current.confirmCheckout(...args), refresh: (...args) => cartRef.current.refresh(...args) }, onChange: setState });
    controller.current = current;
    const stop = startCartRefresh({ appState: AppState, refresh: current.refreshHistory, isSignedIn: () => Boolean(authRef.current.session) });
    return () => { stop(); current.dispose(); controller.current = null; };
  }, []);
  useEffect(() => { controller.current?.setIdentity({ userId, loading, sessionLost: Boolean(auth.sessionLost) }); }, [userId, loading, auth.sessionLost]);
  const hidden = state.owner !== userId || loading || auth.sessionLost;
  return { ...state, orders: hidden ? [] : state.orders, attempt: hidden ? null : state.attempt, result: hidden ? null : state.result,
    error: hidden ? '' : state.error, historyError: hidden ? '' : state.historyError,
    status: auth.sessionLost ? 'session-lost' : hidden ? 'loading' : state.status,
    historyStatus: auth.sessionLost ? 'session-lost' : hidden ? 'loading' : state.historyStatus,
    submit: details => controller.current?.submit(details), refreshHistory: () => controller.current?.refreshHistory(), startAnother: () => controller.current?.startAnother() };
}
