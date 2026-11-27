import { Prisma, PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { assertLocalDatabaseUrl } from '../../prisma/db-guard.mjs';
import { loadHomeContent } from '../../lib/home-content';

// Created only after the DATABASE_URL guard passes: a non-local URL must fail
// before any client exists or any upsert can reach a real deployment.
let prisma: PrismaClient | undefined;

function getPrisma(): PrismaClient {
  if (!prisma) {
    throw new Error('PrismaClient is unavailable; the database guard did not pass.');
  }
  return prisma;
}

// Synthetic CI values only; the WhatsApp number and social handles exist
// exclusively in fixtures/tests and never in the UI or the client bundle.
type ConfigKey =
  | 'whatsapp_number'
  | 'instagram_url'
  | 'facebook_url'
  | 'stores'
  | 'selections';

const VALID_CONFIG: Record<ConfigKey, Prisma.InputJsonValue> = {
  whatsapp_number: '573001234567',
  instagram_url: 'https://www.instagram.com/dadriana_test',
  facebook_url: 'https://www.facebook.com/dadriana.test',
  stores: [],
  selections: {
    mas_vendidos: [
      {
        slug: 'fixture-serum-qa',
        name: 'Sérum sintético QA',
        availability: 'available',
      },
    ],
    mas_referenciados: [
      {
        slug: 'fixture-crema-qa',
        name: 'Crema sintética QA',
        availability: 'out_of_stock',
      },
    ],
  },
};

async function upsertConfig(
  key: ConfigKey,
  value: Prisma.InputJsonValue,
): Promise<void> {
  await getPrisma().appConfig.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

async function restoreValidConfig(): Promise<void> {
  for (const [key, value] of Object.entries(VALID_CONFIG)) {
    await upsertConfig(key as ConfigKey, value);
  }
}

beforeAll(async () => {
  // No client and no connection until the URL is proven local. The guard also
  // covers a missing/invalid URL and rejects host/hostaddr query overrides.
  assertLocalDatabaseUrl(process.env.DATABASE_URL);
  prisma = new PrismaClient();
  await prisma.$connect();
});

// Reset before every case so the suite does not depend on execution order.
beforeEach(async () => {
  await restoreValidConfig();
});

afterAll(async () => {
  // If the guard rejected the URL there is no client to clean up; avoid
  // masking the guard error with a teardown failure.
  if (!prisma) {
    return;
  }
  try {
    await restoreValidConfig();
  } finally {
    await prisma.$disconnect();
  }
});

describe('loadHomeContent against app_config', () => {
  it('normalizes WhatsApp, allowed socials and curated selections from the database', async () => {
    const content = await loadHomeContent();

    expect(content.whatsappUrl).toBe('https://wa.me/573001234567');
    expect(content.socials).toEqual([
      { label: 'Instagram', url: 'https://www.instagram.com/dadriana_test' },
      { label: 'Facebook', url: 'https://www.facebook.com/dadriana.test' },
    ]);
    expect(content.storesAvailable).toBe(false);
    expect(content.selections.masVendidos).toEqual([
      {
        slug: 'fixture-serum-qa',
        name: 'Sérum sintético QA',
        availability: 'available',
      },
    ]);
    expect(content.selections.masReferenciados).toEqual([
      {
        slug: 'fixture-crema-qa',
        name: 'Crema sintética QA',
        availability: 'out_of_stock',
      },
    ]);
  });

  it('discards invalid values injected into app_config', async () => {
    await upsertConfig('whatsapp_number', 'javascript:alert(1)');
    await upsertConfig('instagram_url', 'https://instagram.com.evil.example/profile');

    const content = await loadHomeContent();

    expect(content.whatsappUrl).toBeNull();
    expect(content.socials).toEqual([
      { label: 'Facebook', url: 'https://www.facebook.com/dadriana.test' },
    ]);
    // Unrelated keys keep loading normally from the same database read.
    expect(content.selections.masVendidos).toHaveLength(1);
  });
});
