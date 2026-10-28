import { createHash } from 'node:crypto';
import mongoose from 'mongoose';
import type {
  Cart,
  CartLine,
  MergeCartInput,
  OrderReceipt,
  Product,
} from '../../../../contracts/index.js';
import {
  MAX_QUANTITY,
  MERGE_MARKER_LIMIT,
  canonicalCheckout,
  escapeRegex,
  isId,
  mergeLines,
  totalPagesOf,
  type NormalizedCheckout,
  type NormalizedQuery,
} from '../../../../client/src/features/catalog/rules.js';
import { CatalogError, invalid } from './errors.js';
import { CartModel, InventoryModel, OrderModel, ProductModel } from './models.js';

const { ObjectId } = mongoose.Types;
type ObjectIdType = mongoose.Types.ObjectId;
const sha256 = (data: string) => createHash('sha256').update(data).digest('hex');

interface ProductRecord {
  _id: ObjectIdType;
  slug: string;
  name: Product['name'];
  description: Product['description'];
  category: string;
  origin: string;
  cacaoPct: number;
  priceCents: number;
  images: { url: string; alt: Product['name'] }[];
  ingredients: Product['ingredients'];
  allergens: Product['allergens'];
  active: boolean;
}

const localized = (value: Product['name']) => ({ en: value.en, es: value.es });

/** Public DTO: no _id/__v/timestamps; stock comes from Inventory.availableUnits (0 if missing). */
export function toProductDto(record: ProductRecord, availableUnits: number | undefined): Product {
  return {
    id: record._id.toString(),
    slug: record.slug,
    name: localized(record.name),
    description: localized(record.description),
    category: record.category as Product['category'],
    origin: record.origin,
    cacaoPct: record.cacaoPct,
    priceCents: record.priceCents,
    currency: 'USD',
    images: record.images.map((image) => ({ url: image.url, alt: localized(image.alt) })),
    ingredients: localized(record.ingredients),
    allergens: localized(record.allergens),
    stock: Math.max(0, availableUnits ?? 0),
    active: record.active,
  };
}

async function withStock(records: ProductRecord[]): Promise<Product[]> {
  if (!records.length) return [];
  const inventory = await InventoryModel.find({ productId: { $in: records.map((r) => r._id) } })
    .select({ productId: 1, availableUnits: 1 })
    .lean();
  const units = new Map(inventory.map((row) => [row.productId.toString(), row.availableUnits]));
  return records.map((record) => toProductDto(record, units.get(record._id.toString())));
}

/**
 * Builds the Mongo filter from a validated, typed query only. Every value is a primitive that
 * passed parseProductSearchParams, so no client object can introduce an operator.
 */
export function productFilter(query: NormalizedQuery): Record<string, unknown> {
  const filter: Record<string, unknown> = { active: true };
  if (query.category) filter.category = String(query.category);
  if (query.origin) filter.origin = String(query.origin);
  if (query.cacaoPct !== undefined) filter.cacaoPct = Number(query.cacaoPct);
  else if (query.cacaoMin !== undefined || query.cacaoMax !== undefined)
    filter.cacaoPct = {
      ...(query.cacaoMin !== undefined ? { $gte: Number(query.cacaoMin) } : {}),
      ...(query.cacaoMax !== undefined ? { $lte: Number(query.cacaoMax) } : {}),
    };
  if (query.priceMinCents !== undefined || query.priceMaxCents !== undefined)
    filter.priceCents = {
      ...(query.priceMinCents !== undefined ? { $gte: Number(query.priceMinCents) } : {}),
      ...(query.priceMaxCents !== undefined ? { $lte: Number(query.priceMaxCents) } : {}),
    };
  if (query.search) {
    const pattern = new RegExp(escapeRegex(String(query.search)), 'i');
    filter.$or = [
      { [`name.${query.locale}`]: pattern },
      { [`description.${query.locale}`]: pattern },
    ];
  }
  return filter;
}

export interface ProductListResult {
  items: Product[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** GET /api/products. Count and page use the identical filter; id is always the tie-breaker. */
export async function listProducts(query: NormalizedQuery): Promise<ProductListResult> {
  const filter = productFilter(query);
  const sort: Record<string, 1 | -1> =
    query.sort === 'priceAsc'
      ? { priceCents: 1, _id: 1 }
      : query.sort === 'priceDesc'
        ? { priceCents: -1, _id: 1 }
        : { [`name.${query.locale}`]: 1, _id: 1 };
  const [total, records] = await Promise.all([
    ProductModel.countDocuments(filter),
    ProductModel.find(filter)
      .collation({ locale: query.locale, strength: 1 })
      .sort(sort)
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean<ProductRecord[]>(),
  ]);
  return {
    items: await withStock(records),
    page: query.page,
    limit: query.limit,
    total,
    totalPages: totalPagesOf(total, query.limit),
  };
}

/** GET /api/products/:slug. Missing and inactive products are indistinguishable (null -> 404). */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const record = await ProductModel.findOne({
    slug: String(slug),
    active: true,
  }).lean<ProductRecord>();
  return record ? (await withStock([record]))[0] : null;
}

/**
 * Port for Student 5 (docs/contracts.md): active products for the given IDs as DTOs with
 * inventory stock. Duplicates are collapsed (first occurrence keeps its position); malformed,
 * missing and inactive IDs are simply excluded. No Mongoose document escapes this module.
 */
export async function getActiveProductsByIds(ids: string[]): Promise<Product[]> {
  const unique = [
    ...new Set(
      ids.filter((id) => typeof id === 'string' && isId(id)).map((id) => id.toLowerCase()),
    ),
  ];
  if (!unique.length) return [];
  const records = await ProductModel.find({
    _id: { $in: unique.map((id) => new ObjectId(id)) },
    active: true,
  }).lean<ProductRecord[]>();
  const byId = new Map((await withStock(records)).map((product) => [product.id, product]));
  return unique.flatMap((id) => byId.get(id) ?? []);
}

interface CartRecord {
  items: { productId: ObjectIdType; quantity: number }[];
  revision: number;
  mergeIds: string[];
}

const toCart = (record: CartRecord | null): Cart =>
  record
    ? {
        items: record.items.map((line) => ({
          productId: line.productId.toString(),
          quantity: line.quantity,
        })),
        revision: record.revision,
      }
    : { items: [], revision: 0 };

const toStoredLines = (items: CartLine[]) =>
  items.map((line) => ({ productId: new ObjectId(line.productId), quantity: line.quantity }));

function isDuplicateKey(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}

const cartConflict = () =>
  new CatalogError(409, 'CART_CONFLICT', 'The cart changed. Reload it and try again.');

/** GET /api/cart: the signed-in user's saved cart, or an empty revision-0 cart. */
export async function getCart(userId: string): Promise<Cart> {
  return toCart(await CartModel.findOne({ userId: new ObjectId(userId) }).lean<CartRecord>());
}

/** Rejects unavailable products (400) and quantities above current stock (409 OUT_OF_STOCK). */
async function assertPurchasable(items: CartLine[]): Promise<Map<string, Product>> {
  const products = new Map(
    (await getActiveProductsByIds(items.map((line) => line.productId))).map((p) => [p.id, p]),
  );
  const unavailable: Record<string, string> = {};
  const short: Record<string, string> = {};
  items.forEach((line, index) => {
    const product = products.get(line.productId.toLowerCase());
    if (!product) unavailable[`items.${index}.productId`] = 'Product unavailable';
    else if (line.quantity > product.stock)
      short[`items.${index}.quantity`] = `Only ${product.stock} available`;
  });
  if (Object.keys(unavailable).length) throw invalid(unavailable);
  if (Object.keys(short).length)
    throw new CatalogError(409, 'OUT_OF_STOCK', 'Not enough stock for some items', short);
  return products;
}

/**
 * POST /api/cart/persist: replaces the saved lines only if the stored revision still equals
 * `expectedRevision`, incrementing it once, in a single conditional update. Two writers with the
 * same revision cannot both succeed; the loser gets 409 CART_CONFLICT. The first save of a new
 * cart (revision 0) races on the unique userId index instead.
 */
export async function persistCart(
  userId: string,
  items: CartLine[],
  expectedRevision: number,
): Promise<Cart> {
  await assertPurchasable(items);
  const owner = new ObjectId(userId);
  const updated = await CartModel.findOneAndUpdate(
    { userId: owner, revision: expectedRevision },
    { $set: { items: toStoredLines(items) }, $inc: { revision: 1 } },
    { returnDocument: 'after' },
  ).lean<CartRecord>();
  if (updated) return toCart(updated);
  if (expectedRevision === 0) {
    try {
      const created = await CartModel.create({
        userId: owner,
        items: toStoredLines(items),
        revision: 1,
        mergeIds: [],
      });
      return toCart(created.toObject<CartRecord>());
    } catch (error) {
      if (!isDuplicateKey(error)) throw error;
    }
  }
  throw cartConflict();
}

/**
 * POST /api/cart/merge. Reads the cart, computes the capped additive merge, then writes items,
 * revision+1 and the mergeId in ONE conditional update that requires the same revision and an
 * unseen mergeId. A concurrent or retried request with the same mergeId therefore either loses
 * the race and, on re-read, finds its mergeId already recorded, or finds it immediately: the guest
 * lines are added exactly once. Only the latest 100 mergeIds are kept ($slice), so a retry older
 * than 100 later merges would apply again; that is the documented retry horizon.
 */
export async function mergeCart(userId: string, input: MergeCartInput): Promise<Cart> {
  const owner = new ObjectId(userId);
  for (let attempt = 0; attempt < 5; attempt++) {
    let cart: CartRecord | null;
    try {
      cart = await CartModel.findOneAndUpdate(
        { userId: owner },
        { $setOnInsert: { items: [], revision: 0, mergeIds: [] } },
        { upsert: true, returnDocument: 'after' },
      ).lean<CartRecord>();
    } catch (error) {
      if (isDuplicateKey(error)) continue; // Two first-time upserts raced; re-read the winner.
      throw error;
    }
    if (!cart) continue;
    if (cart.mergeIds.includes(input.mergeId)) return toCart(cart);

    const saved = toCart(cart).items;
    const products = new Map(
      (await getActiveProductsByIds([...saved, ...input.items].map((line) => line.productId))).map(
        (product) => [product.id, product],
      ),
    );
    const { items } = mergeLines(
      saved,
      input.items.map((line) => ({ ...line, productId: line.productId.toLowerCase() })),
      (id) => products.get(id)?.stock,
    );
    const updated = await CartModel.findOneAndUpdate(
      { userId: owner, revision: cart.revision, mergeIds: { $ne: input.mergeId } },
      {
        $set: { items: toStoredLines(items) },
        $inc: { revision: 1 },
        $push: { mergeIds: { $each: [input.mergeId], $slice: -MERGE_MARKER_LIMIT } },
      },
      { returnDocument: 'after' },
    ).lean<CartRecord>();
    if (updated) return toCart(updated);
  }
  throw cartConflict();
}

interface OrderRecord {
  _id: ObjectIdType;
  userId: ObjectIdType | null;
  totalCents: number;
  requestHash: string;
  createdAt: Date;
}

export function toReceipt(record: OrderRecord): OrderReceipt {
  return {
    id: record._id.toString(),
    status: 'simulated',
    totalCents: record.totalCents,
    currency: 'USD',
    createdAt: record.createdAt.toISOString(),
  };
}

/**
 * POST /api/orders (simulated, decision D03). Re-reads active products and inventory, rejects
 * insufficient stock with 409 OUT_OF_STOCK, computes the total from database prices and stores
 * name/price snapshots. Stock is never deducted and no payment data exists.
 *
 * Idempotency: requestId is unique. A retry must match the stored request hash (which covers the
 * normalized email, address and lines) and the same owner (user id, or guest) to get the original
 * receipt; anything else is 409 IDEMPOTENCY_CONFLICT, so guest orders cannot be read by guessing.
 */
export async function createOrder(
  userId: string | null,
  input: NormalizedCheckout,
): Promise<OrderReceipt> {
  const requestHash = sha256(canonicalCheckout(input));
  const replay = (record: OrderRecord) => {
    if (record.requestHash !== requestHash || (record.userId?.toString() ?? null) !== userId)
      throw new CatalogError(
        409,
        'IDEMPOTENCY_CONFLICT',
        'requestId was already used for a different request',
      );
    return toReceipt(record);
  };
  const existing = await OrderModel.findOne({ requestId: input.requestId }).lean<OrderRecord>();
  if (existing) return replay(existing);

  const products = new Map(
    (await getActiveProductsByIds(input.items.map((line) => line.productId))).map((p) => [p.id, p]),
  );
  const problems: Record<string, string> = {};
  input.items.forEach((line, index) => {
    const product = products.get(line.productId.toLowerCase());
    if (!product) problems[`items.${index}.productId`] = 'Product unavailable';
    else if (line.quantity > product.stock)
      problems[`items.${index}.quantity`] = `Only ${product.stock} available`;
  });
  if (Object.keys(problems).length)
    throw new CatalogError(409, 'OUT_OF_STOCK', 'Some items are not available', problems);

  const items = input.items.map((line) => {
    const product = products.get(line.productId.toLowerCase())!;
    return {
      productId: new ObjectId(product.id),
      name: product.name,
      unitPriceCents: product.priceCents,
      quantity: Math.min(line.quantity, MAX_QUANTITY),
    };
  });
  const totalCents = items.reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0);
  try {
    const created = await OrderModel.create({
      userId: userId ? new ObjectId(userId) : null,
      email: input.email,
      address: input.address,
      items,
      totalCents,
      currency: 'USD',
      status: 'simulated',
      requestId: input.requestId,
      requestHash,
    });
    return toReceipt(created.toObject<OrderRecord>());
  } catch (error) {
    if (isDuplicateKey(error)) {
      const winner = await OrderModel.findOne({ requestId: input.requestId }).lean<OrderRecord>();
      if (winner) return replay(winner);
    }
    throw error;
  }
}
