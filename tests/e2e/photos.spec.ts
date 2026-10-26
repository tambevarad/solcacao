import { test, expect } from '@playwright/test';

// Every photo on the image-led pages must actually load (no broken paths after a rename or move).
for (const path of ['/en', '/es/wholesale']) {
  test(`all photos load on ${path}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(path);
    // Lazy images load as they near the viewport; scroll through the page to trigger them.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 60));
      }
    });
    const images = page.locator('main img');
    expect(await images.count()).toBeGreaterThan(5);
    await expect
      .poll(() =>
        images.evaluateAll((nodes) =>
          nodes
            .filter((node): node is HTMLImageElement => node instanceof HTMLImageElement)
            .filter((img) => !img.complete || img.naturalWidth === 0)
            .map((img) => img.currentSrc || img.src),
        ),
      )
      .toEqual([]);
  });
}
