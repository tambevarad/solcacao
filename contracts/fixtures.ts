import type { Product } from './index.js';
/** Fictional test data, never a verified SolCacao product catalog or food label. */
export function makeFixtureProducts(): Product[] {
  return Array.from({ length: 8 }, (_, i) => {
    const category = (['bar', 'truffle', 'seasonal'] as const)[i % 3];
    return {
      id: (i + 1).toString(16).padStart(24, '0'),
      slug: `fixture-${category}-${i + 1}`,
      name: { en: `Fixture ${category} ${i + 1}`, es: `Producto de prueba ${i + 1}` },
      description: {
        en: 'Fictional item for layout and API tests.',
        es: 'Producto ficticio para pruebas de interfaz y API.',
      },
      category,
      origin: ['Ecuador', 'Peru', 'Madagascar'][i % 3],
      cacaoPct: [45, 60, 70, 74, 80, 85, 90, 65][i],
      priceCents: 500 + i * 150,
      currency: 'USD',
      images: [
        {
          url: `/placeholders/${category}.svg`,
          alt: { en: 'Original test placeholder', es: 'Imagen original de prueba' },
        },
      ],
      ingredients: {
        en: 'Test placeholder; not food information.',
        es: 'Texto de prueba; no es informacion alimentaria.',
      },
      allergens: {
        en: 'Test placeholder; not allergen advice.',
        es: 'Texto de prueba; no es informacion sobre alergenos.',
      },
      stock: i === 6 ? 0 : 10 + i,
      active: i !== 7,
    };
  });
}
