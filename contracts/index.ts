/** Contract v1. Read docs/contracts.md before modifying. JSON uses these shapes. */
export type Locale = 'en' | 'es';
export type Role = 'retail' | 'b2b';
export type LocalizedText = Record<Locale, string>;
export type Id = string; // Mongo ObjectId serialized as a 24-character hexadecimal string.
export interface User {
  id: Id;
  name: string;
  email: string;
  role: Role;
  companyName?: string;
}
export interface Address {
  id?: Id;
  recipient: string;
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
}
export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: Role;
  companyName?: string;
}
export interface LoginInput {
  email: string;
  password: string;
}
export interface AuthSession {
  user: User;
  token: string;
  expiresAt: string;
}
export interface ProfileUpdate {
  name: string;
  companyName?: string;
}
export interface Product {
  id: Id;
  slug: string;
  name: LocalizedText;
  description: LocalizedText;
  category: 'bar' | 'truffle' | 'seasonal';
  origin: string;
  cacaoPct: number;
  priceCents: number;
  currency: 'USD';
  images: { url: string; alt: LocalizedText }[];
  ingredients: LocalizedText;
  allergens: LocalizedText;
  stock: number;
  active: boolean;
}
export interface ProductQuery {
  search?: string;
  origin?: string;
  cacaoMin?: number;
  cacaoMax?: number;
  priceMinCents?: number;
  priceMaxCents?: number;
  category?: Product['category'];
  page?: number;
  limit?: number;
  sort?: 'name' | 'priceAsc' | 'priceDesc';
  locale?: Locale;
}
export interface ProductPage {
  items: Product[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
export interface CartLine {
  productId: Id;
  quantity: number;
}
export interface Cart {
  items: CartLine[];
  revision: number;
}
export interface PersistCartInput {
  items: CartLine[];
  expectedRevision: number;
}
export interface MergeCartInput {
  items: CartLine[];
  mergeId: string;
}
export interface CheckoutInput {
  items: CartLine[];
  email: string;
  address: Address;
  requestId: string;
}
export interface OrderReceipt {
  id: Id;
  status: 'simulated';
  totalCents: number;
  currency: 'USD';
  createdAt: string;
}
export type CacaoProfile = 'dark70' | 'dark85' | 'milk45';
export type Packaging = 'sleeve' | 'giftBox' | 'bulk';
export interface QuoteInput {
  cacaoProfile: CacaoProfile;
  quantity: number;
  packaging: Packaging;
  companyName: string;
  contactEmail: string;
  notes?: string;
  locale: Locale;
  requestId: string;
}
export interface QuoteReceipt {
  id: Id;
  status: 'submitted';
  createdAt: string;
  notificationStatus: 'pending' | 'sent' | 'failed';
}
export interface InquiryInput {
  name: string;
  email: string;
  category: 'support' | 'wholesale' | 'feedback' | 'sampler';
  message: string;
  locale: Locale;
  requestId: string;
  samplerItems?: CartLine[];
}
export interface InquiryReceipt {
  id: Id;
  status: 'received';
  notificationStatus: 'pending' | 'sent' | 'failed';
}
export type Dictionary = Record<string, string>;
export interface AuthApi {
  register(input: RegisterInput): Promise<AuthSession>;
  login(input: LoginInput): Promise<AuthSession>;
  me(): Promise<User>;
  updateProfile(input: ProfileUpdate): Promise<User>;
  addresses(): Promise<Address[]>;
  saveAddress(input: Address): Promise<Address>;
}
export interface CatalogApi {
  list(query: ProductQuery): Promise<ProductPage>;
  get(slug: string): Promise<Product>;
  cart(): Promise<Cart>;
  persist(input: PersistCartInput): Promise<Cart>;
  merge(input: MergeCartInput): Promise<Cart>;
  checkout(input: CheckoutInput): Promise<OrderReceipt>;
}
export interface B2bApi {
  submit(input: QuoteInput, file: File): Promise<QuoteReceipt>;
}
export interface SupportApi {
  submit(input: InquiryInput): Promise<InquiryReceipt>;
}
export interface ShellApi {
  dictionary(locale: Locale): Promise<Dictionary>;
}
export interface Api {
  auth: AuthApi;
  catalog: CatalogApi;
  b2b: B2bApi;
  support: SupportApi;
  shell: ShellApi;
}
export interface ErrorBody {
  error: { code: string; message: string; fieldErrors?: Record<string, string> };
}
export interface HttpClient {
  request<T>(
    path: string,
    options?: { method?: 'GET' | 'POST' | 'PATCH'; body?: unknown; multipart?: FormData },
  ): Promise<T>;
}
