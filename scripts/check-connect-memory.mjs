import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';

const browser = await chromium.launch({ channel: 'msedge' });
const samples = [];
try {
  const page = await browser.newPage();
  const client = await page.context().newCDPSession(page);
  await client.send('Performance.enable');
  await page.goto('http://127.0.0.1:5173/');
  await page.evaluate(() => document.fonts.ready);
  for (let cycle = 0; cycle < 5; cycle++) {
    for (const progress of [0, .4, .45, .42, .5, .48, .7, .3, .9, .15, 1, 0]) {
      await page.evaluate(p => scrollTo(0, innerHeight * (4 + p * 4)), progress);
      await page.waitForFunction(p => {
        const state = document.querySelector('#connect-checkpoint').dataset;
        return window.__CONNECT__.active && Math.abs(Number(state.coreProgress) - p) < .001
          && state.loading === 'false' && state.frameIndex === state.targetIndex;
      }, progress);
    }
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForFunction(() => window.__CONNECT__.cache.capacity === 0);
    // Let aborted fetch/decode promises settle before measuring retained objects.
    await page.waitForTimeout(500);
    await client.send('HeapProfiler.collectGarbage');
    await page.waitForTimeout(100);
    await client.send('HeapProfiler.collectGarbage');
    const { detachedNodes } = await client.send('DOM.getDetachedDomNodes');
    const counters = await client.send('Memory.getDOMCounters');
    const { metrics } = await client.send('Performance.getMetrics');
    const cache = await page.evaluate(() => window.__CONNECT__.cache);
    assert.equal(detachedNodes.length, 0, 'No detached preload images remain after exit');
    assert(Object.values(cache).every(value => value === 0), 'Checkpoint cache is released');
    if (samples.length) {
      assert(counters.nodes <= samples[0].counters.nodes + 4, 'DOM nodes do not accumulate between cycles');
      assert(counters.jsEventListeners <= samples[0].counters.jsEventListeners, 'Listeners do not accumulate');
    }
    samples.push({ cycle, detachedNodes: detachedNodes.length, counters, cache,
      heap: Object.fromEntries(metrics.filter(metric => ['JSHeapUsedSize', 'JSHeapTotalSize'].includes(metric.name))
        .map(metric => [metric.name, metric.value])) });
    console.log('Cycle', cycle + 1, JSON.stringify(samples.at(-1)));
  }
  mkdirSync('docs/connect', { recursive: true });
  writeFileSync('docs/connect/memory-verification.json', JSON.stringify({ browser: browser.version(), samples }, null, 2));
} finally { await browser.close(); }
