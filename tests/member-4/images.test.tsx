// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import type { ProductPage } from '../../contracts/index.js';
import { makeFixtureProducts } from '../../contracts/fixtures.js';
import { photos } from '../../client/src/shared/index.js';
import { DeferredPhoto } from '../../client/src/features/b2b/components/DeferredPhoto.js';
import { PRELOAD_AFTER_LOAD_MS } from '../../client/src/features/b2b/components/HeroCarousel.js';
import HomePage from '../../client/src/features/b2b/pages/HomePage.js';
import { renderInLayout } from './harness.js';

vi.mock('../../client/src/features/auth/public.js', () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => children,
  RequireAuth: ({ children }: { children: ReactNode }) => children,
  RequireRole: ({ children }: { children: ReactNode }) => children,
  useAuth: () => ({ user: null, ready: true, login: vi.fn(), register: vi.fn(), logout: vi.fn() }),
}));

// The full suite runs files in parallel; give slow renders room.
vi.setConfig({ testTimeout: 20_000 });

/** jsdom has no IntersectionObserver; this one reports what each test tells it to. */
class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  readonly targets = new Set<Element>();
  constructor(
    readonly callback: IntersectionObserverCallback,
    readonly options: IntersectionObserverInit = {},
  ) {
    FakeIntersectionObserver.instances.push(this);
  }
  observe(target: Element) {
    this.targets.add(target);
  }
  unobserve(target: Element) {
    this.targets.delete(target);
  }
  disconnect() {
    this.targets.clear();
  }
  takeRecords() {
    return [];
  }
  /** Marks every observed element as near the viewport. */
  static bringAllNear() {
    for (const observer of FakeIntersectionObserver.instances) {
      const entries = [...observer.targets].map((target) => {
        const rect = target.getBoundingClientRect();
        return {
          target,
          isIntersecting: true,
          intersectionRatio: 1,
          boundingClientRect: rect,
          intersectionRect: rect,
          rootBounds: null,
          time: 0,
        };
      });
      if (entries.length) observer.callback(entries, observer as never);
    }
  }
}

const products = makeFixtureProducts().filter((product) => product.active);
const productPage = (): ProductPage => ({
  items: products.slice(0, 4),
  page: 1,
  limit: 4,
  total: 4,
  totalPages: 1,
});

function setReducedMotion(reduce: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({
      matches: reduce && query.includes('reduce'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
  });
}

beforeEach(() => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  setReducedMotion(false);
  FakeIntersectionObserver.instances = [];
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('DeferredPhoto', () => {
  it('holds a described box until the slot nears the viewport, then shows the photo', async () => {
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
    renderInLayout('/es', <DeferredPhoto image={photos.homeStory} ratio="aspect-[3/2]" />);
    const box = await screen.findByRole('img', { name: photos.homeStory.alt.es });
    expect(box.tagName).toBe('DIV');
    expect(box).toHaveClass('aspect-[3/2]');
    // The observer starts in an effect, after the first render.
    await waitFor(() => expect(FakeIntersectionObserver.instances.length).toBeGreaterThan(0));
    expect(FakeIntersectionObserver.instances[0].options.rootMargin).toBe('600px 0px');

    act(() => FakeIntersectionObserver.bringAllNear());
    const photo = screen.getByRole('img', { name: photos.homeStory.alt.es });
    expect(photo.tagName).toBe('IMG');
    expect(photo).toHaveAttribute('loading', 'lazy');
  });

  it('keeps a decorative photo out of the accessibility tree while deferred', async () => {
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
    const { container } = renderInLayout(
      '/en',
      <DeferredPhoto image={photos.homeStory} decorative />,
    );
    await waitFor(() =>
      expect(
        container.querySelector('main [aria-hidden="true"].aspect-\\[4\\/3\\]'),
      ).not.toBeNull(),
    );
    expect(screen.queryByRole('img')).toBeNull();
  });
});

describe('homepage image loading', () => {
  it('loads only the first hero photo with the page; the rest wait for the viewport', async () => {
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
    const { container } = renderInLayout(
      '/en',
      <HomePage listProducts={async () => productPage()} />,
    );
    await screen.findByRole('link', { name: products[0].name.en });
    const images = () => [...container.querySelectorAll('main img')];
    expect(images().map((image) => image.getAttribute('src'))).toEqual([photos.heroSeasonal.src]);
    expect(images()[0]).toHaveAttribute('loading', 'eager');
    // Six photos below the fold and four product images, each observed once its effect has run.
    await waitFor(() => expect(FakeIntersectionObserver.instances).toHaveLength(10));

    act(() => FakeIntersectionObserver.bringAllNear());
    const sources = images().map((image) => image.getAttribute('src'));
    expect(sources).toContain(photos.homeStory.src);
    expect(sources).toContain(products[0].images[0].url);
    expect(container.querySelector(`img[src="${products[0].images[0].url}"]`)).toHaveAttribute(
      'decoding',
      'async',
    );
  });

  it('starts the hidden hero photos after the page has loaded, while slides rotate', async () => {
    // As in a browser, the page has finished loading before the homepage mounts.
    await new Promise<void>((done) =>
      document.readyState === 'complete'
        ? done()
        : window.addEventListener('load', () => done(), { once: true }),
    );
    // Fake timers that also follow real time, so Testing Library can still wait for the page.
    vi.useFakeTimers({
      shouldAdvanceTime: true,
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'],
    });
    const { container } = renderInLayout(
      '/en',
      <HomePage listProducts={async () => productPage()} />,
    );
    await screen.findByRole('heading', { name: 'Chocolate for the season' });
    // Let React run the carousel's effects (they start its timers) before moving the clock.
    await act(async () => {});
    const heroSources = () =>
      [...container.querySelectorAll('[aria-roledescription="slide"] img')].map((image) =>
        image.getAttribute('src'),
      );
    expect(heroSources()).toEqual([photos.heroSeasonal.src]);
    act(() => vi.advanceTimersByTime(PRELOAD_AFTER_LOAD_MS));
    expect(heroSources()).toEqual([
      photos.heroSeasonal.src,
      photos.heroTruffles.src,
      photos.heroBusiness.src,
    ]);
  });

  it('without rotation, loads a hidden hero photo only when its slide is opened', async () => {
    setReducedMotion(true);
    vi.useFakeTimers({ shouldAdvanceTime: true, toFake: ['setTimeout', 'clearTimeout'] });
    const { container } = renderInLayout(
      '/en',
      <HomePage listProducts={async () => productPage()} />,
    );
    await screen.findByRole('heading', { name: 'Chocolate for the season' });
    await act(async () => {});
    const heroImageCount = () =>
      container.querySelectorAll('[aria-roledescription="slide"] img').length;
    act(() => vi.advanceTimersByTime(PRELOAD_AFTER_LOAD_MS * 5));
    expect(heroImageCount()).toBe(1);
    fireEvent.click(screen.getByRole('button', { name: 'Show slide 3' }));
    expect(
      container.querySelector(
        `[aria-roledescription="slide"] img[src="${photos.heroBusiness.src}"]`,
      ),
    ).not.toBeNull();
  });

  it('keeps the featured grid’s layout while the products load', async () => {
    renderInLayout('/en', <HomePage listProducts={() => new Promise(() => {})} />);
    const label = await screen.findByText('Loading featured chocolates…');
    const status = label.closest('[role="status"]');
    expect(status).not.toBeNull();
    expect(status?.querySelectorAll('ul[aria-hidden="true"] > li')).toHaveLength(4);
  });
});
