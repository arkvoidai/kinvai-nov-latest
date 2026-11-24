import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Download,
  Heart,
  Layers,
  Lock,
  RefreshCw,
  Search,
  ShoppingBag,
  Sparkles,
  Zap,
} from 'lucide-react';
import { contrastRatio, wcagGrade } from '../lib/contrast';
import { SEED_COLLECTIONS, SEED_PRODUCTS } from '../lib/data/seed';
import type { CollectionAccent } from '../lib/data/types';
import { createRuntimeCoverTestDataUri } from '../lib/media/imagePipeline';
import {
  CountUp,
  Magnetic,
  Marquee,
  Reveal,
  SplitHeadline,
  TileIn,
  Tilt,
} from '../lib/motion';
import { usePageMeta } from '../lib/seo/usePageMeta';
import {
  Accordion,
  Breadcrumb,
  Button,
  Carousel,
  Chip,
  CoverFallback,
  CoverStack,
  Dialog,
  IconButton,
  Input,
  Logo,
  PriceTag,
  ProductCover,
  ProductImage,
  RatingStars,
  SearchPill,
  Select,
  Sheet,
  Skeleton,
  Spinner,
  Tabs,
  TagPill,
  Tile,
  Checkbox,
  useToast,
} from '../components/primitives';

interface SwatchSpec {
  token: string;
  name: string;
  hex: string;
  textHex: string;
  usage: string;
}

const SWATCHES: SwatchSpec[] = [
  { token: '--page', name: 'Porcelain Page', hex: '#F4F2EE', textHex: '#111111', usage: 'Page canvas' },
  { token: '--surface', name: 'Surface White', hex: '#FFFFFF', textHex: '#111111', usage: 'Raised tiles & inputs' },
  { token: '--stone', name: 'Warm Stone', hex: '#EDEAE5', textHex: '#111111', usage: 'Soft tiles, chips, cocoa tint' },
  { token: '--line', name: 'Hairline', hex: '#E3DFD8', textHex: '#111111', usage: '1px borders & dividers' },
  { token: '--ink', name: 'Primary Ink', hex: '#111111', textHex: '#F4F2EE', usage: 'Text, primary CTA, footer' },
  { token: '--ink-2', name: 'Secondary Ink', hex: '#55524D', textHex: '#FFFFFF', usage: 'Secondary body text' },
  { token: '--ink-3', name: 'Muted Ink', hex: '#8A867F', textHex: '#FFFFFF', usage: 'Captions only (never body)' },
  { token: '--brand', name: 'Persimmon', hex: '#FF5B1F', textHex: '#111111', usage: 'Brand dot, focus ring' },
  { token: '--brand-deep', name: 'Persimmon Deep', hex: '#C93A0A', textHex: '#FFFFFF', usage: 'Brand links (AA on white)' },
  { token: '--peach', name: 'Peach (Apricot)', hex: '#FFD9C4', textHex: '#111111', usage: 'Run the Shop collection' },
  { token: '--butter', name: 'Butter', hex: '#FFEFA8', textHex: '#111111', usage: 'Make the Thing collection' },
  { token: '--lilac', name: 'Lilac', hex: '#DDD3FF', textHex: '#111111', usage: 'Build the World collection' },
  { token: '--rose', name: 'Rose', hex: '#FFD3DE', textHex: '#111111', usage: 'Ship the Interface collection' },
  { token: '--success', name: 'Success', hex: '#1E7A4F', textHex: '#FFFFFF', usage: 'Confirmed states' },
  { token: '--warning', name: 'Warning', hex: '#B7791F', textHex: '#FFFFFF', usage: 'Preview / caution icon' },
  { token: '--error', name: 'Error', hex: '#C42B2B', textHex: '#FFFFFF', usage: 'Validation & alerts' },
];

type BentoViewport = 360 | 768 | 1440;

export function DesignPage() {
  usePageMeta({
    title: 'Design System — Kinvai',
    description: 'Porcelain and Pop visual system, tokens, primitives, and motion kit.',
    noindex: true,
  });

  const { toast } = useToast();
  const [selectedChip, setSelectedChip] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [inputVal, setInputVal] = useState('heyarkvoid@gmail.com');
  const [selectVal, setSelectVal] = useState('featured');
  const [checkedA, setCheckedA] = useState(true);
  const [checkedB, setCheckedB] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bentoWidth, setBentoWidth] = useState<BentoViewport>(1440);
  const [undoCount, setUndoCount] = useState(3);
  const [liveAccent, setLiveAccent] = useState<CollectionAccent>('apricot');
  const [liveReplayKey, setLiveReplayKey] = useState(0);
  const [liveLoadedCount, setLiveLoadedCount] = useState(0);

  const collectionMap = useMemo(
    () => new Map(SEED_COLLECTIONS.map((col) => [col.id, col])),
    []
  );

  // 8 products across all 4 collection tints (2 peach, 2 butter, 2 lilac, 2 rose)
  const coverLabProducts = useMemo(() => {
    const picks = [
      'marketplace-launch-system',
      'pricing-margin-and-profit-calculator',
      'youtube-documentary-production-blueprint',
      'cinematic-motion-graphics-pack',
      'cultivation-universe-builder',
      'fantasy-kingdom-atlas',
      'premium-ecommerce-ui-kit',
      'icon-and-illustration-collection',
    ];
    return picks
      .map((slug) => SEED_PRODUCTS.find((p) => p.slug === slug))
      .filter((p): p is (typeof SEED_PRODUCTS)[number] => Boolean(p));
  }, []);

  const coverLabLiveUri = useMemo(
    () => createRuntimeCoverTestDataUri(liveAccent),
    [liveAccent]
  );

  const carouselSlides = [
    <Tile key="s1" variant="tint-peach" radius="lg" padding="md" className="h-full flex flex-col justify-between gap-6">
      <div className="flex items-center justify-between">
        <TagPill>Run the Shop</TagPill>
        <Button variant="arrow-round" size="sm" aria-label="Inspect Run the Shop" to="/collections/run-the-shop" />
      </div>
      <div>
        <h3 className="type-h3 font-semibold text-ink">Pricing Margin Calculator</h3>
        <p className="text-sm text-ink-2 mt-1.5">SKU contribution margin, fee sensitivity and ROAS targets.</p>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-ink/10">
        <PriceTag cents={2900} pill />
        <span className="type-label text-ink/70">XLSX · SHEETS</span>
      </div>
    </Tile>,
    <Tile key="s2" variant="tint-butter" radius="lg" padding="md" className="h-full flex flex-col justify-between gap-6">
      <div className="flex items-center justify-between">
        <TagPill>Make the Thing</TagPill>
        <Button variant="arrow-round" size="sm" aria-label="Inspect Make the Thing" to="/collections/make-the-thing" />
      </div>
      <div>
        <h3 className="type-h3 font-semibold text-ink">YouTube Documentary Blueprint</h3>
        <p className="text-sm text-ink-2 mt-1.5">Research vault, narrative pacing sheets and edit checklists.</p>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-ink/10">
        <PriceTag cents={4900} pill />
        <span className="type-label text-ink/70">NOTION · PDF</span>
      </div>
    </Tile>,
    <Tile key="s3" variant="tint-lilac" radius="lg" padding="md" className="h-full flex flex-col justify-between gap-6">
      <div className="flex items-center justify-between">
        <TagPill>Build the World</TagPill>
        <Button variant="arrow-round" size="sm" aria-label="Inspect Build the World" to="/collections/build-the-world" />
      </div>
      <div>
        <h3 className="type-h3 font-semibold text-ink">Cultivation Universe Builder</h3>
        <p className="text-sm text-ink-2 mt-1.5">Realms, sects, bottlenecks and progression economies.</p>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-ink/10">
        <PriceTag cents={3900} pill />
        <span className="type-label text-ink/70">OBSIDIAN · NOTION</span>
      </div>
    </Tile>,
    <Tile key="s4" variant="tint-rose" radius="lg" padding="md" className="h-full flex flex-col justify-between gap-6">
      <div className="flex items-center justify-between">
        <TagPill>Ship the Interface</TagPill>
        <Button variant="arrow-round" size="sm" aria-label="Inspect Ship the Interface" to="/collections/ship-the-interface" />
      </div>
      <div>
        <h3 className="type-h3 font-semibold text-ink">Premium E-commerce UI Kit</h3>
        <p className="text-sm text-ink-2 mt-1.5">90+ auto-layout components and 28 finished storefront screens.</p>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-ink/10">
        <PriceTag cents={6900} pill />
        <span className="type-label text-ink/70">FIGMA · JSON</span>
      </div>
    </Tile>,
  ];

  const isCompactBento = bentoWidth === 360;
  const isTabletBento = bentoWidth === 768;

  return (
    <div className="kv-container py-8 md:py-14 flex flex-col gap-16 md:gap-24">
      {/* Intro Header */}
      <section className="flex flex-col gap-6">
        <Breadcrumb
          items={[
            { label: 'Home', to: '/' },
            { label: 'Design system' },
          ]}
        />
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-3xl">
            <TagPill tone="brand">Noindex · Porcelain and Pop</TagPill>
            <SplitHeadline
              as="h1"
              text="Porcelain surfaces, *disciplined* colour."
              className="type-display font-light text-ink mt-4"
            />
            <p className="type-body text-ink-2 mt-4 prose-measure">
              Light theme only. Flat collection tints, crisp hairlines, Geist paired with one
              Instrument Serif italic accent word, and Geist Mono reserved strictly for numerals,
              SKUs and 11px uppercase labels.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Logo height={28} />
            <Spinner label="Brand pulse demo" />
          </div>
        </div>
      </section>

      {/* 1. Colour Swatches with live WCAG contrast */}
      <section aria-labelledby="section-colours" className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <span className="type-label text-ink-2">01 · Palette & Contrast</span>
            <h2 id="section-colours" className="type-h2 font-semibold text-ink mt-1">
              Colour tokens
            </h2>
          </div>
          <p className="text-sm text-ink-2">
            Every swatch computes its live WCAG 2.1 contrast ratio against its paired ink.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {SWATCHES.map((swatch) => {
            const ratio = contrastRatio(swatch.textHex, swatch.hex);
            const grade = wcagGrade(ratio);
            return (
              <div
                key={swatch.token}
                className="rounded-[24px] bg-surface border border-line overflow-hidden flex flex-col"
              >
                <div
                  className="h-24 p-4 flex flex-col justify-between"
                  style={{ backgroundColor: swatch.hex, color: swatch.textHex }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-medium">{swatch.hex}</span>
                    <span className="font-mono text-[11px] uppercase tracking-[0.06em] px-2 py-0.5 rounded-full border border-current/25">
                      {ratio}:1 · {grade}
                    </span>
                  </div>
                  <span className="font-mono text-xs opacity-85">{swatch.token}</span>
                </div>
                <div className="p-4 flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-ink">{swatch.name}</span>
                  <span className="text-xs text-ink-2">{swatch.usage}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. Fluid Type Scale */}
      <section aria-labelledby="section-type" className="flex flex-col gap-6">
        <div>
          <span className="type-label text-ink-2">02 · Fluid Typography</span>
          <h2 id="section-type" className="type-h2 font-semibold text-ink mt-1">
            Type scale
          </h2>
        </div>

        <Tile variant="white" radius="xl" padding="lg" className="flex flex-col divide-y divide-line">
          <div className="pb-6">
            <span className="type-label text-ink-2">Display · clamp(40px, 88px) · Geist 300 + 600 + Instrument Serif italic</span>
            <p className="type-display mt-3 text-ink font-light">
              The hard first draft,{' '}
              <strong className="font-semibold">built once</strong>,{' '}
              <span className="font-accent-serif">already done.</span>
            </p>
          </div>
          <div className="py-6">
            <span className="type-label text-ink-2">H1 · clamp(32px, 56px)</span>
            <p className="type-h1 mt-2 font-semibold text-ink">
              Four ways to get a <span className="font-accent-serif">head start.</span>
            </p>
          </div>
          <div className="py-6">
            <span className="type-label text-ink-2">H2 · clamp(28px, 44px)</span>
            <p className="type-h2 mt-2 font-semibold text-ink">
              Good systems are boring to build and brilliant to own.
            </p>
          </div>
          <div className="py-6">
            <span className="type-label text-ink-2">H3 · clamp(20px, 26px)</span>
            <p className="type-h3 mt-2 font-semibold text-ink">
              Marketplace Launch System
            </p>
          </div>
          <div className="py-6">
            <span className="type-label text-ink-2">Body · clamp(16px, 18px) · line-height 1.55 · max 62ch</span>
            <p className="type-body mt-2 text-ink-2 prose-measure">
              Spreadsheets, playbooks, templates and worlds, built properly once, so your project
              starts at step two. Every file is an instant digital download with lifetime access.
            </p>
          </div>
          <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <span className="type-label text-ink-2">Small · 14px</span>
              <p className="type-small mt-1.5 text-ink-2">
                1 licence per product. Yours for life. Verified download links expire automatically.
              </p>
            </div>
            <div>
              <span className="type-label text-ink-2">Mono Numerals & Labels · 11px uppercase +0.08em</span>
              <div className="mt-2 flex flex-wrap items-center gap-4">
                <span className="type-label text-ink">READY-MADE SYSTEMS</span>
                <span className="font-mono text-sm tabular-nums text-ink">KV-RTS-001</span>
                <PriceTag cents={4900} />
              </div>
            </div>
          </div>
        </Tile>
      </section>

      {/* 3. Interactive Primitives Showcase */}
      <section aria-labelledby="section-primitives" className="flex flex-col gap-6">
        <div>
          <span className="type-label text-ink-2">03 · Primitives & States</span>
          <h2 id="section-primitives" className="type-h2 font-semibold text-ink mt-1">
            Interactive components
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Buttons & IconButtons */}
          <Tile variant="white" radius="lg" padding="md" className="lg:col-span-7 flex flex-col gap-5">
            <span className="type-label text-ink-2">Buttons, IconButtons & Tags</span>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary">Explore the shop</Button>
              <Button variant="secondary">How it works</Button>
              <Button variant="quiet">Continue browsing</Button>
              <Button variant="primary" loading>
                Processing
              </Button>
              <Button variant="primary" disabled>
                Disabled
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-line">
              <Button variant="arrow-round" aria-label="Open spotlight tile" />
              <Button variant="icon-round" aria-label="Download file">
                <Download size={20} strokeWidth={1.75} aria-hidden="true" />
              </Button>
              <IconButton label="Save item (hover for tooltip)" icon={<Heart size={20} strokeWidth={1.75} />} />
              <IconButton
                label="Cart with 2 items"
                icon={<ShoppingBag size={20} strokeWidth={1.75} />}
                variant="ink"
                badgeCount={2}
              />
              <IconButton label="Search catalogue" icon={<Search size={20} strokeWidth={1.75} />} variant="stone" />
            </div>
            <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-line">
              <TagPill>READY-MADE SYSTEMS</TagPill>
              <TagPill tone="brand">NEW RELEASE</TagPill>
              <TagPill tone="success">INSTANT DOWNLOAD</TagPill>
              <TagPill tone="warning">PREVIEW DATA</TagPill>
              <PriceTag cents={4900} pill />
              <PriceTag cents={2450} />
            </div>
          </Tile>

          {/* Chips, Ratings, Skeleton & Spinner */}
          <Tile variant="white" radius="lg" padding="md" className="lg:col-span-5 flex flex-col gap-5">
            <span className="type-label text-ink-2">Filter Chips, Ratings & Loaders</span>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'all', label: 'All systems', count: 20 },
                { id: 'shop', label: 'Run the Shop', count: 7 },
                { id: 'thing', label: 'Make the Thing', count: 6 },
                { id: 'world', label: 'Build the World', count: 4 },
              ].map((c) => (
                <Chip
                  key={c.id}
                  active={selectedChip === c.id}
                  count={c.count}
                  onClick={() => setSelectedChip(c.id)}
                >
                  {c.label}
                </Chip>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-line">
              <div>
                <span className="block text-xs text-ink-2 mb-1">With verified data:</span>
                <RatingStars rating={4.9} count={18} pill />
              </div>
              <div>
                <span className="block text-xs text-ink-2 mb-1">Without data (renders null):</span>
                <div className="inline-flex items-center gap-2 text-xs font-mono text-ink-2 bg-stone px-2.5 py-1 rounded-full">
                  <RatingStars rating={null} count={0} />
                  <span>empty</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 pt-3 border-t border-line">
              <Spinner size="sm" />
              <Spinner size="md" />
              <div className="flex-1 flex flex-col gap-2">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3.5 w-1/2" />
              </div>
            </div>
          </Tile>

          {/* Form Controls */}
          <Tile variant="white" radius="lg" padding="md" className="lg:col-span-6 flex flex-col gap-4">
            <span className="type-label text-ink-2">SearchPill, Input, Select & Checkbox</span>
            <SearchPill
              value={searchText}
              onChange={setSearchText}
              onSubmit={(q) =>
                toast({
                  title: q ? `Searched for "${q}"` : 'Entered empty search',
                  description: 'SearchPill submits cleanly on Enter or button click.',
                })
              }
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Receipt email"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                hint="Download links are sent here."
              />
              <Input
                label="Error state example"
                defaultValue="invalid-email"
                error="Enter a valid email address."
              />
            </div>
            <Select
              label="Sort catalogue"
              value={selectVal}
              onChange={(e) => setSelectVal(e.target.value)}
              options={[
                { value: 'featured', label: 'Featured first' },
                { value: 'newest', label: 'Newest releases' },
                { value: 'price-asc', label: 'Price: low to high' },
                { value: 'price-desc', label: 'Price: high to low' },
              ]}
            />
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <Checkbox
                label="Instant download formats"
                description="Include XLSX and Notion files"
                checked={checkedA}
                onChange={(e) => setCheckedA(e.target.checked)}
              />
              <Checkbox
                label="Include PDF playbooks"
                checked={checkedB}
                onChange={(e) => setCheckedB(e.target.checked)}
              />
            </div>
          </Tile>

          {/* Overlays & Notifications */}
          <Tile variant="white" radius="lg" padding="md" className="lg:col-span-6 flex flex-col justify-between gap-5">
            <div className="flex flex-col gap-4">
              <span className="type-label text-ink-2">Sheet, Dialog, Toast (with Undo) & Tabs</span>
              <div className="flex flex-wrap gap-2.5">
                <Button variant="primary" onClick={() => setSheetOpen(true)}>
                  Open Sheet
                </Button>
                <Button variant="secondary" onClick={() => setDialogOpen(true)}>
                  Open Dialog
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    const prev = undoCount;
                    setUndoCount((n) => n + 1);
                    toast({
                      title: `Saved item #${prev + 1}`,
                      description: 'Click Undo to restore the previous count.',
                      tone: 'success',
                      undoLabel: 'Undo',
                      onUndo: () => setUndoCount(prev),
                    });
                  }}
                >
                  Trigger Undo Toast ({undoCount})
                </Button>
              </div>

              <Tabs
                ariaLabel="Product detail preview tabs"
                activeId={activeTab}
                onChange={setActiveTab}
                items={[
                  {
                    id: 'overview',
                    label: 'Overview',
                    content: (
                      <p className="text-sm text-ink-2">
                        Every Kinvai product ships as clean, editable source files with a one-hour
                        quick-start checklist.
                      </p>
                    ),
                  },
                  {
                    id: 'files',
                    label: 'Included files',
                    badge: 4,
                    content: (
                      <p className="text-sm text-ink-2">
                        Master workbook (.xlsx), Notion template link, PDF playbook, and changelog.
                      </p>
                    ),
                  },
                  {
                    id: 'licence',
                    label: 'Licence',
                    content: (
                      <p className="text-sm text-ink-2">
                        1 licence per product. Yours for life across personal and commercial
                        projects.
                      </p>
                    ),
                  },
                ]}
              />
            </div>

            <Accordion
              defaultOpenIds={['a1']}
              items={[
                {
                  id: 'a1',
                  title: 'How does instant digital delivery work?',
                  content:
                    'Once payment verifies on the server, your account library unlocks immediately with private expiring download links.',
                },
                {
                  id: 'a2',
                  title: 'Do I get future version updates?',
                  content:
                    'Yes. Every update published to a product you own appears directly inside your Kinvai library at no extra cost.',
                },
              ]}
            />
          </Tile>
        </div>

        {/* Tile Variants Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <Tile variant="tint-peach" radius="lg" padding="md">
            <TagPill>tint-peach</TagPill>
            <p className="mt-3 font-semibold text-ink">Run the Shop</p>
            <p className="text-sm text-ink-2 mt-1">Apricot maps directly to flat peach.</p>
          </Tile>
          <Tile variant="tint-butter" radius="lg" padding="md">
            <TagPill>tint-butter</TagPill>
            <p className="mt-3 font-semibold text-ink">Make the Thing</p>
            <p className="text-sm text-ink-2 mt-1">Butter maps directly to flat butter.</p>
          </Tile>
          <Tile variant="tint-lilac" radius="lg" padding="md">
            <TagPill>tint-lilac</TagPill>
            <p className="mt-3 font-semibold text-ink">Build the World</p>
            <p className="text-sm text-ink-2 mt-1">Lilac maps directly to flat lilac.</p>
          </Tile>
          <Tile variant="tint-rose" radius="lg" padding="md">
            <TagPill>tint-rose</TagPill>
            <p className="mt-3 font-semibold text-ink">Ship the Interface</p>
            <p className="text-sm text-ink-2 mt-1">Rose maps directly to flat rose.</p>
          </Tile>
          <Tile variant="white" radius="lg" padding="md">
            <TagPill>white</TagPill>
            <p className="mt-3 font-semibold text-ink">Raised Surface</p>
            <p className="text-sm text-ink-2 mt-1">Crisp white with 1px hairline border.</p>
          </Tile>
          <Tile variant="stone" radius="lg" padding="md">
            <TagPill>stone</TagPill>
            <p className="mt-3 font-semibold text-ink">Warm Stone</p>
            <p className="text-sm text-ink-2 mt-1">Cocoa collection fallback & secondary tiles.</p>
          </Tile>
          <Tile variant="ink" radius="lg" padding="md" className="sm:col-span-2">
            <TagPill inverted>ink (inverted)</TagPill>
            <p className="mt-3 font-semibold text-ink-on-dark">Dark Price Bar & Footer Surface</p>
            <p className="text-sm text-ink-on-dark-muted mt-1">
              High-contrast inverted surface using --ink background and --page foreground.
            </p>
          </Tile>
        </div>

        {/* Carousel Demo */}
        <div className="flex flex-col gap-3">
          <span className="type-label text-ink-2">Carousel (scroll-snap + keyboard + Promax slide pill)</span>
          <Carousel
            items={carouselSlides}
            ariaLabel="Collection spotlight carousel"
            showSlidePill
            slidePillLabel="Slide"
          />
        </div>
      </section>

      {/* 4. Motion Kit Demos */}
      <section aria-labelledby="section-motion" className="flex flex-col gap-6">
        <div>
          <span className="type-label text-ink-2">04 · Motion Kit</span>
          <h2 id="section-motion" className="type-h2 font-semibold text-ink mt-1">
            Purposeful motion primitives
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Reveal>
            <Tile variant="white" radius="lg" padding="md" className="h-full flex flex-col justify-between gap-4">
              <TagPill>Reveal & CountUp</TagPill>
              <div>
                <p className="text-4xl font-semibold text-ink">
                  <CountUp value={20} suffix="+" />
                </p>
                <p className="text-sm text-ink-2 mt-1">
                  Ready-made systems revealed once on scroll with transform + opacity only.
                </p>
              </div>
            </Tile>
          </Reveal>

          <Tile variant="white" radius="lg" padding="md" className="h-full flex flex-col justify-between gap-4">
            <TagPill>Magnetic (6px fine pointer)</TagPill>
            <div className="py-2">
              <Magnetic>
                <Button variant="primary" icon={<ArrowRight size={18} strokeWidth={1.75} />}>
                  Hover gently on desktop
                </Button>
              </Magnetic>
            </div>
            <p className="text-xs text-ink-2">Disabled automatically on coarse touch pointers.</p>
          </Tile>

          <Tilt className="h-full">
            <Tile variant="tint-lilac" radius="lg" padding="md" className="h-full flex flex-col justify-between gap-4">
              <TagPill>Tilt (4° rAF)</TagPill>
              <p className="text-lg font-semibold text-ink">
                Subtle perspective response on fine pointers only.
              </p>
              <span className="type-label text-ink/70">REDUCED MOTION SAFE</span>
            </Tile>
          </Tilt>
        </div>

        <Tile variant="white" radius="lg" padding="sm">
          <Marquee
            items={[
              <TagPill key="m1">INSTANT DOWNLOAD</TagPill>,
              <TagPill key="m2">YOURS FOR LIFE</TagPill>,
              <TagPill key="m3">SECURE CHECKOUT</TagPill>,
              <TagPill key="m4">RUN THE SHOP</TagPill>,
              <TagPill key="m5">MAKE THE THING</TagPill>,
              <TagPill key="m6">BUILD THE WORLD</TagPill>,
              <TagPill key="m7">SHIP THE INTERFACE</TagPill>,
            ]}
          />
        </Tile>
      </section>

      {/* 5. Bento Demo at 360, 768 and 1440 */}
      <section aria-labelledby="section-bento" className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="type-label text-ink-2">05 · Responsive Bento Preview</span>
            <h2 id="section-bento" className="type-h2 font-semibold text-ink mt-1">
              Bento layout across breakpoints
            </h2>
          </div>

          <div className="flex items-center gap-2" role="group" aria-label="Bento preview width">
            {([360, 768, 1440] as BentoViewport[]).map((w) => (
              <Chip key={w} active={bentoWidth === w} onClick={() => setBentoWidth(w)}>
                {w}px
              </Chip>
            ))}
          </div>
        </div>

        <div className="w-full overflow-x-auto pb-2">
          <div
            className="mx-auto rounded-[32px] bg-page border border-line-strong p-4 md:p-6 transition-[max-width] duration-300"
            style={{ maxWidth: `${bentoWidth}px` }}
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-line">
              <span className="type-label text-ink-2">Viewport frame · {bentoWidth}px</span>
              <span className="type-label text-ink-2">
                {isCompactBento ? '1 column' : isTabletBento ? '2 columns' : '12-column bento'}
              </span>
            </div>

            <div
              className={`grid gap-3 ${
                isCompactBento
                  ? 'grid-cols-1'
                  : isTabletBento
                    ? 'grid-cols-1 sm:grid-cols-2'
                    : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-12'
              }`}
            >
              {/* Spotlight Tile */}
              <TileIn
                index={0}
                className={
                  isCompactBento
                    ? ''
                    : isTabletBento
                      ? 'sm:col-span-2'
                      : 'md:col-span-2 lg:col-span-7'
                }
              >
                <Tile variant="tint-peach" radius="xl" padding="md" className="h-full flex flex-col justify-between gap-6">
                  <div className="flex items-center justify-between gap-2">
                    <TagPill>Spotlight</TagPill>
                    <div className="flex items-center gap-2">
                      <PriceTag cents={4900} pill />
                      <Button variant="arrow-round" size="sm" aria-label="Open spotlight product" to="/products/marketplace-launch-system" />
                    </div>
                  </div>
                  <ProductCover
                    product={SEED_PRODUCTS[0]}
                    collection={SEED_COLLECTIONS[0]}
                    ratio="16/9"
                    size="sm"
                    className="border border-ink/[0.08]"
                  />
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-ink-2">
                      90-day SKU launch workbook and pre-flight QA sheets.
                    </p>
                  </div>
                </Tile>
              </TileIn>

              {/* Stacked Side Tiles */}
              <div
                className={`grid gap-3 ${
                  isCompactBento
                    ? 'grid-cols-1'
                    : isTabletBento
                      ? 'sm:col-span-2 grid-cols-1 sm:grid-cols-2'
                      : 'md:col-span-2 lg:col-span-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-1'
                }`}
              >
                <TileIn index={1}>
                  <Tile variant="white" radius="lg" padding="md" className="h-full flex flex-col justify-between gap-4">
                    <div className="flex items-center justify-between">
                      <TagPill>Trust trio</TagPill>
                      <Zap size={18} strokeWidth={1.75} className="text-ink-2" aria-hidden="true" />
                    </div>
                    <ul className="flex flex-col gap-2.5 text-sm font-medium text-ink">
                      <li className="flex items-center gap-2.5">
                        <Download size={16} strokeWidth={1.75} aria-hidden="true" />
                        <span>Instant download</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <Layers size={16} strokeWidth={1.75} aria-hidden="true" />
                        <span>Yours for life</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <Lock size={16} strokeWidth={1.75} aria-hidden="true" />
                        <span>Secure checkout</span>
                      </li>
                    </ul>
                  </Tile>
                </TileIn>

                <TileIn index={2}>
                  <Tile variant="ink" radius="lg" padding="md" className="h-full flex flex-col justify-between gap-4">
                    <div className="flex items-center justify-between">
                      <TagPill inverted>Quick buy bar</TagPill>
                      <Sparkles size={18} strokeWidth={1.75} className="text-brand" aria-hidden="true" />
                    </div>
                    <div className="flex items-center justify-between gap-3 pt-2">
                      <div>
                        <span className="block text-xs text-ink-on-dark-muted">Single licence</span>
                        <PriceTag cents={4900} size="lg" inverted />
                      </div>
                      <Button variant="primary" inverted size="sm" to="/shop">
                        Explore
                      </Button>
                    </div>
                  </Tile>
                </TileIn>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Cover Lab (Prompt 2 proof) */}
      <section aria-labelledby="section-cover-lab" className="flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="type-label text-ink-2">06 · Cover Lab</span>
            <h2 id="section-cover-lab" className="type-h2 font-semibold text-ink mt-1">
              Covers, fallbacks and image pipeline
            </h2>
          </div>
          <p className="text-sm text-ink-2 max-w-[46ch]">
            Eight 4:5 Swiss-poster fallback covers across all four collection tints, fanned cover
            stacks, skeleton geometry, and a live zero-shift ProductImage fade-in test.
          </p>
        </div>

        {/* 8 Fallback Covers across 4 tints */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          data-testid="cover-lab-fallbacks"
        >
          {coverLabProducts.map((product) => {
            const col = product.collection_id ? collectionMap.get(product.collection_id) ?? null : null;
            return (
              <div key={product.id} className="flex flex-col gap-2">
                <CoverFallback product={product} collection={col} ratio="4/5" size="md" />
                <div className="flex items-center justify-between px-1">
                  <span className="type-label text-ink-2">{col?.name}</span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-3">
                    {col?.accent}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* CoverStack + Loading Skeleton + Live ProductImage Test */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* CoverStack Demo */}
          <Tile variant="stone" radius="xl" padding="md" className="lg:col-span-4 flex flex-col justify-between gap-5">
            <div className="flex items-center justify-between">
              <TagPill>CoverStack (4° fan)</TagPill>
              <span className="type-label text-ink-2">Transform only</span>
            </div>
            <CoverStack
              products={coverLabProducts.slice(0, 3)}
              collectionsById={collectionMap}
              size="sm"
            />
            <p className="text-xs text-ink-2 leading-relaxed">
              Fans up to 3 covers with -4°, 0° and +4° rotations and soft overlap for hero and
              collection tiles.
            </p>
          </Tile>

          {/* Loading Skeleton Demo */}
          <Tile variant="white" radius="xl" padding="md" className="lg:col-span-4 flex flex-col justify-between gap-5">
            <div className="flex items-center justify-between">
              <TagPill>Loading skeleton</TagPill>
              <span className="type-label text-ink-2">4:5 locked</span>
            </div>
            <div className="w-full max-w-[260px] mx-auto">
              <div
                className="relative w-full aspect-[4/5] rounded-[22px] bg-peach/45 overflow-hidden p-5 flex flex-col justify-between"
                aria-label="Cover loading skeleton preview"
              >
                <Skeleton className="h-3 w-24" rounded="pill" />
                <div className="flex flex-col gap-2.5 my-auto">
                  <Skeleton className="h-7 w-4/5" rounded="sm" />
                  <Skeleton className="h-7 w-3/5" rounded="sm" />
                  <Skeleton className="h-px w-full mt-2" rounded="sm" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1.5">
                    <Skeleton className="h-5 w-12" rounded="pill" />
                    <Skeleton className="h-5 w-14" rounded="pill" />
                  </div>
                  <Skeleton className="h-2.5 w-2.5" rounded="pill" />
                </div>
              </div>
            </div>
            <p className="text-xs text-ink-2 leading-relaxed">
              Matches the exact 4:5 aspect container and 22px radius so hydrated tiles never jump.
            </p>
          </Tile>

          {/* Live ProductImage Fade-in & Zero-CLS Test */}
          <Tile variant="white" radius="xl" padding="md" className="lg:col-span-4 flex flex-col justify-between gap-5">
            <div className="flex items-center justify-between gap-2">
              <TagPill tone="success">Live ProductImage</TagPill>
              <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-2 tabular-nums">
                Loaded: {liveLoadedCount}
              </span>
            </div>

            <div className="w-full max-w-[260px] mx-auto" data-testid="cover-lab-live-image">
              <ProductImage
                key={`${liveAccent}-${liveReplayKey}`}
                base={coverLabLiveUri}
                alt={`Runtime test still-life cover on ${liveAccent} backdrop`}
                ratio="4/5"
                accent={liveAccent}
                priority
                sizes="(max-width: 768px) 80vw, 260px"
                onLoad={() => setLiveLoadedCount((n) => n + 1)}
              />
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Test image tint">
                {(['apricot', 'butter', 'lilac', 'rose'] as CollectionAccent[]).map((acc) => (
                  <Chip
                    key={acc}
                    active={liveAccent === acc}
                    onClick={() => setLiveAccent(acc)}
                  >
                    {acc === 'apricot' ? 'peach' : acc}
                  </Chip>
                ))}
              </div>
              <Button
                variant="secondary"
                size="sm"
                icon={<RefreshCw size={15} strokeWidth={1.75} aria-hidden="true" />}
                onClick={() => setLiveReplayKey((k) => k + 1)}
              >
                Replay 240ms fade-in
              </Button>
            </div>
          </Tile>
        </div>
      </section>

      {/* Live Demo Sheet & Dialog */}
      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Responsive sheet"
        description="Bottom sheet with drag-to-dismiss on phones, right drawer on desktop."
        footer={
          <Button variant="primary" fullWidth onClick={() => setSheetOpen(false)}>
            Done
          </Button>
        }
      >
        <p className="text-sm text-ink-2 leading-relaxed">
          Press Escape, click outside, or drag down on a phone to dismiss. Body scroll is locked
          with scrollbar compensation so the background never shifts.
        </p>
      </Sheet>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Confirm action"
        description="Accessible modal dialog with Escape close and focus restoration."
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setDialogOpen(false);
                toast({ title: 'Action confirmed', tone: 'success' });
              }}
            >
              Confirm
            </Button>
          </>
        }
      >
        <p className="leading-relaxed">
          Dialogs are reserved for high-intent confirmations and licence details. Everyday browsing
          and cart flows use the responsive Sheet drawer.
        </p>
      </Dialog>
    </div>
  );
}
