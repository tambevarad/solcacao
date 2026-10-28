import type {
  Address,
  AuthApi,
  AuthSession,
  HttpClient,
  User,
} from '../../../../contracts/index.js';
import { ApiError } from '../../api/http.js';
import { sessionToken } from '../../api/session.js';
import {
  MAX_ADDRESSES,
  addressSchema,
  fieldErrorsOf,
  loginSchema,
  normalizeEmail,
  profileSchema,
  registerSchema,
} from './rules.js';

/**
 * Phase 2 auth mock (docs/contracts.md, "Mock identity boundary"). One registry per browser tab,
 * shared by every createMockAuth() call, so the B2B and catalog mocks see the same accounts. All
 * state, synthetic passwords included, lives in this module's memory: nothing is written to
 * localStorage and a reload starts empty except for the two seeded demo accounts. Tokens are
 * `mock:<userId>`; the server's JWT middleware never accepts them.
 */
interface MockAccount {
  user: User;
  password: string;
  addresses: Address[];
}

const HOUR_MS = 60 * 60 * 1000;

/** Fictional demo accounts for the Phase 2 demo. Synthetic credentials, never real ones. */
export const MOCK_DEMO_ACCOUNTS = [
  {
    name: 'Demo Retail Shopper',
    email: 'retail@solcacao.test',
    password: 'retail-demo-pass',
    role: 'retail',
  },
  {
    name: 'Demo Business Buyer',
    email: 'business@solcacao.test',
    password: 'business-demo-pass',
    role: 'b2b',
    companyName: 'Fictional Demo Company',
  },
] as const;

let accounts = new Map<string, MockAccount>();
let sequence = 0;

/** Deterministic 24-hex ids: `aa…` for users, `ad…` for addresses. */
const nextId = (prefix: 'aa' | 'ad') => prefix + (++sequence).toString(16).padStart(22, '0');

function createAccount(input: {
  name: string;
  email: string;
  password: string;
  role: User['role'];
  companyName?: string;
}): MockAccount {
  const user: User = {
    id: nextId('aa'),
    name: input.name,
    email: normalizeEmail(input.email),
    role: input.role,
    ...(input.role === 'b2b' && input.companyName ? { companyName: input.companyName } : {}),
  };
  const account = { user, password: input.password, addresses: [] };
  accounts.set(user.id, account);
  return account;
}

/** Back to the seeded registry. For tests; the app never calls it. */
export function resetMockAuth() {
  accounts = new Map();
  sequence = 0;
  for (const demo of MOCK_DEMO_ACCOUNTS) createAccount(demo);
}
resetMockAuth();

const findByEmail = (email: string) =>
  [...accounts.values()].find((account) => account.user.email === normalizeEmail(email));

const unauthorized = () => new ApiError(401, 'UNAUTHORIZED', 'Authentication required');
const invalid = (fieldErrors: Record<string, string>) =>
  new ApiError(400, 'VALIDATION_ERROR', 'Invalid request', fieldErrors);

const copyUser = (user: User): User => ({ ...user });
const copyAddress = (address: Address): Address => ({ ...address });

export interface MockAuthOptions {
  /** Current session token, read at call time. Defaults to the shared sessionToken store. */
  token?: () => string | null;
  now?: () => Date;
  /** Simulated latency on register/login/save so pending states are visible. */
  delayMs?: number;
}

const wait = (ms: number) => (ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : null);

export function createMockAuth(_http: HttpClient, options: MockAuthOptions = {}): AuthApi {
  const { token = sessionToken.get, now = () => new Date(), delayMs = 300 } = options;

  function session(account: MockAccount): AuthSession {
    return {
      user: copyUser(account.user),
      token: `mock:${account.user.id}`,
      expiresAt: new Date(now().getTime() + HOUR_MS).toISOString(),
    };
  }

  function current(): MockAccount {
    const value = token();
    const id = value?.startsWith('mock:') ? value.slice(5) : '';
    const account = accounts.get(id);
    if (!account) throw unauthorized();
    return account;
  }

  return {
    async register(input) {
      await wait(delayMs);
      const parsed = registerSchema.safeParse(input);
      if (!parsed.success) throw invalid(fieldErrorsOf(parsed.error));
      if (findByEmail(parsed.data.email))
        throw new ApiError(409, 'EMAIL_EXISTS', 'An account with this email already exists', {
          email: 'Already registered',
        });
      return session(createAccount(parsed.data));
    },

    async login(input) {
      await wait(delayMs);
      const parsed = loginSchema.safeParse(input);
      if (!parsed.success) throw invalid(fieldErrorsOf(parsed.error));
      const account = findByEmail(parsed.data.email);
      // One message for unknown email and wrong password: no account enumeration.
      if (!account || account.password !== parsed.data.password)
        throw new ApiError(401, 'UNAUTHORIZED', 'Invalid email or password');
      return session(account);
    },

    async me() {
      return copyUser(current().user);
    },

    async updateProfile(input) {
      await wait(delayMs);
      const account = current();
      const parsed = profileSchema.safeParse(input);
      if (!parsed.success) throw invalid(fieldErrorsOf(parsed.error));
      if (parsed.data.companyName !== undefined && account.user.role !== 'b2b')
        throw invalid({ companyName: 'Only business accounts have a company name' });
      account.user = {
        ...account.user,
        name: parsed.data.name,
        ...(parsed.data.companyName !== undefined ? { companyName: parsed.data.companyName } : {}),
      };
      return copyUser(account.user);
    },

    async addresses() {
      return current().addresses.map(copyAddress);
    },

    async saveAddress(input) {
      await wait(delayMs);
      const account = current();
      const parsed = addressSchema.safeParse(input);
      if (!parsed.success) throw invalid(fieldErrorsOf(parsed.error));
      const { id, ...fields } = parsed.data;
      if (id) {
        const index = account.addresses.findIndex((address) => address.id === id.toLowerCase());
        // Another user's id and an unknown id look the same.
        if (index < 0) throw new ApiError(404, 'NOT_FOUND', 'Address not found');
        account.addresses[index] = { id: id.toLowerCase(), ...fields };
        return copyAddress(account.addresses[index]);
      }
      if (account.addresses.length >= MAX_ADDRESSES)
        throw invalid({ addresses: `Maximum ${MAX_ADDRESSES} addresses` });
      const saved = { id: nextId('ad'), ...fields };
      account.addresses.push(saved);
      return copyAddress(saved);
    },
  };
}
