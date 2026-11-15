import { defineConfig } from '@playwright/test';

// Student 1 Phase 3/4 browser journeys (not part of npm test or CI). Run:
// - Local (Phase 3): MongoDB via `npm run services`, the compiled API on :4000 (`npm start` with
//   CLIENT_DIST_DIR, MONGODB_URI=.../solcacao_p3_member1 and CLIENT_ORIGIN including
//   http://localhost:5173), then `VITE_API_MODE=http npm run dev:client` (React StrictMode), then
//   `npx playwright test -c tests/member-1/playwright.config.ts auth-journey`.
// - Deployed (Phase 4): `npx playwright test -c tests/member-1/playwright.config.ts deployed`.
export default defineConfig({
  testDir: '.',
  testMatch: '*.live.spec.ts',
  timeout: 60_000,
  workers: 1,
  reporter: 'list',
  use: { baseURL: process.env.LIVE_UI_URL ?? 'http://localhost:5173' },
});
