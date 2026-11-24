export interface SearchPageEntry {
  id: string;
  title: string;
  description: string;
  to: string;
  keywords: string[];
}

export const SEARCH_PAGES: SearchPageEntry[] = [
  {
    id: 'page-shop',
    title: 'Explore the shop',
    description: 'Browse all ready-made digital systems',
    to: '/shop',
    keywords: ['shop', 'catalogue', 'products', 'browse', 'all'],
  },
  {
    id: 'page-collections',
    title: 'Collections',
    description: 'Four ways to get a head start',
    to: '/collections',
    keywords: ['collections', 'categories', 'run the shop', 'make the thing', 'world', 'interface'],
  },
  {
    id: 'page-how-it-works',
    title: 'How it works',
    description: 'Instant download, lifetime access, secure checkout',
    to: '/how-it-works',
    keywords: ['how', 'delivery', 'download', 'payments', 'razorpay', 'paypal'],
  },
  {
    id: 'page-saved',
    title: 'Saved items',
    description: 'Your saved wishlist shortlist',
    to: '/saved',
    keywords: ['saved', 'wishlist', 'favorites', 'heart'],
  },
  {
    id: 'page-account',
    title: 'Account & Library',
    description: 'Purchased downloads, orders and profile',
    to: '/account',
    keywords: ['account', 'library', 'orders', 'downloads', 'sign in'],
  },
  {
    id: 'page-support',
    title: 'Support & Contact',
    description: 'Questions, download help and heyarkvoid@gmail.com',
    to: '/support',
    keywords: ['support', 'help', 'contact', 'email', 'refund'],
  },
  {
    id: 'page-licence',
    title: 'Licence',
    description: '1 licence per product. Yours for life.',
    to: '/licence',
    keywords: ['licence', 'license', 'commercial', 'usage', 'rights'],
  },
  {
    id: 'page-about',
    title: 'About Kinvai',
    description: 'Owner-built digital commerce by Arkvoid Inc.',
    to: '/about',
    keywords: ['about', 'arkvoid', 'founder', 'manish'],
  },
];

export const SEARCH_SUGGESTIONS: string[] = [
  'Spreadsheet',
  'Playbook',
  'Worldbuilding',
  'Figma',
];

export const RECENT_SEARCHES_KEY = 'kinvai.recent_searches.v1';
const MAX_RECENT_SEARCHES = 5;

export interface HighlightSegment {
  text: string;
  match: boolean;
}

/**
 * Splits a string into matched and non-matched text segments for safe React rendering
 * (no dangerouslySetInnerHTML).
 */
export function highlightMatchSegments(text: string, query: string): HighlightSegment[] {
  const cleanQuery = query.trim();
  if (!cleanQuery || !text) {
    return [{ text, match: false }];
  }

  const tokens = cleanQuery
    .split(/\s+/)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .filter((t) => t.length >= 2);

  if (tokens.length === 0) {
    const escaped = cleanQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    return text
      .split(regex)
      .filter(Boolean)
      .map((part) => ({
        text: part,
        match: part.toLowerCase() === cleanQuery.toLowerCase(),
      }));
  }

  const regex = new RegExp(`(${tokens.join('|')})`, 'gi');
  const lowerTokens = new Set(cleanQuery.toLowerCase().split(/\s+/).filter((t) => t.length >= 2));

  return text
    .split(regex)
    .filter(Boolean)
    .map((part) => ({
      text: part,
      match: lowerTokens.has(part.toLowerCase()),
    }));
}

export function filterSearchPages(query: string): SearchPageEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return SEARCH_PAGES.filter((page) => {
    const hay = `${page.title} ${page.description} ${page.keywords.join(' ')}`.toLowerCase();
    return hay.includes(q);
  }).slice(0, 4);
}

export function readRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .slice(0, MAX_RECENT_SEARCHES);
  } catch {
    return [];
  }
}

export function pushRecentSearch(query: string): string[] {
  const clean = query.trim();
  const current = readRecentSearches();
  if (!clean) return current;
  const next = [clean, ...current.filter((item) => item.toLowerCase() !== clean.toLowerCase())].slice(
    0,
    MAX_RECENT_SEARCHES
  );
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage errors
    }
  }
  return next;
}

export function clearRecentSearches(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    // Ignore
  }
}
