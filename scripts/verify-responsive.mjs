import { chromium, devices } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';

mkdirSync('docs/connect/screenshots', { recursive: true });
const browser = await chromium.launch({ channel: 'msedge' });
const results = []; console.log('Phone test viewport:', devices['Pixel 7'].viewport);
const viewports = [
  { name: 'reference-native', width: 1280, height: 956 },
  { name: 'small-phone', width: 320, height: 568 },
  { name: 'phone-landscape', width: 844, height: 390 },
  { name: 'ultrawide', width: 3440, height: 1440 },
];
try {
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport, reducedMotion: 'reduce' });
    await page.goto('http://127.0.0.1:5173/');
    await page.evaluate(() => document.fonts.ready);
    const metrics = await page.evaluate(() => {
      const rect = selector => {
        const { x, y, width, height, right, bottom } = document.querySelector(selector).getBoundingClientRect();
        return { x, y, width, height, right, bottom };
      };
      return {
        overflow: document.documentElement.scrollWidth > innerWidth,
        title: rect('.headline'), cta: rect('.pill-cta'), stage: rect('.stage'),
        logoCount: document.querySelectorAll('.logos, .lg').length,

      };
    });
    assert.equal(metrics.overflow, false, `${viewport.name}: horizontal overflow`);
    assert(metrics.title.x >= 0 && metrics.title.right <= viewport.width, `${viewport.name}: headline clipped`);
    assert(metrics.cta.height >= 44, `${viewport.name}: CTA touch target too short`);
    assert(metrics.cta.bottom <= viewport.height, `${viewport.name}: CTA outside first viewport`);
    assert.equal(metrics.logoCount, 0, 'Removed partner strip must not return');
    await page.screenshot({ path: `docs/connect/screenshots/landing-${viewport.name}.png` });
    await page.evaluate(() => scrollTo(0, innerHeight * 4));
    await page.waitForFunction(() => document.querySelector('.app-shell').dataset.checkpointState === 'CONNECT_CHECKPOINT_START');
    await page.waitForFunction(() => {
      const image = document.querySelector('.connect-sequence');
      return image.complete && image.naturalWidth === 1920
        && document.querySelector('#connect-checkpoint').dataset.loading === 'false';
    });
    const connect = await page.locator('.connect-sequence').evaluate(image => ({
      width: image.naturalWidth, height: image.naturalHeight, fit: getComputedStyle(image).objectFit,
      progress: document.querySelector('#connect-checkpoint').dataset.coreProgress,
      overflow: document.documentElement.scrollWidth > innerWidth,
    }));
    assert.equal(connect.overflow, false);
    assert.equal(connect.fit, 'contain');
    assert.equal(connect.width / connect.height, 16 / 9);
    assert.equal(Number(connect.progress), 0);
    metrics.connect = connect;
    await page.screenshot({ path: `docs/connect/screenshots/connect-${viewport.name}.png` });

    results.push({ ...viewport, status: 'passed', metrics });
    console.log(`${viewport.name} ${viewport.width}Ã—${viewport.height}: passed`);
    await page.close();
  }
  const fallbackPage = await browser.newPage();
  await fallbackPage.route('**/video/landing-ambient.mp4', route => route.abort());
  await fallbackPage.goto('http://127.0.0.1:5173/');
  await fallbackPage.locator('.plate-poster').waitFor({ state: 'visible' });
  const imageLoaded = await fallbackPage.locator('.plate-poster').evaluate(image => image.complete && image.naturalWidth > 0);
  assert(imageLoaded, 'Approved opening still remains visible on media failure');
  await fallbackPage.locator('.pill-cta').click();
  await fallbackPage.locator('#signup-modal').waitFor({ state: 'visible' });
  await fallbackPage.keyboard.press('Escape');
  await fallbackPage.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await fallbackPage.waitForFunction(() => document.querySelector('.app-shell').dataset.experienceState === 'core');
  results.push({ name: 'landing-video-failure-poster-and-guest-traversal', status: 'passed' });
  await fallbackPage.close();
  writeFileSync('docs/connect/responsive-checks.json', JSON.stringify({ browser: browser.version(), results }, null, 2));
} finally {
  await browser.close();
}
