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
await page.waitForTimeout(240);
await page.locator('.phone').screenshot({ path: `${out}/01-nudge-peak.png` });
const nudgePeak = await page.evaluate(() => {
  const paw = document.querySelector('#gamePaw');
  const cup = document.querySelector('.shell-cup.is-nudging');
  const pawStyle = getComputedStyle(paw);
  const cupStyle = getComputedStyle(cup);
  return {
    pawRect: paw.getBoundingClientRect().toJSON(),
    cupRect: cup.getBoundingClientRect().toJSON(),
    pawX: pawStyle.getPropertyValue('--paw-x'),
    pawY: pawStyle.getPropertyValue('--paw-y'),
    pawTransform: pawStyle.transform,
    cupTransform: cupStyle.transform,
  };
});
await page.waitForTimeout(65);
await page.locator('.phone').screenshot({ path: `${out}/02-nudge-rebound.png` });
await page.waitForTimeout(145);
await page.locator('.phone').screenshot({ path: `${out}/03-nudge-rest.png` });
await page.keyboard.press(key);
await page.waitForTimeout(240);
await page.locator('.phone').screenshot({ path: `${out}/04-strong-nudge-peak.png` });
await page.waitForTimeout(210);
await page.locator('.phone').screenshot({ path: `${out}/05-strong-nudge-rest.png` });
await page.keyboard.press(key);

for (const [name, delay] of [
  ['06-anticipation', 120],
  ['07-paw-contact', 330],
  ['08-airborne', 180],
  ['09-table-impact', 270],
  ['10-paw-retract', 270],
  ['11-settled-reveal', 420],
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
console.log(JSON.stringify({ errors, nudgePeak, ...metrics }, null, 2));
await browser.close();
