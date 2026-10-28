// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Address, HttpClient } from '../../contracts/index.js';
import { ApiError, createHttpClient } from '../../client/src/api/http.js';
import { sessionToken } from '../../client/src/api/session.js';
import { createHttpAuth } from '../../client/src/features/auth/http.js';
import {
  MOCK_DEMO_ACCOUNTS,
  createMockAuth,
  resetMockAuth,
} from '../../client/src/features/auth/mock.js';

const unusedHttp: HttpClient = {
  request: async () => {
    throw new Error('mock adapter must not use HTTP');
  },
  requestRaw: async () => {
    throw new Error('mock adapter must not use HTTP');
  },
};

const PASSWORD = 'synthetic-pass-123';
const retail = {
  name: 'Retail Tester',
  email: '  Retail@Member1.TEST ',
  password: PASSWORD,
  role: 'retail' as const,
};
const business = {
  name: 'Business Tester',
  email: 'buyer@member1.test',
  password: PASSWORD,
  role: 'b2b' as const,
  companyName: 'Test Co',
};
const address: Address = {
  recipient: 'Test Person',
  line1: '1 Example Street',
  city: 'Testville',
  region: 'TX',
  postalCode: '75001',
  country: 'US',
};

const auth = () => createMockAuth(unusedHttp, { delayMs: 0 });

beforeEach(() => {
  resetMockAuth();
  sessionToken.set(null);
  localStorage.clear();
});

describe('auth mock', () => {
  it('registers a retail account with a normalized email and a fake mock:<id> token', async () => {
    const session = await auth().register(retail);
    expect(session.user).toEqual({
      id: expect.stringMatching(/^[a-f0-9]{24}$/),
      name: 'Retail Tester',
      email: 'retail@member1.test',
      role: 'retail',
    });
    expect(session.token).toBe(`mock:${session.user.id}`);
    expect(Date.parse(session.expiresAt)).toBeGreaterThan(Date.now());
  });

  it('returns the business role and company name for a business registration', async () => {
    const { user } = await auth().register(business);
    expect(user).toMatchObject({ role: 'b2b', companyName: 'Test Co' });
  });

  it('ignores a company name sent with a retail registration', async () => {
    const { user } = await auth().register({ ...retail, companyName: 'Ignored' });
    expect(user.companyName).toBeUndefined();
  });

  it('rejects a duplicate email (any case/spacing) with 409 EMAIL_EXISTS', async () => {
    await auth().register(retail);
    await expect(
      auth().register({ ...retail, email: 'retail@member1.test' }),
    ).rejects.toMatchObject({
      status: 409,
      code: 'EMAIL_EXISTS',
      fieldErrors: { email: expect.any(String) },
    });
  });

  it('validates like the server: business without company, short password', async () => {
    await expect(auth().register({ ...business, companyName: undefined })).rejects.toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      fieldErrors: { companyName: expect.any(String) },
    });
    await expect(auth().register({ ...retail, password: 'short' })).rejects.toMatchObject({
      fieldErrors: { password: expect.any(String) },
    });
  });

  it('gives the same 401 for an unknown email and a wrong password', async () => {
    await auth().register(retail);
    const wrongPassword = auth().login({ email: retail.email, password: 'wrong-password-1' });
    const unknown = auth().login({ email: 'nobody@member1.test', password: PASSWORD });
    const [a, b] = await Promise.allSettled([wrongPassword, unknown]);
    expect(a.status === 'rejected' && a.reason).toMatchObject({
      status: 401,
      code: 'UNAUTHORIZED',
    });
    expect(b.status === 'rejected' && b.reason).toEqual(a.status === 'rejected' && a.reason);
  });

  it('signs in the seeded demo accounts with their synthetic passwords', async () => {
    for (const demo of MOCK_DEMO_ACCOUNTS) {
      const { user } = await auth().login({ email: demo.email, password: demo.password });
      expect(user.role).toBe(demo.role);
    }
  });

  it('shares one registry and reads the session token at call time (B2B mock uses me())', async () => {
    const session = await auth().register(business);
    await expect(auth().me()).rejects.toMatchObject({ status: 401, code: 'UNAUTHORIZED' });
    sessionToken.set(session.token);
    await expect(createMockAuth(unusedHttp).me()).resolves.toEqual(session.user);
    sessionToken.set('mock:ffffffffffffffffffffffff');
    await expect(auth().me()).rejects.toBeInstanceOf(ApiError);
  });

  it('updates only profile fields; retail accounts cannot gain a company', async () => {
    const r = await auth().register(retail);
    sessionToken.set(r.token);
    await expect(auth().updateProfile({ name: 'Renamed' })).resolves.toMatchObject({
      name: 'Renamed',
      role: 'retail',
    });
    await expect(auth().updateProfile({ name: 'X', companyName: 'Co' })).rejects.toMatchObject({
      status: 400,
    });
    // Extra properties on a variable pass the type check, as they would from a crafted request.
    const sneaky = { name: 'X', role: 'b2b' };
    await expect(auth().updateProfile(sneaky)).rejects.toMatchObject({
      fieldErrors: { role: 'Unexpected field' },
    });
    expect((await auth().me()).role).toBe('retail');
  });

  it('keeps addresses per user: another user cannot read or overwrite them', async () => {
    const a = await auth().register(retail);
    const b = await auth().register(business);
    sessionToken.set(a.token);
    const saved = await auth().saveAddress(address);
    expect(saved).toEqual({ ...address, id: expect.stringMatching(/^[a-f0-9]{24}$/) });
    const edited = await auth().saveAddress({ ...saved, city: 'Newtown' });
    expect(edited).toEqual({ ...saved, city: 'Newtown' });

    sessionToken.set(b.token);
    expect(await auth().addresses()).toEqual([]);
    await expect(auth().saveAddress({ ...saved, city: 'Hijacked' })).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    });
    sessionToken.set(a.token);
    expect(await auth().addresses()).toEqual([edited]);
  });

  it('keeps credentials and tokens out of browser storage', async () => {
    const session = await auth().register(retail);
    sessionToken.set(session.token);
    await auth().saveAddress(address);
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });
});

describe('auth HTTP adapter', () => {
  const fetchMock = vi.fn<typeof fetch>();
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  const lastCall = () => {
    const [url, init] = fetchMock.mock.calls.at(-1) ?? [];
    const headers = new Headers(init?.headers);
    return {
      url: String(url),
      method: init?.method,
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
      authorization: headers.get('Authorization'),
    };
  };

  it('calls the exact endpoints from docs/api.json and unwraps { data }', async () => {
    const user = { id: 'a'.repeat(24), name: 'T', email: 't@member1.test', role: 'retail' };
    const http = createHttpAuth(createHttpClient(() => 'header.payload.signature'));
    const cases: [() => Promise<unknown>, string, string, unknown][] = [
      [() => http.register(retail), '/api/auth/register', 'POST', retail],
      [
        () => http.login({ email: 'a@member1.test', password: PASSWORD }),
        '/api/auth/login',
        'POST',
        { email: 'a@member1.test', password: PASSWORD },
      ],
      [() => http.me(), '/api/auth/me', 'GET', undefined],
      [() => http.updateProfile({ name: 'N' }), '/api/users/me', 'PATCH', { name: 'N' }],
      [() => http.addresses(), '/api/users/me/addresses', 'GET', undefined],
      [() => http.saveAddress(address), '/api/users/me/addresses', 'POST', address],
    ];
    for (const [call, url, method, body] of cases) {
      fetchMock.mockResolvedValueOnce(json(200, { data: user }));
      await expect(call()).resolves.toEqual(user);
      expect(lastCall()).toEqual({
        url,
        method,
        body,
        authorization: 'Bearer header.payload.signature',
      });
    }
  });

  it('surfaces the error envelope as ApiError (no mock fallback)', async () => {
    const http = createHttpAuth(createHttpClient(() => null));
    fetchMock.mockResolvedValueOnce(
      json(409, {
        error: { code: 'EMAIL_EXISTS', message: 'exists', fieldErrors: { email: 'x' } },
      }),
    );
    await expect(http.register(retail)).rejects.toMatchObject({
      status: 409,
      code: 'EMAIL_EXISTS',
    });
    expect(lastCall().authorization).toBeNull();
  });
});
