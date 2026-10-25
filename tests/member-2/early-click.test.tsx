// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { LocaleProvider } from '../../client/src/features/shell/public.js';
import { Header } from '../../client/src/features/shell/components/Header.js';

// Regression: header menus used to reset their open state in a mount effect, so a click landing
// between the first commit and the passive-effect flush (seen on slower CI) was undone.
let root: Root | undefined;
afterEach(() => {
  root?.unmount();
  document.body.innerHTML = '';
});

it('keeps the Collections menu open when clicked before mount effects run', async () => {
  // Real scheduling instead of act(), so effects are not flushed before the click.
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = false;
  const host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  root.render(
    <MemoryRouter initialEntries={['/es']}>
      <LocaleProvider>
        <Header />
      </LocaleProvider>
    </MemoryRouter>,
  );

  const button = await new Promise<HTMLButtonElement>((resolve) => {
    const find = () =>
      Array.from(host.querySelectorAll('button')).find((element) =>
        element.textContent?.includes('Colecciones'),
      );
    const observer = new MutationObserver(() => {
      const found = find();
      if (!found) return;
      observer.disconnect();
      resolve(found);
    });
    observer.observe(host, { childList: true, subtree: true });
  });
  button.click();
  await new Promise((resolve) => setTimeout(resolve, 50));

  expect(button.getAttribute('aria-expanded')).toBe('true');
});
