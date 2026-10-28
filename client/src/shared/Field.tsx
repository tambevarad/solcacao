import { useId, type ComponentPropsWithRef, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

/** Shared label/hint/error wiring for Field, TextArea and Select. */
interface FieldChromeProps {
  /** Visible, translated label. Required: placeholders are not labels. */
  label: ReactNode;
  /** Optional helper text announced with the control. */
  hint?: ReactNode;
  /** Translated validation message. Sets aria-invalid and is announced with the control. */
  error?: string;
}

const control =
  'block w-full min-h-11 rounded border bg-white px-3 py-2 text-base text-cacao ' +
  'placeholder:text-cacao/60 disabled:cursor-not-allowed disabled:bg-line/40';

function useFieldIds(id: string | undefined, hint: ReactNode, error: string | undefined) {
  const generated = useId();
  const controlId = id ?? generated;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  return { controlId, hintId, errorId, describedBy };
}

function FieldChrome({
  controlId,
  label,
  hint,
  hintId,
  error,
  errorId,
  required,
  className,
  children,
}: FieldChromeProps & {
  controlId: string;
  hintId?: string;
  errorId?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={controlId} className="mb-1 block font-medium">
        {label}
        {required && (
          <span aria-hidden="true" className="text-error">
            {' '}
            *
          </span>
        )}
      </label>
      {hint && (
        <p id={hintId} className="mb-1 text-sm text-cacao/80">
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p id={errorId} className="mt-1 text-sm text-error">
          {error}
        </p>
      )}
    </div>
  );
}

const border = (error?: string) => (error ? 'border-error' : 'border-line focus:border-copper');

export interface FieldProps
  extends Omit<ComponentPropsWithRef<'input'>, 'children'>, FieldChromeProps {
  /** Classes for the wrapper; use `inputClassName` for the input itself. */
  className?: string;
  inputClassName?: string;
}

/** Labeled text-like input (text, email, number, search, password, file...). */
export function Field({ label, hint, error, id, className, inputClassName, ...props }: FieldProps) {
  const ids = useFieldIds(id, hint, error);
  return (
    <FieldChrome
      {...ids}
      label={label}
      hint={hint}
      error={error}
      required={props.required}
      className={className}
    >
      <input
        id={ids.controlId}
        aria-invalid={error ? true : undefined}
        aria-describedby={ids.describedBy}
        className={`${control} ${border(error)}${inputClassName ? ` ${inputClassName}` : ''}`}
        {...props}
      />
    </FieldChrome>
  );
}

export interface TextAreaProps
  extends Omit<ComponentPropsWithRef<'textarea'>, 'children'>, FieldChromeProps {
  className?: string;
  inputClassName?: string;
}

/** Labeled multi-line input, e.g. contact messages and quote notes. */
export function TextArea({
  label,
  hint,
  error,
  id,
  className,
  inputClassName,
  rows = 5,
  ...props
}: TextAreaProps) {
  const ids = useFieldIds(id, hint, error);
  return (
    <FieldChrome
      {...ids}
      label={label}
      hint={hint}
      error={error}
      required={props.required}
      className={className}
    >
      <textarea
        id={ids.controlId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={ids.describedBy}
        className={`${control} ${border(error)}${inputClassName ? ` ${inputClassName}` : ''}`}
        {...props}
      />
    </FieldChrome>
  );
}

export interface SelectProps extends ComponentPropsWithRef<'select'>, FieldChromeProps {
  className?: string;
  inputClassName?: string;
}

/** Labeled native select. Pass <option> children; native selects keep mobile/keyboard behavior. */
export function Select({
  label,
  hint,
  error,
  id,
  className,
  inputClassName,
  children,
  ...props
}: SelectProps) {
  const ids = useFieldIds(id, hint, error);
  return (
    <FieldChrome
      {...ids}
      label={label}
      hint={hint}
      error={error}
      required={props.required}
      className={className}
    >
      <div className="relative">
        <select
          id={ids.controlId}
          aria-invalid={error ? true : undefined}
          aria-describedby={ids.describedBy}
          className={`${control} ${border(error)} appearance-none pr-10${inputClassName ? ` ${inputClassName}` : ''}`}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
        />
      </div>
    </FieldChrome>
  );
}
