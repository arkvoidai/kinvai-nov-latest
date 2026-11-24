export interface ServerPublicConfig {
  siteUrl: string;
  supabaseUrl: string;
  supabasePublishableKey: string;
  flags: {
    razorpay: boolean;
    paypal: boolean;
    allowSeedFallback: boolean;
  };
}

export interface ServerSecrets {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  geminiApiKey: string;
  geminiImageModel: string;
  razorpayKeyId: string;
  razorpayKeySecret: string;
  razorpayWebhookSecret: string;
  paypalClientId: string;
  paypalClientSecret: string;
  paypalWebhookId: string;
  paypalEnv: 'sandbox' | 'live';
}

function parseBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === '') return fallback;
  return value.toLowerCase() === 'true' || value === '1';
}

export function getPublicServerConfig(): ServerPublicConfig {
  const siteUrl = (process.env.SITE_URL || 'https://kinvai.arkvoid.com').replace(/\/+$/, '');
  const supabaseUrl = (process.env.SUPABASE_URL || '').trim();
  const supabasePublishableKey = (process.env.SUPABASE_PUBLISHABLE_KEY || '').trim();

  const razorpayConfigured = Boolean(
    process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  );
  const paypalConfigured = Boolean(
    process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET
  );
  const allowSeedFallback = parseBool(process.env.ALLOW_SEED_FALLBACK, true);

  return {
    siteUrl,
    supabaseUrl,
    supabasePublishableKey,
    flags: {
      razorpay: razorpayConfigured,
      paypal: paypalConfigured,
      allowSeedFallback,
    },
  };
}

export function getServerSecrets(): ServerSecrets {
  return {
    supabaseUrl: (process.env.SUPABASE_URL || '').trim(),
    supabaseServiceRoleKey: (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim(),
    geminiApiKey: (process.env.GEMINI_API_KEY || '').trim(),
    geminiImageModel: (process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image').trim(),
    razorpayKeyId: (process.env.RAZORPAY_KEY_ID || '').trim(),
    razorpayKeySecret: (process.env.RAZORPAY_KEY_SECRET || '').trim(),
    razorpayWebhookSecret: (process.env.RAZORPAY_WEBHOOK_SECRET || '').trim(),
    paypalClientId: (process.env.PAYPAL_CLIENT_ID || '').trim(),
    paypalClientSecret: (process.env.PAYPAL_CLIENT_SECRET || '').trim(),
    paypalWebhookId: (process.env.PAYPAL_WEBHOOK_ID || '').trim(),
    paypalEnv: process.env.PAYPAL_ENV === 'live' ? 'live' : 'sandbox',
  };
}

export function serializePublicConfigScript(config: ServerPublicConfig): string {
  const safeJson = JSON.stringify(config)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
  return `<script>window.__KINVAI__ = ${safeJson};</script>`;
}
