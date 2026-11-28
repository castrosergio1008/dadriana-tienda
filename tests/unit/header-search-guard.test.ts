import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const searchSource = readFileSync(join(ROOT, 'components/HeaderSearch.tsx'), 'utf8');
const headerSource = readFileSync(join(ROOT, 'components/SiteHeader.tsx'), 'utf8');

describe('header search disclosure guard (DD-HOME-25)', () => {
  it('keeps the local glyph, the native GET contract and zero external artifacts', () => {
    const required = [
      'action="/buscar"',
      'method="get"',
      'role="search"',
      'name="q"',
      'aria-label="Buscar"',
      'aria-label="Enviar búsqueda"',
      'aria-expanded={expanded}',
      'aria-controls="site-search-panel"',
      'hidden={!expanded}',
      'data-search-ready',
      'viewBox="0 0 49.36 45.44"',
      'stroke="currentColor"',
      'fill="none"',
      'strokeWidth={4}',
      'h-[22px] w-[22px] md:h-7 md:w-7',
      'h-11 w-11',
      'text-ink',
      // Inline disclosure: input appears left of the icon, no frame, bottom line only.
      'border-b',
      'border-0',
      'bg-transparent',
    ];
    for (const literal of required) {
      expect(searchSource, `HeaderSearch must keep ${literal}`).toContain(literal);
    }
    expect(searchSource.match(/¿Qué estás buscando\?/g)?.length).toBe(2);
    expect(headerSource).toContain('<HeaderSearch />');
    expect(headerSource).toContain('relative mx-auto');
    expect(headerSource).not.toContain('<form');

    const forbidden = [
      'lucide-react',
      'nihlo',
      'uuid-',
      'https://',
      '<style',
      'dangerouslySetInnerHTML',
      '#132c45',
      'XMLHttpRequest',
      'fetch(',
      'router.push',
      // No conditional submit interception; the Escape preventDefault only
      // stops Chromium from clearing type="search" (F-25-10).
      'onsubmit',
      'onchange',
    ];
    for (const [label, source] of [
      ['HeaderSearch.tsx', searchSource],
      ['SiteHeader.tsx', headerSource],
    ] as const) {
      for (const needle of forbidden) {
        expect(source.toLowerCase(), `${label} must not contain ${needle}`).not.toContain(
          needle.toLowerCase(),
        );
      }
    }
  });
});
