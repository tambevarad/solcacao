import type { LocalizedText, Product } from '../../../../contracts/index.js';
import { productPhotos, type ProductPhotoName } from '../../shared/photos.js';

/**
 * Catalog-owned fixture set for the Phase 2 mock adapter and the explicit seed command
 * (server/src/features/catalog/seed.ts). Every product is FICTIONAL: names, prices, origins and
 * label text are demonstration data, not a verified SolCacao catalog or food label. Photos are
 * illustrative CC0 stock from `productPhotos` (docs/assets.md), not photos of these products.
 *
 * Coverage: three categories, six origins, cacao 35–100 %, prices $6.50–$38.00, one sold-out
 * product (`vietnam-78-coffee-bar`), one low-stock product (`spring-chocolate-eggs`, 3 units) and
 * one inactive product (`foil-heart-duo`), which never appears in lists or by slug.
 */

/** Canonical origins (decision D11: English country names). Visible labels are translated. */
export const CATALOG_ORIGINS = [
  'Dominican Republic',
  'Ecuador',
  'Ghana',
  'Madagascar',
  'Peru',
  'Vietnam',
] as const;

const DEMO_LABEL: { ingredients: LocalizedText; allergens: LocalizedText } = {
  ingredients: {
    en: 'Fictional demonstration label, not food information.',
    es: 'Etiqueta ficticia de demostración, no es información alimentaria.',
  },
  allergens: {
    en: 'Fictional demonstration label, not allergen advice.',
    es: 'Etiqueta ficticia de demostración, no es información sobre alérgenos.',
  },
};

interface Seed {
  slug: string;
  name: LocalizedText;
  description: LocalizedText;
  category: Product['category'];
  origin: (typeof CATALOG_ORIGINS)[number];
  cacaoPct: number;
  priceCents: number;
  photos: ProductPhotoName[];
  ingredients: LocalizedText;
  allergens: LocalizedText;
  stock: number;
  active?: boolean;
}

const seeds: Seed[] = [
  {
    slug: 'ecuador-72-dark-bar',
    name: { en: 'Ecuador 72% Dark Bar', es: 'Tableta oscura Ecuador 72 %' },
    description: {
      en: 'Fictional single-origin dark bar with a bright, fruity finish.',
      es: 'Tableta oscura ficticia de origen único con un final afrutado y vivo.',
    },
    category: 'bar',
    origin: 'Ecuador',
    cacaoPct: 72,
    priceCents: 899,
    photos: ['darkBarCocoa', 'darkBarCloseUp'],
    ingredients: {
      en: 'Cacao beans, cane sugar, cocoa butter (fictional demonstration label).',
      es: 'Granos de cacao, azúcar de caña, manteca de cacao (etiqueta ficticia de demostración).',
    },
    allergens: {
      en: 'May contain milk and tree nuts (fictional demonstration label).',
      es: 'Puede contener leche y frutos de cáscara (etiqueta ficticia de demostración).',
    },
    stock: 24,
  },
  {
    slug: 'peru-85-dark-bar',
    name: { en: 'Peru 85% Dark Bar', es: 'Tableta oscura Perú 85 %' },
    description: {
      en: 'Fictional intense dark bar with notes of roasted nuts.',
      es: 'Tableta oscura ficticia e intensa con notas de frutos secos tostados.',
    },
    category: 'bar',
    origin: 'Peru',
    cacaoPct: 85,
    priceCents: 999,
    photos: ['darkBarCloseUp'],
    ...DEMO_LABEL,
    stock: 18,
  },
  {
    slug: 'madagascar-68-dark-bar',
    name: { en: 'Madagascar 68% Dark Bar', es: 'Tableta oscura Madagascar 68 %' },
    description: {
      en: 'Fictional dark bar with a smooth, red-berry character.',
      es: 'Tableta oscura ficticia, suave y con carácter de frutos rojos.',
    },
    category: 'bar',
    origin: 'Madagascar',
    cacaoPct: 68,
    priceCents: 949,
    photos: ['barsWithShavings'],
    ...DEMO_LABEL,
    stock: 30,
  },
  {
    slug: 'ghana-45-milk-bar',
    name: { en: 'Ghana 45% Milk Bar', es: 'Tableta con leche Ghana 45 %' },
    description: {
      en: 'Fictional creamy milk chocolate bar with caramel notes.',
      es: 'Tableta ficticia de chocolate con leche, cremosa y con notas de caramelo.',
    },
    category: 'bar',
    origin: 'Ghana',
    cacaoPct: 45,
    priceCents: 749,
    photos: ['choppedChocolate'],
    ...DEMO_LABEL,
    stock: 40,
  },
  {
    slug: 'dominican-100-pure-bar',
    name: { en: 'Dominican Republic 100% Pure Bar', es: 'Tableta pura República Dominicana 100 %' },
    description: {
      en: 'Fictional unsweetened bar for tasting the bean on its own.',
      es: 'Tableta ficticia sin azúcar para degustar el grano por sí solo.',
    },
    category: 'bar',
    origin: 'Dominican Republic',
    cacaoPct: 100,
    priceCents: 1099,
    photos: ['darkShards'],
    ...DEMO_LABEL,
    stock: 12,
  },
  {
    slug: 'vietnam-78-coffee-bar',
    name: { en: 'Vietnam 78% Coffee Bar', es: 'Tableta con café Vietnam 78 %' },
    description: {
      en: 'Fictional dark bar with roasted coffee pieces. Currently sold out.',
      es: 'Tableta oscura ficticia con trozos de café tostado. Agotada por ahora.',
    },
    category: 'bar',
    origin: 'Vietnam',
    cacaoPct: 78,
    priceCents: 1049,
    photos: ['coffeeBeanPieces'],
    ...DEMO_LABEL,
    stock: 0,
  },
  {
    slug: 'hazelnut-praline-box',
    name: { en: 'Hazelnut Praline Box', es: 'Caja de bombones de avellana' },
    description: {
      en: 'Fictional box of milk chocolate pralines with a hazelnut center.',
      es: 'Caja ficticia de bombones de chocolate con leche y centro de avellana.',
    },
    category: 'truffle',
    origin: 'Ecuador',
    cacaoPct: 55,
    priceCents: 2400,
    photos: ['hazelnutPralines', 'pralinePile'],
    ...DEMO_LABEL,
    stock: 15,
  },
  {
    slug: 'white-truffle-trio',
    name: { en: 'White Truffle Trio', es: 'Trío de trufas blancas' },
    description: {
      en: 'Fictional trio of white chocolate truffles and layered pralines.',
      es: 'Trío ficticio de trufas de chocolate blanco y bombones en capas.',
    },
    category: 'truffle',
    origin: 'Madagascar',
    cacaoPct: 35,
    priceCents: 1800,
    photos: ['whiteTruffleTrio'],
    ...DEMO_LABEL,
    stock: 20,
  },
  {
    slug: 'walnut-dark-truffles',
    name: { en: 'Walnut Dark Truffles', es: 'Trufas oscuras con nuez' },
    description: {
      en: 'Fictional dark chocolate truffles topped with walnut halves.',
      es: 'Trufas ficticias de chocolate oscuro con mitades de nuez.',
    },
    category: 'truffle',
    origin: 'Peru',
    cacaoPct: 70,
    priceCents: 2200,
    photos: ['walnutTruffles'],
    ...DEMO_LABEL,
    stock: 10,
  },
  {
    slug: 'chocolate-sprinkle-truffles',
    name: { en: 'Chocolate Sprinkle Truffles', es: 'Trufas con virutas de chocolate' },
    description: {
      en: 'Fictional truffles rolled in chocolate sprinkles.',
      es: 'Trufas ficticias cubiertas de virutas de chocolate.',
    },
    category: 'truffle',
    origin: 'Ghana',
    cacaoPct: 64,
    priceCents: 1950,
    photos: ['sprinkledChocolateBalls'],
    ...DEMO_LABEL,
    stock: 22,
  },
  {
    slug: 'assorted-praline-collection',
    name: { en: 'Assorted Praline Collection', es: 'Colección de bombones surtidos' },
    description: {
      en: 'Fictional assortment of dark and white chocolate pralines.',
      es: 'Surtido ficticio de bombones de chocolate oscuro y blanco.',
    },
    category: 'truffle',
    origin: 'Dominican Republic',
    cacaoPct: 60,
    priceCents: 3200,
    photos: ['assortedPralines', 'assortedBox'],
    ...DEMO_LABEL,
    stock: 8,
  },
  {
    slug: 'peppermint-nut-bark',
    name: { en: 'Peppermint and Nut Bark', es: 'Corteza de menta y frutos secos' },
    description: {
      en: 'Fictional seasonal bark with peppermint and nut toppings.',
      es: 'Corteza de temporada ficticia con menta y frutos secos.',
    },
    category: 'seasonal',
    origin: 'Peru',
    cacaoPct: 66,
    priceCents: 1600,
    photos: ['barkTiedTwine', 'barkStack'],
    ...DEMO_LABEL,
    stock: 25,
  },
  {
    slug: 'heart-gift-box',
    name: { en: 'Heart Gift Box', es: 'Caja de regalo en forma de corazón' },
    description: {
      en: 'Fictional heart-shaped box of assorted chocolates.',
      es: 'Caja ficticia en forma de corazón con bombones surtidos.',
    },
    category: 'seasonal',
    origin: 'Ecuador',
    cacaoPct: 58,
    priceCents: 3800,
    photos: ['heartBox', 'heartArrangement'],
    ...DEMO_LABEL,
    stock: 6,
  },
  {
    slug: 'spring-chocolate-eggs',
    name: { en: 'Spring Chocolate Eggs', es: 'Huevos de chocolate de primavera' },
    description: {
      en: 'Fictional set of three chocolate eggs. Only a few left.',
      es: 'Juego ficticio de tres huevos de chocolate. Quedan pocas unidades.',
    },
    category: 'seasonal',
    origin: 'Ghana',
    cacaoPct: 40,
    priceCents: 1200,
    photos: ['chocolateEggs'],
    ...DEMO_LABEL,
    stock: 3,
  },
  {
    slug: 'foil-heart-duo',
    name: { en: 'Foil Heart Duo', es: 'Dúo de corazones envueltos' },
    description: {
      en: 'Fictional retired product, inactive to exercise the unavailable path.',
      es: 'Producto ficticio retirado, inactivo para probar el caso no disponible.',
    },
    category: 'seasonal',
    origin: 'Madagascar',
    cacaoPct: 50,
    priceCents: 650,
    photos: ['foilHearts'],
    ...DEMO_LABEL,
    stock: 14,
    active: false,
  },
];

/** Deterministic 24-hex ObjectId per position: 5c0ca0 + zero padding + index. */
export const catalogFixtureId = (index: number) =>
  `5c0ca0${(index + 1).toString(16).padStart(18, '0')}`;

/** Fresh copies on every call, so tests and the mock can mutate their own set safely. */
export function makeCatalogFixtures(): Product[] {
  return seeds.map((seed, index) => ({
    id: catalogFixtureId(index),
    slug: seed.slug,
    name: { ...seed.name },
    description: { ...seed.description },
    category: seed.category,
    origin: seed.origin,
    cacaoPct: seed.cacaoPct,
    priceCents: seed.priceCents,
    currency: 'USD',
    images: seed.photos.map((name) => ({
      url: productPhotos[name].url,
      alt: { ...productPhotos[name].alt },
    })),
    ingredients: { ...seed.ingredients },
    allergens: { ...seed.allergens },
    stock: seed.stock,
    active: seed.active ?? true,
  }));
}
