import mongoose, { Schema } from 'mongoose';
import type { InquiryInput, InquiryReceipt, LocalizedText } from '../../../../contracts/index.js';

interface InquiryRecord {
  name: string;
  email: string;
  category: InquiryInput['category'];
  message: string;
  locale: InquiryInput['locale'];
  requestId: string;
  requestHash: string;
  samplerItems?: { productId: mongoose.Types.ObjectId; quantity: number; name: LocalizedText }[];
  status: 'received';
  notificationStatus: InquiryReceipt['notificationStatus'];
  createdAt: Date;
  updatedAt: Date;
}

const text = { type: String, required: true };
const localized = new Schema({ en: text, es: text }, { _id: false });
const samplerSnapshot = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, required: true, ref: 'Product' },
    quantity: { type: Number, required: true, min: 1, max: 6 },
    name: { type: localized, required: true },
  },
  { _id: false },
);
const inquiry = new Schema<InquiryRecord>(
  {
    name: { ...text, maxlength: 100 },
    email: { ...text, maxlength: 254 },
    category: { ...text, enum: ['support', 'wholesale', 'feedback', 'sampler'] },
    message: { ...text, minlength: 10, maxlength: 2000 },
    locale: { ...text, enum: ['en', 'es'] },
    requestId: { ...text, unique: true },
    requestHash: { ...text, select: false },
    samplerItems: { type: [samplerSnapshot], default: undefined },
    status: { ...text, enum: ['received'], default: 'received' },
    notificationStatus: { ...text, enum: ['pending', 'sent', 'failed'], default: 'pending' },
  },
  { timestamps: true, collection: 'inquiries', bufferCommands: false },
);

export const InquiryModel = mongoose.model('Inquiry', inquiry);
