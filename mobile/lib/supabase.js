import 'react-native-url-polyfill/auto';
import './crypto';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import { createSecureStorage } from './secureStorage.mjs';
import { validPublicConfig } from './publicConfig.mjs';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const storage = createSecureStorage(SecureStore, Crypto.randomUUID);
export const supabase = validPublicConfig(url, key) ? createClient(url, key, {
  auth: {
    storage,
    storageKey: 'beta-drips-mobile-auth',
    flowType: 'pkce',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
}) : null;
