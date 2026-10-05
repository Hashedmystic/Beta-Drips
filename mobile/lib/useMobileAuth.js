import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { supabase, storage } from './supabase';
import { createAuthController } from './authController.mjs';

export default function useMobileAuth() {
  const [state, setState] = useState({ session: null, status: supabase ? 'restoring' : 'unconfigured', message: '', sessionLost: false });
  const controller = useRef(null);
  useEffect(() => {
    const auth = createAuthController({ client: supabase, storage, browser: WebBrowser, linking: Linking, appState: AppState, onChange: setState });
    controller.current = auth;
    auth.start();
    return () => { auth.dispose(); controller.current = null; };
  }, []);
  return { ...state, signIn: () => controller.current?.signIn(), signOut: () => controller.current?.signOut(), markSessionLost: userId => controller.current?.markSessionLost(userId) };
}
