import { createContext, useContext, type ReactNode } from 'react';
import type { User, LoginInput, RegisterInput, Role } from '../../../../contracts/index.js';
import { notImplemented } from '../../api/notImplemented.js';
export interface AuthState {
  user: User | null;
  ready: boolean;
  login(input: LoginInput): Promise<void>;
  register(input: RegisterInput): Promise<void>;
  logout(): void;
}
const Context = createContext<AuthState>({
  user: null,
  ready: true,
  login: async () => notImplemented('auth.login'),
  register: async () => notImplemented('auth.register'),
  logout: () => notImplemented('auth.logout'),
});
export function AuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
export function useAuth() {
  return useContext(Context);
}

// Prewired guard slots; Student 1 implements behavior in Phase 2.
// Fail closed while the template is incomplete.
export function RequireAuth(_props: { children: ReactNode }) {
  return <p>Template: authentication guard implementation pending.</p>;
}
export function RequireRole(_props: { role: Role; children: ReactNode }) {
  return <p>Template: role guard implementation pending.</p>;
}
