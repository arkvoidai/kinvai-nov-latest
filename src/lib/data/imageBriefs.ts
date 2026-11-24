import type { Collection, CollectionAccent, Product } from './types';

export const DEFAULT_IMAGE_BRIEF =
  'a considered arrangement of 3 objects that symbolise the product';

/**
 * Default still-life visual briefs for all 20 Kinvai catalogue products.
 * Products with a non-empty `products.image_prompt` override these defaults.
 * Every brief describes 3 tactile physical objects with zero text, letters, or screens.
 */
export const IMAGE_BRIEFS: Record<string, string> = {
  // Run the Shop (7)
  'marketplace-launch-system':
    'a matte terracotta shipping cube, a brushed brass precision compass, and a neatly folded warm-white linen launch folio arranged in crisp isometric balance',
  'product-listing-conversion-kit':
    'a sculpted alabaster display pedestal, a frosted optical glass prism catching soft light, and a matte ceramic swatch card stacked cleanly',
  'seller-operations-command-center':
    'three modular anodized aluminium desk trays nested cleanly beside a machined matte-black steel index dial and a smooth river-stone paperweight',
  'product-research-intelligence-workbook':
    'a solid brass loupe magnifier resting beside two stepped porcelain data blocks and a slender walnut caliper',
  'pricing-margin-and-profit-calculator':
    'a minimalist brass balance weight, three stacked matte stoneware coins in descending sizes, and a machined anodized aluminium bevel bar',
  'customer-support-response-library':
    'a curved pale-ceramic envelope tray, a smooth linen-wrapped stationery folio, and a soft terracotta wax seal stamp without any emblem',
  'inventory-and-sku-control-system':
    'a neat grid of four matte porcelain storage cubes, a brushed steel tally token, and a warm oak divider bar aligned with architectural precision',

  // Make the Thing (6)
  'youtube-documentary-production-blueprint':
    'a minimalist matte-black optical cinema lens barrel, a pale birch clapboard block without markings, and a brass timeline marker cylinder',
  'short-form-storyboarding-library':
    'three vertical frosted-acrylic framing plates standing in a walnut groove block beside a matte terracotta grease pencil',
  'creator-brand-identity-system':
    'a fanned triad of blank matte cotton colour-swatch chips, a smooth porcelain cylinder, and a machined brass proportional divider',
  'podcast-launch-and-production-kit':
    'a sculptural matte-graphite acoustic microphone sphere, a ribbed warm-ceramic sound diffuser tile, and a coiled braided linen cord',
  'editorial-content-calendar':
    'a set of four stepped limestone desk blocks arranged like weekly pillars beside a slim brass bookmark rod and a folded cream rag-paper signature',
  'cinematic-motion-graphics-pack':
    'three overlapping translucent frosted-glass kinetic arcs casting layered soft shadows beside a brushed-silver geometric prism',

  // Build the World (4)
  'cultivation-universe-builder':
    'a smooth pale-celadon carved jade disc, a matte-porcelain incense vessel with clean architectural lines, and a dark basalt stepping stone',
  'fantasy-kingdom-atlas':
    'a brushed-brass cartographer divider, a rolled unprinted heavy cotton vellum scroll tied with raw linen cord, and a sculpted plaster topographic relief tile',
  'rpg-campaign-design-toolkit':
    'a matte stoneware icosahedron polyhedron with blank faceted faces, a turned walnut GM token cylinder, and a brass hourglass with pale quartz sand',
  'fictional-city-worldbuilding-collection':
    'an architectural cluster of miniature matte-plaster brutalist towers, a slender copper bridge arch, and a smooth slate base plinth',

  // Ship the Interface (3)
  'premium-ecommerce-ui-kit':
    'three layered frosted-glass rectangular interface planes floating on tiny brass pins beside a smooth porcelain tactile dial',
  'landing-page-section-library':
    'modular architectural blocks in matte chalk-white plaster arranged in an asymmetrical bento grid beside a slender anodized aluminium ruler without ticks',
  'icon-and-illustration-collection':
    'a sculpted matte-porcelain geometric torus, a precision steel bezier curve template, and a smooth coral-tinted resin sphere',
};

export type CoverTintName = 'peach' | 'butter' | 'lilac' | 'rose' | 'stone';

export function accentToTintName(accent: CollectionAccent | null | undefined): CoverTintName {
  switch (accent) {
    case 'apricot':
      return 'peach';
    case 'butter':
      return 'butter';
    case 'lilac':
      return 'lilac';
    case 'rose':
      return 'rose';
    case 'cocoa':
    default:
      return 'stone';
  }
}

export function getImageBriefForProduct(
  product: Pick<Product, 'slug' | 'image_prompt'>,
  overrideBrief?: string | null
): string {
  const custom = overrideBrief?.trim();
  if (custom) return custom;

  const productPrompt = product.image_prompt?.trim();
  if (productPrompt) return productPrompt;

  return IMAGE_BRIEFS[product.slug] || DEFAULT_IMAGE_BRIEF;
}

/**
 * Builds the exact Gemini studio still-life prompt for a product cover.
 */
export function buildCoverPrompt(
  product: Pick<Product, 'slug' | 'name' | 'image_prompt'>,
  collection?: Pick<Collection, 'accent'> | null,
  imageBrief?: string | null
): string {
  const brief = getImageBriefForProduct(product, imageBrief);
  const tintName = accentToTintName(collection?.accent);

  return (
    `Premium studio still-life product render. ${brief}. ` +
    `Soft diffused daylight from the upper left, gentle contact shadows, seamless flat matte ${tintName} backdrop ` +
    `with a very subtle tonal falloff, generous negative space, centred slightly low, Apple-product-photography restraint, ` +
    `shallow depth of field, ultra clean, high-end editorial. Portrait 4:5. ` +
    `STRICTLY: no text, no letters, no numbers, no logos, no watermarks, no people, no hands, no readable screens, no clutter, no gibberish.`
  );
}
