// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, screen, within } from '@testing-library/react';
import type { ProductPage, User } from '../../contracts/index.js';
import { makeFixtureProducts } from '../../contracts/fixtures.js';
import { SLIDE_INTERVAL_MS } from '../../client/src/features/b2b/components/HeroCarousel.js';
import type { ListProducts } from '../../client/src/features/b2b/components/FeaturedProducts.js';
import HomePage from '../../client/src/features/b2b/pages/HomePage.js';
import WholesalePage from '../../client/src/features/b2b/pages/WholesalePage.js';
import { renderInLayout } from './harness.js';

// Stand-in for Student 1's useAuth() port; tests switch between guest, retail and business.
const auth = vi.hoisted(() => ({ user: null as User | null }));
vi.mock('../../client/src/features/auth/public.js', () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => children,
  RequireAuth: ({ children }: { children: ReactNode }) => children,
  RequireRole: ({ children }: { children: ReactNode }) => children,
  useAuth: () => ({
    user: auth.user,
    ready: true,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  }),
}));

const products = makeFixtureProducts().filter((product) => product.active);
const page = (items = products.slice(0, 4)): ProductPage => ({
  items,
  page: 1,
  limit: 4,
  total: items.length,
  totalPages: items.length ? 1 : 0,
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
  auth.user = null;
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('HomePage', () => {
  it('renders one h1 and labels the featured area as pending while the catalog is a stub', async () => {
    renderInLayout('/en', <HomePage />);
    expect(
      await screen.findByText(
        'Featured chocolates will appear here once the catalog is connected.',
      ),
    ).toBeInTheDocument();
    expect(within(screen.getByRole('main')).getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getAllByText('Image slot').length).toBeGreaterThan(0);
  });

  it('shows featured products from api.catalog.list with localized price and links', async () => {
    const listProducts = vi.fn<ListProducts>(async () => page());
    renderInLayout('/es', <HomePage listProducts={listProducts} />);
    const first = await screen.findByRole('link', { name: 'Producto de prueba 1' });
    expect(first).toHaveAttribute('href', '/es/products/fixture-bar-1');
    expect(screen.getByText('Ecuador · 45 % de cacao')).toBeInTheDocument();
    expect(screen.getByText(/5,00\sUS\$/)).toBeInTheDocument();
    expect(listProducts).toHaveBeenCalledWith({ limit: 4, sort: 'name', locale: 'es' });
  });

  it('distinguishes error (with retry) from empty results', async () => {
    const listProducts = vi
      .fn<ListProducts>()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(page([]));
    renderInLayout('/en', <HomePage listProducts={listProducts} />);
    expect(await screen.findByText('Featured chocolates could not be loaded')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('No featured chocolates right now.')).toBeInTheDocument();
  });

  it('links collections, wholesale, story and sampler with canonical paths', async () => {
    renderInLayout('/en', <HomePage listProducts={async () => page()} />);
    expect(await screen.findByRole('link', { name: /Truffles\s*Assortments/ })).toHaveAttribute(
      'href',
      '/en/catalog?category=truffle',
    );
    expect(screen.getByRole('link', { name: /Chocolate bars\s*Bars by origin/ })).toHaveAttribute(
      'href',
      '/en/catalog?category=bar',
    );
    expect(screen.getByRole('link', { name: 'Explore wholesale services' })).toHaveAttribute(
      'href',
      '/en/wholesale',
    );
    expect(screen.getByRole('link', { name: 'Read our story' })).toHaveAttribute(
      'href',
      '/en/story',
    );
    expect(screen.getByRole('link', { name: 'Start your sampler' })).toHaveAttribute(
      'href',
      '/en/sampler',
    );
  });
});

describe('hero slides', () => {
  it('rotates automatically, pauses on request and exposes only the active slide', async () => {
    renderInLayout('/en', <HomePage listProducts={async () => page()} />);
    expect(
      await screen.findByRole('heading', { name: 'Chocolate for the season' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Truffles to share or give' })).toBeNull();

    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    // Re-render so the interval is created under fake timers.
    fireEvent.click(screen.getByRole('button', { name: 'Pause slide rotation' }));
    fireEvent.click(screen.getByRole('button', { name: 'Start slide rotation' }));
    act(() => vi.advanceTimersByTime(SLIDE_INTERVAL_MS));
    expect(screen.getByRole('heading', { name: 'Truffles to share or give' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Pause slide rotation' }));
    act(() => vi.advanceTimersByTime(SLIDE_INTERVAL_MS * 3));
    expect(screen.getByRole('heading', { name: 'Truffles to share or give' })).toBeInTheDocument();
  });

  it('supports previous, next and direct slide choice, which stop rotation', async () => {
    renderInLayout('/en', <HomePage listProducts={async () => page()} />);
    await screen.findByRole('heading', { name: 'Chocolate for the season' });
    fireEvent.click(screen.getByRole('button', { name: 'Previous slide' }));
    expect(
      screen.getByRole('heading', { name: 'Custom chocolate for your brand' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start slide rotation' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next slide' }));
    expect(screen.getByRole('heading', { name: 'Chocolate for the season' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Show slide 2' }));
    expect(screen.getByRole('button', { name: 'Show slide 2' })).toHaveAttribute(
      'aria-current',
      'true',
    );
    expect(screen.getByRole('link', { name: 'Shop truffles' })).toHaveAttribute(
      'href',
      '/en/catalog?category=truffle',
    );
  });

  it('does not autoplay when the visitor prefers reduced motion', async () => {
    setReducedMotion(true);
    renderInLayout('/en', <HomePage listProducts={async () => page()} />);
    expect(await screen.findByRole('button', { name: 'Start slide rotation' })).toBeInTheDocument();
  });
});

describe('WholesalePage', () => {
  it('explains the services and offers exactly one start action', async () => {
    renderInLayout('/en/wholesale', <WholesalePage />, 'wholesale');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Custom chocolate for your business' }),
    ).toBeInTheDocument();
    for (const name of [
      'Custom molds',
      'Personalized packaging',
      'White-label chocolate',
      'Sleeve',
      'Gift box',
      'Bulk',
    ])
      expect(screen.getByRole('heading', { name })).toBeInTheDocument();
    const start = screen.getAllByRole('link', { name: 'Start your custom quote' });
    expect(start).toHaveLength(1);
    expect(start[0]).toHaveAttribute('href', '/en/wholesale/request');
    expect(screen.getByText('An order size between 50 and 100,000 units.')).toBeInTheDocument();
  });

  it('tells guests and retail accounts what they need, and stays quiet for business accounts', async () => {
    renderInLayout('/es/wholesale', <WholesalePage />, 'wholesale');
    expect(
      await screen.findByText(/Necesitarás iniciar sesión con una cuenta empresarial/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Iniciar tu cotización personalizada' }),
    ).toHaveAttribute('href', '/es/wholesale/request');
    cleanup();

    auth.user = {
      id: '0000000000000000000000a1',
      name: 'Retail',
      email: 'r@example.test',
      role: 'retail',
    };
    renderInLayout('/en/wholesale', <WholesalePage />, 'wholesale');
    expect(await screen.findByRole('note')).toHaveTextContent(
      'Quote requests need a business account.',
    );
    expect(screen.getByRole('link', { name: 'Create a business account' })).toHaveAttribute(
      'href',
      '/en/register',
    );
    cleanup();

    auth.user = { ...auth.user, role: 'b2b', companyName: 'Test Co' };
    renderInLayout('/en/wholesale', <WholesalePage />, 'wholesale');
    await screen.findByRole('heading', { level: 1 });
    expect(screen.queryByRole('note')).toBeNull();
    expect(screen.queryByText(/sign in with a business account/)).toBeNull();
  });
});
