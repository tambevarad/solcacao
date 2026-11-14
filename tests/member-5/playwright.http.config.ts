import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const repositoryRoot = fileURLToPath(new URL('../../', import.meta.url));

export default defineConfig({
  testDir: '.',
  testMatch: 'http-browser.spec.ts',
  workers: 1,
  outputDir: 'test-results/member-5-http',
  use: { baseURL: 'http://127.0.0.1:5176', browserName: 'chromium' },
  webServer: [
    {
      command: 'node --import tsx tests/member-5/http-browser-server.ts',
      cwd: repositoryRoot,
      url: 'http://127.0.0.1:4015/api/health',
      reuseExistingServer: false,
      timeout: 120000,
    },
    {
      command: 'npm run dev:client -- --host 127.0.0.1 --port 5176 --strictPort',
      cwd: repositoryRoot,
      url: 'http://127.0.0.1:5176',
      reuseExistingServer: false,
      env: {
        VITE_API_MODE: 'http',
        VITE_API_BASE_URL: 'http://127.0.0.1:4015/api',
        VITE_WHATSAPP_NUMBER: '',
      },
    },
  ],
});
