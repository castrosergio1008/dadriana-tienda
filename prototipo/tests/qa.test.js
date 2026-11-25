/* Structural QA: per-element overflow + image loading. */
const puppeteer = require('puppeteer-core');
const path = require('path');
const { pathToFileURL } = require('url');
const URL = pathToFileURL(path.resolve(__dirname, '..', 'index.html')).href;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const u = req.url();
    if (u.includes('fonts.googleapis.com') || u.includes('fonts.gstatic.com')) req.respond({ status: 204, body: '' });
    else req.continue();
  });

  const views = ['#/home', '#/plp', '#/pdp/mascarilla-reparadora', '#/pdp/labial-mate', '#/checkout', '#/confirmation', '#/tracking'];
  let issues = 0;

  for (const width of [375, 768, 1440]) {
    for (const view of views) {
      await page.setViewport({ width, height: 900 });
      await page.goto(URL + view, { waitUntil: 'domcontentloaded' });
      await sleep(500);
      const bad = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const results = [];
        const skipSelectors = 'script, style, link, meta, br, hr, svg, path';
        document.querySelectorAll('body *').forEach((el) => {
          if (el.matches(skipSelectors)) return;
          // ignore children of intentionally scrollable containers
          let p = el.parentElement;
          let scrollableAncestor = false;
          while (p && p !== document.body) {
            const ox = getComputedStyle(p).overflowX;
            if (ox === 'auto' || ox === 'scroll' || ox === 'hidden') { scrollableAncestor = true; break; }
            p = p.parentElement;
          }
          if (scrollableAncestor) return;
          const r = el.getBoundingClientRect();
          if (r.width > 0 && r.height > 0 && (r.right > vw + 1 || r.left < -1)) {
            results.push({
              tag: el.tagName.toLowerCase(),
              cls: (el.className || '').toString().slice(0, 60),
              left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width),
              text: (el.textContent || '').trim().slice(0, 30),
            });
          }
        });
        return results.slice(0, 12);
      });
      if (bad.length) {
        issues += bad.length;
        console.log(`OVERFLOW @ ${width}px ${view}`);
        bad.forEach((b) => console.log('   ', JSON.stringify(b)));
      }
    }
  }
  console.log(issues === 0 ? 'No per-element horizontal overflow found.' : `${issues} overflowing elements`);

  // Image loading: fresh load per view + scroll to trigger lazy images.
  // Hidden views and off-screen lazy images are not counted as broken.
  await page.setViewport({ width: 1440, height: 900 });
  const imageViews = ['#/home', '#/plp', '#/pdp/mascarilla-reparadora'];
  let totalImages = 0;
  const brokenImages = [];
  for (const view of imageViews) {
    await page.goto(URL + view, { waitUntil: 'domcontentloaded' });
    await sleep(400);
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 500) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      window.scrollTo(0, 0);
    });
    await sleep(800);
    const report = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img')).filter((i) => !i.closest('[hidden]'));
      return {
        total: imgs.length,
        broken: imgs.filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.getAttribute('src')),
      };
    });
    totalImages += report.total;
    brokenImages.push(...report.broken);
  }
  console.log(`Images: ${totalImages} total, broken: ${JSON.stringify(brokenImages)}`);

  // Check all catalog images resolve
  const assets = await page.evaluate(async () => {
    const srcs = Array.from(document.querySelectorAll('img')).map((i) => i.getAttribute('src'));
    const unique = [...new Set(srcs)];
    const results = [];
    for (const src of unique) {
      const ok = await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = src;
      });
      results.push({ src, ok });
    }
    return results.filter((r) => !r.ok);
  });
  console.log('Unreachable images:', JSON.stringify(assets));

  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
