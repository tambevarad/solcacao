import mongoose, { Schema } from 'mongoose';

/**
 * products, inventory, carts and orders (docs/data-model.md, docs/phase1/database-schema-design.md).
 * Field shapes follow the Product/Cart/OrderReceipt DTOs in contracts/index.ts, which are
 * authoritative where the Phase 1 table is looser (images carry localized alt text; ingredients
 * and allergens are one localized string each). Schemas are strict, money is integer USD cents.
 */

const localized = {
  en: { type: String, required: true, maxlength: 2000 },
  es: { type: String, required: true, maxlength: 2000 },
};
const integer = {
  validator: Number.isInteger,
  message: '{PATH} must be an integer',
};

const productSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/ },
    name: localized,
    description: localized,
    category: { type: String, enum: ['bar', 'truffle', 'seasonal'], required: true },
    origin: { type: String, required: true, maxlength: 100 },
    cacaoPct: { type: Number, required: true, min: 0, max: 100, validate: integer },
    priceCents: { type: Number, required: true, min: 0, validate: integer },
    currency: { type: String, enum: ['USD'], default: 'USD', required: true },
    images: {
      type: [
        new Schema(
          { url: { type: String, required: true, match: /^\/[\w./-]+$/ }, alt: localized },
          { _id: false },
        ),
      ],
      default: [],
    },
    ingredients: localized,
    allergens: localized,
    active: { type: Boolean, required: true, default: true },
  },
  { timestamps: true, collection: 'products', strict: 'throw' },
);
// GET /api/products indexes, chosen by measuring explain() plans on a 5,000-product catalog
// (team/member-3/phase-3-evidence.md). Each serves a whole sort including the _id tie-breaker, so a
// page stops after skip + limit keys instead of sorting every match in memory. Name sorts run with
// the locale collation, so their indexes carry the same collation; price sorts use no collation.
// priceDesc reads the price indexes backwards ({ priceCents: -1, _id: -1 }).
for (const locale of ['en', 'es'] as const)
  productSchema.index(
    { active: 1, [`name.${locale}`]: 1, _id: 1 },
    { name: `active_name_${locale}`, collation: { locale, strength: 1 } },
  );
productSchema.index({ active: 1, priceCents: 1, _id: 1 }, { name: 'active_price' });
productSchema.index(
  { active: 1, category: 1, priceCents: 1, _id: 1 },
  { name: 'active_category_price' },
);
productSchema.index(
  { active: 1, origin: 1, priceCents: 1, _id: 1 },
  { name: 'active_origin_price' },
);

const inventorySchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, unique: true },
    availableUnits: { type: Number, required: true, min: 0, validate: integer },
  },
  { timestamps: true, collection: 'inventory', strict: 'throw' },
);

const lineSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1, max: 99, validate: integer },
  },
  { _id: false },
);

const cartSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: { type: [lineSchema], default: [] },
    revision: { type: Number, required: true, default: 0, min: 0, validate: integer },
    /** Latest 100 processed guest mergeIds; updated in the same atomic write as items/revision. */
    mergeIds: { type: [String], default: [] },
  },
  { timestamps: true, collection: 'carts', strict: 'throw' },
);

const orderSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    email: { type: String, required: true, maxlength: 254 },
    address: {
      recipient: { type: String, required: true, maxlength: 100 },
      line1: { type: String, required: true, maxlength: 200 },
      line2: { type: String, maxlength: 200 },
      city: { type: String, required: true, maxlength: 100 },
      region: { type: String, required: true, maxlength: 100 },
      postalCode: { type: String, required: true, maxlength: 20 },
      country: { type: String, required: true, match: /^[A-Z]{2}$/ },
    },
    items: {
      type: [
        new Schema(
          {
            productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
            name: localized,
            unitPriceCents: { type: Number, required: true, min: 0, validate: integer },
            quantity: { type: Number, required: true, min: 1, max: 99, validate: integer },
          },
          { _id: false },
        ),
      ],
      required: true,
    },
    totalCents: { type: Number, required: true, min: 0, validate: integer },
    currency: { type: String, enum: ['USD'], default: 'USD', required: true },
    status: { type: String, enum: ['simulated'], default: 'simulated', required: true },
    requestId: { type: String, required: true, unique: true },
    /** SHA-256 of the normalized checkout body; detects a reused requestId. */
    requestHash: { type: String, required: true },
  },
  { timestamps: true, collection: 'orders', strict: 'throw' },
);
orderSchema.index({ userId: 1, createdAt: -1 });

export const ProductModel = mongoose.model('Product', productSchema);
export const InventoryModel = mongoose.model('Inventory', inventorySchema);
export const CartModel = mongoose.model('Cart', cartSchema);
export const OrderModel = mongoose.model('Order', orderSchema);
