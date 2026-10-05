import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as Crypto from 'expo-crypto';
import { storage, supabase } from './supabase';
import { apiBaseUrl, createCartApi } from './cartApi.mjs';
import { createCartController } from './cartController.mjs';
import { startCartRefresh } from './cartRefresh.mjs';

export default function useMobileCart(auth) {
  const authRef = useRef(auth); authRef.current = auth;
  const controller = useRef(null);
  const [state, setState] = useState({ owner: null, items: [], revision: 0, status: 'loading', busy: false, error: '', checkoutPending: true });
  const userId = auth.session?.user.id || null;
  const loading = ['restoring', 'openingBrowser', 'browser', 'exchanging', 'signingOut'].includes(auth.status);
  useEffect(() => {
    let request;
    try {
      const baseUrl = apiBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL || 'https://betadrips.netlify.app', __DEV__);
      request = createCartApi({ client: supabase, baseUrl, onSessionLost: id => authRef.current.markSessionLost(id) });
    } catch {
      request = async () => { throw new Error('Invalid API configuration.'); };
    }
    const cart = createCartController({ storage, request, uuid: Crypto.randomUUID, onChange: setState, initialHold: true });
    controller.current = cart;
    const stopRefresh = startCartRefresh({ appState: AppState, refresh: cart.refresh, isSignedIn: () => Boolean(authRef.current.session) });
    return () => { stopRefresh(); cart.dispose(); controller.current = null; };
  }, []);
  useEffect(() => { controller.current?.setIdentity({ userId, loading, sessionLost: Boolean(auth.sessionLost) }); }, [userId, loading, auth.sessionLost]);
  // Render-time ownership check hides a previous account before effects run.
  const hidden = state.owner !== userId || loading || auth.sessionLost;
  return { ...state, items: hidden ? [] : state.items, status: auth.sessionLost ? 'session-lost' : hidden ? 'loading' : state.status,
    busy: state.busy || hidden, error: auth.sessionLost ? 'Sign in again to view your saved cart. Its server data has not been deleted.' : hidden ? '' : state.error,
    add: (id, size) => controller.current?.add(id, size),
    quantity: (id, size, quantity) => controller.current?.quantity(id, size, quantity),
    getState: () => controller.current?.getState(),
    holdCheckout: value => controller.current?.holdCheckout(value), confirmCheckout: expectedOwner => controller.current?.confirmCheckout(expectedOwner),
    remove: (id, size) => controller.current?.remove(id, size), refresh: (manual = true) => controller.current?.refresh(manual) };
}
