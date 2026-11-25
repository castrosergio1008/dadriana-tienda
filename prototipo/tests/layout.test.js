const puppeteer = require('puppeteer-core');
const path = require('path');
const { pathToFileURL } = require('url');
const URL = pathToFileURL(path.resolve(__dirname, '..', 'index.html')).href;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', headless: 'new',
    args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage'] });
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const u = req.url();
    if (u.includes('fonts.googleapis.com') || u.includes('fonts.gstatic.com')) req.respond({ status: 204, body: '' });
    else req.continue();
  });
  for (const width of [375, 768, 1440]) {
    await page.setViewport({ width, height: 1000 });
    await page.goto(URL + '#/plp', { waitUntil: 'domcontentloaded' }); await sleep(500);
    const cols = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('#plp-grid .product-card'));
      const lefts = [...new Set(cards.map(c => Math.round(c.getBoundingClientRect().left)))];
      return { n: cards.length, lefts };
    });
    console.log(`PLP ${width}px: ${cols.n} cards, columns=${cols.lefts.length} (${cols.lefts.join(',')})`);
  }
  for (const width of [375, 1440]) {
    await page.setViewport({ width, height: 1000 });
    await page.goto(URL + '#/pdp/aceite-argan', { waitUntil: 'domcontentloaded' }); await sleep(500);
    const layout = await page.evaluate(() => {
      const g = document.querySelector('.pdp-gallery').getBoundingClientRect();
      const i = document.querySelector('.pdp-info').getBoundingClientRect();
      return { galleryLeft: Math.round(g.left), infoLeft: Math.round(i.left), sideBySide: i.left >= g.right - 5 };
    });
    console.log(`PDP ${width}px: galleryLeft=${layout.galleryLeft} infoLeft=${layout.infoLeft} sideBySide=${layout.sideBySide}`);
  }
  // Add an item so the checkout renders its full layout (empty cart shows an empty state).
  await page.goto(URL + '#/plp', { waitUntil: 'domcontentloaded' }); await sleep(400);
  await page.evaluate(() => {
    const btn = document.querySelector('#plp-grid .product-card__quick');
    if (btn) btn.click();
  });
  await sleep(400);
  for (const width of [375, 1440]) {
    await page.setViewport({ width, height: 1000 });
    await page.goto(URL + '#/checkout', { waitUntil: 'domcontentloaded' }); await sleep(500);
    const layout = await page.evaluate(() => {
      const s = document.querySelector('.checkout-steps').getBoundingClientRect();
      const sum = document.querySelector('.checkout-summary').getBoundingClientRect();
      return { stepsLeft: Math.round(s.left), summaryLeft: Math.round(sum.left), summaryTop: Math.round(sum.top), sideBySide: sum.left >= s.right - 5 };
    });
    console.log(`Checkout ${width}px: stepsLeft=${layout.stepsLeft} summaryLeft=${layout.summaryLeft} summaryTop=${layout.summaryTop} sideBySide=${layout.sideBySide}`);
  }
  await browser.close();
})();
