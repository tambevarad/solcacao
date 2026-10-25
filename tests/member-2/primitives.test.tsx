// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Button, Dialog, Field, Select } from '../../client/src/shared/index.js';

afterEach(cleanup);

describe('form primitives', () => {
  it('associates label, hint and error with the input', () => {
    render(
      <Field label="Email" type="email" required hint="We reply here" error="Enter an email" />,
    );
    const input = screen.getByLabelText(/Email/);
    expect(input).toBeRequired();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('We reply here Enter an email');
  });

  it('omits invalid state when there is no error', () => {
    render(
      <Select label="Category" defaultValue="bar">
        <option value="bar">Bars</option>
      </Select>,
    );
    const select = screen.getByLabelText('Category');
    expect(select).not.toHaveAttribute('aria-invalid');
    expect(select).not.toHaveAttribute('aria-describedby');
  });

  it('defaults to type=button and blocks duplicate submits while pending', () => {
    const onClick = vi.fn();
    render(
      <Button pending onClick={onClick}>
        Submit
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Submit' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});

function DialogHarness({ onClose }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  const [nested, setNested] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open dialog
      </button>
      <Dialog
        open={open}
        title="Sign in"
        closeLabel="Close dialog"
        onClose={() => {
          onClose?.();
          setOpen(false);
        }}
      >
        <button type="button" onClick={() => setNested(true)}>
          Open nested
        </button>
        <Dialog
          open={nested}
          title="Nested"
          closeLabel="Close nested"
          onClose={() => setNested(false)}
        >
          <p>Nested body</p>
        </Dialog>
      </Dialog>
    </>
  );
}

describe('Dialog', () => {
  it('moves focus inside, closes on overlay click and restores focus', () => {
    const onClose = vi.fn();
    render(<DialogHarness onClose={onClose} />);
    const opener = screen.getByRole('button', { name: 'Open dialog' });
    opener.focus();
    fireEvent.click(opener);
    expect(screen.getByRole('dialog', { name: 'Sign in' })).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('button', { name: 'Close dialog' })).toHaveFocus();

    const overlay = document.querySelector('[aria-hidden="true"].absolute');
    expect(overlay).not.toBeNull();
    if (overlay) fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(opener).toHaveFocus();
  });

  it('lets only the top-most dialog react to Escape', () => {
    render(<DialogHarness />);
    fireEvent.click(screen.getByRole('button', { name: 'Open dialog' }));
    const openNested = screen.getByRole('button', { name: 'Open nested' });
    openNested.focus();
    fireEvent.click(openNested);
    expect(screen.getByRole('dialog', { name: 'Nested' })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Nested' })).toBeNull();
    expect(screen.getByRole('dialog', { name: 'Sign in' })).toBeInTheDocument();
    expect(openNested).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
