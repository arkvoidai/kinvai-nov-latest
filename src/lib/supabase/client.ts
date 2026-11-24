import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getPublicConfig } from '../config';

let browserClient: SupabaseClient | null = null;

/**
 * Browser Supabase client configured for persistent PKCE sessions under RLS.
 * Returns null if SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY are not yet configured.
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (browserClient) return browserClient;

  const { supabaseUrl, supabasePublishableKey } = getPublicConfig();
  if (!supabaseUrl || !supabasePublishableKey) {
    return null;
  }

  browserClient = createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storageKey: 'kinvai.auth.session',
    },
  });

  return browserClient;
}

export function getPublicMediaUrl(storagePath: string | null | undefined): string | null {
  if (!storagePath) return null;
  if (storagePath.startsWith('http://') || storagePath.startsWith('https://') || storagePath.startsWith('/')) {
    return storagePath;
  }
  const client = getSupabaseBrowserClient();
  if (!client) return null;
  const { data } = client.storage.from('product-media').getPublicUrl(storagePath);
  return data.publicUrl || null;
}
