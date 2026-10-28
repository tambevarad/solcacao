import type { ComponentPropsWithRef } from 'react';
import { LoaderCircle } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

const base =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded px-5 text-base font-medium ' +
  'transition-colors disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none';
const variants: Record<ButtonVariant, string> = {
  primary: 'bg-cacao text-ivory hover:bg-copper',
  secondary: 'border border-cacao bg-transparent text-cacao hover:bg-cacao hover:text-ivory',
  ghost: 'bg-transparent text-cacao underline-offset-4 hover:underline',
};

/** Class names for links that must look like buttons, e.g. <Link className={buttonStyles()} />. */
export function buttonStyles({
  variant = 'primary',
  fullWidth = false,
}: { variant?: ButtonVariant; fullWidth?: boolean } = {}) {
  return `${base} ${variants[variant]}${fullWidth ? ' w-full' : ''}`;
}

export interface ButtonProps extends ComponentPropsWithRef<'button'> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  /** Disables the button, marks it busy and shows a spinner. Use while a request is in flight. */
  pending?: boolean;
}

/** Rectangular 44px-high button. Defaults to type="button"; pass type="submit" in forms. */
export function Button({
  variant,
  fullWidth,
  pending = false,
  disabled,
  className,
  type = 'button',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={`${buttonStyles({ variant, fullWidth })}${className ? ` ${className}` : ''}`}
      {...props}
    >
      {pending && (
        <LoaderCircle
          aria-hidden="true"
          className="size-4 animate-spin motion-reduce:animate-none"
        />
      )}
      {children}
    </button>
  );
}
