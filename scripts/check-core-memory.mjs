import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';

// Development review only; the public chain remains gated before invalid Create.
const browser = await chromium.launch({ channel: 'msedge' });
const samples = [];
const activeSamples = [];
try {
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const client = await page.context().newCDPSession(page);
  await client.send('Performance.enable');
  await page.goto('http://127.0.0.1:5173/docs/core-chain/review.html?core=learn');
  for (let cycle = 0; cycle < 3; cycle++) {
    for (const core of ['learn', 'discover']) {
      await page.getByRole('button', { name: core === 'learn' ? 'Learn' : 'Discover', exact: true }).click();
      for (const progress of [0, .5, .45, .8, .2, 1, 0]) {
        await page.evaluate(p => scrollTo(0, innerHeight * 4 * p), progress);
        await page.waitForFunction(({ core, p }) => {
          const state = document.querySelector('#' + core + '-checkpoint')?.dataset;
          return state && Math.abs(Number(state.coreProgress) - p) < .001
            && state.loading === 'false' && state.frameIndex === state.targetIndex && state.frameIndex !== '-1';
        }, { core, p: progress });
        const snapshot = await page.evaluate(core => window['__' + core.toUpperCase() + '__'], core);
        assert.equal(snapshot.cache.capacity, 8);
        assert(snapshot.cache.decoded <= 8, 'Decoded cache stays bounded');
        assert(snapshot.cache.fetching <= 2 && snapshot.cache.decoding <= 2, 'Loading concurrency stays bounded');
        activeSamples.push({ cycle, core, progress: snapshot.progress, cache: snapshot.cache });
      }
    }
    await page.getByRole('button', { name: 'Create', exact: true }).click();
    await page.waitForFunction(() => !('__LEARN__' in window) && !('__DISCOVER__' in window));
    assert.equal(await page.locator('.core-sequence').count(), 0);
    await page.waitForTimeout(500);
    await client.send('HeapProfiler.collectGarbage');
    await page.waitForTimeout(100);
    await client.send('HeapProfiler.collectGarbage');
    const { detachedNodes } = await client.send('DOM.getDetachedDomNodes');
    const counters = await client.send('Memory.getDOMCounters');
    const { metrics } = await client.send('Performance.getMetrics');
    samples.push({ cycle, detachedNodes: detachedNodes.length, counters,
      heap: Object.fromEntries(metrics.filter(metric => ['JSHeapUsedSize', 'JSHeapTotalSize'].includes(metric.name))
        .map(metric => [metric.name, metric.value])) });
    console.log('Cycle', cycle + 1, JSON.stringify(samples.at(-1)));
    assert.equal(detachedNodes.length, 0, 'No detached preload images remain');
    assert(counters.nodes <= samples[0].counters.nodes + 4, 'DOM nodes do not accumulate');
    assert(counters.jsEventListeners <= samples[0].counters.jsEventListeners, 'Listeners do not accumulate');
  }
  mkdirSync('docs/core-chain', { recursive: true });
  writeFileSync('docs/core-chain/memory-verification.json', JSON.stringify({ browser: browser.version(), samples, activeSamples }, null, 2));
} finally { await browser.close(); }
