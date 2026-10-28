// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { LocaleProvider } from '../../client/src/features/shell/public.js';
import ContactPage from '../../client/src/features/support/pages/ContactPage.js';
import FeedbackPage from '../../client/src/features/support/pages/FeedbackPage.js';
import SamplerPage from '../../client/src/features/support/pages/SamplerPage.js';
import StoryPage from '../../client/src/features/support/pages/StoryPage.js';
import CarePage from '../../client/src/features/support/pages/CarePage.js';
import { api } from '../../client/src/api/index.js';
import en from '../../client/src/features/support/locales/en.json';
import es from '../../client/src/features/support/locales/es.json';
import shellEn from '../../client/src/features/shell/locales/en.json';
import shellEs from '../../client/src/features/shell/locales/es.json';
import { product } from './fixtures.js';
import type { ReactNode } from 'react';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

function Switch() {
  const navigate = useNavigate();
  return <button onClick={() => navigate('/es/contact')}>Switch test locale</button>;
}
function mount(page: ReactNode) {
  return render(
    <MemoryRouter
      initialEntries={['/en/contact']}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <LocaleProvider
        loadDictionary={async (locale) =>
          locale === 'es' ? { ...shellEs, ...es } : { ...shellEn, ...en }
        }
      >
        {page}
        <Switch />
      </LocaleProvider>
    </MemoryRouter>,
  );
}
async function fill() {
  fireEvent.change(await screen.findByLabelText(/^Name/), {
    target: { value: 'Synthetic Shopper' },
  });
  fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: 'shopper@example.test' } });
  fireEvent.change(screen.getByLabelText(/^Message/), {
    target: { value: 'A fictional support question.' },
  });
}

describe('support forms', () => {
  it('focuses invalid input summary and preserves values across failure, retry and locale change', async () => {
    const submit = vi
      .spyOn(api.support, 'submit')
      .mockRejectedValueOnce(new Error('Offline'))
      .mockResolvedValue({ id: product.id, status: 'received', notificationStatus: 'pending' });
    mount(<ContactPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Send enquiry' }));
    expect(submit).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(screen.getByRole('alert'));
    await fill();
    fireEvent.click(screen.getByRole('button', { name: 'Send enquiry' }));
    await screen.findByText(en['support.error.request']);
    const first = submit.mock.calls[0][0];
    expect((screen.getByLabelText(/^Name/) as HTMLInputElement).value).toBe('Synthetic Shopper');
    fireEvent.click(screen.getByRole('button', { name: 'Send enquiry' }));
    await screen.findByText(en['support.receipt.mock']);
    expect(submit.mock.calls[1][0].requestId).toBe(first.requestId);
    fireEvent.click(screen.getByRole('button', { name: 'Start another enquiry' }));
    await fill();
    fireEvent.click(screen.getByRole('button', { name: 'Switch test locale' }));
    await screen.findByRole('heading', { name: 'Contáctanos' });
    expect((screen.getByLabelText(/^Nombre/) as HTMLInputElement).value).toBe('Synthetic Shopper');
    expect((screen.getByLabelText(/^Mensaje/) as HTMLTextAreaElement).value).toBe(
      'A fictional support question.',
    );
  });

  it('blocks repeat pending submissions and uses feedback category', async () => {
    let resolve: ((value: Awaited<ReturnType<typeof api.support.submit>>) => void) | undefined;
    const submit = vi.spyOn(api.support, 'submit').mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    mount(<FeedbackPage />);
    await fill();
    const button = screen.getByRole('button', { name: 'Send enquiry' });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(submit).toHaveBeenCalledTimes(1);
    expect(submit.mock.calls[0][0].category).toBe('feedback');
    expect(button.hasAttribute('disabled')).toBe(true);
    resolve?.({ id: product.id, status: 'received', notificationStatus: 'pending' });
    await screen.findByText(en['support.receipt.mock']);
  });

  it('renders complete informational copy and localized navigation without pending-content slots', async () => {
    const view = mount(<StoryPage />);
    await screen.findByText(en['support.story.body']);
    expect(screen.getByText(en['support.story.secondBody'])).toBeTruthy();
    expect(screen.queryByText(en['support.story.pending'])).toBeNull();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole('link', { name: en['support.content.wholesale'] }).getAttribute('href'),
    ).toBe('/en/wholesale');
    fireEvent.click(screen.getByRole('button', { name: 'Switch test locale' }));
    await screen.findByText(es['support.story.body']);
    expect(
      screen.getByRole('link', { name: es['support.content.catalog'] }).getAttribute('href'),
    ).toBe('/es/catalog');
    view.unmount();
    mount(<CarePage />);
    await screen.findByText(en['support.care.body']);
    expect(screen.getByText(en['support.care.secondBody'])).toBeTruthy();
    expect(screen.queryByText(en['support.care.pending'])).toBeNull();
    expect(
      screen.getByRole('link', { name: en['support.content.sampler'] }).getAttribute('href'),
    ).toBe('/en/sampler');
  });

  it('hides unconfigured WhatsApp and keeps a configured US-format link generic in both languages', async () => {
    vi.stubEnv('VITE_WHATSAPP_NUMBER', '');
    const blank = mount(<ContactPage />);
    await screen.findByRole('heading', { name: en['support.contact.title'] });
    expect(screen.queryByRole('link', { name: en['support.whatsapp.link'] })).toBeNull();
    blank.unmount();
    vi.stubEnv('VITE_WHATSAPP_NUMBER', '15555555555');
    mount(<ContactPage />);
    await fill();
    const link = screen.getByRole('link', { name: en['support.whatsapp.link'] });
    expect(link.getAttribute('href')).toBe(
      `https://wa.me/15555555555?text=${encodeURIComponent(en['support.whatsapp.message'])}`,
    );
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('href')).not.toContain('shopper');
    fireEvent.click(screen.getByRole('button', { name: 'Switch test locale' }));
    const spanish = await screen.findByRole('link', { name: es['support.whatsapp.link'] });
    expect(spanish.getAttribute('href')).toBe(
      `https://wa.me/15555555555?text=${encodeURIComponent(es['support.whatsapp.message'])}`,
    );
  });
});

describe('sampler', () => {
  it('uses singular and plural selection text in English and Spanish', async () => {
    vi.spyOn(api.catalog, 'list').mockResolvedValue({
      items: [product],
      page: 1,
      limit: 48,
      total: 1,
      totalPages: 1,
    });
    mount(<SamplerPage />);
    const add = await screen.findByRole('button', { name: 'Add one Test bar' });
    fireEvent.click(add);
    expect(screen.getByText('1 selected')).toBeTruthy();
    expect(screen.getByText('Test bar — 1 piece')).toBeTruthy();
    expect(screen.queryByText('Test bar — 1 pieces')).toBeNull();
    fireEvent.click(add);
    expect(screen.getByText('2 selected')).toBeTruthy();
    expect(screen.getByText('Test bar — 2 pieces')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Switch test locale' }));
    await screen.findByText('2 seleccionadas');
    expect(screen.getByText('Barra de prueba — 2 piezas')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Quitar una pieza de Barra de prueba' }));
    expect(screen.getByText('1 seleccionada')).toBeTruthy();
    expect(screen.getByText('Barra de prueba — 1 pieza')).toBeTruthy();
    expect(screen.queryByText('1 seleccionadas')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Quitar una pieza de Barra de prueba' }));
    expect(screen.getByText('0 seleccionadas')).toBeTruthy();
    expect(screen.getByText(es['support.sampler.none'])).toBeTruthy();
  });

  it('requires six pieces, caps at six, preserves selection in Spanish and submits unique IDs', async () => {
    const list = vi.spyOn(api.catalog, 'list').mockResolvedValue({
      items: [product, { ...product, id: '000000000000000000000002', active: false }],
      page: 1,
      limit: 48,
      total: 2,
      totalPages: 1,
    });
    const submit = vi
      .spyOn(api.support, 'submit')
      .mockResolvedValue({ id: product.id, status: 'received', notificationStatus: 'pending' });
    mount(<SamplerPage />);
    await fill();
    const add = await screen.findByRole('button', { name: 'Add one Test bar' });
    expect(screen.getAllByRole('article')).toHaveLength(1);
    for (let i = 0; i < 5; i++) fireEvent.click(add);
    fireEvent.click(screen.getByRole('button', { name: 'Send enquiry' }));
    expect(submit).not.toHaveBeenCalled();
    fireEvent.click(add);
    expect(add.hasAttribute('disabled')).toBe(true);
    fireEvent.click(add);
    expect(screen.getByText('6 of 6 pieces selected')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Switch test locale' }));
    await screen.findByText('6 de 6 piezas seleccionadas');
    expect(list).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Enviar consulta' }));
    await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
    expect(submit.mock.calls[0][0]).toMatchObject({
      category: 'sampler',
      locale: 'es',
      samplerItems: [{ productId: product.id, quantity: 6 }],
    });
  });

  it('shows catalog error and retry, then an empty state without fixture fallback', async () => {
    const list = vi
      .spyOn(api.catalog, 'list')
      .mockRejectedValueOnce(new Error('Unavailable'))
      .mockResolvedValue({ items: [], page: 1, limit: 48, total: 0, totalPages: 0 });
    mount(<SamplerPage />);
    await screen.findByText(en['support.sampler.loadError']);
    const retry = screen.getByRole('button', { name: shellEn['shell.action.retry'] });
    fireEvent.click(retry);
    await screen.findByText(en['support.sampler.empty']);
    expect(list).toHaveBeenCalledTimes(2);
  });
});
