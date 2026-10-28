import mongoose, { Schema, type InferSchemaType } from 'mongoose';

/**
 * Users, corporate partners and addresses (docs/data-model.md). Strict schemas with explicit
 * collection names; serializers in service.ts remove private fields (passwordHash, active, _id).
 */
const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    // Normalized (trim + lowercase) before save; the unique index enforces one account per email.
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, enum: ['retail', 'b2b'] },
    active: { type: Boolean, required: true, default: true },
  },
  { collection: 'users', timestamps: true, strict: 'throw' },
);
userSchema.index({ email: 1 }, { unique: true });

const corporatePartnerSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    companyName: { type: String, required: true, trim: true, maxlength: 120 },
  },
  { collection: 'corporatePartners', timestamps: true, strict: 'throw' },
);
corporatePartnerSchema.index({ userId: 1 }, { unique: true });

const addressSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: String, required: true, maxlength: 100 },
    line1: { type: String, required: true, maxlength: 200 },
    line2: { type: String, maxlength: 200 },
    city: { type: String, required: true, maxlength: 100 },
    region: { type: String, required: true, maxlength: 100 },
    postalCode: { type: String, required: true, maxlength: 20 },
    country: { type: String, required: true, match: /^[A-Z]{2}$/ },
  },
  { collection: 'addresses', timestamps: true, strict: 'throw' },
);
// Every read and upsert is constrained by userId.
addressSchema.index({ userId: 1, _id: 1 });

export type UserRecord = InferSchemaType<typeof userSchema> & { _id: mongoose.Types.ObjectId };
export type AddressRecord = InferSchemaType<typeof addressSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const UserModel = mongoose.model('User', userSchema);
export const CorporatePartnerModel = mongoose.model('CorporatePartner', corporatePartnerSchema);
export const AddressModel = mongoose.model('Address', addressSchema);
