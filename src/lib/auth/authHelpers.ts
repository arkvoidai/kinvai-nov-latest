/**
 * Validates that a post-auth redirect target is strictly a safe same-origin relative path.
 * Blocks protocol-relative ("//evil.com"), absolute URLs ("https://..."), backslashes, and control chars.
 */
export function validateNextPath(raw: string | null | undefined, fallback = '/account'): string {
  if (!raw || typeof raw !== 'string') return fallback;
  const trimmed = raw.trim();
  if (!trimmed.startsWith('/')) return fallback;
  if (trimmed.startsWith('//') || trimmed.includes('\\')) return fallback;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) return fallback;
  if (/[\r\n\0]/.test(trimmed)) return fallback;
  if (trimmed.startsWith('/auth/callback')) return fallback;
  try {
    const base = 'https://kinvai.arkvoid.com';
    const resolved = new URL(trimmed, base);
    if (resolved.origin !== base) return fallback;
    if (resolved.pathname.startsWith('/auth/callback')) return fallback;
    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return fallback;
  }
}

/**
 * Builds the exact Supabase OAuth redirectTo URL:
 *   `${baseOrigin}/auth/callback?next=${encodeURIComponent(safeNext)}`
 */
export function buildOAuthRedirectUrl(
  siteUrl: string | null | undefined,
  currentPath: string | null | undefined,
  windowOrigin?: string
): string {
  const safeNext = validateNextPath(currentPath, '/account');
  const configuredOrigin = (siteUrl || '').trim().replace(/\/+$/, '');
  const runtimeOrigin = (windowOrigin || '').trim().replace(/\/+$/, '');

  // Prefer the configured siteUrl when running on production domain, otherwise keep runtime origin
  // so local / preview callbacks return cleanly to the active host.
  const base =
    configuredOrigin && (!runtimeOrigin || runtimeOrigin === configuredOrigin)
      ? configuredOrigin
      : runtimeOrigin || configuredOrigin;

  return `${base}/auth/callback?next=${encodeURIComponent(safeNext)}`;
}

/**
 * Safely detects whether the application is currently rendered inside an iframe
 * (e.g., AI Studio preview) where third-party OAuth providers block embedded redirects.
 */
export function isRunningInIframe(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch {
    // Cross-origin frame access throws SecurityError -> definitely inside an iframe
    return true;
  }
}
