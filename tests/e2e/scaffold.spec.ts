import { test, expect } from '@playwright/test';
test('template route is reachable', async ({ page }) => {
  await page.goto('/en');
  await expect(page.getByRole('heading', { name: 'HomePage' })).toBeVisible();
});
