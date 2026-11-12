import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  // Phase 2 mock-mode checks only; the live-API journeys use playwright.live.config.ts.
  testIgnore: ['live/**'],
  use: { baseURL: 'http://localhost:5173' },
  webServer: {
    command: 'npm run dev:client',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
