import { mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const targetUrl = process.argv[2] ?? 'http://127.0.0.1:5179/';
const out = new URL('./ui/cat-motion-v2/', import.meta.url).pathname;
await mkdir(out, { recursive: true });

const browser = await chromium.launch({ headless: true });
const evidence = [];

for (const viewport of [
  { width: 390, height: 844, name: 'primary' },
  { width: 320, height: 568, name: 'narrow' },
]) {
  const page = await browser.newPage({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    reducedMotion: 'no-preference',
    locale: 'zh-CN',
  });
  await page.goto(targetUrl, { waitUntil: 'networkidle' });
  await page.locator('#primaryGameAction').click();
  await page.waitForFunction(() => window.__sixGame?.getPhase() === 'choose');
  await page.waitForTimeout(620);

  for (let frame = 0; frame < 4; frame += 1) {
    const cat = await page.locator('.game-cat').boundingBox();
    evidence.push({ viewport: viewport.name, state: `watch-${frame}`, cat });
    await page.locator('.phone').screenshot({
      path: `${out}/${viewport.name}-watch-${frame}.png`,
    });
    await page.waitForTimeout(520);
  }

  const answerSlot = await page.evaluate(() => window.__sixGame.getAnswerSlot());
  await page.keyboard.press(String(answerSlot + 1));
  for (const [label, delay] of [
    ['nudge-start', 0],
    ['nudge-contact', 210],
    ['nudge-recover', 190],
  ]) {
    await page.waitForTimeout(delay);
    const cat = await page.locator('.game-cat').boundingBox();
    evidence.push({ viewport: viewport.name, state: label, cat });
    await page.locator('.phone').screenshot({
      path: `${out}/${viewport.name}-${label}.png`,
    });
  }
  await page.close();
}

await browser.close();
console.log(JSON.stringify(evidence, null, 2));
