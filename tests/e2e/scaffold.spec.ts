import { test, expect } from '@playwright/test';
// Placeholder-independent: holds for the template slot and for Student 4's real homepage. Add
// homepage-specific landmark/navigation checks once the real HomePage is merged.
test('home route renders inside the shell with one page heading', async ({ page }) => {
  await page.goto('/en');
  await expect(page.getByRole('banner')).toBeVisible();
  await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(page.getByRole('contentinfo')).toBeVisible();
});
