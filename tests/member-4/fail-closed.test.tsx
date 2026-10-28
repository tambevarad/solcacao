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

// A signed-out visitor gets the sign-in prompt; the wizard never renders without a business account.
it('keeps the wizard closed for signed-out visitors', async () => {
  renderApp('/en/wholesale/request');
  expect(await screen.findByRole('heading', { name: 'Sign in to continue' })).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Request a custom quote' })).toBeNull();
});
