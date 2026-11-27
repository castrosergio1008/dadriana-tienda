import 'server-only';

import { PrismaClient } from '@prisma/client';

export type ProductCardData = {
  slug: string;
  name: string;
  brand?: string;
  image?: string;
  priceLabel?: string;
  availability: 'available' | 'out_of_stock';
};

export type HomeContent = {
  hero: {
    headline: string;
    body?: string;
    primaryCta: { label: string; href: string };
  };
  navigation: { label: string; href: string }[];
  commitments: string[];
  whatsappUrl: string | null;
  socials: { label: 'Instagram' | 'Facebook'; url: string }[];
  storesAvailable: boolean;
  selections: {
    masVendidos: ProductCardData[];
    masReferenciados: ProductCardData[];
  };
  legalLinks: { label: string; href: string }[];
};

type SocialLink = HomeContent['socials'][number];
type SocialLabel = SocialLink['label'];
type ConfigKey =
  | 'whatsapp_number'
  | 'instagram_url'
  | 'facebook_url'
  | 'stores'
  | 'selections';
type HomeConfig = Partial<Record<ConfigKey, unknown>>;
type UnknownRecord = { readonly [key: string]: unknown };

const APPROVED_HEADLINE = 'Belleza para tu piel y tu cabello';

const NAVIGATION = [
  { label: 'Piel', href: '/piel' },
  { label: 'Cabello', href: '/cabello' },
  { label: 'Marcas', href: '/marcas' },
  { label: 'Tiendas', href: '/tiendas' },
] as const;

// Approved functional copy, not marketing claims. The WhatsApp item is
// informational: the CTA itself still requires a valid configured number.
const COMMITMENTS = [
  'Cuidado para la piel y el cabello',
  'Atención por WhatsApp',
  'Tiendas físicas',
  'Compra acordada con el asesor',
] as const;

const CONFIG_KEYS: readonly ConfigKey[] = [
  'whatsapp_number',
  'instagram_url',
  'facebook_url',
  'stores',
  'selections',
];

const CONFIG_KEY_SET: ReadonlySet<string> = new Set(CONFIG_KEYS);

const WHATSAPP_NUMBER_PATTERN = /^57\d{10}$/;
const SAFE_SLUG_PATTERN = /^[A-Za-z0-9_-]{1,200}$/;
// Explicit allowlist: image sources are local paths only, with exactly one
// leading slash and URL-safe characters. Percent-encoded separators, query and
// fragment delimiters, traversal sequences (..), repeated slashes and
// backslashes are rejected. Remote images are not part of the contract and are
// blocked by the CSP (img-src 'self' data:).
const SAFE_LOCAL_IMAGE_PATH =
  /^\/(?!\/)(?!.*(?:\/\/|\.\.))[A-Za-z0-9._~!$&'()*+,;=:@\/-]+$/u;

const SOCIAL_HOSTS: Readonly<Record<SocialLabel, readonly string[]>> = {
  Instagram: ['instagram.com', 'www.instagram.com'],
  Facebook: ['facebook.com', 'www.facebook.com'],
};

type PrismaHolder = { homeContentPrisma?: PrismaClient };
const globalForPrisma = globalThis as typeof globalThis & PrismaHolder;

function getPrismaClient(): PrismaClient {
  globalForPrisma.homeContentPrisma ??= new PrismaClient();
  return globalForPrisma.homeContentPrisma;
}

function isConfigKey(key: string): key is ConfigKey {
  return CONFIG_KEY_SET.has(key);
}

function safeErrorType(error: unknown): string {
  if (error instanceof Error && /^[A-Za-z][A-Za-z0-9]{0,63}$/.test(error.name)) {
    return error.name;
  }
  return 'UnknownError';
}

// Structured, PII-free degradation log. Never log error messages (a database
// error may embed a connection string), config values or stack traces.
function logDegradation(
  event: 'database_not_configured' | 'config_read_failed',
  requestId: string,
  errorType?: string,
): void {
  console.warn(
    JSON.stringify({
      component: 'loadHomeContent',
      event,
      requestId,
      ...(errorType === undefined ? {} : { errorType }),
    }),
  );
}

function parseWhatsappUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const number = value.trim();
  if (!WHATSAPP_NUMBER_PATTERN.test(number)) return null;
  return `https://wa.me/${number}`;
}

function parseSocialUrl(value: unknown, label: SocialLabel): SocialLink | null {
  if (typeof value !== 'string') return null;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  if (url.protocol !== 'https:') return null;
  if (url.port !== '' || url.username !== '' || url.password !== '') return null;
  if (!SOCIAL_HOSTS[label].includes(url.hostname)) return null;

  return { label, url: url.toString() };
}

function buildSocials(config: HomeConfig): SocialLink[] {
  const socials: SocialLink[] = [];
  const instagram = parseSocialUrl(config.instagram_url, 'Instagram');
  const facebook = parseSocialUrl(config.facebook_url, 'Facebook');
  if (instagram !== null) socials.push(instagram);
  if (facebook !== null) socials.push(facebook);
  return socials;
}

function parseStoresAvailable(value: unknown): boolean {
  if (value === true) return true;
  if (Array.isArray(value)) {
    const stores: readonly unknown[] = value;
    return stores.length > 0;
  }
  if (typeof value === 'object' && value !== null) {
    const record = value as UnknownRecord;
    return record.active === true || record.enabled === true;
  }
  return false;
}

function readNonEmptyString(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (text.length === 0 || text.length > maxLength) return null;
  return text;
}

function parseImage(value: unknown): string | null {
  if (typeof value !== 'string' || value.length === 0 || value.length > 2000) {
    return null;
  }
  // No normalization is attempted: anything outside the local-path allowlist
  // is dropped, so encoded or protocol-relative values can never reach the UI.
  return SAFE_LOCAL_IMAGE_PATH.test(value) ? value : null;
}

function parseProduct(value: unknown): ProductCardData | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }
  const record = value as UnknownRecord;
  const slug = readNonEmptyString(record.slug, 200);
  const name = readNonEmptyString(record.name, 200);
  const availability = record.availability;

  if (
    slug === null ||
    !SAFE_SLUG_PATTERN.test(slug) ||
    name === null ||
    (availability !== 'available' && availability !== 'out_of_stock')
  ) {
    return null;
  }

  const product: ProductCardData = { slug, name, availability };
  const brand = readNonEmptyString(record.brand, 200);
  const image = parseImage(record.image);
  const priceLabel = readNonEmptyString(record.priceLabel, 100);
  if (brand !== null) product.brand = brand;
  if (image !== null) product.image = image;
  if (priceLabel !== null) product.priceLabel = priceLabel;
  return product;
}

function parseProducts(value: unknown): ProductCardData[] {
  if (!Array.isArray(value)) return [];
  const items: readonly unknown[] = value;
  const products: ProductCardData[] = [];
  for (const item of items) {
    const product = parseProduct(item);
    if (product !== null) products.push(product);
  }
  return products;
}

function parseSelections(value: unknown): HomeContent['selections'] {
  const empty: HomeContent['selections'] = {
    masVendidos: [],
    masReferenciados: [],
  };
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return empty;
  }
  const record = value as UnknownRecord;
  return {
    masVendidos: parseProducts(record.mas_vendidos),
    masReferenciados: parseProducts(record.mas_referenciados),
  };
}

/**
 * Pure, DB-free normalization of app_config values. Exported for unit tests;
 * the RSC entry point below is the only consumer in the app.
 */
export function buildHomeContent(config: HomeConfig): HomeContent {
  return {
    hero: {
      headline: APPROVED_HEADLINE,
      primaryCta: { label: 'Explorar piel', href: '/piel' },
    },
    navigation: NAVIGATION.map((item) => ({ label: item.label, href: item.href })),
    commitments: [...COMMITMENTS],
    whatsappUrl: parseWhatsappUrl(config.whatsapp_number),
    socials: buildSocials(config),
    storesAvailable: parseStoresAvailable(config.stores),
    selections: parseSelections(config.selections),
    // Hidden until the legal routes exist; this is a go-live blocker, not a
    // reason to invent links.
    legalLinks: [],
  };
}

/**
 * Server-only RSC loader. Missing or unreachable configuration degrades to
 * approved static content: no invented data and no internal error details.
 */
export async function loadHomeContent(): Promise<HomeContent> {
  const requestId = crypto.randomUUID();

  if (!process.env.DATABASE_URL) {
    logDegradation('database_not_configured', requestId);
    return buildHomeContent({});
  }

  try {
    const rows = await getPrismaClient().appConfig.findMany({
      where: { key: { in: [...CONFIG_KEYS] } },
      select: { key: true, value: true },
    });

    const config: HomeConfig = {};
    for (const row of rows) {
      if (isConfigKey(row.key)) config[row.key] = row.value;
    }
    return buildHomeContent(config);
  } catch (error) {
    logDegradation('config_read_failed', requestId, safeErrorType(error));
    return buildHomeContent({});
  }
}
