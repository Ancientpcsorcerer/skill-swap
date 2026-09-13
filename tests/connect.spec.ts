import { expect, test, type Page } from '@playwright/test';
import { readdirSync, readFileSync } from 'node:fs';
import { compareFrameNames, sampleConnectPosition, selectConnectFrame } from '../src/components/core/connect/sequence';
import { measureFrame } from '../src/lib/frame';

async function move(page: Page, progress: number) {
  await page.evaluate(p => scrollTo(0, innerHeight * (4 + 4 * p)), progress);
  await expect.poll(async () => Number(await page.locator('#connect-checkpoint').getAttribute('data-core-progress'))).toBeCloseTo(progress, 3);
}
async function rendered(page: Page, progress: number, direction: 'forward' | 'reverse') {
  const actual = Number(await page.locator('#connect-checkpoint').getAttribute('data-core-progress'));
  expect(actual).toBeCloseTo(progress, 3);
  const index = Math.round(actual * 299);
  const checkpoint = page.locator('#connect-checkpoint');
  await expect(checkpoint).toHaveAttribute('data-frame-index', String(index));
  await expect(checkpoint).toHaveAttribute('data-render-direction', direction);
  await expect(checkpoint).toHaveAttribute('data-loading', 'false');
  await expect(checkpoint).toHaveAttribute('data-frame-error', 'false');
  const folder = 'Connect_start';
  await expect(page.locator('.connect-sequence')).toHaveAttribute('data-source',
    new RegExp(folder + '/ezgif-frame-' + String(index + 1).padStart(3, '0') + '\\.jpg$'));
  await expect.poll(() => page.locator('.connect-sequence').evaluate((image: HTMLImageElement) =>
    image.complete && image.naturalWidth === 1920 && image.naturalHeight === 1080)).toBe(true);
}

test('discovered sequence ordering, endpoint mapping, and preceding scroll ranges are deterministic', () => {
  expect(['frame_10.png', 'frame_2.png', 'frame_1.png'].sort(compareFrameNames)).toEqual(['frame_1.png', 'frame_2.png', 'frame_10.png']);
  const forward = readdirSync('Cores/Connect_start').sort(compareFrameNames);
  const reverse = readdirSync('Cores/Connect_back').sort(compareFrameNames);
  expect([forward.length, reverse.length]).toEqual([300, 300]);
  expect([forward[0], forward.at(-1), reverse[0], reverse.at(-1)]).toEqual([
    'ezgif-frame-001.jpg', 'ezgif-frame-300.jpg', 'ezgif-frame-001.jpg', 'ezgif-frame-300.jpg',
  ]);
  const frames = { forward };
  for (const p of [0, .1, .25, .4, .45, .42, .5, .48, .75, 1]) {
    expect(selectConnectFrame(frames, p, 'forward').index).toBe(Math.round(p * 299));
    expect(selectConnectFrame(frames, p, 'reverse').index).toBe(Math.round(p * 299));
  }
  expect(selectConnectFrame(frames, -1, 'forward').index).toBe(0);
  expect(selectConnectFrame(frames, 2, 'forward').index).toBe(299);
  expect(selectConnectFrame(frames, 0, 'reverse').index).toBe(0);
  expect(selectConnectFrame({ forward: ['a','b'] }, .25, 'reverse').index).toBe(0);
  for (const viewport of [568, 839, 941, 1058]) {
    for (const position of [0, .25, 1.625, 3, 3.5, 4]) {
      const before = measureFrame(-position * viewport, 5 * viewport, viewport);
      const after = measureFrame(-position * viewport, 9 * viewport, viewport, 4);
      expect([after.frameProgress, after.transitionProgress]).toEqual([before.frameProgress, before.transitionProgress]);
    }
    expect(measureFrame(-4 * viewport, 9 * viewport, viewport, 4).connectProgress).toBe(0);
    expect(measureFrame(-8 * viewport, 9 * viewport, viewport, 4).connectProgress).toBe(1);
  }
});

test('entry, full forward/reverse, and nonlinear changes scrub the same supplied frames in both directions', async ({ page }, testInfo) => {
  await page.goto('/');
  const video = await page.locator('video').elementHandle();
  const surface = await page.locator('.connect-sequence').elementHandle();
  await move(page, 0);
  await rendered(page, 0, 'forward');
  await page.screenshot({ path: `docs/connect/screenshots/start-${testInfo.project.name}.png` });
  let previous = 0;
  for (const p of [.1, .25, .5, .75, 1, .75, .5, .25, .1, 0, .4, .45, .42, .5, .48, 0, .7, .3, .9, .15, 1, 0, 1]) {
    await move(page, p);
    await rendered(page, p, p > previous ? 'forward' : 'reverse');
    previous = p;
  }
  await expect(page.locator('#connect-checkpoint')).toHaveAttribute('data-checkpoint-state', 'CONNECT_CHECKPOINT_COMPLETE');
  await page.screenshot({ path: `docs/connect/screenshots/complete-${testInfo.project.name}.png` });
  const source = await page.locator('.connect-sequence').getAttribute('src');
  await page.waitForTimeout(450);
  expect(await page.locator('.connect-sequence').getAttribute('src')).toBe(source);
  expect(await video!.evaluate(element => element === document.querySelector('video'))).toBe(true);
  expect(await surface!.evaluate(element => element === document.querySelector('.connect-sequence'))).toBe(true);
  expect(await video!.evaluate((element: HTMLVideoElement) => element.paused)).toBe(false);
  await expect(page.locator('.connect-sequence')).toHaveCount(1);
  await expect(page.locator('.connect-slab, .app-experience, .frame-destination, canvas')).toHaveCount(0);
  expect(await page.evaluate(() => '__CONNECT__' in window)).toBe(false);
});

test('staged loading requests only Connect and preserves the source aspect ratio', async ({ page }, testInfo) => {
  const images: string[] = [];
  page.on('request', request => { if (/\/cores\//i.test(request.url())) images.push(request.url()); });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  expect(new Set(images).size).toBeLessThanOrEqual(1);
  await page.evaluate(() => scrollTo(0, innerHeight * 2));
  await expect.poll(() => new Set(images).size).toBeGreaterThan(1);
  expect(new Set(images).size).toBeLessThan(24);
  await move(page, .5);
  await rendered(page, .5, 'forward');
  expect(images.every(url => /Connect_start\//.test(url))).toBe(true);
  await expect(page.locator('video')).toHaveCount(1);
  await expect(page.locator('video source')).toHaveAttribute('src', '/video/landing-ambient.mp4');
  await expect(page.locator('.connect-sequence')).toHaveCSS('object-fit', 'contain');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `docs/connect/screenshots/midpoint-${testInfo.project.name}.png` });
});

test('a delayed obsolete frame cannot replace the latest target', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'One controlled network race covers the shared controller');
  let release!: () => void;
  let observed!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  const intercepted = new Promise<void>(resolve => { observed = resolve; });
  await page.route('**/Connect_start/ezgif-frame-210.jpg', async route => {
    observed();
    await held;
    await route.continue().catch(() => {});
  });
  await page.goto('/');
  await move(page, .7);
  await intercepted;
  await move(page, .9);
  await rendered(page, .9, 'forward');
  release();
  await page.waitForTimeout(250);
  await rendered(page, .9, 'forward');
});

test('repeated exit/re-entry leaves one renderer and resets no background playback', async ({ page }) => {
  await page.goto('/');
  const image = await page.locator('.connect-sequence').elementHandle();
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  for (let pass = 0; pass < 3; pass++) {
    await move(page, 0);
    await rendered(page, 0, 'forward');
    await move(page, 1);
    await rendered(page, 1, 'forward');
    await move(page, 0);
    await rendered(page, 0, 'reverse');
    await page.evaluate(() => scrollTo(0, 0));
    await expect(page.locator('.app-shell')).toHaveAttribute('data-experience-state', 'landing');
    await expect(page.locator('.connect-sequence')).toHaveCount(1);
    expect(await image!.evaluate(element => element === document.querySelector('.connect-sequence'))).toBe(true);
  }
  expect(errors).toEqual([]);
});

test('production preserves Connect bytes and excludes Connect_back and invalid Create', async ({ request }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Production asset verification is shared');
  expect(readdirSync('dist/cores').sort()).toEqual(['Connect_start','Discover_back','Discover_start','Learn_back','Learn_start']);
  for (const folder of ['Connect_start']) {
    for (const name of ['ezgif-frame-001.jpg', 'ezgif-frame-300.jpg']) {
      const response = await request.get('/cores/' + folder + '/' + name);
      expect(response.ok()).toBe(true);
      expect(await response.body()).toEqual(readFileSync('Cores/' + folder + '/' + name));
    }
  }
});

test('direction is derived only from clamped checkpoint progress', () => {
  let position = { progress: 0, direction: 'forward' as 'forward' | 'reverse' };
  for (const [progress, direction] of [
    [.6, 'forward'], [.55, 'reverse'], [.5, 'reverse'], [.5, 'reverse'],
    [.55, 'forward'], [.65, 'forward'], [1, 'forward'], [2, 'forward'],
    [.8, 'reverse'], [0, 'reverse'], [-1, 'reverse'], [0, 'reverse'], [.01, 'forward'],
  ] as const) {
    position = sampleConnectPosition(progress, position);
    expect(position.direction).toBe(direction);
    expect(position.progress).toBe(Math.max(0, Math.min(1, progress)));
  }
});

test('absolute progress maps every requested small reversal and direct endpoint jump', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('/');
  await move(page, 0);
  await rendered(page, 0, 'forward');
  let previous = 0;
  let direction: 'forward' | 'reverse' = 'forward';
  const paths = [
    [0, .6, .4, .8, .2, 1],
    [0, .25, .5, .75, 1],
    [1, .75, .5, .25, 0],
    [0, .6, .55, .6, .4, .45, .8],
    [.8, .79, .81, .8, .79, .9],
    [.5, .51, .5, .51, .5, .49, .5, .51],
    [0, .2, .4, .6, .55, .5, .55, .65],
    [.58, .56, .58],
    [0, 1, 0],
  ];
  for (const path of paths) {
    for (const progress of path) {
      direction = progress > previous ? 'forward' : progress < previous ? 'reverse' : direction;
      await move(page, progress);
      await rendered(page, progress, direction);
      await expect(page.locator('#connect-checkpoint')).toHaveAttribute('data-direction', direction);
      previous = progress;
    }
  }
  await expect(page.locator('.connect-sequence')).toHaveCount(1);
  await expect(page.locator('.connect-sequence')).toHaveCSS('filter', 'none');
  await expect(page.locator('.connect-sequence')).toHaveCSS('opacity', '1');
  await expect(page.locator('#connect-checkpoint')).toHaveCSS('background-color', 'rgb(243, 243, 241)');
});

test('page movement at unchanged Connect progress cannot switch the endpoint image', async ({ page }) => {
  await page.goto('/');
  await move(page, .6);
  await rendered(page, .6, 'forward');
  await move(page, 0);
  await rendered(page, 0, 'reverse');
  const source = await page.locator('.connect-sequence').getAttribute('src');
  for (const position of [3.8, 3.9, 3.85, 4]) {
    await page.evaluate(v => scrollTo(0, innerHeight * v), position);
    await expect.poll(() => page.evaluate(() => scrollY / innerHeight)).toBeCloseTo(position, 2);
    // Allow the existing scroll observer to process an unchanged Core position.
    await page.waitForTimeout(50);
    await rendered(page, 0, 'reverse');
    expect(await page.locator('.connect-sequence').getAttribute('src')).toBe(source);
  }
  await move(page, .01);
  await rendered(page, .01, 'forward');
});

test('viewport changes derive travel from normalized progress even without page movement', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'One resize verifies the shared progress-derived direction');
  await page.goto('/');
  await move(page, .6);
  await rendered(page, .6, 'forward');
  const before = await page.evaluate(() => scrollY);
  const viewport = page.viewportSize()!;
  await page.setViewportSize({ width: viewport.width, height: viewport.height + 160 });
  await expect.poll(async () => Number(await page.locator('#connect-checkpoint').getAttribute('data-core-progress'))).toBeLessThan(.6);
  const progress = Number(await page.locator('#connect-checkpoint').getAttribute('data-core-progress'));
  expect(await page.evaluate(() => scrollY)).toBe(before);
  await rendered(page, progress, 'reverse');
});

test('a delayed request while reversing cannot overwrite a quick return to the previous frame', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'One controlled reversal race verifies the shared renderer');
  let release!: () => void;
  let observed!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  const intercepted = new Promise<void>(resolve => { observed = resolve; });
  await page.route('**/Connect_start/ezgif-frame-151.jpg', async route => {
    observed();
    await held;
    await route.continue().catch(() => {});
  });
  try {
    await page.goto('/');
    await move(page, .51);
    await rendered(page, .51, 'forward');
    await move(page, .5);
    await intercepted;
    await move(page, .51);
    await rendered(page, .51, 'forward');
    release();
    await page.waitForTimeout(250);
    await rendered(page, .51, 'forward');
  } finally { release(); }
});

test('returning to the same progress is pixel-identical in either travel direction', async ({ page }, testInfo) => {
  await page.goto('/');
  await move(page, .5);
  await rendered(page, .5, 'forward');
  const image = page.locator('.connect-sequence');
  const source = await image.getAttribute('data-source');
  const forward = await image.screenshot({ path: `docs/connect-sync/screenshots/${testInfo.project.name}-forward-half.png` });
  await move(page, .51);
  await rendered(page, .51, 'forward');
  await move(page, .5);
  await rendered(page, .5, 'reverse');
  expect(await image.getAttribute('data-source')).toBe(source);
  const reverse = await image.screenshot({ path: `docs/connect-sync/screenshots/${testInfo.project.name}-reverse-half.png` });
  expect(reverse.equals(forward), 'The rendered pixels at the same progress must match exactly').toBe(true);
});

test('a reversal within one frame updates direction without reassigning the image', async ({ page }) => {
  await page.goto('/');
  let source: string | null = null;
  for (const [progress, direction] of [[.501, 'forward'], [.5015, 'forward'], [.501, 'reverse']] as const) {
    await move(page, progress);
    await page.waitForFunction(() => Number(document.querySelector('#connect-checkpoint')!.getAttribute('data-core-progress')).toFixed(6)
      === ((scrollY / innerHeight - 4) / 4).toFixed(6));
    await rendered(page, progress, direction);
    await expect(page.locator('#connect-checkpoint')).toHaveAttribute('data-direction', direction);
    const current = await page.locator('.connect-sequence').getAttribute('src');
    if (source) expect(current).toBe(source);
    source = current;
  }
});
