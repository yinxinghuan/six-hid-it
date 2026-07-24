import { mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const targetUrl = process.argv[2] ?? 'http://127.0.0.1:5179/';
const out = new URL('./ui/cat-peek/', import.meta.url).pathname;
await mkdir(out, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  locale: 'zh-CN',
});
const errors = [];
const samples = [];
page.on('pageerror', (error) => errors.push(error.message));

async function capture(name) {
  const metrics = await page.evaluate(() => {
    const cat = document.querySelector('.game-cat').getBoundingClientRect();
    const table = document.querySelector('.table-surface').getBoundingClientRect();
    return {
      phase: window.__sixGame?.getPhase(),
      catTop: Math.round(cat.top * 10) / 10,
      catBottom: Math.round(cat.bottom * 10) / 10,
      tableTop: Math.round(table.top * 10) / 10,
      hiddenBelowTable: Math.round(Math.max(0, cat.bottom - table.top) * 10) / 10,
      transform: getComputedStyle(document.querySelector('.game-cat')).transform,
    };
  });
  samples.push({ name, ...metrics });
  await page.locator('.phone').screenshot({ path: `${out}/${name}.png` });
}

await page.goto(targetUrl, { waitUntil: 'networkidle' });
await capture('01-idle-partly-hidden');
await page.locator('#primaryGameAction').click();
await page.waitForFunction(() => window.__sixGame?.getPhase() === 'shuffle');
await page.waitForTimeout(380);
await capture('02-shuffle-crouched');
await page.waitForFunction(() => window.__sixGame?.getPhase() === 'choose');
await page.waitForTimeout(280);
await capture('03-choice-emerging');
await page.waitForTimeout(300);
await capture('04-choice-settled');
const slot = await page.evaluate(() => window.__sixGame.getAnswerSlot());
await page.keyboard.press(String(slot + 1));
await page.waitForTimeout(190);
await capture('05-nudge-head-peak');
await page.waitForTimeout(270);
await capture('06-nudge-restored');

const viewport = await page.evaluate(() => ({
  scrollWidth: document.documentElement.scrollWidth,
  clientWidth: document.documentElement.clientWidth,
}));
console.log(JSON.stringify({ errors, samples, ...viewport }, null, 2));
await browser.close();
