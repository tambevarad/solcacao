import { randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

/** Only an isolated local/CI test database may be seeded or dropped by this harness. */
export function isolatedMongoUri(raw: string, suffix: string) {
  const uri = new URL(raw);
  if (
    process.env.NODE_ENV === 'production' ||
    uri.protocol !== 'mongodb:' ||
    !['127.0.0.1', 'localhost', '[::1]', 'mongo', 'mongodb'].includes(uri.hostname) ||
    !/^\/solcacao_test_[\w-]+$/.test(uri.pathname)
  )
    throw new Error('Use a local mongodb:// URI with a dedicated solcacao_test_* database');
  uri.pathname = `/solcacao_test_member5_${suffix}_${randomUUID().replaceAll('-', '')}`;
  return uri.toString();
}

export async function seedTestCatalog(uri: string) {
  // Use Member 3's documented CLI; do not import its private models into support tests.
  await promisify(execFile)(
    process.execPath,
    ['--import', 'tsx', 'server/src/features/catalog/seed.ts', uri],
    { env: { ...process.env, NODE_ENV: 'test' }, timeout: 60000 },
  );
}
