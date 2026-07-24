import { mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const pass = process.argv[2] ?? 'first-pass';
const out = new URL(`./ui/${pass}/`, import.meta.url).pathname;
await mkdir(out, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = [];

for (const viewport of [{ width: 1440, height: 980, name: 'review-desktop' }, { width: 390, height: 844, name: 'review-mobile' }, { width: 320, height: 568, name: 'review-narrow' }]) {
  const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('http://127.0.0.1:5179/', { waitUntil: 'networkidle' });
  await page.screenshot({ path: `${out}/${viewport.name}.png`, fullPage: true });
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    productImageLoaded: [...document.images].every((image) => image.complete && image.naturalWidth > 0),
    shopLinks: [...document.querySelectorAll('a[href*="lamose-titanium-espresso-cup"]')].length,
  }));
  results.push({ name: viewport.name, errors, ...metrics });
  await page.locator('.cup-two').click();
  await page.waitForTimeout(500);
  await page.locator('.phone').screenshot({ path: `${out}/${viewport.name}-success.png` });
  await page.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
