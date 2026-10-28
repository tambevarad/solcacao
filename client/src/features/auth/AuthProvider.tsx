import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type {
  AuthApi,
  AuthSession,
  LoginInput,
  RegisterInput,
  User,
} from '../../../../contracts/index.js';
import { api, sessionToken } from '../../api/index.js';
import { notImplemented } from '../../api/notImplemented.js';

/** The public useAuth() interface (docs/contracts.md). Do not add members without a proposal. */
export interface AuthState {
  user: User | null;
  ready: boolean;
  login(input: LoginInput): Promise<void>;
  register(input: RegisterInput): Promise<void>;
  logout(): void;
}

const AuthContext = createContext<AuthState>({
  user: null,
  ready: true,
  login: async () => notImplemented('auth.login (no AuthProvider)'),
  register: async () => notImplemented('auth.register (no AuthProvider)'),
  logout: () => notImplemented('auth.logout (no AuthProvider)'),
});

/** Auth-feature internals: the adapter in use and a way to publish a saved profile. */
interface AuthInternals {
  auth: AuthApi;
  replaceUser(user: User): void;
}
const InternalContext = createContext<AuthInternals>({
  auth: api.auth,
  replaceUser: () => notImplemented('auth.replaceUser (no AuthProvider)'),
});
export const useAuthInternals = () => useContext(InternalContext);
export const useAuth = (): AuthState => useContext(AuthContext);

// setTimeout overflows above ~24.8 days; a session is one hour, so this is only a guard.
const MAX_TIMER_MS = 2 ** 31 - 1;

/**
 * Holds the signed-in user in React state and the bearer token in the shared in-memory
 * sessionToken store (decision D09: never localStorage). A full reload therefore starts signed
 * out. Successful login/register sets the token first, then the user, so CartProvider (which
 * observes `user`) can call authenticated endpoints immediately. A generation counter drops
 * responses that arrive after logout or a newer sign-in. The session ends itself at expiresAt.
 */
export function AuthProvider({
  children,
  auth = api.auth,
}: {
  children: ReactNode;
  auth?: AuthApi;
}) {
  const [user, setUser] = useState<User | null>(null);
  // Only a token already in memory (e.g. after a hot reload) needs checking before `ready`.
  const [ready, setReady] = useState(() => sessionToken.get() === null);
  const generation = useRef(0);
  const expiryTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const logout = useCallback(() => {
    generation.current += 1;
    clearTimeout(expiryTimer.current);
    sessionToken.set(null);
    setUser(null);
    setReady(true);
  }, []);

  const start = useCallback(
    (session: AuthSession) => {
      clearTimeout(expiryTimer.current);
      sessionToken.set(session.token);
      setUser(session.user);
      const remaining = new Date(session.expiresAt).getTime() - Date.now();
      if (Number.isFinite(remaining))
        expiryTimer.current = setTimeout(logout, Math.min(Math.max(remaining, 0), MAX_TIMER_MS));
    },
    [logout],
  );

  const run = useCallback(
    async (request: () => Promise<AuthSession>) => {
      const attempt = ++generation.current;
      const session = await request();
      if (attempt === generation.current) start(session);
    },
    [start],
  );

  useEffect(() => {
    if (sessionToken.get() === null) return;
    const attempt = ++generation.current;
    auth.me().then(
      (restored) => {
        if (attempt !== generation.current) return;
        setUser(restored);
        setReady(true);
      },
      () => {
        if (attempt === generation.current) logout();
      },
    );
  }, [auth, logout]);

  useEffect(() => () => clearTimeout(expiryTimer.current), []);

  const state = useMemo<AuthState>(
    () => ({
      user,
      ready,
      login: (input) => run(() => auth.login(input)),
      register: (input) => run(() => auth.register(input)),
      logout,
    }),
    [user, ready, auth, run, logout],
  );
  const internals = useMemo<AuthInternals>(
    () => ({
      auth,
      replaceUser: (next) => setUser((previous) => (previous?.id === next.id ? next : previous)),
    }),
    [auth],
  );

  return (
    <AuthContext.Provider value={state}>
      <InternalContext.Provider value={internals}>{children}</InternalContext.Provider>
    </AuthContext.Provider>
  );
}
