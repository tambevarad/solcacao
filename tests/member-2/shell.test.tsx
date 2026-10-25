// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { useState } from 'react';
import { Route, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import type { Dictionary, Locale } from '../../contracts/index.js';
import { createHttpClient } from '../../client/src/api/http.js';
import { createMockShell } from '../../client/src/features/shell/mock.js';
import { useLocale, usePageMeta } from '../../client/src/features/shell/public.js';
import { PageFrame } from '../../client/src/features/shell/PageFrame.js';
import { allNavigationTargets } from '../../client/src/features/shell/navigation.js';
import { renderApp, renderInLayout } from './harness.js';

const mockShell = createMockShell(createHttpClient(() => null));
const location = () => screen.getByTestId('location').textContent;

beforeEach(() => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

/** Stateful stand-in for a feature page (cart, product quantity, wizard step...). */
function DraftPage() {
  const [draft, setDraft] = useState('');
  const { setLocale } = useLocale();
  const { state } = useLocation();
  return (
    <>
      <label>
        Draft
        <input value={draft} onChange={(event) => setDraft(event.target.value)} />
      </label>
      <p data-testid="route-state">{JSON.stringify(state)}</p>
      <button type="button" onClick={() => setLocale('es')}>
        Hook switch
      </button>
    </>
  );
}

describe('routing shell', () => {
  it('renders the layout, html lang and route title at /en', async () => {
    renderApp('/en');
    expect(await screen.findByRole('heading', { name: 'HomePage' })).toBeInTheDocument();
    // Title and lang are applied in effects, which may run just after the first paint.
    await waitFor(() => expect(document.title).toBe('Artisanal chocolate · SolCacao'));
    expect(document.documentElement.lang).toBe('en');
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveAttribute(
      'href',
      '#main',
    );
    expect(screen.getByText('Placeholder')).toBeInTheDocument();
  });

  it('redirects / to /en', async () => {
    renderApp('/');
    await waitFor(() => expect(location()).toBe('/en'));
  });

  it('renders not-found inside the shell for an unknown path', async () => {
    renderApp('/es/no-existe');
    expect(
      await screen.findByRole('heading', { name: 'Página no encontrada' }),
    ).toBeInTheDocument();
    await waitFor(() => expect(document.title).toBe('Página no encontrada · SolCacao'));
    expect(screen.getByRole('link', { name: 'Ir a la página de inicio' })).toHaveAttribute(
      'href',
      '/es',
    );
  });

  it('does not accept an unsupported language prefix', async () => {
    renderApp('/fr/catalog');
    const main = await screen.findByRole('main');
    expect(within(main).getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'CatalogPage' })).toBeNull();
    expect(within(main).getByRole('link', { name: 'Español' })).toHaveAttribute('href', '/es');
    expect(within(main).getByRole('link', { name: 'English' })).toHaveAttribute('href', '/en');
  });

  it('resolves every navigation target to a real route', async () => {
    for (const target of allNavigationTargets()) {
      renderApp(`/en${target}`);
      await screen.findByRole('navigation', { name: 'Main' });
      expect(screen.queryByRole('heading', { name: 'Page not found' }), target).toBeNull();
      cleanup();
    }
  });
});

describe('language switching', () => {
  it('keeps path, query, hash, history state and mounted page state', async () => {
    renderInLayout(
      {
        pathname: '/en/products/fixture-bar-1',
        search: '?qty=2',
        hash: '#details',
        state: { receipt: 'r-1' },
      },
      <Route path="products/:slug" element={<DraftPage />} />,
    );
    const input = await screen.findByLabelText('Draft');
    fireEvent.change(input, { target: { value: 'keep me' } });

    fireEvent.click(screen.getAllByRole('link', { name: 'ES (Español)' })[0]);

    await waitFor(() => expect(location()).toBe('/es/products/fixture-bar-1?qty=2#details'));
    expect(await screen.findAllByRole('link', { name: 'Tienda' })).not.toHaveLength(0);
    expect(screen.getByLabelText('Draft')).toBe(input);
    expect(input).toHaveValue('keep me');
    expect(screen.getByTestId('route-state')).toHaveTextContent('{"receipt":"r-1"}');
    await waitFor(() => expect(document.documentElement.lang).toBe('es'));
  });

  it('setLocale from useLocale swaps only the prefix', async () => {
    renderInLayout(
      '/en/products/fixture-bar-1?qty=3',
      <Route path="products/:slug" element={<DraftPage />} />,
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Hook switch' }));
    await waitFor(() => expect(location()).toBe('/es/products/fixture-bar-1?qty=3'));
  });

  it('keeps the current page mounted when the new dictionary fails, then retries', async () => {
    const loader = vi.fn<(locale: Locale) => Promise<Dictionary>>((locale) =>
      mockShell.dictionary(locale),
    );
    loader.mockImplementationOnce((locale) => mockShell.dictionary(locale));
    loader.mockImplementationOnce(() => Promise.reject(new Error('offline')));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    renderInLayout('/en/products/x', <Route path="products/:slug" element={<DraftPage />} />, {
      loadDictionary: loader,
    });
    const input = await screen.findByLabelText('Draft');
    fireEvent.change(input, { target: { value: 'still here' } });

    fireEvent.click(screen.getAllByRole('link', { name: 'ES (Español)' })[0]);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('We could not load text for the selected language.');
    expect(location()).toBe('/es/products/x');
    expect(screen.getByLabelText('Draft')).toBe(input);

    fireEvent.click(within(alert).getByRole('button', { name: 'Try again' }));
    expect(await screen.findAllByRole('link', { name: 'Tienda' })).not.toHaveLength(0);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(input).toHaveValue('still here');
  });

  it('shows a bilingual retry screen if the first dictionary cannot load', async () => {
    const loader = vi.fn<(locale: Locale) => Promise<Dictionary>>((locale) =>
      mockShell.dictionary(locale),
    );
    loader.mockImplementationOnce(() => Promise.reject(new Error('offline')));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    renderApp('/en', loader);
    fireEvent.click(await screen.findByRole('button', { name: /Try again/ }));
    expect(await screen.findByRole('heading', { name: 'HomePage' })).toBeInTheDocument();
  });

  it('makes missing keys visible in development', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    function UsesMissingKey() {
      return <p>{useLocale().t('catalog.notAddedYet')}</p>;
    }
    renderInLayout('/en/x', <Route path="x" element={<UsesMissingKey />} />);
    expect(await screen.findByText('⟦catalog.notAddedYet⟧')).toBeInTheDocument();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('catalog.notAddedYet'));
  });
});

describe('header search and navigation', () => {
  it('submits search to the localized catalog URL and browser back returns', async () => {
    renderApp('/es/story');
    fireEvent.click(await screen.findByRole('button', { name: 'Abrir búsqueda' }));
    const search = screen.getByRole('searchbox', { name: 'Buscar chocolates' });
    expect(search).toHaveFocus();
    fireEvent.change(search, { target: { value: '  cacao 70%  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));

    await waitFor(() => expect(location()).toBe('/es/catalog?search=cacao+70%25'));
    expect(screen.queryByRole('searchbox')).toBeNull();
    expect(screen.getByRole('main')).toHaveFocus();

    fireEvent.click(screen.getByRole('button', { name: 'Probe back' }));
    await waitFor(() => expect(location()).toBe('/es/story'));
  });

  it('closes the search panel on Escape and returns focus to its trigger', async () => {
    renderApp('/en');
    const trigger = await screen.findByRole('button', { name: 'Open search' });
    fireEvent.click(trigger);
    fireEvent.keyDown(screen.getByRole('searchbox'), { key: 'Escape' });
    expect(screen.queryByRole('searchbox')).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it('links collections to canonical category query values', async () => {
    renderApp('/es');
    fireEvent.click(await screen.findByRole('button', { name: 'Colecciones' }));
    const nav = screen.getByRole('navigation', { name: 'Principal' });
    expect(within(nav).getByRole('link', { name: 'Trufas' })).toHaveAttribute(
      'href',
      '/es/catalog?category=truffle',
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(within(nav).queryByRole('link', { name: 'Trufas' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Colecciones' })).toHaveFocus();
  });

  it('shows a labeled pending notice instead of crashing while the cart is a stub', async () => {
    renderApp('/en');
    fireEvent.click(await screen.findByRole('button', { name: 'Open cart. Items: 0' }));
    expect(screen.getByRole('status')).toHaveTextContent('The cart drawer is not available yet.');
  });
});

describe('mobile navigation drawer', () => {
  it('traps focus, locks scroll, closes on Escape and restores focus', async () => {
    const { container } = renderApp('/en/catalog');
    const opener = await screen.findByRole('button', { name: 'Open menu' });
    opener.focus();
    fireEvent.click(opener);

    const dialog = await screen.findByRole('dialog', { name: 'Menu' });
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(document.body.style.overflow).toBe('hidden');
    expect(container).toHaveAttribute('inert');

    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>('a[href], button, input'));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    last.focus();
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(first).toHaveFocus();
    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true });
    expect(last).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(opener).toHaveFocus();
    expect(document.body.style.overflow).toBe('');
    expect(container).not.toHaveAttribute('inert');
  });

  it('renders the same destinations as the desktop navigation', async () => {
    renderApp('/en');
    fireEvent.click(await screen.findByRole('button', { name: 'Collections' }));
    const desktop = screen.getByRole('navigation', { name: 'Main' });
    const desktopLinks = within(desktop)
      .getAllByRole('link')
      .map((link) => link.getAttribute('href'));
    fireEvent.keyDown(document, { key: 'Escape' });

    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    const drawerNav = within(await screen.findByRole('dialog')).getByRole('navigation', {
      name: 'Main',
    });
    const drawerLinks = within(drawerNav)
      .getAllByRole('link')
      .map((link) => link.getAttribute('href'));
    expect(new Set(drawerLinks)).toEqual(new Set(desktopLinks));
  });

  it('closes after navigation and moves focus to the new page content', async () => {
    renderApp('/en/catalog');
    fireEvent.click(await screen.findByRole('button', { name: 'Open menu' }));
    fireEvent.click(
      within(await screen.findByRole('dialog')).getByRole('link', { name: 'Our story' }),
    );
    await waitFor(() => expect(location()).toBe('/en/story'));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('main')).toHaveFocus();
  });
});

describe('page frame', () => {
  it('lets a page override its title while keeping the localized route description', async () => {
    function ProductStandIn() {
      usePageMeta({ title: 'Fixture bar 1' });
      return <p>product</p>;
    }
    renderInLayout(
      '/en/products/fixture-bar-1',
      <Route
        path="products/:slug"
        element={
          <PageFrame meta="product">
            <ProductStandIn />
          </PageFrame>
        }
      />,
    );
    await screen.findByText('product');
    await waitFor(() => expect(document.title).toBe('Fixture bar 1 · SolCacao'));
    expect(document.querySelector('meta[name="description"]')).toHaveAttribute(
      'content',
      'Chocolate details, ingredients and allergens.',
    );
  });

  it('contains a crashing page, keeps the shell usable and resets on the next page', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    function Fragile() {
      const { pathname } = useLocation();
      if (pathname.endsWith('/broken')) throw new Error('feature bug');
      return <p>healthy product</p>;
    }
    renderInLayout(
      '/en/products/broken',
      <Route
        path="products/:slug"
        element={
          <PageFrame meta="product">
            <Fragile />
          </PageFrame>
        }
      />,
      { probeLinks: [{ label: 'Go healthy', to: '/en/products/fine' }] },
    );
    expect(await screen.findByRole('alert')).toHaveTextContent('This page could not be displayed');
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Go healthy' }));
    expect(await screen.findByText('healthy product')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
