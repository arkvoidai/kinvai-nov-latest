import { Router } from 'express';
import { getPublicServerConfig } from '../lib/config.ts';

export const seoRouter = Router();

seoRouter.get('/robots.txt', (_req, res) => {
  const { siteUrl } = getPublicServerConfig();
  const lines = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /account',
    'Disallow: /checkout',
    'Disallow: /saved',
    'Disallow: /cart-redirect',
    'Disallow: /auth',
    'Disallow: /design',
    '',
    `Sitemap: ${siteUrl}/sitemap.xml`,
  ];
  res.type('text/plain').send(lines.join('\n'));
});

seoRouter.get('/sitemap.xml', (_req, res) => {
  const { siteUrl } = getPublicServerConfig();
  const staticPaths = [
    '/',
    '/shop',
    '/collections',
    '/about',
    '/how-it-works',
    '/support',
    '/licence',
    '/legal/privacy',
    '/legal/terms',
    '/legal/refunds',
  ];

  const urls = staticPaths
    .map(
      (p) =>
        `  <url>\n    <loc>${siteUrl}${p === '/' ? '' : p}</loc>\n    <changefreq>weekly</changefreq>\n  </url>`
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
  res.type('application/xml').send(xml);
});
