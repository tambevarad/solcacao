import { createPortal } from 'react-dom';
import { ModalSurface, type ModalProps } from './Modal.js';

export interface DialogProps extends ModalProps {
  open: boolean;
}

/** Centered modal dialog (e.g. auth modal). Focus is trapped and restored; Escape closes. */
export function Dialog({ open, ...props }: DialogProps) {
  if (!open) return null;
  return createPortal(<ModalSurface variant="dialog" {...props} />, document.body);
}
