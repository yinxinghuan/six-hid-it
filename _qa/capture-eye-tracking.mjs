import { mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const targetUrl = process.argv[2] ?? 'http://127.0.0.1:5179/';
const out = new URL('./ui/eye-tracking-v1/', import.meta.url).pathname;
await mkdir(out, { recursive: true });

const browser = await chromium.launch({ headless: true });
const evidence = [];

async function eyeMetrics(page, state, viewport) {
  const metrics = await page.evaluate(() => {
    const phone = document.querySelector('.phone');
    const left = getComputedStyle(document.querySelector('.cat-pupil-left'));
    const right = getComputedStyle(document.querySelector('.cat-pupil-right'));
    return {
      phase: window.__sixGame?.getPhase(),
      phoneClass: phone.className,
      effort: phone.dataset.effort,
      leftTransform: left.transform,
      rightTransform: right.transform,
      pupilSize: `${left.width} × ${left.height}`,
    };
  });
  evidence.push({ viewport, state, ...metrics });
}

for (const viewport of [
  { width: 390, height: 844, name: '390x844' },
  { width: 320, height: 568, name: '320x568' },
]) {
  const page = await browser.newPage({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    reducedMotion: 'no-preference',
    locale: 'zh-CN',
  });
  await page.goto(targetUrl, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: '#alteru-guest-banner{display:none!important}' });
  await page.locator('#primaryGameAction').click();
  await page.waitForFunction(() => window.__sixGame?.getPhase() === 'shuffle');

  for (let step = 0; step < 3; step += 1) {
    await page.waitForFunction(() => document.querySelector('.phone').classList.contains('is-eye-tracking'));
    await page.waitForTimeout(90);
    const state = `platform-layout-shuffle-${step + 1}`;
    await eyeMetrics(page, state, viewport.name);
    await page.locator('.phone').screenshot({ path: `${out}/${viewport.name}-${state}.png` });
    await page.waitForFunction(() => !document.querySelector('.phone').classList.contains('is-eye-tracking'));
  }

  await page.waitForFunction(() => window.__sixGame?.getPhase() === 'choose');
  await page.waitForTimeout(180);
  await eyeMetrics(page, 'platform-layout-choose-center', viewport.name);
  await page.locator('.phone').screenshot({ path: `${out}/${viewport.name}-platform-layout-choose-center.png` });

  await page.keyboard.press('1');
  await page.waitForTimeout(90);
  await eyeMetrics(page, 'platform-layout-select-left', viewport.name);
  await page.locator('.phone').screenshot({ path: `${out}/${viewport.name}-platform-layout-select-left.png` });
  await page.waitForTimeout(430);

  await page.keyboard.press('3');
  await page.waitForTimeout(90);
  await eyeMetrics(page, 'platform-layout-switch-right', viewport.name);
  await page.locator('.phone').screenshot({ path: `${out}/${viewport.name}-platform-layout-switch-right.png` });
  await page.close();
}

const external = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  locale: 'zh-CN',
});
await external.goto(targetUrl, { waitUntil: 'networkidle' });
await external.screenshot({ path: `${out}/390x844-external-guest-entry.png`, fullPage: true });
evidence.push({
  viewport: '390x844',
  state: 'external-guest-entry',
  guestBanner: await external.locator('#alteru-guest-banner').count(),
});
await external.close();

await browser.close();
console.log(JSON.stringify(evidence, null, 2));
