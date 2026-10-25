import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    include: [
      'tests/**/*.test.{ts,tsx}',
      'client/src/**/*.test.{ts,tsx}',
      'server/src/**/*.test.ts',
    ],
    environment: 'node',
  },
});
