import { defineConfig } from '@playwright/test';

// Student 4's live-API quote journeys (Phase 3, D22): real MongoDB, real uploads and Mailpit, no
// mock adapters. Start them like CI's e2e-live job: npm run services, a build with
// VITE_API_MODE=http, npm run seed:catalog, then the compiled API with CLIENT_DIST_DIR=dist/client
// and SMTP pointed at Mailpit. Then: npx playwright test --config tests/member-4/playwright.config.ts
export default defineConfig({
  testDir: '.',
  testMatch: '*.live.spec.ts',
  workers: 1,
  timeout: 60_000,
  use: {
    baseURL: process.env.LIVE_BASE_URL ?? 'http://127.0.0.1:4000',
    browserName: 'chromium',
  },
});
