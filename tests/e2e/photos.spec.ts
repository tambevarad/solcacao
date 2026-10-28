import { test, expect } from '@playwright/test';

// Every photo on the image-led pages must actually load (no broken paths after a rename or move).
for (const path of ['/en', '/es/wholesale']) {
  test(`all photos load on ${path}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
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
    // Content that arrives after the scroll (e.g. featured products from api.catalog) can sit above
    // the viewport; load every image eagerly so the check covers it too.
    await images.evaluateAll((nodes) =>
      nodes.forEach((node) => node instanceof HTMLImageElement && (node.loading = 'eager')),
    );
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
    // Also catches missing static files such as the favicon.
    expect(errors).toEqual([]);
  });
}

test('favicon and touch icon are served', async ({ request }) => {
  for (const path of ['/favicon.svg', '/apple-touch-icon.png', '/og-image.jpg'])
    expect((await request.get(path)).status(), path).toBe(200);
});
