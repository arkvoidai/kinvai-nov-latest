# Kinvai — Architectural Decisions & Assumptions Log

This file records every engineering decision and assumption made across Kinvai build phases.

## Prompt 1: Foundation

1. **Stack & Runtime Entrypoint**
   - Uses React 19 + TypeScript (strict) + Vite 8 + Tailwind CSS v4 + Express 4 (`server.ts` + `/server/app.ts`).
   - In development (`npm run dev`), `tsx server.ts` starts Express on port 3000 with Vite middleware mounted so `index.html` receives live `window.__KINVAI__` public config and SEO/noindex injection on every request.
   - In production (`npm run build && npm run start`), Express serves static assets from `/dist` and injects `window.__KINVAI__` into `dist/index.html` at request time.

2. **Public Config vs. Secrets Boundary**
   - `window.__KINVAI__` exposes strictly `{ siteUrl, supabaseUrl, supabasePublishableKey, flags: { razorpay, paypal, allowSeedFallback } }`.
   - Service-role Supabase client (`server/services/supabaseAdmin.ts`) and all payment/webhook/Gemini secrets stay strictly inside `/server` and are never imported in `/src`.
   - `ALLOW_SEED_FALLBACK` defaults to `true` when unset while building, per Charter section 2.

3. **Security Headers & AI Studio Preview Compatibility**
   - Express sets `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff`, and `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
   - `Content-Security-Policy: frame-ancestors 'self'` is applied outside local/AI Studio preview environments (`*.run.app`, `localhost`, non-production) so preview iframes remain functional while production stays protected from clickjacking.

4. **Raw-Body Webhook Middleware Ordering**
   - `/api/webhooks/*` mounts `express.raw({ type: '*/*', limit: '1mb' })` strictly *before* `express.json()` so future Razorpay and PayPal HMAC/signature checks can verify exact raw payloads.

5. **Seed Fallback & Preview Guard (Charter Rule 7d)**
   - When Supabase credentials are absent or the live `products` table is empty and `flags.allowSeedFallback` is `true`, repository functions transparently return the 4 collections and 20 owner products from `src/lib/data/seed.ts` with `isPreviewData: true`.
   - All preview products render a clear `"Preview data"` indicator and disable Add to cart / Buy now / Checkout actions so no fake purchases can ever occur.
   - When `flags.allowSeedFallback` is `false` and Supabase returns empty, the storefront renders the `"Catalogue opening soon"` state with an email capture form.

6. **Auth Session Discipline**
   - `AuthProvider` resolves `supabase.auth.getSession()` once on boot, holds `loading: true` until resolved, and subscribes to `onAuthStateChange` thereafter.
   - Header reserves a fixed-width skeleton (`w-[104px] h-10`) for the account control while `loading` is `true` to prevent layout shift or flicker.
   - Sessions use PKCE flow with `persistSession: true`, `autoRefreshToken: true`, and `detectSessionInUrl: true`. Sign-out occurs only on explicit user action.

7. **Design Language ("Porcelain and Pop")**
   - Light theme only (no dark mode toggle).
   - Google Fonts loaded via `<link rel="preconnect">` and `display=swap`: `Geist` (300–700), `Instrument Serif` (italic 400 only for one accent word per headline), and `Geist Mono` (400–600 strictly for numerals, SKUs, and 11px uppercase labels).
   - Product art uses clean typographic fallback covers on flat collection-tinted backdrops (`ProductCover`) until Gemini-generated still-life covers or uploaded media are added in Prompt 2.
   - All icon-only buttons require an explicit `aria-label` and render a visible desktop tooltip on hover/focus.

8. **Cart & Local Persistence (Foundation Shell)**
   - `CartProvider` enforces Kinvai's digital commerce rule: `"1 licence per product. Yours for life."` (no duplicate quantity multipliers per SKU).
   - Full server-verified checkout (Razorpay/PayPal) and Supabase-synced wishlists are wired in subsequent prompts; foundation controls cleanly guard preview items and explain checkout readiness.

## Prompt 2: Cover and Image System

1. **Client-Side WebP Image Pipeline (`src/lib/media/imagePipeline.ts`)**
   - Every uploaded image and every generated Gemini cover flows through `processImage(file | blob)`, which resizes on an HTML `<canvas>` to WebP (`quality: 0.82`) at widths `480`, `960`, and `1600`, strictly preserving aspect ratio and never upscaling past intrinsic pixel width.
   - Public storage bucket `product-media` stores objects at `products/{productId}/{mediaId}/480.webp`, `960.webp`, and `1600.webp`. Database columns (`product_media.storage_path` and `products.cover_path`) store strictly the base path `"products/{productId}/{mediaId}"`. No image URLs are ever hardcoded in components.

2. **Responsive `<ProductImage>` & Zero-CLS Contract**
   - `<ProductImage>` constructs `srcSet` (`480w`, `960w`, `1600w`) via `supabase.storage.from('product-media').getPublicUrl(...)`, locks container aspect ratio (`4/5` default), passes explicit `width`/`height` HTML attributes, holds the flat collection tint while loading, and fades in over `240ms` (`opacity` transition only).

3. **Swiss-Poster `<CoverFallback>` & `<CoverStack>`**
   - Whenever `product.cover_path` is absent (or fails to load), `<ProductCover>` renders `<CoverFallback>` at `4:5` inside the flat collection tint.
   - Collection layouts differ solely through Swiss poster typography positioning (title upper-middle vs bottom-anchored, oversized low-contrast numeral anchor position) with strict left alignment, Geist 600 auto-fit title (max 3 lines), thin ink rule, 11px Geist Mono uppercase SKU + collection label, format chips, and the persimmon dot.
   - Top-right metadata clearance (`overlaySafe`) guarantees `ProductCard`'s floating `Preview data` pill and heart button never overlap cover typography.
   - `<CoverStack>` fans up to 3 covers at `-4deg`, `0deg`, and `+4deg` using compositor `transform` only for the hero spotlight and collection tiles.

4. **Server-Side Gemini Image Service (`server/services/gemini.ts` & `POST /api/admin/image/generate`)**
   - Uses `@google/genai` server-side only with `GEMINI_API_KEY` (never exposed or logged) and `httpOptions.headers['User-Agent'] = 'aistudio-build'`.
   - Model defaults to `process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image'` (per Charter & Prompt 2; confirmed in installed `@google/genai` types that `imageConfig: { aspectRatio: '4:5' }` is natively supported alongside `responseModalities: ['TEXT', 'IMAGE']`).
   - Guardrails: Zod schema validation, per-admin rate limit (6 requests/minute via `MemoryRateLimiter`), 45-second timeout, 1 automatic retry on transient upstream/timeout errors, and descriptive errors when `GEMINI_API_KEY` is missing or when the model returns text without an image.
   - Route protection (`server/middleware/requireAdmin.ts`): verifies Supabase Bearer JWT via service-role `auth.getUser(token)` and checks `profiles.is_admin === true`. Every unauthenticated, invalid, unconfigured, or non-admin caller receives a stealth **HTTP 404**.
   - `/api/admin/image` mounts an explicit `10mb` JSON body limit ahead of the global `1mb` JSON parser to support optional `referenceImageBase64` edit requests without inflating global payload limits.

5. **SEO / OpenGraph 1600.webp Resolution**
   - `getProductOgImageUrl(coverPath)` resolves the `1600.webp` variant for `og:image` and `twitter:image` tags on product pages, and collection pages resolve the first product's cover `1600.webp` both in client meta (`usePageMeta`) and server HTML injection (`server/app.ts`) when Supabase is configured.

## Prompt 3: App Shell

1. **Floating Desktop Pill Header & Mobile Navigation**
   - Desktop (`>=1024px`) renders a floating 56px pill bar (`16px` from top, `max-w-[1360px]`) composed of separate soft white hairline pills (Logo, flexible Search trigger with `"/"` hint & dark round button, Shop, Collections + hover-intent mega panel, How it works, Saved round button, Cart round button, Account pill).
   - Scroll compaction uses GPU-composited `transform` only (`scale(0.96)` + shadow token, `-translate-y-[125%]` hide on scroll down, reveal on scroll up with an `8px` delta threshold), never animating height and staying visible while keyboard focus or the mega panel is active.
   - Mobile (`<1024px`) pairs a 56px top bar (Logo left; Search + Cart round buttons right) with a 64px + safe-area bottom tab bar (`Home`, `Shop`, `Search`, `Saved`, `Account`) featuring Lucide icons + visible 11px labels and a transform-driven sliding active pill indicator. On `/products/:slug`, the bottom tab bar is omitted completely so the sticky dark mobile buy bar replaces it cleanly with zero overlap.
   - Collections mega panel and category pill row render live `collections` from Supabase when available and gracefully fall back to the 4 canonical collection links (without fabricating purchasable products) if anonymous Supabase catalogue reads are unavailable.

2. **Command Search (`Cmd/Ctrl+K` & `"/"`)**
   - Centred fixed-height desktop palette (zero layout shift) and full-height mobile sheet with `120ms` debounced, `AbortController`-backed requests to `search_products` RPC.
   - Groups results into Products (with 4:5 cover thumbs and USD prices), Collections, and Pages; highlights matches using safe React segment rendering (no `dangerouslySetInnerHTML`), persists recent searches in `localStorage`, provides 4 real-search suggestion chips, announces result counts via `aria-live="polite"`, and navigates to `/search?q=...` on Enter.

3. **Cart Store (`useSyncExternalStore`) & Wishlist Sync**
   - `cartStore` (`kinvai.cart.v2`) persists `{ version: 2, productIds: string[] }` in `localStorage` (migrating legacy v1 arrays automatically), keeping prices authoritative from catalogue/server records and enforcing 1 licence per product (`"1 licence. Yours for life."`, no quantity stepper).
   - Adding to cart triggers a lightweight compositor-only persimmon-dot flight animation (`CartFlightOverlay`, skipped when `prefers-reduced-motion`) plus an Undo toast. Owned products from `entitlements` display `"In your library"` instead of Add to cart.
   - `wishlistStore` (`kinvai.wishlist.v2`) stores guest saves in `localStorage`, merges guest IDs into `wishlist_items` on sign-in, and performs optimistic toggles with automatic rollback if a signed-in Supabase write fails.

4. **Sign-In Sheet & Iframe Safety**
   - Opens as a centred modal on desktop and draggable bottom sheet on phones (`SignInSheet`).
   - Uses `buildOAuthRedirectUrl` to construct `redirectTo = <origin>/auth/callback?next=<validated current path>` and validates `next` strictly as a same-origin relative path in `AuthCallbackPage`.
   - When rendered inside an iframe (detected via `window.self !== window.top`), displays `"Open Kinvai in a new tab to sign in"` using a native `<a target="_blank" rel="noopener noreferrer">` link (never `window.open`).

5. **Inverted Ink Footer & Live Newsletter Endpoint**
   - Rendered as an inset `36px`-radius ink tile with 4 link columns (`Shop`, `Collections`, `Support`, `Legal`), payments-and-security note, contact links (`heyarkvoid@gmail.com`, `@ArkvoidAI`), copyright (`© <year> Arkvoid Inc.`), and an oversized cropped `"kinvai."` bottom wordmark.
   - Newsletter form submits to `POST /api/newsletter` (Zod validation, hidden honeypot field, 5/min per-IP rate limit, Supabase service-role insert into `newsletter_subscribers` with friendly Postgres `23505` duplicate handling).

## Prompt 4: Homepage

1. **13-Section Distinct-Layout Rhythm**
   - `/` composes 13 distinct sections in sequence (`HomeHero`, `HomeFormatStrip`, `HomeProblemBeats`, `HomeCollectionsBento`, `HomeStartHereMosaic`, `HomeStartingPoint`, `HomeAssuranceBand`, `HomeLibrarySection`, `HomeHowItWorks`, `HomeStandardSection`, `HomeFeedbackSection`, `HomeFaqSection`, `HomeClosingBanner`) so no two consecutive bands share a grid structure or surface treatment.
   - Every section card, chip, row, and CTA navigates to a real route or performs a real client-side state change (zero dead buttons, zero `href="#"`).

2. **Above-the-Fold Hero & Immediate LCP Discipline**
   - The hero H1 (`"The hard first draft, already done."`) renders immediately visible (`opacity: 1`) without opacity-0 gates so LCP text paints immediately.
   - On phones (`390x740`), vertical spacing and compact hero padding ensure the eyebrow, H1, subtitle, and both full-width stacked primary/secondary CTA buttons (`"Explore the shop"` and `"How it works"`) remain visible above the mobile bottom tab bar without scrolling.
   - The right-hand Promax spotlight tile cycles up to 5 featured products with a compositor-only `420ms` crossfade + `24px` horizontal slide, touch swipe gestures, and subtle `<=4deg` pointer tilt on fine pointers only.

3. **Zero Fake Data & Graceful Empty Live Catalogue Handling (Charter Rule 7d)**
   - `HomeFormatStrip` derives text-only chips strictly from published products' `file_formats` and returns `null` when empty.
   - `HomeFeedbackSection` queries approved `reviews` via `getRecentApprovedReviews()` and returns `null` when none exist (never fabricating testimonials).
   - `HomeStartHereMosaic` returns `null` when `products.length === 0` so the page never shows duplicate empty banners or empty dead tiles; `HomeLibrarySection` hosts the single `<EmptyCatalogueBanner />` (now wired to the live `POST /api/newsletter` endpoint) when Supabase returns no published products and `flags.allowSeedFallback` is `false`.
   - `HomeAssuranceBand` and `HomeFaqSection` generate checkout provider wording via `buildPaymentAssuranceCopy(getPublicConfig().flags)`, naming Razorpay or PayPal only when their public server flag is enabled.

4. **Owner Confirmation Ledger (`/docs/CLAIMS_TO_CONFIRM.md`)**
   - All four promises in Section 10 (`HomeStandardSection`) and unconfirmed refund/update policy lines in Section 12 (`HomeFaqSection`) carry explicit `// OWNER_CONFIRM` code comments and are logged in `/docs/CLAIMS_TO_CONFIRM.md` for founder sign-off.

## Prompt 5: Shop, Collections & Search

1. **Shared `<ProductCard>` & Four Variants (`src/components/layout/ProductCard.tsx`)**
   - Finalized `<ProductCard>` with `standard` (`28px` collection-tinted tile, `4:5` cover with `12px` inner padding, top-left collection `<TagPill>`, top-right round Heart, below-tile 2-line name with GPU `scaleX` persimmon hover underline, 1-line tagline, mono tabular USD price, up to 3 format chips + `+N`, white hairline `Add to cart` pill + dark ink `View` pill), `wide` (`16:10` desktop rhythm span for every 7th card when balanced), `compact` (mobile search, cart, and library rows), and `feature` (Collection `"Start with"` presentation showing the first 3 `includes` items).
   - Whole card links cleanly to `/products/:slug` via an accessible stretched-link pseudo-element on the title link while Heart, Add to cart / In cart / In your library (`/account`), and View remain separate, keyboard-focusable controls at `z-10`.
   - `<ProductCardSkeleton>` matches exact variant geometry to avoid layout shift.

2. **URL-Driven Filters, Pagination & Regression Guard (`src/lib/shop/shopFilters.ts`, `ShopFilterBar.tsx`, `ShopProductGrid.tsx`)**
   - All filter state (`collection`, `format`, `price`, `tag`, `sort`, `q`, `page`) lives exclusively in URL search parameters updated with `preventScrollReset: true` so shareable URLs, reloads, and browser Back/Forward restore state cleanly with zero scroll jumps.
   - Desktop renders a sticky Promax-style pill bar + expandable filter tray (`Formats`, USD `Price` ranges, `Made for` tags) + `Sort` select + removable active filter chips. Mobile renders a horizontally scrolling collection pill rail + `Filter & sort` button + drag-to-dismiss bottom `<Sheet>` with `Clear all` and `Show N products`.
   - Grid supports 4 columns at `>=1280px`, 3 at `>=1024px`, 2 at `>=340px`, and 1 only below `340px`, with `160ms` opacity crossfade, first-8 stagger reveal, 12 products per page, Load more button, and accessible numbered page links.
   - Repository functions (`getProducts`, `getCollections`, `getCollection`, `searchProducts`) now surface explicit `error` strings on failed queries so `/shop`, `/collections`, `/collections/:slug`, and `/search` render `<ShopErrorTile />` with a working **Retry** button instead of falsely collapsing failures into an empty state.

3. **Editorial Collections, Highlighted Search & Guest-Friendly Saved**
   - `/collections` renders four alternating asymmetric bento rows (`7/5`, `5/7`, `6/6`, and full-bleed Converse banner) pairing collection-tinted `<CoverStack>` tiles with `collections.story` and live counts.
   - `/collections/:slug` renders a collection-tinted editorial header with a `"Start with"` `feature` card sourced strictly from the collection's first featured database product, collection-scoped URL filters, shared grid, and circular Previous/Next collection tiles.
   - `/search?q=` queries `search_products` RPC with `AbortController`, preserves `q` in the URL, highlights matched tokens safely in React inside product cards, renders `compact` cards on phones and `standard` cards on desktop, and provides clickable suggestion chips on empty results.
   - `/saved` shows the gentle guest banner (`"Sign in to keep these on every device."`) above local saves when signed out and uses optimistic heart updates via `useCart()`.

## Prompt 6: Product Page

1. **Wink Desktop Bento & Mobile Shop App Phone Architecture (`/products/:slug`)**
   - Desktop (`>=1024px`) renders a breadcrumb pill row (`Home / Collection / Product`) above a 12-column bento: Left 7 columns feature a `36px`-radius collection-tinted hero tile (`ProductCover` at `lg` size, top-left collection `<TagPill>`, top-right floating Save & Share round buttons) paired with 3 secondary gallery tiles below (`product_media` gallery images when present, or real-data-only File-tree, Formats, and Made-for peek tiles). Right 5 columns hold a sticky purchase card (`lg:sticky lg:top-24`) with title, tagline, conditional `RatingStars` (`review_count > 0` only), monospaced USD price, format chips, requirements line, Add to cart + Heart row, a Wink-inspired dark ink price bar (price left, white `Buy now` / `Go to checkout` pill right), and three round-badge assurance rows (`Instant download`, `Yours for life`, `Secure checkout`).
   - Mobile (`<1024px`) translates the Mobile Shop App reference into a dedicated touch-first experience: full-width tinted swipeable cover stage with floating round Back, Save, and Share buttons plus centered gallery dots, followed by a crisp white product block with expandable description accordion, and a spring-animated `<MobileStickyBuyBar />` that slides up above the safe area once the primary purchase controls scroll out of view (replacing `<MobileBottomBar />` cleanly).

2. **Purchase States, 600ms Drawn-Check Add to Cart & Exclusive Buy Now**
   - `resolvePurchaseState` explicitly governs `not-owned`, `in-cart` (`In cart` + `Go to checkout`), `owned` (`Download from your library` -> `/account`), and `preview` (seed mode: disabled purchase actions labelled `Preview data`).
   - Clicking `Add to cart` morphs the button to `Added` with an animated SVG drawn-check stroke over `600ms` before settling; on desktop (`>=1024px`) only, `CartSheet` opens after the morph completes.
   - `CartProvider.buyNow(product, isPreviewData)` replaces the cart exclusively with `[product.id]` via `cartStore.replace([product.id])` and navigates directly to `/checkout`.

3. **Archived Owner Access, Real-Data Related Fallback & Verified Owner Reviews**
   - `getProductBySlug(slug, { userId, isAdmin })` allows signed-in owners (verified via `entitlements` with `revoked_at IS NULL`) or admins to view `archived` products they own, while returning 404 to everyone else and distinguishing live query errors (Retry tile) from genuine 404s.
   - `getRelated` queries `product_relations` first, then falls back exclusively to published products in the same collection ranked by shared tag overlap (`rankRelatedProducts`), never fabricating items.
   - `ProductReviewsSection` displays `product_rating_stats` only when `review_count > 0`, lists approved reviews or the calm empty state (`"Reviews appear here after buyers have used this product."`), and provides a `Write a review` form strictly for signed-in owners, handling Supabase RLS/duplicate errors gracefully (`mapReviewSubmitError`) and showing `Awaiting approval` for newly submitted or pending reviews.

4. **Accessible Lightbox, Shared-Element View Transitions & Canonical SEO**
   - `ProductLightbox` opens any available `product_media` image with a keyboard focus trap, `Escape` to close, `ArrowLeft`/`ArrowRight` navigation, touch swipe support, and a `220ms` crossfade.
   - Shared-element transitions attach a deterministic `viewTransitionName` (`kv-cover-<slug>`) strictly to the active visible product cover on `ProductCard` and `ProductDetailPage`, with CSS reduced-motion disable and `PageTransition` fade fallback when unsupported.
   - `usePageMeta` updates `document.title` and upserts a single canonical `<link rel="canonical">` on every route change (removing duplicates/stale links and omitting canonical on `noindex` routes such as 404 or archived owner views).

## Prompt 7: Account, Library & Orders

1. **Auth Polish, Protected Routes & OAuth Setup Docs (`/docs/AUTH_SETUP.md`)**
   - Reused the existing `AuthProvider` (Supabase PKCE, `persistSession: true`, `autoRefreshToken: true`), `SignInSheet`, and `AuthCallbackPage` without introducing any parallel auth system.
   - Added `<RequireAuth>` guarding both `/account` and `/checkout`: waits until `authLoading === false` (rendering a layout-matched skeleton so signed-in users never see sign-in flicker on reload or browser restart), automatically opens `SignInSheet` with validated same-origin `next` (`pathname + search`) when unauthenticated, and preserves intended destination through `/auth/callback?next=...`.
   - Hardened `AuthCallbackPage` with `mapOAuthCallbackError` to render calm, non-raw error copy with **Try signing in again** and recovery links (`/shop`, `/`, `heyarkvoid@gmail.com`).
   - Added explicit inline two-step Sign-out confirmation + toast feedback + graceful error handling in `AccountHeaderBento`, and exposed `getAccessToken()` on `AuthProvider` for authenticated server API requests.
   - Documented complete Supabase URL Configuration and Google Cloud Console OAuth client setup in `/docs/AUTH_SETUP.md`.

2. **Promax-Inspired Customer Account Bento & URL-Driven Tabs (`/account?tab=library|saved|orders|profile`)**
   - Designed an asymmetric desktop bento (`AccountHeaderBento`: 8-col Identity tile + 4-col Quick Stats tile showing real Owned and Saved counts) paired with URL-synced pill navigation (`AccountTabsNav`, sticky on mobile, `preventScrollReset: true` without `replace: true` so direct links, reloads, and browser Back/Forward preserve active tabs with zero scroll jump).
   - Preserved the `"More"` navigation tile below the tab stage so mobile visitors can still reach Collections, How it works, Support, Licence, and Legal pages cleanly.

3. **Batched Account Queries, Signed Private Downloads & Verified Reviews**
   - Added batched, zero-N+1 repository queries (`getAccountLibrary`, `getAccountOrders`, `updateUserProfile`, `upsertProductReview`):
     - `getAccountLibrary` fetches active `entitlements` (`revoked_at IS NULL`) and batch-hydrates `products`, active `product_files` safe metadata (`id, product_id, file_name, mime_type, size_bytes, version` — never selecting `storage_path`), and the user's own `reviews`.
     - `getAccountOrders` fetches `orders` and batch-fetches `order_items` (falling back cleanly to batched product names if snapshot names are absent).
     - `updateUserProfile` updates strictly `display_name` and `country_code` in `profiles` (leaving `email` read-only from Google OAuth; Profile tab links to `/support` rather than implementing a self-service delete action).
     - `upsertProductReview` inserts new reviews as `status: 'pending'` (`Awaiting approval`) and resets edited reviews back to `status: 'pending'` under Supabase RLS.
   - Implemented `GET /api/download/:productId` (with optional `?fileId=...`, mounted at `/api/download` and `/api/downloads`) verifying the caller's Supabase Bearer JWT and active entitlement (`revoked_at IS NULL`) server-side before returning either a multi-file manifest (`mode: 'multiple'`) or a 120-second expiring signed download URL from private bucket `product-files`, never exposing `storage_path` to the client.
   - Library cards implement explicit `Preparing…` -> `Starting download` -> `Error` / `Retry` states (never faking download success), validate `http:`/`https:` signed download URLs before launching downloads, open `LibraryDownloadSheet` for multi-file products, and open `LibraryReviewSheet` for verified buyer reviews.
   - Orders tab supports smooth expandable item detail rows, canonical status badges (`Paid`, `Pending`, `Failed`, `Cancelled`, `Refunded`, `Partially refunded`), and accurate refund notices (`refunded` notes access removal; `partially_refunded` directs users to check Library without implying all access was removed).
   - Hardened `AuthProvider` (StrictMode-safe mount/unmount subscription), `validateNextPath` (URL origin & backslash verification), `AuthCallbackPage` (PKCE race re-check), `RequireAuth` (calm post-signout state without popping `SignInSheet` over the confirmation toast), `SignInSheet` (auto-close on active session), and `updateUserProfile`/`upsertProductReview` (requiring confirmed PostgREST returned rows so RLS rejections are never silently reported as success).
   - Composed the Library tab inside an asymmetric Promax-inspired desktop bento (8/9-col Library tile + 4/3-col supporting rail displaying the latest real order or live collection jumps + licence guidance) with restrained sliding tab indicators, `AnimatePresence` tab transitions, optimistic unsave animations, fine-pointer `.kv-bento-tile` hover lifts, and graceful avatar monogram fallback.


