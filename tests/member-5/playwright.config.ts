import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: '.',
  testMatch: 'visual.spec.ts',
  use: { baseURL: 'http://127.0.0.1:5175', browserName: 'chromium' },
  webServer: {
    command: 'npm run dev:client -- --host 127.0.0.1 --port 5175',
    url: 'http://127.0.0.1:5175',
    reuseExistingServer: false,
  },
});
