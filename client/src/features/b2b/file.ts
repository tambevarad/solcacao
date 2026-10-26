import type { Locale } from '../../../../contracts/index.js';
import { MAX_FILE_BYTES } from './options.js';

export type FileProblem = 'type' | 'empty' | 'size' | 'signature';

/** Translation key for each client-side file problem. */
export const FILE_PROBLEM_KEYS: Record<FileProblem, string> = {
  type: 'b2b.errors.fileType',
  empty: 'b2b.errors.fileEmpty',
  size: 'b2b.errors.fileSize',
  signature: 'b2b.errors.fileSignature',
};

/**
 * Client-side assistance only: the server repeats every check and is the security boundary.
 * Mirrors the server rules so a shopper learns about a bad file before reaching review.
 */
export async function checkPdf(file: File): Promise<FileProblem | null> {
  if (!/\.pdf$/i.test(file.name) || file.type !== 'application/pdf') return 'type';
  if (file.size === 0) return 'empty';
  if (file.size > MAX_FILE_BYTES) return 'size';
  const head = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  return String.fromCharCode(...head) === '%PDF-' ? null : 'signature';
}

/** Display-safe file name: no path segments or control characters, bounded length. */
export function displayFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? '';
  // React escapes the text when rendering; this only keeps the summary readable.
  const clean = Array.from(base)
    .filter((char) => char.charCodeAt(0) > 0x1f && char.charCodeAt(0) !== 0x7f)
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
  if (!clean) return 'design.pdf';
  return clean.length > 120 ? `${clean.slice(0, 116)}….pdf` : clean;
}

/** "1.2 MB" / "1,2 MB" style sizes using 1024-based units, matching the "5 MB" limit copy. */
export function formatFileSize(bytes: number, locale: Locale): string {
  const megabytes = bytes / (1024 * 1024);
  if (megabytes >= 0.1)
    return new Intl.NumberFormat(locale, {
      style: 'unit',
      unit: 'megabyte',
      maximumFractionDigits: 1,
    }).format(megabytes);
  return new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: 'kilobyte',
    maximumFractionDigits: 0,
  }).format(Math.max(1, Math.round(bytes / 1024)));
}
