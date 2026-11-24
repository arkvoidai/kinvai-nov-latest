import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getPublicConfig } from '../config';
import { ProfileSchema, type Profile } from '../data/types';
import { getSupabaseBrowserClient } from '../supabase/client';
import { buildOAuthRedirectUrl } from './authHelpers';

export interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  configured: boolean;
  signInWithGoogle: (redirectPath?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchUserProfile(userId: string): Promise<Profile | null> {
  const client = getSupabaseBrowserClient();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from('profiles')
      .select('id, display_name, avatar_url, country_code, is_admin')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) return null;
    const parsed = ProfileSchema.safeParse(data);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const client = getSupabaseBrowserClient();
  const configured = Boolean(client);

  const syncSession = useCallback(async (session: Session | null) => {
    const nextUser = session?.user ?? null;
    setUser(nextUser);
    if (nextUser) {
      const nextProfile = await fetchUserProfile(nextUser.id);
      setProfile(nextProfile);
    } else {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    if (!client) {
      setLoading(false);
      return;
    }

    let active = true;

    // Resolve the session on boot via getSession() without premature signed-out flicker
    client.auth
      .getSession()
      .then(async ({ data }) => {
        if (!active) return;
        await syncSession(data.session);
        if (active) {
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setLoading(false);
        }
      });

    // Keep session live on subsequent auth state changes without unnecessary sign-outs
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        return;
      }
      if (session) {
        void syncSession(session);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [client, syncSession]);

  const signInWithGoogle = useCallback(
    async (redirectPath = '/account'): Promise<{ error: string | null }> => {
      if (!client) {
        return {
          error: 'Sign-in is unavailable until Supabase authentication is configured.',
        };
      }
      const { siteUrl } = getPublicConfig();
      const runtimeOrigin = typeof window !== 'undefined' ? window.location.origin : '';
      const redirectTo = buildOAuthRedirectUrl(siteUrl, redirectPath, runtimeOrigin);

      const { error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
        },
      });
      return {
        error: error
          ? "We couldn't start Google sign-in right now. Please try again."
          : null,
      };
    },
    [client]
  );

  const signOut = useCallback(async (): Promise<{ error: string | null }> => {
    if (!client) {
      setUser(null);
      setProfile(null);
      return { error: null };
    }
    try {
      const { error } = await client.auth.signOut();
      if (error) {
        return {
          error: "We couldn't sign you out right now. Please try again.",
        };
      }
      setUser(null);
      setProfile(null);
      return { error: null };
    } catch {
      return {
        error: "We couldn't sign you out right now. Please try again.",
      };
    }
  }, [client]);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const nextProfile = await fetchUserProfile(user.id);
    if (nextProfile) {
      setProfile(nextProfile);
    }
  }, [user]);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (!client) return null;
    try {
      const { data } = await client.auth.getSession();
      return data.session?.access_token ?? null;
    } catch {
      return null;
    }
  }, [client]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      isAdmin: Boolean(profile?.is_admin),
      loading,
      configured,
      signInWithGoogle,
      signOut,
      refreshProfile,
      getAccessToken,
    }),
    [user, profile, loading, configured, signInWithGoogle, signOut, refreshProfile, getAccessToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
