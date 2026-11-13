// Measures GET /api/products query plans on a synthetic 5,000-product catalog in a separate
// database (solcacao_index_bench, dropped afterwards). Results: team/member-3/phase-3-evidence.md.
//   npx tsx tests/member-3/index-bench.mts [mode]      mode: current (schema indexes) | none
//   BENCH_MONGODB_URI overrides mongodb://127.0.0.1:27017/solcacao_index_bench
// NO_COLLATION=1 measures the shipped query shape (collation only for name sorts, priceDesc ties
// by _id descending); without it, the Phase 2 shape (collation on every sort).
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const mode = process.argv[2] ?? 'current';
const uri = process.env.BENCH_MONGODB_URI ?? 'mongodb://127.0.0.1:27017/solcacao_index_bench';
const imp = (p: string) => import(pathToFileURL(path.join(repo, p)).href);

const mongoose = (await import('mongoose')).default;
const { ProductModel } = await imp('server/src/features/catalog/models.ts');
const { productFilter } = await imp('server/src/features/catalog/service.ts');
const { parseProductSearchParams } = await imp('client/src/features/catalog/rules.ts');

mongoose.set('autoIndex', false);
mongoose.set('autoCreate', false);
await mongoose.connect(uri);
await mongoose.connection.db!.dropDatabase();
await ProductModel.createCollection();
if (mode === 'current') await ProductModel.syncIndexes();
else if (mode !== 'none') {
  await ProductModel.collection.createIndex({ slug: 1 }, { unique: true });
  for (const spec of JSON.parse(mode))
    await ProductModel.collection.createIndex(spec.key, spec.options ?? {});
}

const origins = ['Dominican Republic', 'Ecuador', 'Ghana', 'Madagascar', 'Peru', 'Vietnam'];
const categories = ['bar', 'truffle', 'seasonal'];
const N = 5000;
const docs = Array.from({ length: N }, (_, i) => ({
  slug: `bench-${i}`,
  name: {
    en: `Bench product ${String(i).padStart(5, '0')}`,
    es: `Producto ${String(i).padStart(5, '0')}`,
  },
  description: { en: 'Synthetic bench text', es: 'Texto sintético' },
  category: categories[i % 3],
  origin: origins[i % 6],
  cacaoPct: 35 + (i % 66),
  priceCents: 500 + ((i * 37) % 4000),
  currency: 'USD',
  images: [],
  ingredients: { en: 'x', es: 'x' },
  allergens: { en: 'x', es: 'x' },
  active: i % 10 !== 0,
}));
await ProductModel.collection.insertMany(docs);

const cases: Record<string, string> = {
  'default (name, en)': '',
  'priceAsc, no filter': 'sort=priceAsc',
  'category=bar, priceAsc': 'category=bar&sort=priceAsc',
  'origin=Peru, name es': 'origin=Peru&locale=es',
  'origin=Peru, cacao 60-80, priceDesc': 'origin=Peru&cacaoMin=60&cacaoMax=80&sort=priceDesc',
  'price 1000-2000, priceAsc, page 5': 'priceMinCents=1000&priceMaxCents=2000&sort=priceAsc&page=5',
  'category=truffle, name en, page 3': 'category=truffle&page=3',
};

interface Plan {
  stage: string;
  indexName?: string;
  inputStage?: Plan;
  inputStages?: Plan[];
}
const stage = (plan: Plan): string =>
  plan.inputStage
    ? `${plan.stage}<${stage(plan.inputStage)}`
    : plan.inputStages
      ? `${plan.stage}<[${plan.inputStages.map(stage).join(',')}]>`
      : `${plan.stage}${plan.indexName ? `(${plan.indexName})` : ''}`;

const rows: string[] = [];
for (const [label, qs] of Object.entries(cases)) {
  const parsed = parseProductSearchParams(new URLSearchParams(qs));
  if (!parsed.ok) throw new Error(`bad query ${qs}`);
  const q = parsed.value;
  const filter = productFilter(q);
  const sort =
    q.sort === 'priceAsc'
      ? { priceCents: 1, _id: 1 }
      : q.sort === 'priceDesc'
        ? { priceCents: -1, _id: process.env.NO_COLLATION ? -1 : 1 }
        : { [`name.${q.locale}`]: 1, _id: 1 };
  const collation =
    process.env.NO_COLLATION && q.sort !== 'name' ? undefined : { locale: q.locale, strength: 1 };
  let cursor = ProductModel.find(filter)
    .sort(sort)
    .skip((q.page - 1) * q.limit)
    .limit(q.limit);
  if (collation) cursor = cursor.collation(collation);
  const times: number[] = [];
  let ex: {
    queryPlanner: { winningPlan: Plan };
    executionStats: {
      executionTimeMillis: number;
      totalKeysExamined: number;
      totalDocsExamined: number;
      nReturned: number;
    };
  } = undefined!;
  for (let r = 0; r < 5; r++) {
    ex = await cursor.clone().explain('executionStats');
    times.push(ex.executionStats.executionTimeMillis);
  }
  const s = ex.executionStats;
  rows.push(
    `| ${label} | ${stage(ex.queryPlanner.winningPlan)} | ${s.totalKeysExamined} | ${s.totalDocsExamined} | ${s.nReturned} | ${Math.min(...times)} |`,
  );
}
console.log(
  `mode=${mode}${process.env.NO_COLLATION ? ' (no collation for price sorts)' : ''}, ${N} products`,
);
console.log('| query | winning plan | keys | docs | returned | best ms of 5 |');
console.log('| --- | --- | --- | --- | --- | --- |');
console.log(rows.join('\n'));
await mongoose.connection.db!.dropDatabase();
await mongoose.disconnect();
