// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { renderApp } from './harness.js';

beforeEach(() => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// With the template auth (no Student 1 implementation yet) the wizard route must stay closed.
it('keeps the wizard closed until real authentication exists', async () => {
  renderApp('/en/wholesale/request');
  expect(await screen.findByText(/role guard implementation pending/)).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Request a custom quote' })).toBeNull();
});
