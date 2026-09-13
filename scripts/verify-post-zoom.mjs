import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const browser = await chromium.launch({ channel: 'msedge' });
mkdirSync('docs/scroll-transition/screenshots', { recursive: true });
const results = [];
try {
  for (const viewport of [
    { width: 1672, height: 941, name: 'native-preview' },
    { width: 412, height: 839, name: 'phone-preview' },
    { width: 3440, height: 1440, name: 'wide-preview' },
  ]) {
    const page = await browser.newPage({ viewport, reducedMotion: 'reduce' });
    await page.goto('http://127.0.0.1:5173/');
    await page.evaluate(() => document.fonts.ready);
    const samples = [];
    for (const [name, position] of [
      ['light', 3], ['midpoint', 3.5], ['connect', 4],
      ['reverse-one-pixel', 4 - 1 / viewport.height], ['reverse-midpoint', 3.5], ['reverse-light', 3],
    ]) {
      const sample = await page.evaluate(async value => {
        scrollTo(0, innerHeight * value);
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        const visual = getComputedStyle(document.querySelector('.frame-visual'));
        return {
          viewport: [innerWidth, innerHeight], overflow: document.documentElement.scrollWidth > innerWidth,
          transform: visual.transform, opacity: Number(visual.opacity),
          state: document.querySelector('.app-shell').dataset.checkpointState,
        };
      }, position);
      assert.equal(sample.overflow, false);
      assert.equal(sample.transform, 'matrix(12, 0, 0, 12, 0, 0)');
      if (name.includes('light')) assert.equal(sample.opacity, 1);
      if (name.includes('midpoint')) assert(Math.abs(sample.opacity - .5) < .002);
      if (name === 'connect') assert.equal(sample.opacity, 0);
      if (name === 'reverse-one-pixel') assert(sample.opacity > 0 && sample.opacity < .001);
      await page.screenshot({ path: `docs/scroll-transition/screenshots/${viewport.name}-${name}.png` });
      samples.push({ name, ...sample });
    }
    results.push({ name: viewport.name, samples });
    console.log(`${viewport.name}: immediate reveal and continuous reverse passed`);
    await page.close();
  }
  writeFileSync('docs/scroll-transition/visual-metrics.json', JSON.stringify(results, null, 2));
} finally { await browser.close(); }

