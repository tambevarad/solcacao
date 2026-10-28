import { describe, expect, it } from 'vitest';
import {
  addressSchema,
  loginSchema,
  profileSchema,
  registerSchema,
  safeReturnTo,
} from '../../client/src/features/auth/rules.js';

const retail = {
  name: 'Test Shopper',
  email: 'shopper@member1.test',
  password: 'correct horse battery',
  role: 'retail',
};

describe('registration schema (shared by forms, mock and server)', () => {
  it('accepts retail and business accounts; business requires a company', () => {
    expect(registerSchema.safeParse(retail).success).toBe(true);
    expect(registerSchema.safeParse({ ...retail, role: 'b2b' }).success).toBe(false);
    expect(
      registerSchema.safeParse({ ...retail, role: 'b2b', companyName: 'Test Co' }).success,
    ).toBe(true);
  });

  it('refuses any role other than retail or b2b and any extra field', () => {
    expect(registerSchema.safeParse({ ...retail, role: 'admin' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...retail, active: false }).success).toBe(false);
  });

  it.each([
    ['11 characters', 'a'.repeat(11), false],
    ['12 characters', 'a'.repeat(12), true],
    ['72 ASCII bytes', 'a'.repeat(72), true],
    ['73 ASCII bytes', 'a'.repeat(73), false],
    ['36 two-byte letters (72 bytes)', 'ñ'.repeat(36), true],
    ['37 two-byte letters (74 bytes)', 'ñ'.repeat(37), false],
    ['19 emoji (76 bytes)', '🍫'.repeat(19), false],
  ])('password of %s -> valid: %s', (_label, password, valid) => {
    expect(registerSchema.safeParse({ ...retail, password }).success).toBe(valid);
  });

  it('requires name and a valid email', () => {
    expect(registerSchema.safeParse({ ...retail, name: '  ' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...retail, email: 'not-an-email' }).success).toBe(false);
  });
});

describe('profile, login and address schemas', () => {
  it('profile updates accept only name and companyName', () => {
    expect(profileSchema.safeParse({ name: 'New Name' }).success).toBe(true);
    for (const field of ['role', 'email', 'passwordHash', 'userId'])
      expect(profileSchema.safeParse({ name: 'New Name', [field]: 'x' }).success).toBe(false);
  });

  it('login needs an email and a non-empty password only', () => {
    expect(loginSchema.safeParse({ email: 'a@member1.test', password: 'x' }).success).toBe(true);
    expect(loginSchema.safeParse({ email: 'a@member1.test', password: '' }).success).toBe(false);
  });

  it('addresses reject a userId, bad country codes and invalid postal codes', () => {
    const address = {
      recipient: 'Test Person',
      line1: '1 Example Street',
      city: 'Testville',
      region: 'TX',
      postalCode: '75001',
      country: 'us',
    };
    const parsed = addressSchema.safeParse(address);
    expect(parsed.success && parsed.data.country).toBe('US');
    expect(addressSchema.safeParse({ ...address, userId: 'aa' }).success).toBe(false);
    expect(addressSchema.safeParse({ ...address, country: 'EU' }).success).toBe(false);
    expect(addressSchema.safeParse({ ...address, postalCode: '<script>' }).success).toBe(false);
    expect(addressSchema.safeParse({ ...address, id: 'not-an-object-id' }).success).toBe(false);
  });
});

describe('safeReturnTo', () => {
  it.each([
    ['/en/account', '/en/account'],
    ['/en/wholesale/request?step=2', '/en/wholesale/request?step=2'],
    ['/es/account', '/en/account'],
    ['/en', '/en'],
  ])('keeps internal path %s (as %s for an English page)', (value, expected) => {
    expect(safeReturnTo(value, 'en')).toBe(expected);
  });

  it.each([
    'https://evil.example/en/account',
    '//evil.example/en',
    '/en//evil.example',
    '/\\evil.example',
    '/en/\\evil.example',
    '/en/%2F%2Fevil.example',
    '/fr/account',
    '/english',
    'javascript:alert(1)',
    '/en/\u0000',
    '',
    null,
    undefined,
  ])('rejects %s', (value) => {
    expect(safeReturnTo(value, 'en')).toBeNull();
  });
});
