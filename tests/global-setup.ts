import type { FullConfig } from '@playwright/test';

// QA-EXC-28-01: next/image optimizes each (asset, width, quality) variant on the
// first request. With a 3 MB source and a fully parallel suite, those cold
// encodes queue up and delay the `load` event past the per-test timeout. Warm
// every variant once, before workers start, so the tests exercise the same
// bytes regardless of scheduling. This does not modify the app or its assets.
// 5 manifests assets x 8 widths = 40 warmup requests (C-HOME-28i).
const ASSETS = ['hero-1.png', 'hero-2.png', 'hero-3.png', 'hero-5.jpg', 'hero-6.jpg'] as const;
const WIDTHS = [640, 750, 828, 1080, 1200, 1920, 2048, 3840] as const;
const QUALITY = 75;
const CONCURRENCY = 6;

type ConfigWithRootBaseURL = FullConfig & { use?: { baseURL?: string } };

export default async function globalSetup(config: FullConfig): Promise<void> {
  const rootBaseURL = (config as ConfigWithRootBaseURL).use?.baseURL;
  const baseURL = String(rootBaseURL ?? config.projects[0]?.use?.baseURL ?? 'http://127.0.0.1:3000');
  const queue = ASSETS.flatMap((asset) =>
    WIDTHS.map(
      (width) =>
        `${baseURL}/_next/image?url=${encodeURIComponent(`/slides/${asset}`)}&w=${width}&q=${QUALITY}`,
    ),
  );

  const warmers = Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length > 0) {
      const url = queue.shift();
      if (!url) return;
      const response = await fetch(url, { headers: { Accept: 'image/webp' } });
      if (!response.ok) throw new Error(`image warmup failed (${response.status}): ${url}`);
      await response.arrayBuffer();
    }
  });

  await Promise.all(warmers);
}
