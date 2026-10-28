import { useState } from 'react';
import type { Role } from '../../../../../contracts/index.js';
import { Button, Dialog } from '../../../shared/index.js';
import { useLocale } from '../../shell/public.js';
import { LoginForm, RegisterForm } from './AuthForms.js';

export type AuthMode = 'login' | 'register';

/**
 * Modal wrapper around the same LoginForm/RegisterForm the routes use. The shared Dialog traps
 * focus, closes on Escape and returns focus to the button that opened it. The parent owns `open`.
 */
export function AuthDialog({
  open,
  onClose,
  initialMode = 'login',
  initialRole,
}: {
  open: boolean;
  onClose(): void;
  initialMode?: AuthMode;
  initialRole?: Role;
}) {
  const { t } = useLocale();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const close = () => {
    onClose();
    setMode(initialMode);
  };
  return (
    <Dialog
      open={open}
      onClose={close}
      title={t(mode === 'login' ? 'auth.dialog.signInTitle' : 'auth.dialog.registerTitle')}
    >
      {mode === 'login' ? (
        <LoginForm onSuccess={close} />
      ) : (
        <RegisterForm onSuccess={close} initialRole={initialRole} />
      )}
      <Button
        variant="ghost"
        className="mt-4"
        onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
      >
        {t(mode === 'login' ? 'auth.dialog.toRegister' : 'auth.dialog.toLogin')}
      </Button>
    </Dialog>
  );
}
