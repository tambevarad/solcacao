import { defineConfig } from '@playwright/test';

// Phase 3 live-API journeys (D22). The compiled API serves the built client against a real MongoDB
// and Mailpit; start them first (CI job "e2e-live" in .github/workflows/ci.yml shows how). This
// config never starts a mock server.
export default defineConfig({
  testDir: './tests/e2e/live',
  use: { baseURL: process.env.LIVE_BASE_URL ?? 'http://127.0.0.1:4000' },
  retries: process.env.CI ? 1 : 0,
});
