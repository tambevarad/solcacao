/**
 * Isolated MongoDB for Student 1's integration tests. TEST_MONGODB_URI must point at a local or CI
 * service container (never a deployment); the tests then use their own database
 * `solcacao_test_member1_<pid>` on it and drop only that database afterwards.
 */
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', 'mongo', 'mongodb']);

export class UnsafeTestDatabaseError extends Error {}

/** The member-1 test database URI, or null when TEST_MONGODB_URI is unset (tests are skipped). */
export function memberTestMongoUri(env: NodeJS.ProcessEnv = process.env): string | null {
  const raw = env.TEST_MONGODB_URI?.trim();
  if (!raw) return null;
  const refuse = (reason: string) => {
    throw new UnsafeTestDatabaseError(`Refusing TEST_MONGODB_URI: ${reason}`);
  };
  if (env.NODE_ENV === 'production') refuse('NODE_ENV is production');
  if (env.MONGODB_URI && raw === env.MONGODB_URI.trim()) refuse('it equals MONGODB_URI');
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return refuse('not a single-host mongodb:// URI');
  }
  if (url.protocol !== 'mongodb:') refuse('only mongodb:// to a local/CI host is allowed');
  if (!LOCAL_HOSTS.has(url.hostname)) refuse(`host ${url.hostname} is not local`);
  url.pathname = `/solcacao_test_member1_${process.pid}`;
  return url.toString();
}
