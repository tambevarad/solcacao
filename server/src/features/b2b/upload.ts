import type { QuoteInput } from '../../../../contracts/index.js';
import { quoteSchema } from '../../../../contracts/validation.js';
import { B2bError } from './errors.js';

/** Decision D07: one required PDF, at most 5 MiB. */
export const MAX_DESIGN_FILE_BYTES = 5 * 1024 * 1024;
/** Generous bound for the metadata JSON string (notes are capped at 2000 characters). */
export const MAX_METADATA_BYTES = 16 * 1024;

const PDF_SIGNATURE = Buffer.from('%PDF-', 'ascii');

export interface UploadedFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

/** Parses the `metadata` field: one JSON string matching the strict shared quote schema. */
export function parseMetadata(raw: unknown): QuoteInput {
  if (typeof raw !== 'string')
    throw new B2bError(400, 'VALIDATION_ERROR', 'Invalid request', {
      metadata: 'Send the quote as a JSON string field named metadata',
    });
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new B2bError(400, 'VALIDATION_ERROR', 'Invalid request', {
      metadata: 'Malformed JSON',
    });
  }
  const parsed = quoteSchema.safeParse(json);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path.length ? String(issue.path[0]) : 'metadata';
      fieldErrors[field] ??= issue.message;
    }
    // Strict-object violations name the unexpected keys rather than a path.
    for (const issue of parsed.error.issues)
      if (issue.code === 'unrecognized_keys')
        for (const key of issue.keys) fieldErrors[key] = 'Unexpected field';
    throw new B2bError(400, 'VALIDATION_ERROR', 'Invalid request', fieldErrors);
  }
  return parsed.data;
}

/**
 * Declared MIME, extension and signature must all say PDF. Size is enforced by multer before the
 * buffer is complete; this repeats the check so the rule holds without multer too.
 */
export function checkDesignFile(file: UploadedFile | undefined): UploadedFile {
  if (!file)
    throw new B2bError(400, 'VALIDATION_ERROR', 'Invalid request', {
      designFile: 'A PDF branding file is required',
    });
  if (file.size > MAX_DESIGN_FILE_BYTES)
    throw new B2bError(413, 'FILE_TOO_LARGE', 'File too large', { designFile: 'Maximum 5 MiB' });
  if (file.mimetype !== 'application/pdf' || !/\.pdf$/i.test(file.originalname))
    throw new B2bError(415, 'UNSUPPORTED_FILE', 'Unsupported file', { designFile: 'PDF only' });
  if (file.size === 0 || !file.buffer.subarray(0, PDF_SIGNATURE.length).equals(PDF_SIGNATURE))
    throw new B2bError(415, 'UNSUPPORTED_FILE', 'Unsupported file', { designFile: 'Not a PDF' });
  return file;
}

/** Display-only name: no path segments, quotes or control characters, bounded length. */
export function safeDisplayName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? '';
  const clean = Array.from(base)
    .filter((char) => char.charCodeAt(0) > 0x1f && char.charCodeAt(0) !== 0x7f && char !== '"')
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
  if (!clean || clean === '.pdf') return 'design.pdf';
  return clean.length > 120 ? `${clean.slice(0, 116)}.pdf` : clean;
}
