import type { LocalizedText, Product } from '../../../contracts/index.js';

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
  heroTruffles: photo('hero-truffles', standard, 719, '45% 55%', {
    en: 'White chocolate truffle beside two layered chocolate pralines on a cocoa-dusted surface',
    es: 'Trufa de chocolate blanco junto a dos bombones de chocolate en capas sobre cacao en polvo',
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
  /** Available for the Story page (Student 5): from bean to bar. */
  storyBeansNibs: photo('story-beans-nibs', standard, 683, '35% 55%', {
    en: 'Cacao beans, an opened pod and a bowl of cocoa on a rustic table',
    es: 'Granos de cacao, una mazorca abierta y un cuenco de cacao sobre una mesa rústica',
  }),
  storyPodsStudio: photo('story-pods-studio', standard, 683, '50% 50%', {
    en: 'Two ripe cacao pods on a white background',
    es: 'Dos mazorcas de cacao maduras sobre fondo blanco',
  }),
  /** Available for catalog or care content (Students 3 and 5). */
  productDarkShards: photo('product-dark-shards', standard, 683, '35% 50%', {
    en: 'Stack of dark chocolate pieces with shavings on a dark background',
    es: 'Pila de trozos de chocolate oscuro con virutas sobre fondo oscuro',
  }),
} satisfies Record<string, PhotoAsset>;

export type PhotoName = keyof typeof photos;

type ProductImage = Product['images'][number];

/**
 * Square product photos for catalog data (Student 3), already in the Product DTO image shape:
 * `images: [productPhotos.darkBarCocoa, productPhotos.darkShards]`. Illustrative CC0 stock for the
 * fictional fixture products: never present them as photos of real SolCacao products, and replace
 * them when the team supplies its own product photography. Grouped by category: bars, truffles,
 * seasonal. The wholesale packaging photos (gift box, foil bar) are deliberately excluded so a
 * product never looks like a packaging option; some entries share a photo with a homepage slot
 * (listed in docs/assets.md).
 */
export const productPhotos = {
  darkBarCocoa: {
    url: '/images/products/dark-bar-cocoa.webp',
    alt: {
      en: 'Dark chocolate bars resting on cocoa powder',
      es: 'Tabletas de chocolate oscuro sobre cacao en polvo',
    },
  },
  darkBarCloseUp: {
    url: '/images/products/dark-bar-close-up.webp',
    alt: {
      en: 'Close-up of stacked dark chocolate bars on cocoa',
      es: 'Primer plano de tabletas de chocolate oscuro apiladas sobre cacao',
    },
  },
  barsWithShavings: {
    url: '/images/products/bars-with-shavings.webp',
    alt: {
      en: 'Chocolate bars with chocolate shavings on a white background',
      es: 'Tabletas de chocolate con virutas de chocolate sobre fondo blanco',
    },
  },
  darkShards: {
    url: '/images/products/dark-shards.webp',
    alt: {
      en: 'Stacked dark chocolate pieces with shavings',
      es: 'Trozos de chocolate oscuro apilados con virutas',
    },
  },
  choppedChocolate: {
    url: '/images/products/chopped-chocolate.webp',
    alt: {
      en: 'Chopped dark chocolate on a white background',
      es: 'Chocolate oscuro troceado sobre fondo blanco',
    },
  },
  coffeeBeanPieces: {
    url: '/images/products/coffee-bean-pieces.webp',
    alt: {
      en: 'Dark chocolate pieces with roasted coffee beans',
      es: 'Trozos de chocolate oscuro con granos de café tostados',
    },
  },
  hazelnutPralines: {
    url: '/images/products/hazelnut-pralines.webp',
    alt: {
      en: 'Chocolate pralines on a wooden board, one cut open to show a hazelnut center',
      es: 'Bombones de chocolate sobre una tabla de madera, uno abierto con centro de avellana',
    },
  },
  whiteTruffleTrio: {
    url: '/images/products/white-truffle-trio.webp',
    alt: {
      en: 'White chocolate truffle beside two layered chocolate pralines',
      es: 'Trufa de chocolate blanco junto a dos bombones de chocolate en capas',
    },
  },
  walnutTruffles: {
    url: '/images/products/walnut-truffles.webp',
    alt: {
      en: 'Dark chocolate truffles topped with walnut halves',
      es: 'Trufas de chocolate oscuro con mitades de nuez',
    },
  },
  sprinkledChocolateBalls: {
    url: '/images/products/sprinkled-chocolate-balls.webp',
    alt: {
      en: 'Chocolate balls rolled in chocolate sprinkles',
      es: 'Bolitas de chocolate cubiertas de virutas de chocolate',
    },
  },
  pralinePile: {
    url: '/images/products/praline-pile.webp',
    alt: {
      en: 'Pile of hazelnut pralines and white chocolate pieces',
      es: 'Montón de bombones de avellana y trozos de chocolate blanco',
    },
  },
  assortedPralines: {
    url: '/images/products/assorted-pralines.webp',
    alt: {
      en: 'Assorted dark and white chocolate pralines on wood',
      es: 'Bombones surtidos de chocolate oscuro y blanco sobre madera',
    },
  },
  assortedBox: {
    url: '/images/products/assorted-box.webp',
    alt: {
      en: 'Box of assorted chocolates in individual cups',
      es: 'Caja de bombones surtidos en cápsulas individuales',
    },
  },
  chocolateEggs: {
    url: '/images/products/chocolate-eggs.webp',
    alt: {
      en: 'Three chocolate eggs on a white background',
      es: 'Tres huevos de chocolate sobre fondo blanco',
    },
  },
  barkTiedTwine: {
    url: '/images/products/bark-tied-twine.webp',
    alt: {
      en: 'Peppermint and nut chocolate bark tied with red-and-white twine',
      es: 'Corteza de chocolate con menta y frutos secos atada con cordel rojo y blanco',
    },
  },
  barkStack: {
    url: '/images/products/bark-stack.webp',
    alt: {
      en: 'Tall stack of chocolate bark with fruit and nut toppings',
      es: 'Pila alta de corteza de chocolate con fruta y frutos secos',
    },
  },
  heartBox: {
    url: '/images/products/heart-box.webp',
    alt: {
      en: 'Heart-shaped box of assorted chocolates beside roses',
      es: 'Caja en forma de corazón con bombones surtidos junto a unas rosas',
    },
  },
  heartArrangement: {
    url: '/images/products/heart-arrangement.webp',
    alt: {
      en: 'Chocolates arranged in a heart on weathered wood',
      es: 'Bombones dispuestos en forma de corazón sobre madera envejecida',
    },
  },
  foilHearts: {
    url: '/images/products/foil-hearts.webp',
    alt: {
      en: 'Two red foil-wrapped chocolate hearts on black',
      es: 'Dos corazones de chocolate envueltos en papel rojo sobre fondo negro',
    },
  },
} satisfies Record<string, ProductImage>;

export type ProductPhotoName = keyof typeof productPhotos;
