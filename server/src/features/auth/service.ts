import bcrypt from 'bcrypt';
import type { z } from 'zod';
import type { Address, ProfileUpdate, User } from '../../../../contracts/index.js';
import {
  MAX_ADDRESSES,
  normalizeEmail,
  type addressSchema,
  type registerSchema,
} from '../../../../client/src/features/auth/rules.js';
import { AppError, invalid, notFound } from '../../shared/errors.js';
import {
  AddressModel,
  CorporatePartnerModel,
  UserModel,
  type AddressRecord,
  type UserRecord,
} from './models.js';

export const BCRYPT_COST = 12;
const MAX_PASSWORD_BYTES = 72;

type RegisterData = z.output<typeof registerSchema>;
type AddressData = z.output<typeof addressSchema>;

/** Build the unique and lookup indexes before serving requests (the email race depends on it). */
export async function ensureAuthIndexes() {
  await Promise.all([UserModel.init(), CorporatePartnerModel.init(), AddressModel.init()]);
}

/** Public User DTO: no passwordHash, active flag, timestamps or _id. */
export function toUserDto(
  user: Pick<UserRecord, '_id' | 'name' | 'email' | 'role'>,
  companyName?: string,
): User {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    ...(user.role === 'b2b' && companyName ? { companyName } : {}),
  };
}

function toAddressDto(address: Omit<AddressRecord, 'userId' | 'createdAt' | 'updatedAt'>): Address {
  return {
    id: address._id.toString(),
    recipient: address.recipient,
    line1: address.line1,
    ...(address.line2 ? { line2: address.line2 } : {}),
    city: address.city,
    region: address.region,
    postalCode: address.postalCode,
    country: address.country,
  };
}

const isDuplicateKey = (error: unknown) =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;

const emailExists = () =>
  new AppError(409, 'EMAIL_EXISTS', 'An account with this email already exists', {
    email: 'Already registered',
  });

async function companyOf(user: UserRecord): Promise<string | undefined> {
  if (user.role !== 'b2b') return undefined;
  const partner = await CorporatePartnerModel.findOne({ userId: user._id }).lean();
  return partner?.companyName;
}

/**
 * Create a retail or business account. The unique email index decides concurrent registrations:
 * exactly one insert wins and the other gets EMAIL_EXISTS. A business account also gets its
 * CorporatePartner; if that insert fails the user is deleted again (compensation, no replica-set
 * transaction), so no business account is left without a company.
 */
export async function registerUser(input: RegisterData): Promise<User> {
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);
  let user;
  try {
    user = await UserModel.create({
      name: input.name,
      email: normalizeEmail(input.email),
      passwordHash,
      role: input.role,
    });
  } catch (error) {
    if (isDuplicateKey(error)) throw emailExists();
    throw error;
  }
  if (input.role !== 'b2b') return toUserDto(user);
  try {
    const companyName = input.companyName ?? '';
    await CorporatePartnerModel.create({ userId: user._id, companyName });
    return toUserDto(user, companyName);
  } catch (error) {
    await UserModel.deleteOne({ _id: user._id });
    throw error;
  }
}

// Compared against when the email is unknown, so both failures cost one bcrypt verification.
let dummyHash: Promise<string> | undefined;
const getDummyHash = () => (dummyHash ??= bcrypt.hash('solcacao-no-such-account', BCRYPT_COST));

/**
 * Verify credentials. Unknown email, inactive account, wrong password and an over-long password
 * (bcrypt would silently truncate it) all fail the same way: 401 "Invalid email or password".
 */
export async function authenticate(email: string, password: string): Promise<User> {
  const user = await UserModel.findOne({
    email: normalizeEmail(email),
    active: true,
  }).lean<UserRecord>();
  const usable = new TextEncoder().encode(password).length <= MAX_PASSWORD_BYTES;
  const matches = await bcrypt.compare(
    usable ? password : '',
    user && usable ? user.passwordHash : await getDummyHash(),
  );
  if (!user || !usable || !matches)
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid email or password');
  return toUserDto(user, await companyOf(user));
}

/** Current active user for a verified token subject, or null. */
export async function findActiveUser(id: string): Promise<User | null> {
  const user = await UserModel.findOne({ _id: id, active: true }).lean<UserRecord>();
  return user ? toUserDto(user, await companyOf(user)) : null;
}

/** Name for everyone; company for business accounts only. Role and email never change here. */
export async function updateProfile(user: User, input: ProfileUpdate): Promise<User> {
  if (input.companyName !== undefined && user.role !== 'b2b')
    throw invalid({ companyName: 'Only business accounts have a company name' });
  const updated = await UserModel.findOneAndUpdate(
    { _id: user.id, active: true },
    { $set: { name: input.name } },
    { returnDocument: 'after' },
  ).lean<UserRecord>();
  if (!updated) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  if (input.companyName !== undefined)
    await CorporatePartnerModel.updateOne(
      { userId: updated._id },
      { $set: { companyName: input.companyName } },
      { upsert: true },
    );
  return toUserDto(updated, await companyOf(updated));
}

export async function listAddresses(userId: string): Promise<Address[]> {
  const addresses = await AddressModel.find({ userId })
    .sort({ createdAt: 1, _id: 1 })
    .lean<AddressRecord[]>();
  return addresses.map(toAddressDto);
}

/**
 * Upsert one of the user's own addresses. With an id, only a document matching both the id and
 * the user is updated; any other id (including another user's) is 404. Without an id a new
 * address is created, up to MAX_ADDRESSES per user.
 */
export async function saveAddress(userId: string, input: AddressData): Promise<Address> {
  const { id, line2, ...fields } = input;
  if (id) {
    const updated = await AddressModel.findOneAndUpdate(
      { _id: id, userId },
      line2 ? { $set: { ...fields, line2 } } : { $set: fields, $unset: { line2: 1 } },
      { returnDocument: 'after', runValidators: true },
    ).lean<AddressRecord>();
    if (!updated) throw notFound('Address not found');
    return toAddressDto(updated);
  }
  if ((await AddressModel.countDocuments({ userId })) >= MAX_ADDRESSES)
    throw invalid({ addresses: `Maximum ${MAX_ADDRESSES} addresses` });
  const created = await AddressModel.create({ userId, ...fields, ...(line2 ? { line2 } : {}) });
  return toAddressDto(created);
}
