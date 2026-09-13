import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';

mkdirSync('docs/connect/screenshots', { recursive: true });
const browser = await chromium.launch({ channel: 'msedge' });
const results = [];
try {
  for (const viewport of [
    { width: 1672, height: 941, name: 'native' },
    { width: 412, height: 839, name: 'phone' },
    { width: 768, height: 1024, name: 'tablet' },
  ]) {
    const page = await browser.newPage({ viewport, hasTouch: viewport.name !== 'native', isMobile: viewport.name === 'phone' });
    const client = await page.context().newCDPSession(page);
    await page.goto('http://127.0.0.1:5173/');
    await page.evaluate(() => document.fonts.ready);
    const initial = await page.locator('.connect-sequence').elementHandle();
    const samples = [];
    for (let cycle = 0; cycle < 2; cycle++) {
      let previous = -1;
      for (const progress of [0, .4, .45, .42, .5, .48, .7, .3, .9, .15, 1, 0]) {
        const startedAt = Date.now();
        const direction = progress >= previous ? 'forward' : 'reverse';
        await page.evaluate(p => scrollTo(0, innerHeight * (4 + p * 4)), progress);
        await page.waitForFunction(({ p, direction }) => {
          const checkpoint = document.querySelector('#connect-checkpoint');
          return window.__CONNECT__.active && window.__CONNECT__.cache.capacity > 0
            && Math.abs(Number(checkpoint.dataset.coreProgress) - p) < .001
            && checkpoint.dataset.loading === 'false'
            && checkpoint.dataset.frameIndex === checkpoint.dataset.targetIndex
            && checkpoint.dataset.renderDirection === direction;
        }, { p: progress, direction });
        const state = await page.evaluate(() => window.__CONNECT__);
        assert.equal(state.cache.capacity, viewport.name === 'native' ? 8 : 6);
        assert(state.cache.decoded <= state.cache.capacity, 'Decoded cache is bounded');
        assert(state.cache.fetching <= 2 && state.cache.decoding <= 2, 'Loading concurrency is bounded');
        samples.push({ cycle, progress: state.progress, direction: state.direction, frame: state.target.index,
          readyMs: Date.now() - startedAt, cache: state.cache });
        if (cycle === 0 && [0, .5, 1].includes(progress)) {
          await page.screenshot({ path: `docs/connect/screenshots/${viewport.name}-${direction}-${progress}.png` });
        }
        previous = progress;
      }
      await page.evaluate(() => scrollTo(0, 0));
      await page.waitForFunction(() => window.__CONNECT__.cache.capacity === 0);
      await page.waitForTimeout(500);
      await client.send('HeapProfiler.collectGarbage');
      await page.waitForTimeout(100);
      await client.send('HeapProfiler.collectGarbage');
      const { detachedNodes } = await client.send('DOM.getDetachedDomNodes');
      assert.equal(detachedNodes.length, 0);
      const counters = await client.send('Memory.getDOMCounters');
      samples.push({ cycle, afterExit: true, counters, detachedNodes: detachedNodes.length, cache: await page.evaluate(() => window.__CONNECT__.cache) });
      assert(await initial.evaluate(element => element === document.querySelector('.connect-sequence')));
    }
    assert.equal(await page.locator('.connect-sequence').count(), 1);
    results.push({ viewport, samples });
    console.log(viewport.name + ': frame mapping, bounded cache, and repeated cleanup passed');
    await page.close();
  }
  writeFileSync('docs/connect/verification.json', JSON.stringify(results, null, 2));
} finally { await browser.close(); }
