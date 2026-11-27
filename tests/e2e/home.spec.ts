import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

declare global {
  interface Window {
    axe?: {
      run: (
        context: unknown,
        options: unknown,
      ) => Promise<{
        violations: Array<{ id: string; impact?: string; nodes: unknown[] }>;
      }>;
    };
  }
}

const axeSource = readFileSync(
  join(process.cwd(), 'node_modules/axe-core/axe.min.js'),
  'utf8',
);

const stubs = [
  { path: '/piel', heading: 'Piel', empty: 'Catálogo pendiente de publicar.' },
  { path: '/cabello', heading: 'Cabello', empty: 'Catálogo pendiente de publicar.' },
  { path: '/marcas', heading: 'Marcas', empty: 'Catálogo pendiente de publicar.' },
  { path: '/tiendas', heading: 'Tiendas', empty: 'Sin tiendas publicadas todavía.' },
  {
    path: '/buscar',
    heading: 'Buscar',
    empty: 'La búsqueda estará disponible cuando se publique el catálogo.',
  },
  {
    path: '/productos/ejemplo',
    heading: 'Producto',
    empty: 'Ficha de producto pendiente de publicar.',
  },
];

test.describe('Home smoke (DB-free)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('skip link is the first focusable element and focuses main @smoke', async ({ page }) => {
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    await expect(focused).toHaveAttribute('href', '#main');
    await expect(focused).toHaveText('Saltar al contenido');

    await page.keyboard.press('Enter');
    await expect(page.locator('#main')).toBeFocused();
  });

  test('renders one header, one main, one footer and a single H1 @smoke', async ({ page }) => {
    await expect(page.locator('header')).toHaveCount(1);
    await expect(page.getByRole('navigation', { name: 'Principal' })).toHaveCount(1);
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('footer')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveCount(1);
    expect(await page.locator('h2').count()).toBeGreaterThan(0);
  });

  test('HOME-E2E-29: hero below the header keeps one H1, one CTA and three local slides @smoke', async ({
    page,
  }) => {
    const hero = page.locator('section[aria-labelledby="hero-title"]');
    await expect(hero).toHaveCount(1);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(hero.getByRole('link')).toHaveCount(1);
    await expect(hero.locator('img')).toHaveCount(3);

    const sources = await hero.locator('img').evaluateAll((elements) =>
      elements.map((element) => element.getAttribute('src') ?? ''),
    );
    for (const source of sources) {
      const url = new URL(source, 'http://localhost');
      expect(url.pathname).toBe('/_next/image');
      expect(url.searchParams.get('url')).toMatch(/^\/slides\/hero-0[123]/);
    }

    await expect(
      page.locator('video, [autoplay], [aria-roledescription="carousel"]'),
    ).toHaveCount(0);
    await expect(hero.getByRole('heading', { level: 1 })).toHaveText(
      'Belleza para tu piel y tu cabello',
    );
    await expect(hero.getByRole('link', { name: 'Explorar piel' })).toHaveAttribute(
      'href',
      '/piel',
    );
  });

  test('hides both curated sections without data @smoke', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Más vendidos' }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('heading', { name: 'Más referenciados' }),
    ).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Ver producto' })).toHaveCount(0);
  });

  test('store CTA is always visible and points to /tiendas @smoke', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Encuentra tu tienda' })).toHaveAttribute(
      'href',
      '/tiendas',
    );
    await expect(page.getByText('Sin tiendas publicadas todavía')).toHaveCount(0);
  });

  test('omits WhatsApp without a configured number @smoke', async ({ page }) => {
    await expect(page.locator('a[href^="https://wa.me/"]')).toHaveCount(0);
  });

  test('renders no analytics, construction notice or external runtime resources @smoke', async ({
    page,
  }) => {
    const html = (await page.content()).toLowerCase();
    for (const needle of [
      'googletagmanager',
      'google-analytics',
      'googletag',
      'onetrust',
      'página en construcción',
      'fonts.googleapis.com',
      'fonts.gstatic.com',
      'nihlo.com.co',
      'cdn.shopify.com',
    ]) {
      expect(html).not.toContain(needle);
    }
    await expect(page.locator('script[src^="http"], link[href^="http"]')).toHaveCount(0);

    // DD-HOME-22 §7.2: self-hosted Poppins must not add external hints.
    const hints = await page
      .locator('link[rel~="preconnect"], link[rel~="dns-prefetch"]')
      .evaluateAll((elements) => elements.map((element) => element.getAttribute('href') ?? ''));
    expect(hints).toEqual([]);
  });

  for (const width of [375, 768, 1440]) {
    test.describe(`axe 2.2 AA at ${width}px`, () => {
      test.use({ viewport: { width, height: width === 375 ? 812 : 1024 } });

      test('has no critical or serious axe 2.2 AA violations @a11y', async ({ page }) => {
        await page.addScriptTag({ content: axeSource });
        const violations = await page.evaluate(async () => {
          if (!window.axe) throw new Error('axe-core was not injected');
          const result = await window.axe.run(document, {
            runOnly: {
              type: 'tag',
              values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
            },
          });
          return result.violations.map((violation) => ({
            id: violation.id,
            impact: violation.impact,
            nodes: violation.nodes.length,
          }));
        });

        // Moderate/minor findings are recorded as non-blocking warnings;
        // only critical/serious violations fail the release gate.
        const advisory = violations.filter(
          (violation) =>
            violation.impact !== 'critical' && violation.impact !== 'serious',
        );
        if (advisory.length > 0) {
          console.warn(
            `[axe:${width}px] non-blocking findings: ${JSON.stringify(advisory)}`,
          );
        }

        expect(
          violations.filter(
            (violation) =>
              violation.impact === 'critical' || violation.impact === 'serious',
          ),
        ).toEqual([]);

        // DD-HOME-22 §7.2: the slide controls must also pass the three rules
        // that classic WCAG tags do not force deterministically.
        const targeted = await page.evaluate(async () => {
          if (!window.axe) throw new Error('axe-core was not injected');
          const result = await window.axe.run(document, {
            runOnly: {
              type: 'rule',
              values: ['aria-hidden-focus', 'button-name', 'aria-allowed-attr'],
            },
          });
          return result.violations.map((violation) => violation.id);
        });
        expect(targeted).toEqual([]);
      });
    });
  }

  test('approved stub routes return 200 with honest empty states @smoke', async ({ page }) => {
    for (const stub of stubs) {
      const response = await page.goto(stub.path);
      expect(response?.status()).toBe(200);
      await expect(page.locator('h1')).toHaveText(stub.heading);
      await expect(page.getByText(stub.empty)).toBeVisible();
    }
  });
});

test.describe('Home smoke — response headers', () => {
  test('serves noindex,nofollow and omits X-Powered-By @smoke', async ({ page }) => {
    const response = await page.request.get('/');

    expect(response.status()).toBe(200);
    expect(response.headers()['x-robots-tag']).toBe('noindex, nofollow');
    expect(response.headers()['x-powered-by']).toBeUndefined();

    // C-HOME-01: report-only is the only CSP mode allowed until a no-PII
    // reporting endpoint is designed and signed off by sentinel + infra.
    const reportOnly = response.headers()['content-security-policy-report-only'];
    expect(reportOnly).toBeDefined();
    for (const directive of [
      "default-src 'self'",
      "base-uri 'none'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      'upgrade-insecure-requests',
    ]) {
      expect(reportOnly).toContain(directive);
    }
    expect(reportOnly).not.toContain('report-uri');
    expect(response.headers()['content-security-policy']).toBeUndefined();
  });
});

test.describe('Home smoke — reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('disables transitions, animations and smooth scrolling @smoke', async ({ page }) => {
    await page.goto('/');
    const styles = await page.evaluate(() => {
      const link = document.querySelector('main a');
      if (!link) throw new Error('hero CTA not found');
      const computed = getComputedStyle(link);
      return {
        scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
        transitionDuration: computed.transitionDuration,
        animationName: computed.animationName,
      };
    });

    expect(styles.scrollBehavior).toBe('auto');
    expect(styles.transitionDuration).toBe('0s');
    expect(styles.animationName).toBe('none');
  });
});

test.describe('Home smoke — mobile navigation', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('native details opens by keyboard and keeps the focus visible @smoke', async ({ page }) => {
    await page.goto('/');
    const details = page.locator('nav[aria-label="Principal"] details');
    const summary = details.locator('summary');

    await expect(details).not.toHaveAttribute('open', '');
    await summary.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(summary).toBeFocused();

    const outline = await summary.evaluate((element) => {
      const computed = getComputedStyle(element);
      return {
        style: computed.outlineStyle,
        width: computed.outlineWidth,
        color: computed.outlineColor,
      };
    });
    expect(outline.style).not.toBe('none');
    expect(outline.width).toBe('2px');
    // DD-HOME-21.3: the chrome is a light surface, so the ink ring applies.
    expect(outline.color).toBe('rgb(18, 63, 51)');

    await page.keyboard.press('Enter');
    await expect(details).toHaveAttribute('open', '');
    await page.keyboard.press('Space');
    await expect(details).not.toHaveAttribute('open', '');
  });
});

test.describe('Home smoke — focus tokens on light controls', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  // Reviewer B1 / WCAG 2.2 SC 1.4.11: champagne stays on dark surfaces only.
  test('cream search and mobile menu controls use the ink focus ring @smoke', async ({ page }) => {
    await page.goto('/');

    const summary = page.locator('nav[aria-label="Principal"] details summary');
    const searchbox = page.getByRole('searchbox', { name: 'Buscar en la tienda' });

    // The summary precedes the form in the DOM, so Tab lands on the search input.
    await summary.focus();
    await page.keyboard.press('Tab');
    await expect(searchbox).toBeFocused();
    await expect(searchbox).toHaveCSS('outline-color', 'rgb(18, 63, 51)');
    await expect(searchbox).toHaveCSS('outline-width', '2px');

    await summary.click();
    await expect(page.locator('nav[aria-label="Principal"] details')).toHaveAttribute('open', '');

    // With the native details open, Tab enters the cream mobile menu list.
    await summary.focus();
    await page.keyboard.press('Tab');
    const menuLink = page.locator('nav[aria-label="Principal"] details ul a').first();
    await expect(menuLink).toBeFocused();
    await expect(menuLink).toHaveCSS('outline-color', 'rgb(18, 63, 51)');
    await expect(menuLink).toHaveCSS('outline-width', '2px');
  });

  test('HOME-E2E-13: approved focus pairs and no gold text on light surfaces @smoke', async ({
    page,
  }) => {
    await page.goto('/');

    const summary = page.locator('nav[aria-label="Principal"] details summary');
    await summary.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(summary).toBeFocused();
    // DD-HOME-21.3: no dark surface remains in the chrome, so champagne no
    // longer applies; the global ink ring is the single source of truth.
    await expect(summary).toHaveCSS('outline-color', 'rgb(18, 63, 51)');

    await page.keyboard.press('Tab');
    const searchbox = page.getByRole('searchbox', { name: 'Buscar en la tienda' });
    await expect(searchbox).toBeFocused();
    await expect(searchbox).toHaveCSS('outline-color', 'rgb(18, 63, 51)');

    const goldOnLight = await page.evaluate(() => {
      const gold = 'rgb(198, 160, 80)';
      const lightBackgrounds = new Set([
        'rgb(247, 245, 238)',
        'rgb(255, 255, 255)',
        'rgb(238, 244, 241)',
      ]);
      const offenders: string[] = [];

      for (const node of Array.from(document.querySelectorAll('body *'))) {
        if (!(node instanceof HTMLElement)) continue;
        if (getComputedStyle(node).color !== gold) continue;

        const ownsText = Array.from(node.childNodes).some(
          (child) =>
            child.nodeType === Node.TEXT_NODE && (child.textContent ?? '').trim().length > 0,
        );
        if (!ownsText) continue;

        let ancestor: HTMLElement | null = node;
        let background = '';
        while (ancestor !== null) {
          // DD-HOME-24: the hero is a light white surface; the exclusion stays
          // to keep this guard scoped to the chrome (§7.2).
          if (
            ancestor.classList.contains('home-stage') ||
            ancestor.classList.contains('home-stage__chrome')
          ) {
            break;
          }
          const candidate = getComputedStyle(ancestor).backgroundColor;
          if (candidate !== 'transparent' && candidate !== 'rgba(0, 0, 0, 0)') {
            background = candidate;
            break;
          }
          ancestor = ancestor.parentElement;
        }
        if (lightBackgrounds.has(background)) {
          offenders.push(node.textContent?.trim() ?? node.tagName);
        }
      }
      return offenders;
    });

    expect(goldOnLight).toEqual([]);

    // DD-HOME-21.3: sweep every focusable control in both chrome landmarks.
    // A Tab first sets keyboard modality, then focus() targets the control so
    // :focus-visible paints the real ring instead of a programmatic guess.
    await summary.click();
    await expect(page.locator('nav[aria-label="Principal"] details')).toHaveAttribute('open', '');
    const chromeControls = page.locator('header a, header summary, header input, header button, footer a');
    const ink = 'rgb(18, 63, 51)';
    const champagne = 'rgb(230, 204, 135)';
    const wrongRings: string[] = [];
    const champagneRings: string[] = [];
    const controlCount = await chromeControls.count();
    expect(controlCount).toBeGreaterThan(0);

    for (let index = 0; index < controlCount; index += 1) {
      const control = chromeControls.nth(index);
      if (!(await control.isVisible())) continue;

      await page.keyboard.press('Tab');
      await control.focus();
      const ring = await control.evaluate((element) => {
        const computed = getComputedStyle(element);
        return { color: computed.outlineColor, width: computed.outlineWidth };
      });
      const label =
        ((await control.textContent()) ?? '').trim() ||
        (await control.getAttribute('name')) ||
        `control-${index}`;

      if (ring.color === champagne) champagneRings.push(label);
      if (ring.color !== ink || ring.width !== '2px') {
        wrongRings.push(`${label}: ${ring.color} / ${ring.width}`);
      }
    }

    expect(wrongRings).toEqual([]);
    expect(champagneRings).toEqual([]);
  });
});

// WCAG 2.2 SC 1.4.11: the indicator is measured against the colour that is
// actually painted next to it. Checking outline-color alone is a false
// positive: an ink ring with a 2px offset can land on the green header even
// when the control itself is cream (reviewer B1, reopened).
type FocusSample = {
  label: string;
  outlineColor: string;
  outlineWidth: string;
  outlineOffset: string;
  adjacentColor: string;
};

function parseRgb(value: string): [number, number, number] {
  const match = value.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
  if (!match) throw new Error(`Unsupported CSS colour: ${value}`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function relativeLuminance(rgb: readonly [number, number, number]): number {
  const channels = rgb.map((component) => {
    const channel = component / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(outline: string, adjacent: string): number {
  const first = relativeLuminance(parseRgb(outline));
  const second = relativeLuminance(parseRgb(adjacent));
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

async function sampleFocusRing(page: Page, locator: Locator, label: string): Promise<FocusSample> {
  // A Tab first sets keyboard modality so `:focus-visible` also applies to
  // buttons; plain programmatic focus would not paint their indicator.
  await page.keyboard.press('Tab');
  await locator.focus();

  return page.evaluate((focusLabel) => {
    const element = document.activeElement;
    if (!(element instanceof HTMLElement)) throw new Error(`No focused element: ${focusLabel}`);

    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    const y = rect.top + rect.height / 2;
    let adjacent: Element | null = null;

    for (const x of [rect.left - 1, rect.right + 1]) {
      if (x < 0 || x >= window.innerWidth || y < 0 || y >= window.innerHeight) continue;
      const candidate = document.elementFromPoint(x, y);
      if (candidate && candidate !== element && !element.contains(candidate)) {
        adjacent = candidate;
        break;
      }
    }
    if (!adjacent) throw new Error(`No adjacent surface found: ${focusLabel}`);

    let node: HTMLElement | null =
      adjacent instanceof HTMLElement ? adjacent : adjacent.parentElement;
    let adjacentColor = '';
    while (node !== null) {
      const background = getComputedStyle(node).backgroundColor;
      if (background !== 'transparent' && background !== 'rgba(0, 0, 0, 0)') {
        adjacentColor = background;
        break;
      }
      node = node.parentElement;
    }
    if (!adjacentColor) throw new Error(`No adjacent background colour: ${focusLabel}`);

    return {
      label: focusLabel,
      outlineColor: style.outlineColor,
      outlineWidth: style.outlineWidth,
      outlineOffset: style.outlineOffset,
      adjacentColor,
    };
  }, label);
}

test.describe('Home smoke — focus indicator contrast', () => {
  for (const width of [375, 768, 1440]) {
    test(`HOME-E2E-19: focus ring meets 3:1 against its real adjacent surface at ${width}px @smoke`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');

      const summary = page.locator('nav[aria-label="Principal"] details summary');
      const searchbox = page.getByRole('searchbox', { name: 'Buscar en la tienda' });
      const searchButton = page.getByRole('button', { name: 'Buscar' });

      const samples: FocusSample[] = [];
      if (await summary.isVisible()) {
        samples.push(await sampleFocusRing(page, summary, 'Menú summary'));
      } else {
        // The native <details> menu is display:none from md upwards; measure
        // the desktop nav link instead of focusing a hidden element.
        const desktopLink = page.locator('nav[aria-label="Principal"] ul a').first();
        samples.push(await sampleFocusRing(page, desktopLink, 'desktop nav link'));
      }
      samples.push(await sampleFocusRing(page, searchbox, 'search input'));
      samples.push(await sampleFocusRing(page, searchButton, 'Buscar button'));

      if (width < 768) {
        await summary.click();
        const menuLink = page.locator('nav[aria-label="Principal"] details ul a').first();
        samples.push(await sampleFocusRing(page, menuLink, 'mobile menu link'));
      }

      for (const sample of samples) {
        expect(Number.parseFloat(sample.outlineWidth), sample.label).toBeGreaterThanOrEqual(2);
        expect(
          contrastRatio(sample.outlineColor, sample.adjacentColor),
          `${sample.label}: ${sample.outlineColor} on ${sample.adjacentColor}`,
        ).toBeGreaterThanOrEqual(3);
      }
    });
  }
});

test.describe('Home smoke — structure, search and copy', () => {
  test('HOME-E2E-02: one H1 and no skipped heading levels @smoke', async ({ page }) => {
    await page.goto('/');

    const levels = await page
      .locator('h1, h2, h3, h4, h5, h6')
      .evaluateAll((elements) => elements.map((element) => Number(element.tagName.slice(1))));

    expect(levels.length).toBeGreaterThan(0);
    expect(levels[0]).toBe(1);
    expect(levels.filter((level) => level === 1)).toEqual([1]);
    for (let index = 1; index < levels.length; index += 1) {
      expect(levels[index] - levels[index - 1], `heading ${index + 1} follows ${index}`).toBeLessThanOrEqual(1);
    }
  });

  test('HOME-E2E-05: search submits a GET to /buscar without XHR @smoke', async ({ page }) => {
    const xhr: string[] = [];
    page.on('request', (request) => {
      // Framework requests are not part of the Home search contract: Next
      // router refreshes and prefetches use fetch() with an _rsc query.
      const url = new URL(request.url());
      if (
        (request.resourceType() === 'xhr' || request.resourceType() === 'fetch') &&
        !url.pathname.startsWith('/_next/') &&
        !url.searchParams.has('_rsc')
      ) {
        xhr.push(`${request.method()} ${request.url()}`);
      }
    });

    await page.goto('/');
    const form = page.getByRole('search');
    await expect(form).toHaveAttribute('method', 'get');
    await expect(form).toHaveAttribute('action', '/buscar');
    await form.getByRole('searchbox', { name: 'Buscar en la tienda' }).fill('shampoo');
    await Promise.all([
      page.waitForURL(/\/buscar\?q=shampoo$/),
      form.getByRole('button', { name: 'Buscar' }).click(),
    ]);

    expect(new URL(page.url()).pathname).toBe('/buscar');
    expect(new URL(page.url()).searchParams.get('q')).toBe('shampoo');
    expect(xhr).toEqual([]);
  });

  test('HOME-E2E-17: no efficacy percentages, diagnoses, AI or guaranteed results @smoke', async ({
    page,
  }) => {
    await page.goto('/');
    // Runtime scripts and inline style attributes are excluded: next/image fill
    // layout styles (e.g. width:100%) are CSS, not copy. Visible text and alt
    // attributes remain covered by the regexes below.
    const html = (await page.content())
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/\sstyle="[^"]*"/gi, '');
    const banned = [
      /\d+(?:[.,]\d+)?\s?%/u,
      /\bdiagn[oó]stic[a-záéíóú]*\b/iu,
      /\binteligencia artificial\b/iu,
      /\bIA\b/u,
      /\bresultados?\s+garantizados?\b/iu,
    ];

    for (const pattern of banned) {
      expect(html.match(pattern), `banned copy matching ${pattern}`).toBeNull();
    }
  });

  test('HOME-E2E-18: legal links stay absent until their routes exist @smoke', async ({ page }) => {
    await page.goto('/');
    // Go-live blocker: legalLinks is intentionally empty in the MVP, but this pass
    // is not an approval. Publish the legal routes and re-check them with
    // forge-sentinel before A2; here we only block invented or dead links.
    const footer = page.locator('footer');
    await expect(footer.getByRole('heading', { name: 'Legales' })).toHaveCount(0);
    await expect(
      footer.getByRole('link', { name: /pol[ií]tica|t[eé]rminos|privacidad/i }),
    ).toHaveCount(0);
  });
});

test.describe('Home smoke — DD-HOME-21 white chrome', () => {
  for (const width of [375, 768, 1440]) {
    test(`HOME-E2E-27: white chrome keeps ink text, primary edges and gold decoration at ${width}px @smoke`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: width === 375 ? 812 : 1024 });
      await page.goto('/');

      const chrome = await page.evaluate(() => {
        const header = document.querySelector('header');
        const footer = document.querySelector('footer');
        const wrapper = document.querySelector('.home-stage__chrome');
        if (
          !(header instanceof HTMLElement) ||
          !(footer instanceof HTMLElement) ||
          !(wrapper instanceof HTMLElement)
        ) {
          throw new Error('Chrome landmarks not found');
        }

        const headerStyle = getComputedStyle(header);
        const footerStyle = getComputedStyle(footer);
        const goldTextColours = new Set([
          'rgb(198, 160, 80)',
          'rgb(230, 204, 135)',
          'rgb(179, 143, 68)',
        ]);
        const goldText: string[] = [];
        for (const region of [header, footer]) {
          for (const node of [region, ...Array.from(region.querySelectorAll('*'))]) {
            if (!(node instanceof HTMLElement)) continue;
            if (!goldTextColours.has(getComputedStyle(node).color)) continue;
            const ownsText = Array.from(node.childNodes).some(
              (child) =>
                child.nodeType === Node.TEXT_NODE && (child.textContent ?? '').trim().length > 0,
            );
            if (ownsText) goldText.push(node.textContent?.trim() ?? node.tagName);
          }
        }

        const linkColours = Array.from(document.querySelectorAll('header nav a, footer a')).map(
          (node) => ({
            label: node.textContent?.trim() ?? '',
            color: getComputedStyle(node).color,
          }),
        );
        const headings = Array.from(footer.querySelectorAll('h3')).map((node) => {
          const style = getComputedStyle(node);
          return {
            color: style.color,
            decorationColor: style.textDecorationColor,
            decorationLine: style.textDecorationLine,
          };
        });
        const tagline = footer.querySelector('p');
        const submit = header.querySelector('button[type="submit"]');
        const submitStyle = submit === null ? null : getComputedStyle(submit);

        return {
          headerSurface: header.dataset.surface,
          footerSurface: footer.dataset.surface,
          headerBackground: headerStyle.backgroundColor,
          wrapperBackground: getComputedStyle(wrapper).backgroundColor,
          footerBackground: footerStyle.backgroundColor,
          headerBorder: {
            width: headerStyle.borderBottomWidth,
            color: headerStyle.borderBottomColor,
          },
          footerBorder: {
            width: footerStyle.borderTopWidth,
            color: footerStyle.borderTopColor,
          },
          nestedSurfaces: Array.from(header.querySelectorAll('[data-surface]')).map((node) =>
            node.getAttribute('data-surface'),
          ),
          goldText,
          linkColours,
          taglineLine: tagline === null ? '' : getComputedStyle(tagline).borderTopColor,
          headings,
          submit:
            submitStyle === null
              ? null
              : { background: submitStyle.backgroundColor, color: submitStyle.color },
          overflow: document.documentElement.scrollWidth - window.innerWidth,
        };
      });

      expect(chrome.headerSurface).toBe('light');
      expect(chrome.footerSurface).toBe('light');
      // DD-HOME-24: the header is still normal chrome, white and opaque.
      expect(chrome.headerBackground).toBe('rgb(255, 255, 255)');
      expect(chrome.wrapperBackground).toBe('rgb(255, 255, 255)');
      expect(chrome.footerBackground).toBe('rgb(255, 255, 255)');
      expect(chrome.headerBorder).toEqual({ width: '2px', color: 'rgb(27, 93, 74)' });
      expect(chrome.footerBorder).toEqual({ width: '2px', color: 'rgb(27, 93, 74)' });
      expect(chrome.nestedSurfaces.length).toBeGreaterThanOrEqual(4);
      expect(chrome.nestedSurfaces.every((surface) => surface === 'light')).toBe(true);
      expect(chrome.goldText).toEqual([]);
      expect(chrome.linkColours.length).toBeGreaterThan(0);
      for (const link of chrome.linkColours) {
        expect(link.color, link.label).toBe('rgb(18, 63, 51)');
      }
      expect(chrome.taglineLine).toBe('rgb(198, 160, 80)');
      // Social/legal headings are data-driven and absent in the DB-free render;
      // when present their underline must still use the approved darker gold.
      for (const heading of chrome.headings) {
        expect(heading.color).toBe('rgb(18, 63, 51)');
        expect(heading.decorationLine).toContain('underline');
        expect(heading.decorationColor).toBe('rgb(179, 143, 68)');
      }
      expect(chrome.submit).toEqual({
        background: 'rgb(27, 93, 74)',
        color: 'rgb(255, 255, 255)',
      });

      const wrapper = page.locator('.home-stage__chrome');
      // DD-HOME-24: there is still no hover/focus reveal to wait for.
      await expect(page.locator('header')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
      await expect(wrapper).toHaveCSS('background-color', 'rgb(255, 255, 255)');
      // The 2px primary edge stays on the header itself, never on the wrapper.
      await expect(page.locator('header')).toHaveCSS(
        'border-bottom',
        '2px solid rgb(27, 93, 74)',
      );
      await expect(wrapper).toHaveCSS('border-bottom-width', '0px');

      // The DB-free footer has no data-driven headings, so hover a link to
      // exercise the same accent-dark underline in the real rendered state.
      const footerLink = page.locator('footer a').first();
      await footerLink.hover();
      const hoverDecoration = await footerLink.evaluate((element) => {
        const style = getComputedStyle(element);
        return { color: style.textDecorationColor, line: style.textDecorationLine };
      });
      expect(hoverDecoration.line).toContain('underline');
      expect(hoverDecoration.color).toBe('rgb(179, 143, 68)');

      if (width === 375) expect(chrome.overflow).toBeLessThanOrEqual(0);
    });
  }
});

test.describe('Home smoke — DD-HOME-22 typography', () => {
  const routes = ['/', '/piel', '/tiendas'];
  const forbiddenHosts = [
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'nihlo.com.co',
    'cdn.shopify.com',
  ];

  test('HOME-E2E-37: Poppins is really loaded on every route @smoke', async ({ page }) => {
    const externalRequests: string[] = [];
    const woff2Requests: string[] = [];
    // Read the body when the response arrives: after navigating away the
    // response body is no longer available (Protocol error in Playwright).
    const cssResponses: Array<Promise<string>> = [];

    page.on('request', (request) => {
      const parsed = new URL(request.url());
      if (forbiddenHosts.some((host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`))) {
        externalRequests.push(`${request.method()} ${request.url()}`);
      }
      if (parsed.pathname.startsWith('/_next/static/media/') && parsed.pathname.endsWith('.woff2')) {
        woff2Requests.push(request.url());
      }
    });
    page.on('response', (response) => {
      if (response.url().includes('/_next/static/css/')) {
        cssResponses.push(response.text().catch(() => ''));
      }
    });

    const fontFamily = (locator: Locator) =>
      locator.evaluate((element) => getComputedStyle(element).fontFamily);

    for (const route of routes) {
      await page.goto(route);
      await page.evaluate(() => document.fonts.ready);

      // Scope to real landmarks: Next dev tooling injects its own button in a
      // <nextjs-portal> outside <main>/<header>/<footer>, with a Geist font.
      const button = page.locator('main button, header button, footer button').first();
      // The approved /piel and /tiendas stubs render only <main>, so they have
      // no real button. Probe the same global CSS with a test-only control
      // instead of adding production markup just to satisfy the test.
      const buttonFamily =
        (await button.count()) > 0
          ? await fontFamily(button)
          : await page.evaluate(() => {
              const probe = document.createElement('button');
              probe.type = 'button';
              probe.textContent = 'Poppins';
              document.body.append(probe);
              const family = getComputedStyle(probe).fontFamily;
              probe.remove();
              return family;
            });

      const families = {
        body: await fontFamily(page.locator('body')),
        h1: await fontFamily(page.locator('h1').first()),
        button: buttonFamily,
      };
      for (const [element, family] of Object.entries(families)) {
        expect(family, `${route} ${element} font-family: ${family}`).toMatch(/Poppins/i);
      }

      const loaded = await page.evaluate(() => ({
        check: document.fonts.check('600 16px Poppins'),
        faces: Array.from(document.fonts).some(
          (face) => /Poppins/i.test(face.family) && face.status === 'loaded',
        ),
        bodyWeight: getComputedStyle(document.body).fontWeight,
        h1Weight: getComputedStyle(document.querySelector('h1') ?? document.body).fontWeight,
        h3Weight: (() => {
          const h3 = document.querySelector('h3');
          return h3 ? getComputedStyle(h3).fontWeight : null;
        })(),
      }));
      expect(loaded.check, `${route} document.fonts.check`).toBe(true);
      expect(loaded.faces, `${route} loaded FontFace`).toBe(true);
      expect(loaded.bodyWeight).toBe('400');
      expect(loaded.h1Weight).toBe('600');
      if (loaded.h3Weight !== null) expect(loaded.h3Weight).toBe('600');

      const renderedFonts = await page.evaluate(() =>
        Array.from(
          new Set(
            Array.from(document.querySelectorAll('*')).map(
              (element) => getComputedStyle(element).fontFamily,
            ),
          ),
        ),
      );
      for (const family of renderedFonts) {
        expect(family, `${route} rendered font-family: ${family}`).not.toMatch(/Inter|Playfair/);
      }

      // Licensing decision DD-HOME-22 §4.8: no HelveticaNeue binaries or
      // references are copied from the reference site.
      const html = (await page.content()).toLowerCase();
      expect(html, `${route} must not ship HelveticaNeue`).not.toContain('helveticaneue');
      const domHasHelvetica = await page.evaluate(() =>
        Array.from(document.querySelectorAll('*')).some((element) =>
          Array.from(element.attributes).some(
            (attribute) =>
              /helveticaneue/i.test(attribute.name) || /helveticaneue/i.test(attribute.value),
          ),
        ),
      );
      expect(domHasHelvetica, `${route} must not reference HelveticaNeue`).toBe(false);
    }

    expect(externalRequests, `forbidden font requests: ${externalRequests.join(', ')}`).toEqual([]);
    expect(woff2Requests.length, 'self-hosted woff2 requests').toBeGreaterThan(0);

    // Legacy font names can survive as unused Tailwind utility class names in
    // dev fixtures; only real font-family declarations are a bundle violation.
    const servedCss = await Promise.all(cssResponses);
    expect(servedCss.length, 'served CSS bodies').toBeGreaterThan(0);
    const appCss = readFileSync(join(process.cwd(), 'app/globals.css'), 'utf8');
    for (const [label, bodies] of [
      ['served CSS', servedCss],
      ['app/globals.css', [appCss]],
    ] as const) {
      for (const [index, css] of bodies.entries()) {
        const declarations = css.match(/font-family\s*:\s*[^;}]+/gi) ?? [];
        for (const declaration of declarations) {
          expect(declaration, `${label} ${index} must not declare Inter/Playfair`).not.toMatch(
            /Inter|Playfair/i,
          );
        }
      }
    }
  });
});
