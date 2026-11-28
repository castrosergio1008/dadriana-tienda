import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { heroSlides, isLocalSlidePath } from '../../lib/hero-slides';

const ROOT = process.cwd();

const approvedSlides = [
  {
    id: 'slide-01',
    source: 'hero-1.jpg',
    destination: 'public/slides/hero-1.jpg',
    sha256: '59127cdadf561af0d9d4acdaa14e2601b471bb31b683aac538a9a0de89e15d45',
  },
  {
    id: 'slide-02',
    source: 'hero-2.jpg',
    destination: 'public/slides/hero-2.jpg',
    sha256: '70b830e0c52e0e0b6712113ae79b9f34c6de01ce5317df7d5a9250387ca31836',
  },
  {
    id: 'slide-03',
    source: 'hero-3.jpg',
    destination: 'public/slides/hero-3.jpg',
    sha256: 'c9c834c87e3037a638a2bc722b7c49d02cdacb8bba4942a02c4038e859886cbd',
  },
  {
    id: 'slide-04',
    source: 'hero-4.jpg',
    destination: 'public/slides/hero-4.jpg',
    sha256: 'd1931b2782e3e5546d8f273f38bc737b7d2cd7de811ae94c01b24a9063bcab48',
  },
] as const;

function sha256(relativePath: string): string {
  const absolutePath = join(ROOT, relativePath);

  // A missing source or copy fails the test explicitly instead of silently
  // comparing an empty or stale file.
  expect(existsSync(absolutePath), `${relativePath} must exist`).toBe(true);

  return createHash('sha256').update(readFileSync(absolutePath)).digest('hex');
}

describe('hero slides manifest', () => {
  it('exposes exactly four slides with the approved ids and paths', () => {
    expect(heroSlides).toHaveLength(4);
    expect(heroSlides.map((slide) => slide.id)).toEqual([
      'slide-01',
      'slide-02',
      'slide-03',
      'slide-04',
    ]);
    expect(heroSlides.map((slide) => slide.src)).toEqual([
      '/slides/hero-1.jpg',
      '/slides/hero-2.jpg',
      '/slides/hero-3.jpg',
      '/slides/hero-4.jpg',
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
    expect(isLocalSlidePath('/slides/hero-1.jpg')).toBe(true);
    expect(isLocalSlidePath('/slides/hero-4.jpg')).toBe(true);
    for (const path of [
      'https://example.com/slides/hero-1.jpg',
      'http://example.com/slides/hero-1.jpg',
      '/Imagenes/475978267_941094554864692_7081155730124177924_n.jpg',
      '/products/crema-hidratante-piel-sensible.jpg',
    ]) {
      expect(isLocalSlidePath(path), `${path} must be rejected`).toBe(false);
    }
  });

  it.each(approvedSlides)(
    '$id matches the approved SHA-256 in the root source and in public/slides/',
    ({ source, destination, sha256: expected }) => {
      expect(sha256(source)).toBe(expected);
      expect(sha256(destination)).toBe(expected);
    },
  );
});
