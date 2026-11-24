import { useEffect, useMemo, useState } from 'react';
import { HomeAssuranceBand } from '../components/home/HomeAssuranceBand';
import { HomeClosingBanner } from '../components/home/HomeClosingBanner';
import { HomeCollectionsBento } from '../components/home/HomeCollectionsBento';
import { HomeFaqSection } from '../components/home/HomeFaqSection';
import { HomeFeedbackSection } from '../components/home/HomeFeedbackSection';
import { HomeFormatStrip } from '../components/home/HomeFormatStrip';
import { HomeHero } from '../components/home/HomeHero';
import { HomeHowItWorks } from '../components/home/HomeHowItWorks';
import { HomeLibrarySection } from '../components/home/HomeLibrarySection';
import { HomeProblemBeats } from '../components/home/HomeProblemBeats';
import { HomeStandardSection } from '../components/home/HomeStandardSection';
import { HomeStartHereMosaic } from '../components/home/HomeStartHereMosaic';
import { HomeStartingPoint } from '../components/home/HomeStartingPoint';
import { useCart } from '../lib/cart/CartProvider';
import { getFeatured, getRecentApprovedReviews } from '../lib/data/repository';
import type { Product, Review } from '../lib/data/types';
import {
  extractUniqueFormats,
  selectSpotlightProducts,
} from '../lib/home/homeHelpers';
import { usePageMeta } from '../lib/seo/usePageMeta';

export function HomePage() {
  usePageMeta({
    title: 'Kinvai — The hard first draft, already done.',
    description:
      'Spreadsheets, playbooks, templates and worlds, built properly once, so your project starts at step two.',
  });

  const {
    collections,
    catalogueProducts,
    catalogueIsPreview,
    catalogueLoaded,
  } = useCart();

  const [featured, setFeatured] = useState<Product[]>([]);
  const [featuredPreview, setFeaturedPreview] = useState(false);
  const [featuredLoaded, setFeaturedLoaded] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    let active = true;

    Promise.all([getFeatured(6), getRecentApprovedReviews(6)])
      .then(([featRes, revRes]) => {
        if (!active) return;
        setFeatured(featRes.data);
        setFeaturedPreview(featRes.isPreviewData);
        setReviews(revRes);
        setFeaturedLoaded(true);
      })
      .catch(() => {
        if (active) setFeaturedLoaded(true);
      });

    return () => {
      active = false;
    };
  }, []);

  const collectionsById = useMemo(
    () => new Map(collections.map((c) => [c.id, c])),
    [collections]
  );

  const productsById = useMemo(() => {
    const map = new Map<string, Product>();
    for (const p of catalogueProducts) map.set(p.id, p);
    for (const p of featured) map.set(p.id, p);
    return map;
  }, [catalogueProducts, featured]);

  const spotlightProducts = useMemo(
    () => selectSpotlightProducts(featured, catalogueProducts, 5),
    [featured, catalogueProducts]
  );

  const formats = useMemo(
    () => extractUniqueFormats(catalogueProducts),
    [catalogueProducts]
  );

  const isPreviewData = catalogueIsPreview || featuredPreview;
  const loading = !catalogueLoaded && !featuredLoaded;

  return (
    <div className="kv-container py-4 sm:py-6 lg:py-8 flex flex-col gap-12 sm:gap-16 md:gap-20 lg:gap-28">
      {/* 1. Hero Bento (Promax + Nest DNA; LCP text visible immediately) */}
      <HomeHero
        spotlightProducts={spotlightProducts}
        collectionsById={collectionsById}
        collections={collections}
        isPreviewData={isPreviewData}
        loading={loading}
      />

      {/* 2. Format Strip (slow CSS marquee derived from published products; hidden when empty) */}
      <HomeFormatStrip formats={formats} />

      {/* 3. The Problem, Three Beats (sticky left statement + 3 scrolling tinted tiles) */}
      <HomeProblemBeats
        products={catalogueProducts}
        collectionsById={collectionsById}
      />

      {/* 4. Four Ways to Get a Head Start (asymmetric 12-col collections bento + mobile snap rail) */}
      <HomeCollectionsBento
        collections={collections}
        products={catalogueProducts}
      />

      {/* 5. Start Here (Nest staggered 4-product mosaic; hidden cleanly when catalogue is empty) */}
      <HomeStartHereMosaic
        featured={featured}
        allProducts={catalogueProducts}
        collectionsById={collectionsById}
      />

      {/* 6. Find Your Starting Point (Nest rows-with-arrows beside 260ms crossfading tinted tile) */}
      <HomeStartingPoint
        collections={collections}
        products={catalogueProducts}
      />

      {/* 7. Assurance Band (soft peach 3-col reassurance with accurate payment provider flags) */}
      <HomeAssuranceBand />

      {/* 8. The Library (client-side filter pills + 8-card 2/4-col grid, or EmptyCatalogueBanner) */}
      <HomeLibrarySection
        collections={collections}
        products={catalogueProducts}
        collectionsById={collectionsById}
        isPreviewData={isPreviewData}
        loading={loading}
      />

      {/* 9. How It Works (3 large numerals + stroke-dashoffset drawn SVG connector) */}
      <HomeHowItWorks />

      {/* 10. The Kinvai Standard (inverted ink 36px tile, 2x2 grid with mono numerals) */}
      <HomeStandardSection />

      {/* 11. Feedback (approved reviews carousel ONLY; renders nothing when empty) */}
      <HomeFeedbackSection
        reviews={reviews}
        productsById={productsById}
      />

      {/* 12. FAQ (6 exact questions in accessible Accordion with policy links) */}
      <HomeFaqSection />

      {/* 13. Closing Banner (Converse inverted ink closing tile + CoverStack + Open the shop) */}
      <HomeClosingBanner
        featured={featured}
        allProducts={catalogueProducts}
        collectionsById={collectionsById}
      />
    </div>
  );
}
