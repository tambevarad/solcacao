import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    include: [
      'tests/**/*.test.{ts,tsx}',
      'client/src/**/*.test.{ts,tsx}',
      'server/src/**/*.test.ts',
    ],
    environment: 'node',
    // Unit tests use the mock adapters whatever a developer's .env says; the live-API checks run
    // separately (persistence suites and the live browser tests).
    env: { VITE_API_MODE: 'mock' },
  },
});
