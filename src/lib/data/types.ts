import { z } from 'zod';

export const CollectionAccentSchema = z.enum(['apricot', 'butter', 'lilac', 'rose', 'cocoa']);
export type CollectionAccent = z.infer<typeof CollectionAccentSchema>;

export const ProductStatusSchema = z.enum(['draft', 'review', 'published', 'archived']);
export type ProductStatus = z.infer<typeof ProductStatusSchema>;

export const MediaKindSchema = z.enum(['cover', 'gallery', 'preview']);
export type MediaKind = z.infer<typeof MediaKindSchema>;

export const MediaSourceSchema = z.enum(['upload', 'gemini']);
export type MediaSource = z.infer<typeof MediaSourceSchema>;

export const ReviewStatusSchema = z.enum(['pending', 'approved', 'rejected']);
export type ReviewStatus = z.infer<typeof ReviewStatusSchema>;

export const ProfileSchema = z.object({
  id: z.string(),
  display_name: z.string().nullable().optional().default(null),
  avatar_url: z.string().nullable().optional().default(null),
  country_code: z.string().nullable().optional().default(null),
  is_admin: z.boolean().default(false),
});
export type Profile = z.infer<typeof ProfileSchema>;

export const CollectionSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  tagline: z.string().nullable().optional().default(null),
  story: z.string().nullable().optional().default(null),
  accent: CollectionAccentSchema.default('cocoa'),
  image_path: z.string().nullable().optional().default(null),
  sort_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
});
export type Collection = z.infer<typeof CollectionSchema>;

export const ProductMediaSchema = z.object({
  id: z.string(),
  product_id: z.string(),
  storage_path: z.string(),
  kind: MediaKindSchema.default('gallery'),
  alt: z.string().nullable().optional().default(null),
  width: z.number().int().nullable().optional().default(null),
  height: z.number().int().nullable().optional().default(null),
  sort_order: z.number().int().default(0),
  source: MediaSourceSchema.default('upload'),
});
export type ProductMedia = z.infer<typeof ProductMediaSchema>;

export const ProductFileSchema = z.object({
  id: z.string(),
  product_id: z.string(),
  storage_path: z.string(),
  file_name: z.string(),
  mime_type: z.string().nullable().optional().default(null),
  size_bytes: z.number().int().nullable().optional().default(null),
  version: z.string().nullable().optional().default(null),
  checksum_sha256: z.string().nullable().optional().default(null),
  is_active: z.boolean().default(true),
});
export type ProductFile = z.infer<typeof ProductFileSchema>;

export const ProductSchema = z.object({
  id: z.string(),
  slug: z.string(),
  sku: z.string(),
  name: z.string(),
  tagline: z.string().nullable().optional().default(null),
  short_description: z.string().nullable().optional().default(null),
  description: z.string().nullable().optional().default(null),
  collection_id: z.string().nullable().optional().default(null),
  price_cents: z.number().int().nonnegative(),
  currency: z.string().default('USD'),
  status: ProductStatusSchema.default('published'),
  is_featured: z.boolean().default(false),
  featured_rank: z.number().int().nullable().optional().default(null),
  tags: z.array(z.string()).nullable().optional().transform((v) => v ?? []),
  file_formats: z.array(z.string()).nullable().optional().transform((v) => v ?? []),
  includes: z.array(z.string()).nullable().optional().transform((v) => v ?? []),
  audience: z.array(z.string()).nullable().optional().transform((v) => v ?? []),
  requirements: z.string().nullable().optional().default(null),
  first_hour: z.array(z.string()).nullable().optional().transform((v) => v ?? []),
  cover_path: z.string().nullable().optional().default(null),
  version: z.string().nullable().optional().default(null),
  seo_title: z.string().nullable().optional().default(null),
  seo_description: z.string().nullable().optional().default(null),
  image_prompt: z.string().nullable().optional().default(null),
  published_at: z.string().nullable().optional().default(null),
});
export type Product = z.infer<typeof ProductSchema>;

export const RatingStatsSchema = z.object({
  product_id: z.string(),
  review_count: z.coerce.number().int().nonnegative(),
  avg_rating: z.coerce.number().min(0).max(5),
});
export type RatingStats = z.infer<typeof RatingStatsSchema>;

export const ReviewSchema = z.object({
  id: z.string().optional(),
  user_id: z.string(),
  product_id: z.string(),
  rating: z.number().int().min(1).max(5),
  title: z.string().nullable().optional().default(null),
  body: z.string().nullable().optional().default(null),
  status: ReviewStatusSchema.default('approved'),
  created_at: z.string().nullable().optional().default(null),
});
export type Review = z.infer<typeof ReviewSchema>;

export const EntitlementSchema = z.object({
  user_id: z.string(),
  product_id: z.string(),
  order_id: z.string().nullable().optional().default(null),
  revoked_at: z.string().nullable().optional().default(null),
});
export type Entitlement = z.infer<typeof EntitlementSchema>;

export const WishlistItemSchema = z.object({
  user_id: z.string(),
  product_id: z.string(),
});
export type WishlistItem = z.infer<typeof WishlistItemSchema>;

export interface ProductDetail {
  product: Product;
  collection: Collection | null;
  media: ProductMedia[];
  related: Product[];
  ratingStats: RatingStats | null;
  reviews?: Review[];
  userReview?: Review | null;
}

export type DataSource = 'supabase' | 'seed' | 'empty';

export interface DataEnvelope<T> {
  data: T;
  source: DataSource;
  isPreviewData: boolean;
  error?: string;
}

export interface ProductQueryParams {
  collection?: string;
  collectionId?: string;
  tags?: string[];
  formats?: string[];
  priceMin?: number;
  priceMax?: number;
  sort?: 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'name-asc';
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedProductsResult {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  source: DataSource;
  isPreviewData: boolean;
  error?: string;
}
