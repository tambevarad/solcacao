import { createPortal } from 'react-dom';
import { ModalSurface, type ModalProps } from './Modal.js';

export interface DrawerProps extends ModalProps {
  open: boolean;
  /** Edge the panel slides from. The cart uses "right" (default); the mobile menu uses "left". */
  side?: 'left' | 'right';
}

/** Full-height side panel with the same focus, Escape and scroll-lock behavior as Dialog. */
export function Drawer({ open, side = 'right', ...props }: DrawerProps) {
  if (!open) return null;
  return createPortal(<ModalSurface variant={side} {...props} />, document.body);
}
