import { createHash } from 'node:crypto';
import mongoose from 'mongoose';
import type { QuoteInput, QuoteReceipt, User } from '../../../../contracts/index.js';
import { B2bError } from './errors.js';
import { B2bRequest } from './model.js';
import type { QuoteFileStorage } from './storage.js';
import type { NotifyQuote } from './types.js';
import { safeDisplayName, type UploadedFile } from './upload.js';

const sha256 = (data: string | Buffer) => createHash('sha256').update(data).digest('hex');

/** Key-sorted JSON, so the same quote always hashes the same way. */
function canonicalJson(input: QuoteInput): string {
  const entries = Object.entries(input).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return JSON.stringify(Object.fromEntries(entries));
}

function notificationStatusOf(value: string): QuoteReceipt['notificationStatus'] {
  return value === 'sent' || value === 'failed' ? value : 'pending';
}

interface ReceiptSource {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  notificationStatus: string;
}

/** Public DTO: no _id, __v, file key, hash or contact data. */
export function toReceipt(record: ReceiptSource): QuoteReceipt {
  return {
    id: record._id.toString(),
    status: 'submitted',
    createdAt: record.createdAt.toISOString(),
    notificationStatus: notificationStatusOf(record.notificationStatus),
  };
}

function isDuplicateKey(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}

/**
 * Saves one quote request per (user, requestId) and only then notifies.
 * - Same requestId with the same metadata and file returns the original receipt, with no new
 *   file or notification. A different body returns 409 IDEMPOTENCY_CONFLICT.
 * - Concurrent duplicates race on the unique index; the loser deletes its file and replays.
 * - Any failure after the file is written deletes that file.
 */
export async function submitQuote({
  user,
  input,
  file,
  storage,
  notifyQuote,
}: {
  user: User;
  input: QuoteInput;
  file: UploadedFile;
  storage: QuoteFileStorage;
  notifyQuote: NotifyQuote;
}): Promise<QuoteReceipt> {
  const userId = new mongoose.Types.ObjectId(user.id);
  const fileDigest = sha256(file.buffer);
  const requestHash = sha256(`${canonicalJson(input)}\n${fileDigest}`);
  const replay = (record: ReceiptSource & { requestHash: string }) => {
    if (record.requestHash !== requestHash)
      throw new B2bError(
        409,
        'IDEMPOTENCY_CONFLICT',
        'requestId was already used for a different request',
      );
    return toReceipt(record);
  };

  const existing = await B2bRequest.findOne({ userId, requestId: input.requestId }).lean();
  if (existing) return replay(existing);

  const fileKey = await storage.save(file.buffer);
  let created;
  try {
    created = await B2bRequest.create({
      userId,
      ...input,
      requestHash,
      fileKey,
      fileOriginalName: safeDisplayName(file.originalname),
      fileMime: 'application/pdf',
      fileSize: file.size,
      fileDigest,
      notificationStatus: 'pending',
    });
  } catch (error) {
    await storage.remove(fileKey);
    if (isDuplicateKey(error)) {
      const winner = await B2bRequest.findOne({ userId, requestId: input.requestId }).lean();
      if (winner) return replay(winner);
    }
    throw error;
  }

  // The request is already saved, so a mail outage can neither lose it nor cause a resubmission.
  let notificationStatus: 'sent' | 'failed';
  try {
    notificationStatus = await notifyQuote({
      quoteId: created.id,
      companyName: input.companyName,
      contactEmail: input.contactEmail,
      locale: input.locale,
    });
  } catch {
    notificationStatus = 'failed';
  }
  try {
    await B2bRequest.updateOne({ _id: created._id }, { notificationStatus });
  } catch (error) {
    console.error('[b2b] Could not record the notification status', error);
  }
  return { ...toReceipt(created), notificationStatus };
}

/** Owner-scoped lookup: another user's request is indistinguishable from a missing one. */
export function findOwnRequest(user: User, id: string) {
  return B2bRequest.findOne({ _id: id, userId: user.id }).lean();
}
