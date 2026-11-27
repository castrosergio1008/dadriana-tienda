import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('@prisma/client', () => ({ PrismaClient: class {} }));

import { buildHomeContent } from '../../lib/home-content';
import {
  PROTOTYPE_HIGHLIGHTS,
  type PrototypeHighlight,
} from '../../lib/prototype-highlights';

const PROTOTYPE_SOURCE = readFileSync(
  join(process.cwd(), 'prototipo/app.js'),
  'utf8',
);

const SLUG_PATTERN = /^[A-Za-z0-9_-]{1,200}$/;
const FORBIDDEN_KEYS = [
  'price',
  'oldPrice',
  'rating',
  'reviews',
  'stock',
  'badge',
  'description',
  'howToUse',
  'availability',
] as const;

const ASSET_PAIRS = [
  ['476383572_942330954741052_878526072427543475_n.jpg', 'shampoo-purificante-anticaspa.jpg'],
  ['476452255_942330974741050_5802109887038169884_n.jpg', 'shampoo-morado-anti-amarillo.jpg'],
  ['476162518_942328904741257_7430935235354454783_n.jpg', 'mascarilla-reparadora-400-ml.jpg'],
  ['476134411_941094224864725_2822899998559028354_n.jpg', 'aceite-capilar-argan.jpg'],
  ['476402716_942330921407722_7554504591105678866_n.jpg', 'serum-vitamina-c-30-ml.jpg'],
  ['187485109_101843935456429_4899052523150508942_n.jpg', 'crema-hidratante-piel-sensible.jpg'],
] as const;

describe('prototype highlights (DD-HOME-20)', () => {
  it('exposes exactly six items with only the four approved fields', () => {
    expect(PROTOTYPE_HIGHLIGHTS).toHaveLength(6);

    const typed: readonly PrototypeHighlight[] = PROTOTYPE_HIGHLIGHTS;
    expect(typed).toHaveLength(6);

    for (const highlight of PROTOTYPE_HIGHLIGHTS) {
      expect(Object.keys(highlight).sort()).toEqual(['brand', 'image', 'name', 'slug']);
      for (const key of FORBIDDEN_KEYS) {
        expect(highlight).not.toHaveProperty(key);
      }
    }
  });

  it('uses verbatim prototype ids, names and brands', () => {
    for (const highlight of PROTOTYPE_HIGHLIGHTS) {
      expect(highlight.slug).toMatch(SLUG_PATTERN);
      expect(PROTOTYPE_SOURCE).toContain(`id: '${highlight.slug}'`);
      // Literal provenance: no paraphrase, translation or invented copy.
      expect(PROTOTYPE_SOURCE).toContain(highlight.name);
      expect(PROTOTYPE_SOURCE).toContain(highlight.brand);
    }
  });

  it('uses local /products/ paths accepted by the production image allowlist', () => {
    for (const highlight of PROTOTYPE_HIGHLIGHTS) {
      expect(highlight.image).toMatch(/^\/products\/[A-Za-z0-9._-]+\.jpg$/);

      // buildHomeContent runs the real (private) parseImage allowlist, so the
      // test cannot drift by duplicating the regular expression.
      const parsed = buildHomeContent({
        selections: {
          mas_vendidos: [
            {
              slug: highlight.slug,
              name: highlight.name,
              availability: 'available',
              image: highlight.image,
            },
          ],
        },
      }).selections.masVendidos[0]?.image;

      expect(parsed).toBe(highlight.image);
    }
  });

  it('copies every source photo byte-for-byte without re-encoding', () => {
    for (const [source, target] of ASSET_PAIRS) {
      const original = readFileSync(join(process.cwd(), 'prototipo/assets', source));
      const copy = readFileSync(join(process.cwd(), 'public/products', target));

      expect(copy.byteLength).toBe(original.byteLength);
      expect(copy.equals(original)).toBe(true);
    }
  });
});
