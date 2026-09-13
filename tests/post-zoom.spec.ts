import { expect, test, type Page } from '@playwright/test';
import { coreCheckpoints, samplePostZoom } from '../src/lib/checkpoints';
import { measureFrame } from '../src/lib/frame';

async function scrollToViewport(page: Page, position: number) {
  // Let the single existing scroll observer paint, without waiting for a timer.
  await page.evaluate(async value => {
    scrollTo(0, innerHeight * value);
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  }, position);
}

async function portalOpacity(page: Page) {
  return page.locator('.frame-visual').evaluate(element => Number(getComputedStyle(element).opacity));
}

test('original zoom positions stay intact and the adjacent reveal is reversible without time', () => {
  for (const viewport of [568, 839, 941, 1058, 1440]) {
    const sample = (position: number) => measureFrame(-position * viewport, viewport * 5, viewport);
    expect(sample(0).frameProgress).toBe(0);
    expect(sample(.25).frameProgress).toBe(0);
    expect(sample(1.625).frameProgress).toBe(.5);
    expect(sample(3)).toMatchObject({ frameProgress: 1, transitionProgress: 0 });
    expect(sample(3.5)).toMatchObject({ frameProgress: 1, transitionProgress: .5 });
    expect(sample(4)).toMatchObject({ frameProgress: 1, transitionProgress: 1 });
    expect(sample(3.001).transitionProgress).toBeGreaterThan(0);
    expect(samplePostZoom(1, sample(4 - 1 / viewport).transitionProgress).revealProgress).toBeGreaterThan(.999);
    const positions = [3, 3.1, 3.25, 3.5, 3.75, 3.9, 4];
    const forward = positions.map(position => {
      const snapshot = sample(position);
      return samplePostZoom(snapshot.frameProgress, snapshot.transitionProgress);
    });
    const backward = [...positions].reverse().map(position => {
      const snapshot = sample(position);
      return samplePostZoom(snapshot.frameProgress, snapshot.transitionProgress);
    });
    expect(backward.reverse()).toEqual(forward);
    expect(forward[0]).toEqual({ phase: 'POST_ZOOM_LIGHT', revealProgress: 0 });
    expect(forward[3].revealProgress).toBe(.5);
    expect(forward.at(-1)?.phase).toBe('CONNECT_CHECKPOINT_START');
  }
  expect(new Set(Object.values(coreCheckpoints).map(checkpoint => checkpoint.startState)).size).toBe(4);
  expect(coreCheckpoints.create.animationRange).toBeNull();
  expect(coreCheckpoints.learn.animationRange).toEqual({start:13,end:17});
  expect(coreCheckpoints.discover.animationRange).toEqual({start:17,end:21});
});

test('scroll reveals immediately, stays at the chosen blend, and reverses without a white flash', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  await scrollToViewport(page, 3);
  const sticky = page.locator('.frame-sticky');
  await expect(sticky).toHaveAttribute('data-checkpoint-state', 'POST_ZOOM_LIGHT');
  expect(await portalOpacity(page)).toBe(1);
  await expect(page.locator('.frame-visual')).toHaveCSS('transform', 'matrix(12, 0, 0, 12, 0, 0)');
  await expect(page.locator('.app-experience, .frame-destination, #experience-title')).toHaveCount(0);
  await expect(page.getByRole('heading')).toHaveCount(0);
  await expect(page.getByRole('button')).toHaveCount(0);
  await page.screenshot({ path: `docs/scroll-transition/screenshots/light-${testInfo.project.name}.png` });

  await scrollToViewport(page, 3.5);
  // Immediate read after the scroll observer, not a timeout/poll that could hide a delayed reveal.
  expect(await portalOpacity(page)).toBeCloseTo(.5, 2);
  const midpoint = await portalOpacity(page);
  await page.screenshot({ path: `docs/scroll-transition/screenshots/reveal-${testInfo.project.name}.png` });
  await page.waitForTimeout(1250);
  expect(await portalOpacity(page)).toBe(midpoint);

  await scrollToViewport(page, 4);
  await expect(sticky).toHaveAttribute('data-checkpoint-state', 'CONNECT_CHECKPOINT_START');
  expect(await portalOpacity(page)).toBe(0);
  await expect(page.locator('#connect-checkpoint')).toHaveAttribute('data-core-progress', '0.000000');
  await page.screenshot({ path: `docs/scroll-transition/screenshots/connect-${testInfo.project.name}.png` });

  const viewportHeight = await page.evaluate(() => innerHeight);
  await scrollToViewport(page, 4 - 1 / viewportHeight);
  const tinyReverse = await portalOpacity(page);
  expect(tinyReverse).toBeGreaterThan(0);
  expect(tinyReverse).toBeLessThan(.001);
  await expect(page.locator('.core-underlay')).toHaveCSS('visibility', 'visible');
  await page.screenshot({ path: `docs/scroll-transition/screenshots/reverse-one-pixel-${testInfo.project.name}.png` });
  let previousOpacity = tinyReverse;
  for (const position of [3.9, 3.75, 3.5, 3.25, 3.1, 3]) {
    await scrollToViewport(page, position);
    const opacity = await portalOpacity(page);
    expect(opacity).toBeGreaterThan(previousOpacity);
    await expect(page.locator('.frame-visual')).toHaveCSS('transform', 'matrix(12, 0, 0, 12, 0, 0)');
    if (position === 3.5) {
      expect(opacity).toBe(midpoint);
      await page.screenshot({ path: `docs/scroll-transition/screenshots/reverse-midpoint-${testInfo.project.name}.png` });
    }
    previousOpacity = opacity;
  }
  expect(previousOpacity).toBe(1);
  await scrollToViewport(page, 1.625);
  const reversedScale = await page.locator('.frame-visual').evaluate(element => new DOMMatrix(getComputedStyle(element).transform).a);
  expect(reversedScale).toBeCloseTo(3.75, 2); // Native scroll positions round to whole pixels.
  await scrollToViewport(page, 0);
  await expect(page.locator('.app-shell')).toHaveAttribute('data-experience-state', 'landing');
});

test('the same video keeps playing through repeated full forward and reverse traversal', async ({ page }) => {
  await page.addInitScript(() => {
    const audit = { pause: 0, play: 0, load: 0, timeWrites: 0 };
    Object.assign(window, { mediaAudit: audit });
    for (const method of ['pause', 'play', 'load'] as const) {
      const original = HTMLMediaElement.prototype[method];
      Object.defineProperty(HTMLMediaElement.prototype, method, {
        configurable: true,
        value: function(this: HTMLMediaElement) {
          audit[method]++;
          return original.call(this);
        },
      });
    }
    const descriptor = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'currentTime')!;
    Object.defineProperty(HTMLMediaElement.prototype, 'currentTime', {
      ...descriptor,
      set(this: HTMLMediaElement, value: number) {
        audit.timeWrites++;
        descriptor.set!.call(this, value);
      },
    });
  });
  await page.goto('/');
  const media = page.locator('video');
  await expect.poll(() => media.evaluate((video: HTMLVideoElement) => video.currentTime)).toBeGreaterThan(.1);
  const original = await media.elementHandle();
  const audit = () => page.evaluate(() => (window as unknown as {
    mediaAudit: { pause: number; play: number; load: number; timeWrites: number };
  }).mediaAudit);
  const initialAudit = await audit();
  const originalUrl = page.url();

  for (let cycle = 0; cycle < 2; cycle++) {
    for (const position of [0, 1.625, 2.8, 3, 3.5, 4, 3.99, 3.5, 3, 1.625, 0]) {
      await scrollToViewport(page, position);
      const playback = await media.evaluate(async (video: HTMLVideoElement) => {
        const before = video.currentTime;
        await new Promise(resolve => setTimeout(resolve, 200));
        return { paused: video.paused, ended: video.ended,
          advanced: (video.currentTime - before + video.duration) % video.duration };
      });
      expect(playback.paused).toBe(false);
      expect(playback.ended).toBe(false);
      expect(playback.advanced).toBeGreaterThan(.05);
      expect(playback.advanced).toBeLessThan(1);
      expect(await original!.evaluate(element => element === document.querySelector('video'))).toBe(true);
    }
  }
  expect(await audit()).toEqual(initialAudit);
  await expect(media).toHaveCount(1);
  await expect(media).toHaveAttribute('loop', '');
  expect(page.url()).toBe(originalUrl);
  await expect(page.locator('.app-experience, .frame-destination')).toHaveCount(0);
});

test('Connect retains the existing reference geometry, depth layers, and empty center', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Native source geometry is independent of input device');
  await page.setViewportSize({ width: 1672, height: 941 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await scrollToViewport(page, 4);
  await expect(page.locator('.app-shell')).toHaveAttribute('data-checkpoint-state', 'CONNECT_CHECKPOINT_START');
  await expect(page.locator('.connect-sequence')).toHaveCSS('object-fit', 'contain');
  await expect.poll(() => page.locator('.connect-sequence').evaluate((image: HTMLImageElement) => image.naturalWidth)).toBe(1920);
  await expect(page.locator('.connect-slab')).toHaveCount(0);
  await expect(page.locator('#connect-checkpoint')).toHaveText('');
  await page.screenshot({ path: 'docs/scroll-transition/screenshots/connect-native.png' });
});



