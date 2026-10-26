import { randomUUID } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

/** Generated keys only; nothing derived from user input ever reaches the filesystem. */
const FILE_KEY = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$/;

export interface QuoteFileStorage {
  /** Writes the bytes under a new generated name and returns that key. */
  save(bytes: Buffer): Promise<string>;
  /** Deletes a stored file; missing files are ignored. */
  remove(key: string): Promise<void>;
  /** Absolute path for streaming a download. Throws for anything that is not a generated key. */
  resolve(key: string): string;
}

/**
 * Private local storage under `<root>/b2b` (decision D12). The directory is never served
 * statically; downloads go through the owner-checked GET route.
 */
export function createLocalQuoteStorage(root: string): QuoteFileStorage {
  const dir = path.resolve(root, 'b2b');
  function resolve(key: string) {
    if (!FILE_KEY.test(key)) throw new Error('Invalid file key');
    return path.join(dir, key);
  }
  return {
    async save(bytes) {
      await mkdir(dir, { recursive: true, mode: 0o700 });
      const key = `${randomUUID()}.pdf`;
      await writeFile(resolve(key), bytes, { flag: 'wx', mode: 0o600 });
      return key;
    },
    async remove(key) {
      if (FILE_KEY.test(key)) await rm(resolve(key), { force: true });
    },
    resolve,
  };
}
