import { useEffect } from 'react';
import { getPublicConfig } from '../config';

export interface PageMetaOptions {
  title: string;
  description?: string;
  noindex?: boolean;
  ogImage?: string | null;
  /** Relative path (e.g. "/products/my-slug") or full URL for <link rel="canonical"> */
  canonicalPath?: string | null;
}

function upsertMeta(
  selector: string,
  attrName: 'name' | 'property',
  attrValue: string,
  content: string
): void {
  let meta = document.querySelector<HTMLMetaElement>(selector);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attrName, attrValue);
    document.head.appendChild(meta);
  }
  meta.content = content;
}

export function buildCanonicalHref(siteUrl: string, canonicalPath: string): string {
  const cleanBase = siteUrl.replace(/\/+$/, '');
  if (/^https?:\/\//i.test(canonicalPath)) {
    return canonicalPath;
  }
  const normalizedPath = canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`;
  if (normalizedPath === '/') {
    return `${cleanBase}/`;
  }
  return `${cleanBase}${normalizedPath.replace(/\/+$/, '')}`;
}

function upsertCanonical(href: string | null): void {
  const existing = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="canonical"]'));
  if (!href) {
    existing.forEach((node) => node.remove());
    return;
  }
  const [first, ...duplicates] = existing;
  duplicates.forEach((node) => node.remove());

  if (first) {
    first.href = href;
  } else {
    const link = document.createElement('link');
    link.rel = 'canonical';
    link.href = href;
    document.head.appendChild(link);
  }
}

export function usePageMeta({
  title,
  description,
  noindex = false,
  ogImage,
  canonicalPath,
}: PageMetaOptions): void {
  useEffect(() => {
    document.title = title;
    upsertMeta('meta[property="og:title"]', 'property', 'og:title', title);

    if (description) {
      upsertMeta('meta[name="description"]', 'name', 'description', description);
      upsertMeta('meta[property="og:description"]', 'property', 'og:description', description);
    }

    if (ogImage) {
      upsertMeta('meta[property="og:image"]', 'property', 'og:image', ogImage);
      upsertMeta('meta[name="twitter:image"]', 'name', 'twitter:image', ogImage);
    } else {
      document.querySelector('meta[property="og:image"]')?.remove();
      document.querySelector('meta[name="twitter:image"]')?.remove();
    }

    if (noindex) {
      upsertCanonical(null);
    } else {
      const { siteUrl } = getPublicConfig();
      const targetPath =
        canonicalPath !== undefined
          ? canonicalPath
          : typeof window !== 'undefined'
            ? window.location.pathname
            : null;
      upsertCanonical(targetPath ? buildCanonicalHref(siteUrl, targetPath) : null);
    }

    const existingRobots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (noindex) {
      if (existingRobots) {
        existingRobots.content = 'noindex, nofollow';
      } else {
        const meta = document.createElement('meta');
        meta.name = 'robots';
        meta.content = 'noindex, nofollow';
        document.head.appendChild(meta);
      }
    } else if (existingRobots) {
      existingRobots.remove();
    }
  }, [title, description, noindex, ogImage, canonicalPath]);
}
