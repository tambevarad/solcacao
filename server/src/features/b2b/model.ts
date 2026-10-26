import mongoose, { Schema, type InferSchemaType } from 'mongoose';

/**
 * b2bRequests collection (docs/data-model.md). Stores the validated QuoteInput, idempotency data
 * and private file metadata. Never a File object, file contents or a public URL: `fileKey` is a
 * generated name inside the private upload directory.
 */
const b2bRequestSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    cacaoProfile: { type: String, enum: ['dark70', 'dark85', 'milk45'], required: true },
    quantity: { type: Number, required: true, min: 50, max: 100000 },
    packaging: { type: String, enum: ['sleeve', 'giftBox', 'bulk'], required: true },
    companyName: { type: String, required: true, maxlength: 120 },
    contactEmail: { type: String, required: true, maxlength: 254 },
    notes: { type: String, maxlength: 2000 },
    locale: { type: String, enum: ['en', 'es'], required: true },
    requestId: { type: String, required: true },
    /** SHA-256 of the canonical metadata plus the file digest; detects a reused requestId. */
    requestHash: { type: String, required: true },
    fileKey: { type: String, required: true },
    fileOriginalName: { type: String, required: true, maxlength: 255 },
    fileMime: { type: String, required: true, enum: ['application/pdf'] },
    fileSize: { type: Number, required: true, min: 1 },
    fileDigest: { type: String, required: true },
    status: { type: String, enum: ['submitted'], default: 'submitted', required: true },
    notificationStatus: {
      type: String,
      enum: ['pending', 'sent', 'failed'],
      default: 'pending',
      required: true,
    },
  },
  { timestamps: true, collection: 'b2bRequests' },
);

// Idempotency key (userId, requestId): concurrent duplicates fail atomically on insert.
b2bRequestSchema.index({ userId: 1, requestId: 1 }, { unique: true });
// Own-request reads are always filtered by owner.
b2bRequestSchema.index({ userId: 1, createdAt: -1 });

export type B2bRequestRecord = InferSchemaType<typeof b2bRequestSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const B2bRequest = mongoose.model('B2bRequest', b2bRequestSchema);
