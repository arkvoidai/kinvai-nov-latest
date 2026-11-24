import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getServerSecrets } from '../lib/config.ts';

let adminClient: SupabaseClient | null = null;

/**
 * Service-role Supabase client — strictly server-side only.
 * Never import this file from /src.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (adminClient) return adminClient;
  const { supabaseUrl, supabaseServiceRoleKey } = getServerSecrets();
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return null;
  }

  adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  return adminClient;
}
