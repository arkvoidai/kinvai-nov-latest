import { z } from 'zod';
import { getPublicConfig } from '../config';
import { getSupabaseBrowserClient } from '../supabase/client';
import { SEED_COLLECTIONS, SEED_PRODUCTS } from './seed';
import {
  CollectionSchema,
  EntitlementSchema,
  ProductMediaSchema,
  ProductSchema,
  RatingStatsSchema,
  ReviewSchema,
  WishlistItemSchema,
  type Collection,
  type DataEnvelope,
  type Entitlement,
  type PaginatedProductsResult,
  type Product,
  type ProductDetail,
  type ProductMedia,
  type ProductQueryParams,
  type RatingStats,
  type Review,
  type WishlistItem,
} from './types';
import { mapReviewSubmitError, rankRelatedProducts } from '../product/productHelpers';
import {
  normalizeOrderItemRow,
  normalizeOrderRow,
  type AccountLibraryItem,
  type AccountOrder,
  type AccountOrderItem,
  type SafeProductFileMeta,
} from '../account/accountHelpers';

function allowSeedFallback(): boolean {
  return getPublicConfig().flags.allowSeedFallback;
}

function parseArray<T>(schema: z.ZodType<T>, raw: unknown): T[] {
  const result = z.array(schema).safeParse(raw);
  if (result.success) {
    return result.data;
  }
  // Validate row-by-row so one malformed legacy row never hides valid rows
  if (Array.isArray(raw)) {
    const valid: T[] = [];
    for (const item of raw) {
      const parsed = schema.safeParse(item);
      if (parsed.success) {
        valid.push(parsed.data);
      }
    }
    return valid;
  }
  return [];
}

/**
 * Pure seed-data filtering, sorting, and pagination helper (also unit-tested directly).
 */
export function querySeedProducts(params: ProductQueryParams = {}): PaginatedProductsResult {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.max(1, Math.min(48, params.pageSize ?? 12));

  let list = SEED_PRODUCTS.filter((p) => p.status === 'published');

  if (params.collection) {
    const col = SEED_COLLECTIONS.find(
      (c) => c.slug === params.collection || c.id === params.collection
    );
    if (col) {
      list = list.filter((p) => p.collection_id === col.id);
    } else {
      list = [];
    }
  }

  if (params.tags && params.tags.length > 0) {
    const lowerTags = params.tags.map((t) => t.toLowerCase());
    list = list.filter((p) =>
      lowerTags.some((t) => p.tags.map((pt) => pt.toLowerCase()).includes(t))
    );
  }

  if (params.formats && params.formats.length > 0) {
    const lowerFormats = params.formats.map((f) => f.toLowerCase());
    list = list.filter((p) =>
      lowerFormats.some((f) => p.file_formats.map((pf) => pf.toLowerCase()).includes(f))
    );
  }

  if (typeof params.priceMin === 'number') {
    list = list.filter((p) => p.price_cents >= params.priceMin!);
  }

  if (typeof params.priceMax === 'number') {
    list = list.filter((p) => p.price_cents <= params.priceMax!);
  }

  if (params.q && params.q.trim().length > 0) {
    const tokens = params.q
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
    list = list.filter((p) => {
      const haystack = [
        p.name,
        p.tagline ?? '',
        p.short_description ?? '',
        p.description ?? '',
        p.sku,
        ...p.tags,
        ...p.file_formats,
      ]
        .join(' ')
        .toLowerCase();
      return tokens.every((tok) => haystack.includes(tok));
    });
  }

  const sort = params.sort ?? 'featured';
  list = [...list].sort((a, b) => {
    switch (sort) {
      case 'price-asc':
        return a.price_cents - b.price_cents;
      case 'price-desc':
        return b.price_cents - a.price_cents;
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'newest':
        return (b.published_at ?? '').localeCompare(a.published_at ?? '');
      case 'featured':
      default: {
        const aFeat = a.is_featured ? 0 : 1;
        const bFeat = b.is_featured ? 0 : 1;
        if (aFeat !== bFeat) return aFeat - bFeat;
        const aRank = a.featured_rank ?? 999;
        const bRank = b.featured_rank ?? 999;
        if (aRank !== bRank) return aRank - bRank;
        return a.name.localeCompare(b.name);
      }
    }
  });

  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const items = list.slice(start, start + pageSize);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
    source: 'seed',
    isPreviewData: true,
  };
}

export async function getCollections(): Promise<DataEnvelope<Collection[]>> {
  const client = getSupabaseBrowserClient();
  let queryError: string | undefined;

  if (client) {
    try {
      const { data, error } = await client
        .from('collections')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        queryError = error.message || 'Could not load collections.';
      } else if (data && data.length > 0) {
        const parsed = parseArray(CollectionSchema, data);
        if (parsed.length > 0) {
          return { data: parsed, source: 'supabase', isPreviewData: false };
        }
      }
    } catch (err) {
      queryError = err instanceof Error ? err.message : 'Could not load collections.';
    }
  }

  if (allowSeedFallback()) {
    return { data: SEED_COLLECTIONS, source: 'seed', isPreviewData: true };
  }
  return { data: [], source: 'empty', isPreviewData: false, error: queryError };
}

export async function getCollection(slug: string): Promise<DataEnvelope<Collection | null>> {
  const client = getSupabaseBrowserClient();
  let queryError: string | undefined;

  if (client) {
    try {
      const { data, error } = await client
        .from('collections')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        queryError = error.message || 'Could not load collection.';
      } else if (data) {
        const parsed = CollectionSchema.safeParse(data);
        if (parsed.success) {
          return { data: parsed.data, source: 'supabase', isPreviewData: false };
        }
      }
    } catch (err) {
      queryError = err instanceof Error ? err.message : 'Could not load collection.';
    }
  }

  if (allowSeedFallback()) {
    const found = SEED_COLLECTIONS.find((c) => c.slug === slug) ?? null;
    return { data: found, source: 'seed', isPreviewData: true };
  }
  return { data: null, source: 'empty', isPreviewData: false, error: queryError };
}

export async function getProducts(params: ProductQueryParams = {}): Promise<PaginatedProductsResult> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.max(1, Math.min(48, params.pageSize ?? 12));
  const client = getSupabaseBrowserClient();
  let queryError: string | undefined;

  if (client) {
    try {
      let collectionId: string | undefined = params.collectionId;
      if (!collectionId && params.collection) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          params.collection
        );
        const colRes = isUuid
          ? await client
              .from('collections')
              .select('id')
              .eq('id', params.collection)
              .maybeSingle()
          : await client
              .from('collections')
              .select('id')
              .eq('slug', params.collection)
              .maybeSingle();
        if (colRes.error) {
          queryError = colRes.error.message || 'Could not resolve collection.';
        } else {
          collectionId = colRes.data?.id;
        }
      }

      if (!queryError) {
        let query = client
          .from('products')
          .select('*', { count: 'exact' })
          .eq('status', 'published');

        if (params.collection || params.collectionId) {
          if (!collectionId) {
            const { count: liveCount, error: countError } = await client
              .from('products')
              .select('id', { count: 'exact', head: true })
              .eq('status', 'published');

            if (countError) {
              queryError = countError.message || 'Could not load products.';
            } else if ((liveCount ?? 0) > 0) {
              return {
                items: [],
                total: 0,
                page,
                pageSize,
                totalPages: 1,
                source: 'supabase',
                isPreviewData: false,
              };
            } else if (allowSeedFallback()) {
              return querySeedProducts(params);
            } else {
              return {
                items: [],
                total: 0,
                page,
                pageSize,
                totalPages: 1,
                source: 'empty',
                isPreviewData: false,
              };
            }
          } else {
            query = query.eq('collection_id', collectionId);
          }
        }

        if (!queryError) {
          if (params.tags && params.tags.length > 0) {
            query = query.overlaps('tags', params.tags);
          }
          if (params.formats && params.formats.length > 0) {
            query = query.overlaps('file_formats', params.formats);
          }
          if (typeof params.priceMin === 'number') {
            query = query.gte('price_cents', params.priceMin);
          }
          if (typeof params.priceMax === 'number') {
            query = query.lte('price_cents', params.priceMax);
          }
          if (params.q && params.q.trim().length > 0) {
            const safeQ = params.q.trim().replace(/[,%()]/g, ' ');
            query = query.or(
              `name.ilike.%${safeQ}%,tagline.ilike.%${safeQ}%,short_description.ilike.%${safeQ}%`
            );
          }

          switch (params.sort) {
            case 'price-asc':
              query = query.order('price_cents', { ascending: true });
              break;
            case 'price-desc':
              query = query.order('price_cents', { ascending: false });
              break;
            case 'name-asc':
              query = query.order('name', { ascending: true });
              break;
            case 'newest':
              query = query.order('published_at', { ascending: false, nullsFirst: false });
              break;
            case 'featured':
            default:
              query = query
                .order('is_featured', { ascending: false })
                .order('featured_rank', { ascending: true, nullsFirst: false })
                .order('name', { ascending: true });
              break;
          }

          const from = (page - 1) * pageSize;
          const to = from + pageSize - 1;
          const { data, count, error } = await query.range(from, to);

          if (error) {
            queryError = error.message || 'Could not load products.';
          } else if (data) {
            const hasFilters = Boolean(
              params.collection ||
                params.collectionId ||
                (params.tags && params.tags.length > 0) ||
                (params.formats && params.formats.length > 0) ||
                params.priceMin !== undefined ||
                params.priceMax !== undefined ||
                (params.q && params.q.trim().length > 0)
            );
            if (data.length > 0 || hasFilters) {
              const parsed = parseArray(ProductSchema, data);
              const total = count ?? parsed.length;
              return {
                items: parsed,
                total,
                page,
                pageSize,
                totalPages: Math.max(1, Math.ceil(total / pageSize)),
                source: 'supabase',
                isPreviewData: false,
              };
            }
          }
        }
      }
    } catch (err) {
      queryError = err instanceof Error ? err.message : 'Could not load products.';
    }
  }

  if (allowSeedFallback()) {
    return querySeedProducts(params);
  }

  return {
    items: [],
    total: 0,
    page,
    pageSize,
    totalPages: 1,
    source: 'empty',
    isPreviewData: false,
    error: queryError,
  };
}

export async function getFeatured(limit = 6): Promise<DataEnvelope<Product[]>> {
  const client = getSupabaseBrowserClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('products')
        .select('*')
        .eq('status', 'published')
        .eq('is_featured', true)
        .order('featured_rank', { ascending: true, nullsFirst: false })
        .limit(limit);

      if (!error && data && data.length > 0) {
        const parsed = parseArray(ProductSchema, data);
        if (parsed.length > 0) {
          return { data: parsed, source: 'supabase', isPreviewData: false };
        }
      }
    } catch {
      // Fallback below
    }
  }

  if (allowSeedFallback()) {
    const featured = SEED_PRODUCTS.filter((p) => p.is_featured)
      .sort((a, b) => (a.featured_rank ?? 999) - (b.featured_rank ?? 999))
      .slice(0, limit);
    return { data: featured, source: 'seed', isPreviewData: true };
  }
  return { data: [], source: 'empty', isPreviewData: false };
}

export async function getRelated(
  productId: string,
  limit = 4,
  currentProduct?: Pick<Product, 'id' | 'collection_id' | 'tags'> | null
): Promise<DataEnvelope<Product[]>> {
  const client = getSupabaseBrowserClient();
  if (client) {
    try {
      const { data: relRows, error: relError } = await client
        .from('product_relations')
        .select('related_product_id, sort_order')
        .eq('product_id', productId)
        .order('sort_order', { ascending: true })
        .limit(limit);

      if (!relError && relRows && relRows.length > 0) {
        const ids = relRows.map((r) => String(r.related_product_id));
        const { data: prodRows, error: prodError } = await client
          .from('products')
          .select('*')
          .in('id', ids)
          .eq('status', 'published');

        if (!prodError && prodRows && prodRows.length > 0) {
          const parsed = parseArray(ProductSchema, prodRows);
          const ordered = ids
            .map((id) => parsed.find((p) => p.id === id))
            .filter((p): p is Product => Boolean(p));
          if (ordered.length > 0) {
            return { data: ordered, source: 'supabase', isPreviewData: false };
          }
        }
      }

      // Fallback: same collection, ranked by shared tags (never fabricate)
      if (currentProduct?.collection_id) {
        const { data: sameColRows, error: sameColErr } = await client
          .from('products')
          .select('*')
          .eq('status', 'published')
          .eq('collection_id', currentProduct.collection_id)
          .neq('id', productId)
          .limit(24);

        if (!sameColErr && sameColRows && sameColRows.length > 0) {
          const parsed = parseArray(ProductSchema, sameColRows);
          const ranked = rankRelatedProducts(currentProduct, parsed, limit);
          return { data: ranked, source: 'supabase', isPreviewData: false };
        }
      }
    } catch {
      // Fallback below
    }
  }

  if (allowSeedFallback()) {
    const current = currentProduct ?? SEED_PRODUCTS.find((p) => p.id === productId);
    if (!current) {
      return { data: [], source: 'seed', isPreviewData: true };
    }
    const ranked = rankRelatedProducts(current, SEED_PRODUCTS, limit);
    return {
      data: ranked,
      source: 'seed',
      isPreviewData: true,
    };
  }
  return { data: [], source: 'empty', isPreviewData: false };
}

export async function getProductBySlug(
  slug: string,
  options?: { userId?: string | null; isAdmin?: boolean }
): Promise<DataEnvelope<ProductDetail | null>> {
  const client = getSupabaseBrowserClient();
  let queryError: string | undefined;

  if (client) {
    try {
      const allowedStatuses = options?.userId ? ['published', 'archived'] : ['published'];
      const { data: prodRow, error } = await client
        .from('products')
        .select('*')
        .eq('slug', slug)
        .in('status', allowedStatuses)
        .maybeSingle();

      if (error) {
        queryError = error.message || 'Could not load product.';
      } else if (prodRow) {
        const parsedProduct = ProductSchema.safeParse(prodRow);
        if (parsedProduct.success) {
          const product = parsedProduct.data;

          // Archived products are visible ONLY to signed-in owners (or admins)
          if (product.status === 'archived') {
            const hasAccess =
              Boolean(options?.isAdmin) ||
              (options?.userId ? await isOwned(options.userId, product.id) : false);
            if (!hasAccess) {
              return { data: null, source: 'supabase', isPreviewData: false };
            }
          }

          const [colRes, mediaRes, relatedRes, stats, reviews, userReview] = await Promise.all([
            product.collection_id
              ? client.from('collections').select('*').eq('id', product.collection_id).maybeSingle()
              : Promise.resolve({ data: null, error: null }),
            client
              .from('product_media')
              .select('*')
              .eq('product_id', product.id)
              .order('sort_order', { ascending: true }),
            getRelated(product.id, 4, product),
            getRatingStats(product.id),
            getApprovedReviews(product.id),
            options?.userId ? getUserProductReview(options.userId, product.id) : Promise.resolve(null),
          ]);

          const collectionParsed = colRes.data ? CollectionSchema.safeParse(colRes.data) : null;
          const media: ProductMedia[] = mediaRes.data
            ? parseArray(ProductMediaSchema, mediaRes.data)
            : [];

          return {
            data: {
              product,
              collection: collectionParsed?.success ? collectionParsed.data : null,
              media,
              related: relatedRes.data,
              ratingStats: stats,
              reviews,
              userReview,
            },
            source: 'supabase',
            isPreviewData: false,
          };
        }
      } else if (!allowSeedFallback()) {
        // Genuine 404 (query succeeded with no matching row)
        return { data: null, source: 'supabase', isPreviewData: false };
      }
    } catch (err) {
      queryError = err instanceof Error ? err.message : 'Could not load product.';
    }
  }

  if (allowSeedFallback()) {
    const product = SEED_PRODUCTS.find((p) => p.slug === slug);
    if (!product) {
      return { data: null, source: 'seed', isPreviewData: true };
    }
    const collection = SEED_COLLECTIONS.find((c) => c.id === product.collection_id) ?? null;
    const related = rankRelatedProducts(product, SEED_PRODUCTS, 4);

    return {
      data: {
        product,
        collection,
        media: [],
        related,
        ratingStats: null,
        reviews: [],
        userReview: null,
      },
      source: 'seed',
      isPreviewData: true,
    };
  }

  return { data: null, source: 'empty', isPreviewData: false, error: queryError };
}

export async function searchProducts(
  queryText: string,
  limit = 12,
  signal?: AbortSignal
): Promise<DataEnvelope<Product[]>> {
  const q = queryText.trim();
  if (!q || signal?.aborted) {
    return { data: [], source: 'empty', isPreviewData: false };
  }

  const client = getSupabaseBrowserClient();
  let queryError: string | undefined;

  if (client) {
    try {
      const rpcQuery = client.rpc('search_products', {
        p_query: q,
        p_limit: limit,
      });
      if (signal && typeof rpcQuery.abortSignal === 'function') {
        rpcQuery.abortSignal(signal);
      }
      const { data, error } = await rpcQuery;
      if (signal?.aborted) {
        return { data: [], source: 'empty', isPreviewData: false };
      }

      if (error) {
        queryError = error.message || 'Search could not be completed.';
      } else if (Array.isArray(data)) {
        const parsed = parseArray(ProductSchema, data);
        if (parsed.length > 0) {
          return { data: parsed, source: 'supabase', isPreviewData: false };
        }
        const countQuery = client
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'published');
        if (signal && typeof countQuery.abortSignal === 'function') {
          countQuery.abortSignal(signal);
        }
        const { count } = await countQuery;
        if (signal?.aborted) {
          return { data: [], source: 'empty', isPreviewData: false };
        }
        if ((count ?? 0) > 0) {
          return { data: [], source: 'supabase', isPreviewData: false };
        }
      }
    } catch (err) {
      if (signal?.aborted) {
        return { data: [], source: 'empty', isPreviewData: false };
      }
      queryError = err instanceof Error ? err.message : 'Search could not be completed.';
    }
  }

  if (allowSeedFallback()) {
    const res = querySeedProducts({ q, pageSize: limit });
    return { data: res.items, source: 'seed', isPreviewData: true };
  }
  return { data: [], source: 'empty', isPreviewData: false, error: queryError };
}

export async function getRatingStats(productId: string): Promise<RatingStats | null> {
  const client = getSupabaseBrowserClient();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from('product_rating_stats')
      .select('product_id, review_count, avg_rating')
      .eq('product_id', productId)
      .maybeSingle();

    if (error || !data) return null;
    const parsed = RatingStatsSchema.safeParse(data);
    if (!parsed.success || parsed.data.review_count === 0) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export async function getApprovedReviews(productId: string): Promise<Review[]> {
  const client = getSupabaseBrowserClient();
  if (!client) return [];
  try {
    const { data, error } = await client
      .from('reviews')
      .select('id, user_id, product_id, rating, title, body, status, created_at')
      .eq('product_id', productId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return parseArray(ReviewSchema, data);
  } catch {
    return [];
  }
}

export async function getUserProductReview(
  userId: string,
  productId: string
): Promise<Review | null> {
  const client = getSupabaseBrowserClient();
  if (!client || !userId || !productId) return null;
  try {
    const { data, error } = await client
      .from('reviews')
      .select('id, user_id, product_id, rating, title, body, status, created_at')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .maybeSingle();

    if (error || !data) return null;
    const parsed = ReviewSchema.safeParse(data);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export interface SubmitReviewResult {
  review: Review | null;
  error?: string;
}

export async function submitProductReview(input: {
  userId: string;
  productId: string;
  rating: number;
  title: string;
  body: string;
}): Promise<SubmitReviewResult> {
  const client = getSupabaseBrowserClient();
  if (!client) {
    return {
      review: null,
      error: "That didn't work. Try again, or write to heyarkvoid@gmail.com.",
    };
  }

  const rating = Math.max(1, Math.min(5, Math.round(input.rating)));
  const cleanTitle = input.title.trim();
  const cleanBody = input.body.trim();

  if (!cleanTitle || !cleanBody) {
    return {
      review: null,
      error: 'Add both a short title and your review before submitting.',
    };
  }

  try {
    const { data, error } = await client
      .from('reviews')
      .insert({
        user_id: input.userId,
        product_id: input.productId,
        rating,
        title: cleanTitle,
        body: cleanBody,
        status: 'pending',
      })
      .select('id, user_id, product_id, rating, title, body, status, created_at')
      .maybeSingle();

    if (error) {
      return {
        review: null,
        error: mapReviewSubmitError({ code: error.code, message: error.message }),
      };
    }

    if (!data) {
      return {
        review: null,
        error: 'Only verified buyers signed in with their purchasing account can post a review.',
      };
    }

    const parsed = ReviewSchema.safeParse(data);
    if (!parsed.success) {
      return {
        review: null,
        error: "That didn't work. Try again, or write to heyarkvoid@gmail.com.",
      };
    }
    return { review: parsed.data };
  } catch (err) {
    return {
      review: null,
      error: mapReviewSubmitError(
        err instanceof Error ? { message: err.message } : undefined
      ),
    };
  }
}

export async function getRecentApprovedReviews(limit = 6): Promise<Review[]> {
  const client = getSupabaseBrowserClient();
  if (!client) return [];
  try {
    const { data, error } = await client
      .from('reviews')
      .select('id, user_id, product_id, rating, title, body, status, created_at')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return parseArray(ReviewSchema, data);
  } catch {
    return [];
  }
}

export async function getLibrary(userId: string): Promise<Entitlement[]> {
  const client = getSupabaseBrowserClient();
  if (!client || !userId) return [];
  try {
    const { data, error } = await client
      .from('entitlements')
      .select('user_id, product_id, order_id, revoked_at')
      .eq('user_id', userId)
      .is('revoked_at', null);

    if (error || !data) return [];
    return parseArray(EntitlementSchema, data);
  } catch {
    return [];
  }
}

export async function getWishlist(userId: string): Promise<WishlistItem[]> {
  const client = getSupabaseBrowserClient();
  if (!client || !userId) return [];
  try {
    const { data, error } = await client
      .from('wishlist_items')
      .select('user_id, product_id')
      .eq('user_id', userId);

    if (error || !data) return [];
    return parseArray(WishlistItemSchema, data);
  } catch {
    return [];
  }
}

export async function addWishlistItem(userId: string, productId: string): Promise<boolean> {
  const client = getSupabaseBrowserClient();
  if (!client || !userId || !productId) return false;
  try {
    const { error } = await client
      .from('wishlist_items')
      .upsert({ user_id: userId, product_id: productId }, { onConflict: 'user_id,product_id' });
    return !error;
  } catch {
    return false;
  }
}

export async function removeWishlistItem(userId: string, productId: string): Promise<boolean> {
  const client = getSupabaseBrowserClient();
  if (!client || !userId || !productId) return false;
  try {
    const { error } = await client
      .from('wishlist_items')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);
    return !error;
  } catch {
    return false;
  }
}

export async function upsertWishlistItems(userId: string, productIds: string[]): Promise<boolean> {
  const client = getSupabaseBrowserClient();
  if (!client || !userId || productIds.length === 0) return true;
  try {
    const rows = productIds.map((product_id) => ({ user_id: userId, product_id }));
    const { error } = await client
      .from('wishlist_items')
      .upsert(rows, { onConflict: 'user_id,product_id' });
    return !error;
  } catch {
    return false;
  }
}

export async function isOwned(userId: string, productId: string): Promise<boolean> {
  const client = getSupabaseBrowserClient();
  if (!client || !userId || !productId) return false;
  try {
    const { data, error } = await client
      .from('entitlements')
      .select('product_id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .is('revoked_at', null)
      .maybeSingle();

    return !error && Boolean(data);
  } catch {
    return false;
  }
}

export interface SiteAnnouncement {
  enabled: boolean;
  message: string;
  href?: string;
  label?: string;
}

const SiteAnnouncementSchema = z.object({
  enabled: z.boolean().optional().default(false),
  message: z.string().trim().min(1).optional(),
  text: z.string().trim().min(1).optional(),
  href: z.string().trim().optional(),
  label: z.string().trim().optional(),
});

/**
 * Reads `site_settings` key "announcement" (where is_public = true).
 * Returns null whenever disabled, absent, or unreadable.
 */
export async function getSiteAnnouncement(): Promise<SiteAnnouncement | null> {
  const client = getSupabaseBrowserClient();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from('site_settings')
      .select('value, is_public')
      .eq('key', 'announcement')
      .eq('is_public', true)
      .maybeSingle();

    if (error || !data?.value) return null;
    const rawVal = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
    const parsed = SiteAnnouncementSchema.safeParse(rawVal);
    if (!parsed.success || !parsed.data.enabled) return null;
    const message = parsed.data.message || parsed.data.text;
    if (!message) return null;

    return {
      enabled: true,
      message,
      href: parsed.data.href,
      label: parsed.data.label,
    };
  } catch {
    return null;
  }
}

/* ============================================================================
   ACCOUNT QUERIES (Batched, zero N+1, strict RLS)
   ============================================================================ */

export interface AccountLibraryResult {
  items: AccountLibraryItem[];
  error?: string;
}

/**
 * Fetches active entitlements (`revoked_at IS NULL`) and batch-hydrates products,
 * active `product_files` safe metadata (NEVER selecting `storage_path`), and the user's own reviews.
 */
export async function getAccountLibrary(userId: string): Promise<AccountLibraryResult> {
  const client = getSupabaseBrowserClient();
  if (!client || !userId) {
    return { items: [] };
  }

  try {
    const { data: entRows, error: entError } = await client
      .from('entitlements')
      .select('user_id, product_id, order_id, revoked_at')
      .eq('user_id', userId)
      .is('revoked_at', null);

    if (entError) {
      return {
        items: [],
        error: "We couldn't load your library right now. Try again in a moment.",
      };
    }

    const entitlements = parseArray(EntitlementSchema, entRows ?? []);
    if (entitlements.length === 0) {
      return { items: [] };
    }

    // Deduplicate product IDs preserving entitlement order
    const seen = new Set<string>();
    const uniqueEntitlements: Entitlement[] = [];
    for (const ent of entitlements) {
      if (!seen.has(ent.product_id)) {
        seen.add(ent.product_id);
        uniqueEntitlements.push(ent);
      }
    }
    const productIds = uniqueEntitlements.map((e) => e.product_id);

    // Parallel batched queries (no N+1, never selecting storage_path on product_files)
    const [productsRes, filesRes, reviewsRes] = await Promise.all([
      client.from('products').select('*').in('id', productIds),
      client
        .from('product_files')
        .select('id, product_id, file_name, mime_type, size_bytes, version')
        .in('product_id', productIds)
        .eq('is_active', true)
        .order('file_name', { ascending: true }),
      client
        .from('reviews')
        .select('id, user_id, product_id, rating, title, body, status, created_at')
        .eq('user_id', userId)
        .in('product_id', productIds),
    ]);

    if (productsRes.error) {
      return {
        items: [],
        error: "We couldn't load your library products right now. Try again in a moment.",
      };
    }

    const products = parseArray(ProductSchema, productsRes.data ?? []);
    const productById = new Map<string, Product>(products.map((p) => [p.id, p]));

    const filesByProduct = new Map<string, SafeProductFileMeta[]>();
    if (!filesRes.error && Array.isArray(filesRes.data)) {
      for (const row of filesRes.data) {
        if (!row || typeof row !== 'object') continue;
        const r = row as Record<string, unknown>;
        if (
          typeof r.id !== 'string' ||
          typeof r.product_id !== 'string' ||
          typeof r.file_name !== 'string'
        ) {
          continue;
        }
        const safeFile: SafeProductFileMeta = {
          id: r.id,
          product_id: r.product_id,
          file_name: r.file_name,
          mime_type: typeof r.mime_type === 'string' ? r.mime_type : null,
          size_bytes: typeof r.size_bytes === 'number' ? r.size_bytes : null,
          version: typeof r.version === 'string' ? r.version : null,
        };
        const list = filesByProduct.get(safeFile.product_id) ?? [];
        list.push(safeFile);
        filesByProduct.set(safeFile.product_id, list);
      }
    }

    const reviews = !reviewsRes.error ? parseArray(ReviewSchema, reviewsRes.data ?? []) : [];
    const reviewByProduct = new Map<string, Review>(reviews.map((r) => [r.product_id, r]));

    const items: AccountLibraryItem[] = [];
    for (const ent of uniqueEntitlements) {
      const product = productById.get(ent.product_id);
      if (!product) continue;
      items.push({
        product,
        orderId: ent.order_id ?? null,
        files: filesByProduct.get(product.id) ?? [],
        userReview: reviewByProduct.get(product.id) ?? null,
      });
    }

    return { items };
  } catch {
    return {
      items: [],
      error: "We couldn't load your library right now. Try again in a moment.",
    };
  }
}

export interface AccountOrdersResult {
  orders: AccountOrder[];
  error?: string;
}

/**
 * Fetches the authenticated user's orders + batched order_items (zero N+1).
 */
export async function getAccountOrders(userId: string): Promise<AccountOrdersResult> {
  const client = getSupabaseBrowserClient();
  if (!client || !userId) {
    return { orders: [] };
  }

  try {
    const { data: orderRows, error: ordersError } = await client
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (ordersError) {
      return {
        orders: [],
        error: "We couldn't load your order history right now. Try again in a moment.",
      };
    }

    const rawOrders = Array.isArray(orderRows)
      ? (orderRows as Record<string, unknown>[])
      : [];
    if (rawOrders.length === 0) {
      return { orders: [] };
    }

    const orderIds = rawOrders
      .map((row) => (typeof row.id === 'string' ? row.id : ''))
      .filter(Boolean);

    const { data: itemRows } =
      orderIds.length > 0
        ? await client.from('order_items').select('*').in('order_id', orderIds)
        : { data: [] };

    const rawItems = Array.isArray(itemRows)
      ? (itemRows as Record<string, unknown>[])
      : [];

    // Resolve missing snapshot product names in one batched query if needed
    const unnamedProductIds = Array.from(
      new Set(
        rawItems
          .filter(
            (r) =>
              !(typeof r.product_name === 'string' && r.product_name.trim()) &&
              !(typeof r.name === 'string' && r.name.trim()) &&
              !(typeof r.title === 'string' && r.title.trim()) &&
              typeof r.product_id === 'string' &&
              r.product_id.trim()
          )
          .map((r) => String(r.product_id))
      )
    );

    const productNameMap = new Map<string, string>();
    if (unnamedProductIds.length > 0) {
      const { data: prodNames } = await client
        .from('products')
        .select('id, name')
        .in('id', unnamedProductIds);
      if (Array.isArray(prodNames)) {
        for (const p of prodNames) {
          if (typeof p.id === 'string' && typeof p.name === 'string') {
            productNameMap.set(p.id, p.name);
          }
        }
      }
    }

    const itemsByOrder = new Map<string, AccountOrderItem[]>();
    for (const rawItem of rawItems) {
      const normalized = normalizeOrderItemRow(rawItem, productNameMap);
      if (!normalized) continue;
      const list = itemsByOrder.get(normalized.order_id) ?? [];
      list.push(normalized);
      itemsByOrder.set(normalized.order_id, list);
    }

    const orders: AccountOrder[] = [];
    for (const rawOrder of rawOrders) {
      const orderId = typeof rawOrder.id === 'string' ? rawOrder.id : '';
      const normalized = normalizeOrderRow(rawOrder, itemsByOrder.get(orderId) ?? []);
      if (normalized) {
        orders.push(normalized);
      }
    }

    return { orders };
  } catch {
    return {
      orders: [],
      error: "We couldn't load your order history right now. Try again in a moment.",
    };
  }
}

export interface UpdateProfileResult {
  ok: boolean;
  error?: string;
}

/**
 * Updates strictly `display_name` and `country_code` on `profiles` for the signed-in user.
 */
export async function updateUserProfile(
  userId: string,
  input: { display_name: string | null; country_code: string | null }
): Promise<UpdateProfileResult> {
  const client = getSupabaseBrowserClient();
  if (!client || !userId) {
    return {
      ok: false,
      error: "That didn't work. Try again, or write to heyarkvoid@gmail.com.",
    };
  }

  try {
    const { data, error } = await client
      .from('profiles')
      .update({
        display_name: input.display_name,
        country_code: input.country_code,
      })
      .eq('id', userId)
      .select('id, display_name, avatar_url, country_code, is_admin')
      .maybeSingle();

    if (error || !data) {
      return {
        ok: false,
        error: "We couldn't save your profile changes. Please try again.",
      };
    }

    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "We couldn't save your profile changes. Please try again.",
    };
  }
}

/**
 * Inserts a new review OR updates an existing user review (resetting status to 'pending' -> Awaiting approval).
 * Ownership and update rights remain enforced by Supabase RLS.
 */
export async function upsertProductReview(input: {
  userId: string;
  productId: string;
  rating: number;
  title: string;
  body: string;
  existingReviewId?: string | null;
  isEdit?: boolean;
}): Promise<SubmitReviewResult> {
  if (!input.isEdit) {
    return submitProductReview(input);
  }

  const client = getSupabaseBrowserClient();
  if (!client) {
    return {
      review: null,
      error: "That didn't work. Try again, or write to heyarkvoid@gmail.com.",
    };
  }

  const rating = Math.max(1, Math.min(5, Math.round(input.rating)));
  const cleanTitle = input.title.trim();
  const cleanBody = input.body.trim();

  if (!cleanTitle || !cleanBody) {
    return {
      review: null,
      error: 'Add both a short title and your review before saving.',
    };
  }

  try {
    let query = client
      .from('reviews')
      .update({
        rating,
        title: cleanTitle,
        body: cleanBody,
        status: 'pending',
      })
      .eq('user_id', input.userId)
      .eq('product_id', input.productId);

    if (input.existingReviewId) {
      query = query.eq('id', input.existingReviewId);
    }

    const { data, error } = await query
      .select('id, user_id, product_id, rating, title, body, status, created_at')
      .maybeSingle();

    if (error) {
      return {
        review: null,
        error: mapReviewSubmitError({ code: error.code, message: error.message }),
      };
    }

    if (!data) {
      return {
        review: null,
        error: 'Only verified buyers signed in with their purchasing account can update this review.',
      };
    }

    const parsed = ReviewSchema.safeParse(data);
    if (!parsed.success) {
      return {
        review: null,
        error: "That didn't work. Try again, or write to heyarkvoid@gmail.com.",
      };
    }
    return { review: parsed.data };
  } catch (err) {
    return {
      review: null,
      error: mapReviewSubmitError(err instanceof Error ? { message: err.message } : undefined),
    };
  }
}
