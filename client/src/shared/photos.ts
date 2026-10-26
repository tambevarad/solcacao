import type { LocalizedText } from '../../../contracts/index.js';

/**
 * Approved site photography (owner: Student 2). Files live in client/public/images; source, license
 * and changes for each photo are recorded in docs/assets.md. All current photos are CC0 1.0 from
 * rawpixel's public-domain collection, resized to WebP. Add new photos here, not in features.
 */
export interface PhotoAsset {
  /** Largest file; also the fallback when srcset is unsupported. */
  src: string;
  /** Width descriptors so the browser downloads only what the slot needs. */
  srcSet: string;
  /** Intrinsic size of `src`, so the browser reserves space and the layout does not shift. */
  width: number;
  height: number;
  /** CSS object-position: the part of the photo to keep when a slot crops it. */
  position: string;
  /** Describes what the photo actually shows, in both languages. */
  alt: LocalizedText;
}

function photo(
  name: string,
  [small, large]: [number, number],
  height: number,
  position: string,
  alt: LocalizedText,
): PhotoAsset {
  return {
    src: `/images/${name}-${large}.webp`,
    srcSet: `/images/${name}-${small}.webp ${small}w, /images/${name}-${large}.webp ${large}w`,
    width: large,
    height,
    position,
    alt,
  };
}

const standard: [number, number] = [640, 1024];

export const photos = {
  heroSeasonal: photo('hero-seasonal', standard, 683, '62% 55%', {
    en: 'Peppermint and nut chocolate bark stacked and tied with red-and-white twine',
    es: 'Corteza de chocolate con menta y frutos secos, apilada y atada con cordel rojo y blanco',
  }),
  heroTruffles: photo('hero-truffles', standard, 525, '28% 50%', {
    en: 'White chocolate truffle beside layered chocolate desserts dusted with cocoa',
    es: 'Trufa de chocolate blanco junto a postres de chocolate en capas espolvoreados con cacao',
  }),
  heroBusiness: photo('hero-business', standard, 576, '50% 50%', {
    en: 'Gift boxes wrapped in brown paper and tied with red twine',
    es: 'Cajas de regalo envueltas en papel marrón y atadas con cordel rojo',
  }),
  collectionBars: photo('collection-bars', standard, 683, '40% 45%', {
    en: 'Dark chocolate bars resting on cocoa powder',
    es: 'Tabletas de chocolate oscuro sobre cacao en polvo',
  }),
  collectionTruffles: photo('collection-truffles', standard, 840, '60% 50%', {
    en: 'Chocolate pralines on a wooden board, one cut open to show a hazelnut center',
    es: 'Bombones de chocolate sobre una tabla de madera, uno abierto con centro de avellana',
  }),
  collectionSeasonal: photo('collection-seasonal', standard, 683, '50% 50%', {
    en: 'Three chocolate eggs on a white background',
    es: 'Tres huevos de chocolate sobre fondo blanco',
  }),
  homeBusiness: photo('home-business', standard, 678, '78% 55%', {
    en: 'Dark gift box tied with a burlap bow and a snowflake tag',
    es: 'Caja de regalo oscura atada con un lazo de arpillera y una etiqueta con un copo de nieve',
  }),
  homeStory: photo('home-story', standard, 765, '50% 50%', {
    en: 'Pile of dried cacao beans',
    es: 'Montón de granos de cacao secos',
  }),
  homeSampler: photo('home-sampler', standard, 768, '50% 50%', {
    en: 'Box of assorted chocolates in individual cups',
    es: 'Caja de bombones surtidos en cápsulas individuales',
  }),
  wholesaleHero: photo('wholesale-hero', standard, 765, '50% 50%', {
    en: 'Rows of handmade chocolate truffles on display',
    es: 'Filas de trufas de chocolate artesanales en exhibición',
  }),
  serviceMolds: photo('service-molds', standard, 683, '62% 50%', {
    en: 'Melted chocolate being stirred with a spatula',
    es: 'Chocolate derretido removido con una espátula',
  }),
  servicePackaging: photo('service-packaging', [480, 683], 1024, '50% 62%', {
    en: 'Package wrapped in kraft paper with a silver ribbon',
    es: 'Paquete envuelto en papel kraft con un lazo plateado',
  }),
  serviceWhiteLabel: photo('service-white-label', standard, 683, '45% 50%', {
    en: 'Plain chocolate bars with chocolate shavings',
    es: 'Tabletas de chocolate sin marca con virutas de chocolate',
  }),
  packagingSleeve: photo('packaging-sleeve', standard, 642, '50% 50%', {
    en: 'Dark chocolate bar on its opened foil wrapper',
    es: 'Tableta de chocolate oscuro sobre su envoltorio de aluminio abierto',
  }),
  packagingGiftBox: photo('packaging-gift-box', standard, 683, '50% 50%', {
    en: 'Gold gift box tied with a gold ribbon',
    es: 'Caja de regalo dorada atada con una cinta dorada',
  }),
  packagingBulk: photo('packaging-bulk', standard, 683, '50% 50%', {
    en: 'Heap of chocolate bark pieces with nuts',
    es: 'Montón de trozos de corteza de chocolate con frutos secos',
  }),
  /** Available for the Story page (Student 5). */
  storyCacaoPods: photo('story-cacao-pods', standard, 948, '50% 45%', {
    en: 'Ripe red cacao pods growing on the tree',
    es: 'Mazorcas de cacao rojas y maduras creciendo en el árbol',
  }),
  /** Available for catalog or care content (Students 3 and 5). */
  productDarkShards: photo('product-dark-shards', standard, 683, '35% 50%', {
    en: 'Stack of dark chocolate pieces with shavings on a dark background',
    es: 'Pila de trozos de chocolate oscuro con virutas sobre fondo oscuro',
  }),
} satisfies Record<string, PhotoAsset>;

export type PhotoName = keyof typeof photos;
