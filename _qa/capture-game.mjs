import { mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const pass = process.argv[2] ?? 'game-first-pass';
const onlyName = process.argv[3];
const targetUrl = process.argv[4] ?? 'http://127.0.0.1:5179/';
const out = new URL(`./ui/${pass}/`, import.meta.url).pathname;
await mkdir(out, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = [];

async function waitForPhase(page, expected, timeout = 15000) {
  await page.waitForFunction(
    (phase) => window.__sixGame?.getPhase() === phase,
    expected,
    { timeout },
  );
}

async function answerCorrectly(page) {
  const slot = await page.evaluate(() => window.__sixGame.getAnswerSlot());
  for (let tap = 0; tap < 3; tap += 1) {
    await page.keyboard.press(String(slot + 1));
    await page.waitForTimeout(120);
  }
}

const viewports = [
  { width: 1440, height: 980, name: 'game-desktop', journey: 'slice' },
  { width: 390, height: 844, name: 'game-mobile', journey: 'win' },
  { width: 320, height: 568, name: 'game-narrow', journey: 'lose' },
].filter((viewport) => !onlyName || viewport.name === onlyName);

for (const viewport of viewports) {
  const page = await browser.newPage({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
    locale: viewport.name === 'game-mobile' ? 'zh-CN' : 'en-US',
  });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto(targetUrl, { waitUntil: 'networkidle' });
  await page.screenshot({ path: `${out}/${viewport.name}-review.png`, fullPage: true });
  await page.locator('.phone').screenshot({ path: `${out}/${viewport.name}-entry.png` });
  await page.locator('#primaryGameAction').click();
  await waitForPhase(page, 'choose');
  await page.locator('.phone').screenshot({ path: `${out}/${viewport.name}-choose.png` });

  if (viewport.journey === 'lose') {
    const answerSlot = await page.evaluate(() => window.__sixGame.getAnswerSlot());
    const wrongKey = String(((answerSlot + 1) % 3) + 1);
    await page.keyboard.press(wrongKey);
    await page.waitForTimeout(120);
    await page.locator('.phone').screenshot({ path: `${out}/${viewport.name}-nudge-one.png` });
    await page.keyboard.press(wrongKey);
    await page.waitForTimeout(120);
    await page.locator('.phone').screenshot({ path: `${out}/${viewport.name}-nudge-two.png` });
    await page.keyboard.press(wrongKey);
    await waitForPhase(page, 'reveal');
    await page.waitForTimeout(180);
    await page.locator('.phone').screenshot({ path: `${out}/${viewport.name}-wrong-reveal.png` });
    await waitForPhase(page, 'failed');
    await page.locator('.phone').screenshot({ path: `${out}/${viewport.name}-failed.png` });
    await page.locator('#primaryGameAction').click();
    await waitForPhase(page, 'choose');
    await waitForPhase(page, 'reveal', 11000);
    await page.locator('.phone').screenshot({ path: `${out}/${viewport.name}-timeout-reveal.png` });
    await waitForPhase(page, 'failed');
    await page.locator('.phone').screenshot({ path: `${out}/${viewport.name}-timeout-result.png` });
  } else {
    await answerCorrectly(page);
    await waitForPhase(page, 'reveal');
    await page.waitForTimeout(180);
    await page.locator('.phone').screenshot({ path: `${out}/${viewport.name}-correct-reveal.png` });
    if (viewport.journey === 'win') {
      for (let round = 1; round < 3; round += 1) {
        await waitForPhase(page, 'choose');
        await answerCorrectly(page);
        await waitForPhase(page, 'reveal');
      }
      await waitForPhase(page, 'complete');
      await page.locator('.phone').screenshot({ path: `${out}/${viewport.name}-complete.png` });
    }
  }

  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    imagesLoaded: [...document.images].every((image) => image.complete && image.naturalWidth > 0),
    shopLinks: [...document.querySelectorAll('a[href*="lamose-titanium-espresso-cup"]')].length,
    phase: window.__sixGame?.getPhase(),
    score: window.__sixGame?.getScore(),
  }));
  results.push({ name: viewport.name, errors, ...metrics });
  await page.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
