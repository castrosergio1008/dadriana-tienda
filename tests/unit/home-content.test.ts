import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({ findMany: vi.fn() }));

vi.mock('server-only', () => ({}));
vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    appConfig = { findMany: prismaMock.findMany };
  },
}));

import { buildHomeContent, loadHomeContent } from '../../lib/home-content';

beforeEach(() => {
  vi.unstubAllEnvs();
  prismaMock.findMany.mockReset();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

function lastWarning(): string {
  const call = vi.mocked(console.warn).mock.calls.at(-1);
  expect(call).toBeDefined();
  return String(call?.[0]);
}

function imageOf(value: unknown): string | undefined {
  return buildHomeContent({
    selections: {
      mas_vendidos: [
        {
          slug: 'crema-facial',
          name: 'Crema facial',
          availability: 'available',
          image: value,
        },
      ],
    },
  }).selections.masVendidos[0]?.image;
}

describe('loadHomeContent degradation', () => {
  it('returns only approved static content when no database is configured', async () => {
    vi.stubEnv('DATABASE_URL', '');

    const content = await loadHomeContent();

    expect(content).toEqual({
      hero: {
        headline: 'Belleza para tu piel y tu cabello',
        primaryCta: { label: 'Explorar piel', href: '/piel' },
      },
      navigation: [
        { label: 'Piel', href: '/piel' },
        { label: 'Cabello', href: '/cabello' },
        { label: 'Marcas', href: '/marcas' },
        { label: 'Tiendas', href: '/tiendas' },
      ],
      commitments: [
        'Cuidado para la piel y el cabello',
        'Atención por WhatsApp',
        'Tiendas físicas',
        'Compra acordada con el asesor',
      ],
      whatsappUrl: null,
      socials: [],
      storesAvailable: false,
      selections: { masVendidos: [], masReferenciados: [] },
      legalLinks: [],
    });
    expect(prismaMock.findMany).not.toHaveBeenCalled();

    const warning = lastWarning();
    expect(JSON.parse(warning)).toMatchObject({
      component: 'loadHomeContent',
      event: 'database_not_configured',
      requestId: expect.any(String),
    });
    expect(warning).not.toContain('DATABASE_URL');
  });

  it('degrades cleanly when the config query fails, without leaking error details', async () => {
    vi.stubEnv('DATABASE_URL', 'postgresql://synthetic-only');
    prismaMock.findMany.mockRejectedValue(
      new Error('connection refused at db-internal.example/573001234567'),
    );

    const content = await loadHomeContent();

    expect(content.whatsappUrl).toBeNull();
    expect(content.socials).toEqual([]);
    expect(content.storesAvailable).toBe(false);
    expect(content.selections).toEqual({
      masVendidos: [],
      masReferenciados: [],
    });

    const warning = lastWarning();
    expect(JSON.parse(warning)).toMatchObject({
      event: 'config_read_failed',
      requestId: expect.any(String),
      errorType: 'Error',
    });
    expect(warning).not.toContain('573001234567');
    expect(warning).not.toContain('connection refused');
    expect(warning).not.toContain('\n    at ');
  });

  it('reads only the approved keys with a parameterized Prisma query', async () => {
    vi.stubEnv('DATABASE_URL', 'postgresql://synthetic-only');
    prismaMock.findMany.mockResolvedValue([
      { key: 'whatsapp_number', value: '573001234567' },
      { key: 'unexpected_key', value: 'ignored' },
    ]);

    const content = await loadHomeContent();

    expect(content.whatsappUrl).toBe('https://wa.me/573001234567');
    expect(prismaMock.findMany).toHaveBeenCalledWith({
      where: {
        key: {
          in: [
            'whatsapp_number',
            'instagram_url',
            'facebook_url',
            'stores',
            'selections',
          ],
        },
      },
      select: { key: true, value: true },
    });
  });
});

describe('WhatsApp validation', () => {
  it.each([
    '3001234567',
    '57300123456',
    '5730012345678',
    '573001234567?source=home',
    'https://wa.me/573001234567',
    573001234567,
  ])('rejects the invalid number %j', (value) => {
    expect(buildHomeContent({ whatsapp_number: value }).whatsappUrl).toBeNull();
  });

  it('builds the wa.me URL from a valid Colombian number', () => {
    const content = buildHomeContent({ whatsapp_number: ' 573001234567 ' });

    expect(content.whatsappUrl).toBe('https://wa.me/573001234567');
  });
});

describe('social link allowlist', () => {
  it('rejects injected domains, wrong protocols and lookalike hostnames', () => {
    const content = buildHomeContent({
      instagram_url: 'https://instagram.com.evil.example/profile',
      facebook_url: 'https://evil.example/?next=https%3A%2F%2Ffacebook.com%2Fx',
    });
    expect(content.socials).toEqual([]);

    expect(
      buildHomeContent({ instagram_url: 'http://instagram.com/profile' }).socials,
    ).toEqual([]);
    expect(
      buildHomeContent({ facebook_url: 'javascript:alert(1)' }).socials,
    ).toEqual([]);
    expect(
      buildHomeContent({ facebook_url: 'https://facebook.com.evil.example' })
        .socials,
    ).toEqual([]);
  });

  it('keeps exact allowed hosts over HTTPS', () => {
    const content = buildHomeContent({
      instagram_url: 'https://www.instagram.com/dadriana',
      facebook_url: 'https://facebook.com/dadriana',
    });

    expect(content.socials).toEqual([
      { label: 'Instagram', url: 'https://www.instagram.com/dadriana' },
      { label: 'Facebook', url: 'https://facebook.com/dadriana' },
    ]);
  });
});

describe('product image validation', () => {
  it.each([
    '/\\evil.com',
    '//evil.com',
    '/bad path',
    '/bad\tpath',
    'https://user@evil.com/x',
    'https://cdn.example.com:8443/x.jpg',
    'https://cdn.example.com/x.jpg',
    '/%5C%5Cevil.com',
    '/%2f%2fevil.com',
    '/images/..%2f..%2fx',
    '/images/producto.jpg?size=large',
    '/images/producto.jpg#top',
  ])('rejects unsafe image %j', (value) => {
    expect(imageOf(value)).toBeUndefined();
  });

  it('accepts a single-slash local image path', () => {
    expect(imageOf('/images/producto.jpg')).toBe('/images/producto.jpg');
  });
});

describe('curated selections', () => {
  it('returns empty arrays when the stored selection is empty or malformed', () => {
    expect(
      buildHomeContent({
        selections: { mas_vendidos: [], mas_referenciados: [] },
      }).selections,
    ).toEqual({ masVendidos: [], masReferenciados: [] });

    expect(buildHomeContent({}).selections).toEqual({
      masVendidos: [],
      masReferenciados: [],
    });
    expect(buildHomeContent({ selections: 'not-an-object' }).selections).toEqual({
      masVendidos: [],
      masReferenciados: [],
    });
  });

  it('normalizes valid items and drops unsafe or incomplete ones', () => {
    const content = buildHomeContent({
      selections: {
        mas_vendidos: [
          {
            slug: 'crema-facial',
            name: 'Crema facial',
            brand: 'D’Adriana',
            priceLabel: '$ 45.000',
            availability: 'available',
          },
          { slug: 'javascript:alert(1)', name: 'Bad', availability: 'available' },
          { slug: 'sin-precio', name: 'Sin precio' },
        ],
        mas_referenciados: 'invalid',
      },
    });

    expect(content.selections).toEqual({
      masVendidos: [
        {
          slug: 'crema-facial',
          name: 'Crema facial',
          brand: 'D’Adriana',
          priceLabel: '$ 45.000',
          availability: 'available',
        },
      ],
      masReferenciados: [],
    });
  });
});
