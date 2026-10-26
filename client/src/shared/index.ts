/**
 * Stable shared UI surface (owner: Student 2). Import from here, not from individual files:
 *   import { Button, Field, Drawer } from '../../shared/index.js';
 * Usage examples: client/src/shared/README.md. Request changes through Student 2.
 */
export { Button, buttonStyles, type ButtonProps, type ButtonVariant } from './Button.js';
export {
  Field,
  TextArea,
  Select,
  type FieldProps,
  type TextAreaProps,
  type SelectProps,
} from './Field.js';
export { Dialog, type DialogProps } from './Dialog.js';
export { Drawer, type DrawerProps } from './Drawer.js';
export type { ModalProps } from './Modal.js';
export { LoadingState, EmptyState, ErrorState } from './StatusStates.js';
export { Placeholder } from './Placeholder.js';
export { Photo } from './Photo.js';
export { photos, type PhotoAsset, type PhotoName } from './photos.js';
