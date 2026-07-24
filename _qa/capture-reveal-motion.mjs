import { mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const targetUrl = process.argv[2] ?? 'http://127.0.0.1:5179/play.html';
const out = new URL('./ui/reveal-motion/', import.meta.url).pathname;
await mkdir(out, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  locale: 'zh-CN',
});
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
await page.goto(targetUrl, { waitUntil: 'networkidle' });
await page.locator('#primaryGameAction').click();
await page.waitForFunction(() => window.__sixGame?.getPhase() === 'choose');
const slot = await page.evaluate(() => window.__sixGame.getAnswerSlot());
const key = String(slot + 1);

await page.keyboard.press(key);
await page.waitForTimeout(330);
await page.locator('.phone').screenshot({ path: `${out}/01-grounded-nudge.png` });
await page.keyboard.press(key);
await page.waitForTimeout(330);
await page.locator('.phone').screenshot({ path: `${out}/02-grounded-crooked.png` });
await page.keyboard.press(key);

for (const [name, delay] of [
  ['03-anticipation', 120],
  ['04-paw-contact', 330],
  ['05-airborne', 180],
  ['06-table-impact', 270],
  ['07-paw-retract', 270],
  ['08-settled-reveal', 420],
]) {
  await page.waitForTimeout(delay);
  await page.locator('.phone').screenshot({ path: `${out}/${name}.png` });
}

const metrics = await page.evaluate(() => ({
  phase: window.__sixGame?.getPhase(),
  score: window.__sixGame?.getScore(),
  scrollWidth: document.documentElement.scrollWidth,
  clientWidth: document.documentElement.clientWidth,
}));
console.log(JSON.stringify({ errors, ...metrics }, null, 2));
await browser.close();
