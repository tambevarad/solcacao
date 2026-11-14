import 'dotenv/config';
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: 'deployed.spec.ts',
  workers: 1,
  outputDir: 'test-results/member-5-deployed',
  timeout: 60000,
  use: {
    baseURL: 'https://solcacao-production.up.railway.app',
    browserName: 'chromium',
    trace: 'off', // The protected inbox credentials must not enter traces.
  },
});
