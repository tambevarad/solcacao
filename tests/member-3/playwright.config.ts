import { defineConfig } from '@playwright/test';

// Student 3's live-API retail journeys (Phase 3, D22): the compiled API serving the built client
// (VITE_API_MODE=http) against a real, seeded MongoDB. No mock adapters and no dev server. Start it
// like CI's e2e-live job: a build with VITE_API_MODE=http and VITE_API_BASE_URL=/api, then
// `npm run seed:catalog`, then `npm start` with CLIENT_DIST_DIR=dist/client. Then:
//   npx playwright test --config tests/member-3/playwright.config.ts
// The specs read and briefly change that database (stale-stock journey), so point LIVE_MONGODB_URI
// at the same demo/e2e database the API uses, never a shared one. PW_CHANNEL=chrome runs an
// installed Google Chrome where the Playwright Chromium download is unavailable.
export default defineConfig({
  testDir: '.',
  testMatch: '*.live.spec.ts',
  workers: 1,
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: process.env.LIVE_BASE_URL ?? 'http://127.0.0.1:4000',
    browserName: 'chromium',
    ...(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {}),
  },
});
