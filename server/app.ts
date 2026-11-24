import compression from 'compression';
import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { getPublicServerConfig, serializePublicConfigScript } from './lib/config.ts';
import { createRateLimitMiddleware } from './lib/rateLimit.ts';
import { adminImageRouter } from './routes/adminImage.ts';
import { downloadsRouter } from './routes/downloads.ts';
import { formsRouter } from './routes/forms.ts';
import { healthRouter } from './routes/health.ts';
import { mediaRouter } from './routes/media.ts';
import { paymentsRouter } from './routes/payments.ts';
import { seoRouter } from './routes/seo.ts';
import { webhooksRouter } from './routes/webhooks.ts';
import { getSupabaseAdmin } from './services/supabaseAdmin.ts';

const NOINDEX_PREFIXES = [
  '/design',
  '/admin',
  '/account',
  '/checkout',
  '/saved',
  '/cart-redirect',
  '/auth',
];

function isPreviewEnvironment(req: Request): boolean {
  const host = (req.headers.host || '').toLowerCase();
  const appUrl = (process.env.APP_URL || '').toLowerCase();
  return (
    process.env.NODE_ENV !== 'production' ||
    host.includes('localhost') ||
    host.includes('127.0.0.1') ||
    host.includes('.run.app') ||
    appUrl.includes('.run.app')
  );
}

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildPublicCover1600Url(supabaseUrl: string, coverPath: string | null | undefined): string | null {
  if (!supabaseUrl || !coverPath) return null;
  const trimmed = coverPath.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  const normalized = trimmed
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')
    .replace(/\/(480|960|1600)\.webp$/i, '');
  const cleanHost = supabaseUrl.trim().replace(/\/+$/, '');
  return `${cleanHost}/storage/v1/object/public/product-media/${normalized}/1600.webp`;
}

async function resolveRouteOgImage(pathname: string, supabaseUrl: string): Promise<string | null> {
  if (!supabaseUrl) return null;
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return null;

  try {
    const productMatch = pathname.match(/^\/products\/([^/]+)\/?$/);
    if (productMatch) {
      const slug = decodeURIComponent(productMatch[1]);
      const { data } = await supabaseAdmin
        .from('products')
        .select('cover_path')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle();
      return buildPublicCover1600Url(supabaseUrl, data?.cover_path);
    }

    const collectionMatch = pathname.match(/^\/collections\/([^/]+)\/?$/);
    if (collectionMatch) {
      const slug = decodeURIComponent(collectionMatch[1]);
      const { data: col } = await supabaseAdmin
        .from('collections')
        .select('id')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();
      if (!col?.id) return null;

      const { data: firstProduct } = await supabaseAdmin
        .from('products')
        .select('cover_path')
        .eq('collection_id', col.id)
        .eq('status', 'published')
        .not('cover_path', 'is', null)
        .order('is_featured', { ascending: false })
        .order('featured_rank', { ascending: true, nullsFirst: false })
        .limit(1)
        .maybeSingle();

      return buildPublicCover1600Url(supabaseUrl, firstProduct?.cover_path);
    }
  } catch {
    return null;
  }

  return null;
}

async function injectHtml(template: string, pathname: string): Promise<string> {
  const pubConfig = getPublicServerConfig();
  const configScript = serializePublicConfigScript(pubConfig);

  const shouldNoindex = NOINDEX_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  const ogImage = shouldNoindex
    ? null
    : await resolveRouteOgImage(pathname, pubConfig.supabaseUrl);

  const canonicalUrl = `${pubConfig.siteUrl}${pathname === '/' ? '' : pathname}`;
  const seoLines = [
    `<link rel="canonical" href="${escapeHtmlAttr(canonicalUrl)}" />`,
    shouldNoindex ? '<meta name="robots" content="noindex, nofollow" />' : '',
    ogImage ? `<meta property="og:image" content="${escapeHtmlAttr(ogImage)}" />` : '',
    ogImage ? `<meta name="twitter:image" content="${escapeHtmlAttr(ogImage)}" />` : '',
  ]
    .filter(Boolean)
    .join('\n    ');

  let html = template;
  if (html.includes('<!--__KINVAI_SEO__-->')) {
    html = html.replace('<!--__KINVAI_SEO__-->', seoLines);
  } else {
    html = html.replace('</head>', `    ${seoLines}\n  </head>`);
  }

  if (html.includes('<!--__KINVAI_CONFIG__-->')) {
    html = html.replace('<!--__KINVAI_CONFIG__-->', configScript);
  } else {
    html = html.replace('</head>', `    ${configScript}\n  </head>`);
  }

  return html;
}

export async function createApp(): Promise<Express> {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  // Security headers
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    // Enforce frame-ancestors 'self' in production, relaxed in AI Studio preview iframe
    if (!isPreviewEnvironment(req)) {
      res.setHeader('Content-Security-Policy', "frame-ancestors 'self'");
    }
    next();
  });

  app.use(compression());

  // Raw-body parsing MUST be mounted before express.json() for webhook signature verification
  app.use('/api/webhooks', webhooksRouter);

  // Basic rate limiting on API routes
  const apiLimiter = createRateLimitMiddleware({
    windowMs: 60_000,
    maxRequests: 120,
    keyPrefix: 'api',
  });
  app.use('/api', apiLimiter);

  // Admin image generation route mounts its own 10mb JSON parser & stealth admin check
  app.use('/api/admin/image', adminImageRouter);

  // Standard JSON parsing for all other non-webhook API routes
  app.use(express.json({ limit: '1mb' }));

  // Health & SEO routes
  app.use(healthRouter);
  app.use(seoRouter);

  // API route modules
  app.use('/api/payments', paymentsRouter);
  app.use('/api/download', downloadsRouter);
  app.use('/api/downloads', downloadsRouter);
  app.use('/api/media', mediaRouter);
  app.use('/api/forms', formsRouter);
  app.use('/api', formsRouter);

  // Unknown API routes return clean JSON 404
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  const rootDir = process.cwd();
  const distDir = path.resolve(rootDir, 'dist');
  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(path.join(distDir, 'index.html'));

  if (!isProd) {
    // Dev mode: mount Vite middleware inside Express (never inside vite.config.ts)
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });

    app.use(vite.middlewares);

    app.get('*', async (req, res, next) => {
      try {
        const url = req.originalUrl;
        const indexPath = path.resolve(rootDir, 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        const html = await injectHtml(template, req.path);
        res.status(200).set({ 'Content-Type': 'text/html; charset=utf-8' }).end(html);
      } catch (err) {
        if (err instanceof Error) {
          vite.ssrFixStacktrace(err);
        }
        next(err);
      }
    });
  } else {
    // Production mode: serve static assets from /dist and inject runtime config into index.html
    app.use(
      express.static(distDir, {
        index: false,
        maxAge: '7d',
      })
    );

    const distIndexHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');
    app.get('*', async (req, res, next) => {
      try {
        const html = await injectHtml(distIndexHtml, req.path);
        res.status(200).set({ 'Content-Type': 'text/html; charset=utf-8' }).end(html);
      } catch (err) {
        next(err);
      }
    });
  }

  // Fallback error handler
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[kinvai-server] unhandled error:', err);
    if (res.headersSent) return;
    res.status(500).json({ error: 'Internal server error.' });
  });

  return app;
}
