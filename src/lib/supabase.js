import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const configured = url && key && !/YOUR_/i.test(url + key);
let client = null;
try {
  if (configured) client = createClient(url, key, {
    auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
} catch { /* Invalid public configuration shows the same missing-configuration state. */ }
export const supabase = client;
