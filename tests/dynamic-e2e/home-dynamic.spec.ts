import { Prisma, PrismaClient } from '@prisma/client';
import { expect, test, type Page } from '@playwright/test';

import { assertLocalDatabaseUrl } from '../../prisma/db-guard.mjs';

// Synthetic values from prisma/fixtures.mjs. CI loads those fixtures into a
// local PostgreSQL database before this suite; no customer data, real phone
// numbers or placeholder/example links are used here. The malicious strings
// below are obviously fake sentinels used only to prove they do not leak.
const WHATSAPP_NUMBER = '573001234567';
const INSTAGRAM_URL = 'https://www.instagram.com/dadriana_test';
const FACEBOOK_URL = 'https://www.facebook.com/dadriana.test';

const SERUM = {
  slug: 'fixture-serum-qa',
  name: 'Sérum sintético QA',
  availability: 'available',
} as const;
const CREMA = {
  slug: 'fixture-crema-qa',
  name: 'Crema sintética QA',
  availability: 'out_of_stock',
} as const;

const PII_SENTINEL = 'qa-pii-sentinel@example.invalid';
const INJECTED_NUMBER = '573999999999';
const MALICIOUS_HOST = 'evil.example';
const INJECTED_INSTAGRAM = `https://www.instagram.com.${MALICIOUS_HOST}/dadriana_test`;
const INJECTED_FACEBOOK = `https://${MALICIOUS_HOST}/dadriana.test`;

const MANAGED_KEYS = [
  'whatsapp_number',
  'instagram_url',
  'facebook_url',
  'selections',
] as const;
type ConfigKey = (typeof MANAGED_KEYS)[number];
type ConfigValues = Readonly<Record<ConfigKey, Prisma.InputJsonValue>>;
type ConfigSnapshot = ReadonlyMap<ConfigKey, Prisma.InputJsonValue>;

const MANAGED_KEY_SET: ReadonlySet<string> = new Set<string>(MANAGED_KEYS);

const BASE_CONFIG: ConfigValues = {
  whatsapp_number: WHATSAPP_NUMBER,
  instagram_url: INSTAGRAM_URL,
  facebook_url: FACEBOOK_URL,
  selections: {
    mas_vendidos: [SERUM],
    mas_referenciados: [CREMA],
  },
};

// Static SQL only: mirrors prisma/schema.prisma so an ephemeral CI database
// needs no migration step. No test input is interpolated into this statement.
const ENSURE_APP_CONFIG_TABLE = `
  CREATE TABLE IF NOT EXISTS "app_config" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "app_config_pkey" PRIMARY KEY ("key")
  )
`;

type LocalStore = {
  snapshot(): Promise<ConfigSnapshot>;
  seed(values: ConfigValues): Promise<void>;
  restore(snapshot: ConfigSnapshot): Promise<void>;
  disconnect(): Promise<void>;
};

let store: LocalStore | undefined;

function getStore(): LocalStore {
  if (!store) {
    throw new Error('Local app_config store is unavailable; the database guard did not pass.');
  }
  return store;
}

function isManagedKey(key: string): key is ConfigKey {
  return MANAGED_KEY_SET.has(key);
}

// Prisma errors can embed the connection string. Only a sanitized error class
// name ever leaves these helpers, on success or failure.
function safeErrorType(error: unknown): string {
  if (error instanceof Error && /^[A-Za-z][A-Za-z0-9]{0,63}$/.test(error.name)) {
    return error.name;
  }
  return 'UnknownError';
}

async function audited<T>(label: string, operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw new Error(`Local app_config dynamic E2E ${label} failed (${safeErrorType(error)}).`);
  }
}

test.beforeAll(async () => {
  // Fail closed before a client exists: a missing or non-local DATABASE_URL
  // cannot connect to, or write into, a real deployment database.
  assertLocalDatabaseUrl(process.env.DATABASE_URL);
  const prisma = new PrismaClient();
  try {
    await audited('table setup', () => prisma.$executeRawUnsafe(ENSURE_APP_CONFIG_TABLE));
  } catch (error) {
    await prisma.$disconnect();
    throw error;
  }

  store = {
    async snapshot() {
      const rows = await audited('snapshot read', () =>
        prisma.appConfig.findMany({
          where: { key: { in: [...MANAGED_KEYS] } },
          select: { key: true, value: true },
        }),
      );
      const previous = new Map<ConfigKey, Prisma.InputJsonValue>();
      for (const row of rows) {
        // Top-level JSON null is not valid upsert input; treat it as absent
        // and let restore remove the row instead.
        if (isManagedKey(row.key) && row.value !== null) {
          previous.set(row.key, row.value as Prisma.InputJsonValue);
        }
      }
      return previous;
    },

    async seed(values) {
      await audited('seed write', () =>
        prisma.$transaction(async (tx) => {
          for (const key of MANAGED_KEYS) {
            await tx.appConfig.upsert({
              where: { key },
              create: { key, value: values[key] },
              update: { value: values[key] },
            });
          }
        }),
      );
    },

    async restore(snapshot) {
      await audited('restore write', () =>
        prisma.$transaction(async (tx) => {
          for (const key of MANAGED_KEYS) {
            const value = snapshot.get(key);
            if (value === undefined) {
              await tx.appConfig.deleteMany({ where: { key } });
              continue;
            }
            await tx.appConfig.upsert({
              where: { key },
              create: { key, value },
              update: { value },
            });
          }
        }),
      );
    },

    async disconnect() {
      await prisma.$disconnect();
    },
  };
});

test.afterAll(async () => {
  await store?.disconnect();
  store = undefined;
});

// Every test seeds its own baseline and restores the CI fixtures in finally,
// so tests stay independent even if one of them fails mid-assertion.
async function withConfig<T>(values: ConfigValues, run: () => Promise<T>): Promise<T> {
  const activeStore = getStore();
  const original = await activeStore.snapshot();
  try {
    await activeStore.seed(values);
    return await run();
  } finally {
    await activeStore.restore(original);
  }
}

type ContactLink = {
  href: string | null;
  target: string | null;
  rel: string | null;
};

type DomSnapshot = {
  whatsapp: ContactLink[];
  socialExternal: (string | null)[];
  headings: (string | null)[];
};

async function domSnapshot(page: Page): Promise<DomSnapshot> {
  return page.evaluate(() => ({
    whatsapp: Array.from(document.querySelectorAll('a[href^="https://wa.me/"]')).map((element) => ({
      href: element.getAttribute('href'),
      target: element.getAttribute('target'),
      rel: element.getAttribute('rel'),
    })),
    socialExternal: Array.from(document.querySelectorAll('footer a[target="_blank"]')).map(
      (element) => element.getAttribute('href'),
    ),
    headings: Array.from(document.querySelectorAll('main h1, main h2')).map(
      (element) => element.textContent,
    ),
  }));
}

// Only the user-visible DOM counts as a leak. Raw page.content() also contains
// the dev overlay and the RSC payload, which legitimately echo the request URL
// (including its query and hash) without rendering those values to visitors.
async function visibleSurface(page: Page): Promise<string> {
  return page.evaluate(() => {
    const text = document.body?.innerText ?? '';
    const urls = Array.from(
      document.querySelectorAll('a[href], area[href], img[src], source[src], iframe[src]'),
    ).flatMap((element) => [element.getAttribute('href') ?? '', element.getAttribute('src') ?? '']);
    return [text, ...urls].join('\n').toLowerCase();
  });
}

async function expectNoInjectedPii(
  page: Page,
  needles: readonly string[] = [PII_SENTINEL, INJECTED_NUMBER, MALICIOUS_HOST],
): Promise<void> {
  const surface = await visibleSurface(page);
  for (const needle of needles) {
    expect(surface).not.toContain(needle.toLowerCase());
  }
}

test('HOME-E2E-06: populated carousel is focusable and scrolls with the right arrow', async ({
  page,
}) => {
  await withConfig(
    {
      ...BASE_CONFIG,
      selections: { mas_vendidos: [SERUM, CREMA], mas_referenciados: [] },
    },
    async () => {
      // Two 288px cards overflow a 375px viewport, so keyboard scrolling is
      // observable without relying on an arbitrary desktop window size.
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/');

      const region = page.getByRole('region', {
        name: 'Más vendidos, selección de la tienda',
      });
      await expect(region).toBeVisible();
      await expect(region.getByRole('heading', { name: 'Más vendidos' })).toBeVisible();

      const list = region.locator('ul[tabindex="0"]');
      await expect(list).toHaveCount(1);
      await list.focus();
      await expect(list).toBeFocused();

      const links = list.getByRole('link', { name: 'Ver producto' });
      await expect(links).toHaveCount(2);
      await expect(links.nth(0)).toHaveAttribute('href', `/productos/${SERUM.slug}`);
      await expect(links.nth(1)).toHaveAttribute('href', `/productos/${CREMA.slug}`);

      const overflow = await list.evaluate(
        (element) => element.scrollWidth - element.clientWidth,
      );
      expect(overflow).toBeGreaterThan(0);

      const scrollLeftBefore = await list.evaluate((element) => element.scrollLeft);
      // Repeat the arrow press so scroll snapping cannot collapse a single
      // small step back to the first card; every movement comes from the
      // keyboard, never from a programmatic scrollLeft assignment.
      for (let press = 0; press < 8; press += 1) {
        await page.keyboard.press('ArrowRight');
        const current = await list.evaluate((element) => element.scrollLeft);
        if (current > scrollLeftBefore) break;
      }
      await expect
        .poll(() => list.evaluate((element) => element.scrollLeft), { timeout: 5_000 })
        .toBeGreaterThan(scrollLeftBefore);
    },
  );
});

test('HOME-E2E-08: app_config edits change the DOM without a rebuild (DD-HOME-19)', async ({
  page,
}) => {
  await withConfig(BASE_CONFIG, async () => {
    await page.goto('/');

    const region = page.getByRole('region', {
      name: 'Más vendidos, selección de la tienda',
    });
    await expect(region.locator('article h3')).toHaveText([SERUM.name]);
    await expect(region.getByRole('link', { name: 'Ver producto' })).toHaveAttribute(
      'href',
      `/productos/${SERUM.slug}`,
    );

    // The same server process stays up: no build, no deploy, no restart. Only
    // the synthetic app_config row changes, then the page is refreshed.
    await getStore().seed({
      ...BASE_CONFIG,
      selections: {
        mas_vendidos: [CREMA, SERUM],
        mas_referenciados: [],
      },
    });

    await page.reload();

    await expect(region.locator('article h3')).toHaveText([CREMA.name, SERUM.name]);
    const updatedLinks = region.getByRole('link', { name: 'Ver producto' });
    await expect(updatedLinks).toHaveCount(2);
    await expect(updatedLinks.nth(0)).toHaveAttribute('href', `/productos/${CREMA.slug}`);
    await expect(updatedLinks.nth(1)).toHaveAttribute('href', `/productos/${SERUM.slug}`);
  });
});

test('HOME-E2E-09: WhatsApp CTA ignores injected query, hash and Referer', async ({ page }) => {
  await withConfig(BASE_CONFIG, async () => {
    await page.goto('/');

    // The configured number feeds two CTAs: the header and the always-visible
    // store section (S8). Both must be identical and derive only from app_config.
    const expected: ContactLink[] = [
      {
        href: `https://wa.me/${WHATSAPP_NUMBER}`,
        target: '_blank',
        rel: 'noopener noreferrer',
      },
      {
        href: `https://wa.me/${WHATSAPP_NUMBER}`,
        target: '_blank',
        rel: 'noopener noreferrer',
      },
    ];
    const baseline = await domSnapshot(page);
    expect(baseline.whatsapp).toEqual(expected);

    const attack = `wa=${INJECTED_NUMBER}&email=${PII_SENTINEL}`;
    await page.goto(`/?${attack}#${attack}`);
    expect(await domSnapshot(page)).toEqual(baseline);
    await expectNoInjectedPii(page);

    await page.setExtraHTTPHeaders({ Referer: `https://${MALICIOUS_HOST}/?${attack}` });
    try {
      await page.goto('/');
      expect(await domSnapshot(page)).toEqual(baseline);
      await expectNoInjectedPii(page);
    } finally {
      await page.setExtraHTTPHeaders({});
    }
  });
});

test('HOME-E2E-10: social links allow only exact hosts and reject injected domains', async ({
  page,
}) => {
  await withConfig(BASE_CONFIG, async () => {
    await page.goto('/');

    const socials = page.locator('footer a[target="_blank"]');
    await expect(socials).toHaveCount(2);
    await expect(socials.nth(0)).toHaveAttribute('href', INSTAGRAM_URL);
    await expect(socials.nth(1)).toHaveAttribute('href', FACEBOOK_URL);

    // wa.me is the configured contact CTA; every other external anchor must
    // resolve to one of the exact social hostnames.
    const externalHosts = await page.locator('a[href^="https://"]').evaluateAll((elements) =>
      elements.map((element) => new URL(element.getAttribute('href') ?? '').hostname),
    );
    expect(externalHosts.length).toBeGreaterThan(0);
    const allowedHosts = new Set([
      'instagram.com',
      'www.instagram.com',
      'facebook.com',
      'www.facebook.com',
      'wa.me',
    ]);
    for (const host of externalHosts) {
      expect(allowedHosts.has(host)).toBe(true);
    }

    const hrefs = await page.locator('a[href]').evaluateAll((elements) =>
      elements.map((element) => element.getAttribute('href') ?? ''),
    );
    expect(hrefs.some((href) => /ejemplo|example/i.test(href))).toBe(false);

    // The server is already up: an injected lookalike host and a foreign host
    // must both be rejected on the next request, not rendered as example links.
    await getStore().seed({
      ...BASE_CONFIG,
      instagram_url: INJECTED_INSTAGRAM,
      facebook_url: INJECTED_FACEBOOK,
    });
    await page.reload();

    await expect(page.locator('footer a[target="_blank"]')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Redes' })).toHaveCount(0);
    await expectNoInjectedPii(page, [MALICIOUS_HOST, '/ejemplo']);
  });
});

test('HOME-E2E-28: configured WhatsApp CTAs keep the approved fill and white label (DD-HOME-21)', async ({
  page,
}) => {
  await withConfig(BASE_CONFIG, async () => {
    await page.goto('/');

    const headerCta = page.locator('header a[href^="https://wa.me/"]');
    await expect(headerCta).toHaveCount(1);
    await expect(headerCta).toHaveAttribute('href', `https://wa.me/${WHATSAPP_NUMBER}`);
    await expect(headerCta).toHaveAttribute('target', '_blank');
    await expect(headerCta).toHaveAttribute('rel', 'noopener noreferrer');

    const headerStyle = await headerCta.evaluate((element) => {
      const computed = getComputedStyle(element);
      return {
        background: computed.backgroundColor,
        borderColor: computed.borderTopColor,
        borderWidth: computed.borderTopWidth,
        color: computed.color,
      };
    });
    expect(headerStyle).toEqual({
      background: 'rgb(27, 93, 74)',
      borderColor: 'rgb(27, 93, 74)',
      borderWidth: '1px',
      color: 'rgb(255, 255, 255)',
    });

    await headerCta.hover();
    await expect(headerCta).toHaveCSS('background-color', 'rgb(34, 117, 92)');
    await expect(headerCta).toHaveCSS('color', 'rgb(255, 255, 255)');

    const sectionCta = page.locator('section[aria-labelledby="stores-title"] a[href^="https://wa.me/"]');
    await expect(sectionCta).toHaveCount(1);
    await expect(sectionCta).toHaveAttribute('href', `https://wa.me/${WHATSAPP_NUMBER}`);
    const sectionStyle = await sectionCta.evaluate((element) => {
      const computed = getComputedStyle(element);
      return { background: computed.backgroundColor, color: computed.color };
    });
    expect(sectionStyle).toEqual({
      background: 'rgb(27, 93, 74)',
      color: 'rgb(255, 255, 255)',
    });

    await expectNoInjectedPii(page);
  });
});
