import { mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const targetUrl = process.argv[2] ?? 'http://127.0.0.1:5179/play.html';
const out = new URL('./ui/immediate-reveal/', import.meta.url).pathname;
await mkdir(out, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  reducedMotion: 'no-preference',
  locale: 'zh-CN',
});
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});

await page.goto(targetUrl, { waitUntil: 'networkidle' });
await page.locator('#primaryGameAction').click();
await page.waitForFunction(() => window.__sixGame?.getPhase() === 'choose');
const key = await page.evaluate(() => String(window.__sixGame.getAnswerSlot() + 1));
await page.keyboard.press(key);
await page.waitForTimeout(450);

await page.evaluate(() => {
  const answerCup = document.querySelector('.shell-cup.is-candidate');
  const flower = document.querySelector('#gameFlower');
  window.__revealEvents = [];
  const startedAt = performance.now();
  const record = () => {
    if (answerCup.classList.contains('is-tumbling')
      && !window.__revealEvents.some((event) => event.name === 'cup-tumbling')) {
      window.__revealEvents.push({ name: 'cup-tumbling', at: performance.now() - startedAt });
    }
    if (flower.classList.contains('is-visible')
      && !window.__revealEvents.some((event) => event.name === 'flower-visible')) {
      window.__revealEvents.push({ name: 'flower-visible', at: performance.now() - startedAt });
    }
  };
  new MutationObserver(record).observe(document.querySelector('.phone'), {
    attributes: true,
    subtree: true,
    attributeFilter: ['class'],
  });
});

await page.keyboard.press(key);
await page.waitForFunction(() => window.__revealEvents?.length === 2);
await page.waitForTimeout(70);
await page.locator('.phone').screenshot({ path: `${out}/cup-lift-plus-70ms.png` });

const result = await page.evaluate(() => {
  const flowerStyle = getComputedStyle(document.querySelector('#gameFlower'));
  const events = window.__revealEvents;
  return {
    events,
    deltaMs: Math.abs(events[0].at - events[1].at),
    flowerOpacity: flowerStyle.opacity,
    flowerTransform: flowerStyle.transform,
    phase: window.__sixGame.getPhase(),
  };
});

await browser.close();
console.log(JSON.stringify({ errors, ...result }, null, 2));
