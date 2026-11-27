import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { heroSlides, isLocalSlidePath } from '../../lib/hero-slides';

const ROOT = process.cwd();

// DD-HOME-22 §4.7: source, destination and verified SHA-256 per slide.
const approvedSlides = [
  {
    id: 'slide-01',
    source: 'Imagenes/475978267_941094554864692_7081155730124177924_n.jpg',
    destination: 'public/slides/hero-01.jpg',
    sha256: 'ee61df8813bd344bc25ccdb404f4f13823556395edee2583d30623517e70f1cc',
  },
  {
    id: 'slide-02',
    source: 'Imagenes/476352299_941094471531367_8294340225166205945_n.jpg',
    destination: 'public/slides/hero-02.jpg',
    sha256: '07d8ea3ba01d156cc67e9983468d8d90fe6e216e5d550ea4f297fd43815bd5b9',
  },
  {
    id: 'slide-03',
    source: 'Imagenes/905462971_1477563607884448_2853981617253828113_n.jpeg',
    destination: 'public/slides/hero-03-crema-hidratante.jpg',
    sha256: 'dab0ad1827b379d985d3e0887149c621d4c78bf9e63ff5940b5fac381d0e1ed2',
  },
] as const;

function sha256(relativePath: string): string {
  const absolutePath = join(ROOT, relativePath);

  // A missing source or copy fails the test explicitly instead of silently
  // comparing an empty or stale file.
  expect(existsSync(absolutePath), `${relativePath} must exist`).toBe(true);

  return createHash('sha256').update(readFileSync(absolutePath)).digest('hex');
}

describe('hero slides manifest (DD-HOME-22 §4.7)', () => {
  it('exposes exactly three slides with the approved ids and paths', () => {
    expect(heroSlides).toHaveLength(3);
    expect(heroSlides.map((slide) => slide.id)).toEqual([
      'slide-01',
      'slide-02',
      'slide-03',
    ]);
    expect(heroSlides.map((slide) => slide.src)).toEqual([
      '/slides/hero-01.jpg',
      '/slides/hero-02.jpg',
      '/slides/hero-03-crema-hidratante.jpg',
    ]);
  });

  it('keeps every slide decorative, local and free of invented fields', () => {
    const bannedFields = ['title', 'name', 'price', 'href', 'claim'] as const;

    for (const slide of heroSlides) {
      expect(slide.alt, `${slide.id} must be decorative`).toBe('');
      expect(isLocalSlidePath(slide.src), `${slide.id} must be local`).toBe(true);
      expect(Object.keys(slide).sort(), `${slide.id} field allowlist`).toEqual([
        'alt',
        'id',
        'src',
      ]);
      for (const field of bannedFields) {
        expect(Object.hasOwn(slide, field), `${slide.id} must not declare ${field}`).toBe(false);
      }
    }
  });

  it('rejects remote, raw and misplaced paths with the shared allowlist', () => {
    expect(isLocalSlidePath('/slides/hero-03-crema-hidratante.jpg')).toBe(true);
    for (const path of [
      'https://example.com/slides/hero-01.jpg',
      'http://example.com/slides/hero-01.jpg',
      '/Imagenes/475978267_941094554864692_7081155730124177924_n.jpg',
      '/products/crema-hidratante-piel-sensible.jpg',
    ]) {
      expect(isLocalSlidePath(path), `${path} must be rejected`).toBe(false);
    }
  });

  it.each(approvedSlides)(
    '$id matches the approved SHA-256 in Imagenes/ and in public/slides/',
    ({ source, destination, sha256: expected }) => {
      expect(sha256(source)).toBe(expected);
      expect(sha256(destination)).toBe(expected);
    },
  );
});
