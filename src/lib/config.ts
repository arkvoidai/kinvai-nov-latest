export interface KinvaiPublicFlags {
  razorpay: boolean;
  paypal: boolean;
  allowSeedFallback: boolean;
}

export interface KinvaiPublicConfig {
  siteUrl: string;
  supabaseUrl: string;
  supabasePublishableKey: string;
  flags: KinvaiPublicFlags;
}

declare global {
  interface Window {
    __KINVAI__?: KinvaiPublicConfig;
  }
}

const DEFAULT_CONFIG: KinvaiPublicConfig = {
  siteUrl: 'https://kinvai.arkvoid.com',
  supabaseUrl: '',
  supabasePublishableKey: '',
  flags: {
    razorpay: false,
    paypal: false,
    allowSeedFallback: true,
  },
};

export function getPublicConfig(): KinvaiPublicConfig {
  if (typeof window !== 'undefined' && window.__KINVAI__) {
    return {
      siteUrl: window.__KINVAI__.siteUrl || DEFAULT_CONFIG.siteUrl,
      supabaseUrl: window.__KINVAI__.supabaseUrl || '',
      supabasePublishableKey: window.__KINVAI__.supabasePublishableKey || '',
      flags: {
        razorpay: Boolean(window.__KINVAI__.flags?.razorpay),
        paypal: Boolean(window.__KINVAI__.flags?.paypal),
        allowSeedFallback:
          window.__KINVAI__.flags?.allowSeedFallback !== undefined
            ? Boolean(window.__KINVAI__.flags.allowSeedFallback)
            : true,
      },
    };
  }
  return DEFAULT_CONFIG;
}

export function isSupabaseConfigured(): boolean {
  const cfg = getPublicConfig();
  return Boolean(cfg.supabaseUrl && cfg.supabasePublishableKey);
}
