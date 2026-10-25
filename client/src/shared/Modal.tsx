import { useEffect, useId, useRef, type ReactNode, type RefObject } from 'react';
import { X } from 'lucide-react';
import { useLocale } from '../features/shell/public.js';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/** Open modals, newest last. Only the top one reacts to Escape/Tab. */
const stack: object[] = [];
let scrollLocks = 0;
let savedOverflow = '';
let savedPaddingRight = '';

function lockScroll() {
  if (scrollLocks++ > 0) return;
  const { body, documentElement } = document;
  savedOverflow = body.style.overflow;
  savedPaddingRight = body.style.paddingRight;
  // Keep the page from shifting when the scrollbar disappears.
  const scrollbar = window.innerWidth - documentElement.clientWidth;
  if (documentElement.clientWidth > 0 && scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
  body.style.overflow = 'hidden';
}

function unlockScroll() {
  if (--scrollLocks > 0) return;
  document.body.style.overflow = savedOverflow;
  document.body.style.paddingRight = savedPaddingRight;
}

function focusableWithin(root: HTMLElement) {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (element) => !element.hidden && !element.closest('[inert]'),
  );
}

/**
 * Runs while a modal surface is mounted: makes the rest of the page inert, locks body scroll,
 * moves focus inside, traps Tab, closes on Escape and restores focus to the opener on unmount.
 */
function useModal(
  containerRef: RefObject<HTMLElement | null>,
  panelRef: RefObject<HTMLElement | null>,
  onClose: () => void,
  initialFocusRef?: RefObject<HTMLElement | null>,
) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const container = containerRef.current;
    const panel = panelRef.current;
    if (!container || !panel) return;
    const token = {};
    stack.push(token);
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const inerted: Element[] = [];
    for (const element of Array.from(document.body.children)) {
      if (element === container || element.hasAttribute('inert')) continue;
      element.setAttribute('inert', '');
      inerted.push(element);
    }
    lockScroll();
    (initialFocusRef?.current ?? focusableWithin(panel)[0] ?? panel).focus();

    function onKeyDown(event: KeyboardEvent) {
      if (stack[stack.length - 1] !== token || !panel) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusableWithin(panel);
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (!first || !last) {
        event.preventDefault();
        panel.focus();
      } else if (event.shiftKey && (active === first || !panel.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !panel.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      stack.splice(stack.indexOf(token), 1);
      for (const element of inerted) element.removeAttribute('inert');
      unlockScroll();
      if (opener?.isConnected) opener.focus();
    };
  }, [containerRef, panelRef, initialFocusRef]);
}

export interface ModalProps {
  /** Called on Escape, overlay click and the close button. The parent sets `open` to false. */
  onClose(): void;
  /** Translated heading; also the accessible name of the dialog. */
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** Sticky area under the scrolling body, e.g. a subtotal and checkout button. */
  footer?: ReactNode;
  /** Element to focus on open. Defaults to the first focusable element (the close button). */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** Accessible label for the close button. Defaults to shell.action.close. */
  closeLabel?: string;
  /** Extra classes for the panel. */
  className?: string;
}

const panels = {
  dialog:
    'relative mx-auto mt-[10vh] flex max-h-[80vh] w-[calc(100%-2rem)] max-w-lg flex-col rounded bg-ivory shadow-xl',
  left: 'absolute inset-y-0 left-0 flex w-[min(24rem,calc(100%-3rem))] flex-col bg-ivory shadow-xl',
  right:
    'absolute inset-y-0 right-0 flex w-[min(24rem,calc(100%-3rem))] flex-col bg-ivory shadow-xl',
};

/** Internal surface shared by Dialog and Drawer. Mounted only while open. */
export function ModalSurface({
  variant,
  onClose,
  title,
  description,
  children,
  footer,
  initialFocusRef,
  closeLabel,
  className,
}: ModalProps & { variant: keyof typeof panels }) {
  const { t } = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useModal(containerRef, panelRef, onClose, initialFocusRef);
  return (
    <div ref={containerRef} className="fixed inset-0 z-50">
      <div aria-hidden="true" className="absolute inset-0 bg-cacao/50" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={`${panels[variant]}${className ? ` ${className}` : ''}`}
      >
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3">
          <h2 id={titleId} className="text-xl font-semibold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel ?? t('shell.action.close')}
            className="-mr-2 inline-flex size-11 shrink-0 items-center justify-center rounded hover:bg-line/60"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>
        {description && (
          <p id={descriptionId} className="px-5 pt-4 text-cacao/80">
            {description}
          </p>
        )}
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-line px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}
