import 'dotenv/config';
import { pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import { makeCatalogFixtures } from '../../../../client/src/features/catalog/fixtures.js';
import { InventoryModel, ProductModel } from './models.js';

/**
 * Explicit, idempotent fixture seed (docs/data-model.md). Upserts the fictional catalog fixtures
 * and their inventory by fixed ObjectId. It never deletes or drops documents and never runs on
 * server startup. Usage (MongoDB from `npm run services`):
 *
 *   npx tsx server/src/features/catalog/seed.ts            # uses MONGODB_URI from .env
 *   npx tsx server/src/features/catalog/seed.ts <uri>
 */
export async function seedCatalogFixtures(): Promise<{ products: number }> {
  const products = makeCatalogFixtures();
  // Deliberate index migration for the products collection only: builds the declared indexes and
  // drops ones the schema no longer declares (the Phase 2 list indexes). Documents are untouched.
  await ProductModel.syncIndexes();
  await InventoryModel.init();
  for (const { id, stock, ...product } of products) {
    const _id = new mongoose.Types.ObjectId(id);
    await ProductModel.updateOne({ _id }, { $set: product }, { upsert: true });
    await InventoryModel.updateOne(
      { productId: _id },
      { $set: { availableUnits: stock } },
      { upsert: true },
    );
  }
  return { products: products.length };
}

async function main() {
  const uri = process.argv[2] || process.env.MONGODB_URI;
  if (!uri) throw new Error('Set MONGODB_URI or pass a MongoDB URI.');
  if (process.env.NODE_ENV === 'production')
    throw new Error('Refusing to seed fictional fixtures with NODE_ENV=production.');
  await mongoose.connect(uri);
  try {
    const { products } = await seedCatalogFixtures();
    console.log(`Seeded ${products} fictional catalog fixtures (upsert; nothing deleted).`);
  } finally {
    await mongoose.disconnect();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
