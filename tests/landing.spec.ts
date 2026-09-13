import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
});

test('approved composition, navigation, and measured desktop geometry', async ({ page }, testInfo) => {
  await expect(page).toHaveTitle('Skill Swap');
  await expect(page.locator('.hero h1')).toHaveText('Skill Swap');
  await expect(page.locator('.hero p')).toHaveCount(0);
  await expect(page.getByText('View Architecture', { exact: true })).toHaveCount(0);
  await expect(page.locator('.logos, .lg')).toHaveCount(0);
  await expect(page.getByText(/logoipsum/i)).toHaveCount(0);
  await expect(page.locator('video')).toHaveCount(1);
  await expect(page.locator('.frame-plate, .frame-track')).toHaveCount(0);
  await expect(page.locator('.app-shell')).toHaveAttribute('data-auth-state', 'guest');
  await expect(page.locator('.app-shell')).toHaveAttribute('data-experience-state', 'landing');
  await expect(page.locator('canvas')).toHaveCount(0);
  const navigation = page.locator('.links');
  await expect(navigation.locator('button')).toHaveText(['About us', 'Contact']);
  await expect(navigation.locator('button').nth(0)).toHaveAttribute('aria-disabled', 'true');
  await expect(navigation.locator('button').nth(1)).toHaveAttribute('aria-disabled', 'true');

  if (testInfo.project.name === 'desktop') {
    const dimensions = await page.evaluate(() => {
      const headline = document.querySelector('.headline')!.getBoundingClientRect();
      const media = document.querySelector('video')!.getBoundingClientRect();
      const cta = document.querySelector('.pill-cta')!.getBoundingClientRect();
      return { left: headline.left, top: parseFloat(getComputedStyle(document.querySelector('.headline')!).top),
        mediaWidth: media.width, mediaHeight: media.height, mediaTop: media.top,
        ctaTop: parseFloat(getComputedStyle(document.querySelector('.pill-cta')!).top), ctaWidth: cta.width };
    });
    expect(dimensions.left).toBeCloseTo(75.5, 0);
    expect(dimensions.top).toBeCloseTo(230.5, 0);
    expect(dimensions.mediaWidth).toBeCloseTo(1492, 0);
    expect(dimensions.mediaHeight).toBeCloseTo(1054, 0);
    expect(dimensions.mediaTop).toBeCloseTo(1, 0);
    expect(dimensions.ctaTop).toBeCloseTo(495, 0);
    expect(dimensions.ctaWidth).toBeCloseTo(175.6, 0);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.screenshot({ path: `docs/scroll-transition/screenshots/landing-${testInfo.project.name}.png` });
});

test('both Get Started controls open the same signup shell without traversal', async ({ page }, testInfo) => {
  const dialog = page.locator('#signup-modal');
  if (testInfo.project.name !== 'desktop') {
    await page.getByRole('button', { name: 'Open menu' }).click();
    await expect(page.locator('#mobile-menu')).toBeVisible();
    await page.locator('#mobile-menu').getByRole('button', { name: 'Get Started' }).click();
    await expect(page.locator('#mobile-menu')).not.toBeVisible();
  } else {
    await page.locator('.pill-nav').click();
  }
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute('aria-labelledby', 'signup-title');
  await expect(page.getByRole('button', { name: 'Close signup' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await page.locator('.pill-cta').click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Keep exploring' }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.locator('.app-shell')).toHaveAttribute('data-experience-state', 'landing');
  await expect(page.locator('.pill-cta')).toBeFocused();
});

test('modal traps focus, locks scroll, restores position and supports close/backdrop', async ({ page }) => {
  await page.evaluate(() => window.scrollTo(0, 110));
  await page.locator('.pill-cta').focus();
  const scroll = await page.evaluate(() => window.scrollY);
  await page.keyboard.press('Enter');
  const dialog = page.locator('#signup-modal');
  await expect(dialog).toBeVisible();
  await expect(page.locator('body')).toHaveCSS('position', 'fixed');
  await expect(page.locator('body')).toHaveCSS('top', `-${scroll}px`);
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('button', { name: 'Keep exploring' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Close signup' })).toBeFocused();
  const locked = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, 600);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(locked);
  await dialog.getByRole('button', { name: 'Close signup' }).click();
  await expect(dialog).not.toBeVisible();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(scroll);
  await expect(page.locator('.pill-cta')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(dialog).toBeVisible();
  await page.mouse.click(3, 3);
  await expect(dialog).not.toBeVisible();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(scroll);
});

test('guest Frame progress advances, reaches Connect, and reverses with actual scroll', async ({ page }, testInfo) => {
  const geometry = await page.locator('.experience-track').evaluate(element => ({
    start: element.getBoundingClientRect().top + window.scrollY + window.innerHeight * 0.25,
    distance: element.getBoundingClientRect().height - window.innerHeight * 6.25,
  }));
  await page.evaluate(y => window.scrollTo(0, y), geometry.start + geometry.distance * 0.5);
  await expect.poll(async () => Number(await page.locator('.experience-track').getAttribute('data-progress'))).toBeCloseTo(0.5, 2);
  await expect(page.locator('.app-shell')).toHaveAttribute('data-experience-state', 'frame-transition');
  await expect(page.locator('#signup-modal')).not.toBeVisible();
  await page.screenshot({ path: `docs/scroll-transition/screenshots/frame-${testInfo.project.name}.png` });
  await page.evaluate(() => window.scrollTo(0, innerHeight * 4));
  await expect(page.locator('.app-shell')).toHaveAttribute('data-experience-state', 'core');
  await expect(page.locator('.app-shell')).toHaveAttribute('data-auth-state', 'guest');
  await expect(page.locator('.core-underlay')).not.toHaveAttribute('inert', '');
  await expect(page.locator('#connect-checkpoint')).toHaveAttribute('data-checkpoint-state', 'CONNECT_CHECKPOINT_START');
  await page.screenshot({ path: `docs/scroll-transition/screenshots/app-${testInfo.project.name}.png` });
  await page.evaluate(y => window.scrollTo(0, y), geometry.start + geometry.distance * 0.25);
  await expect.poll(async () => Number(await page.locator('.experience-track').getAttribute('data-progress'))).toBeCloseTo(0.25, 2);
  await expect(page.locator('.core-underlay')).toHaveAttribute('inert', '');
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(page.locator('.app-shell')).toHaveAttribute('data-experience-state', 'landing');
  await expect(page.locator('.experience-track')).toHaveAttribute('data-progress', '0.0000');
});

test('approved native video plays and can be paused', async ({ page }) => {
  const video = page.locator('video');
  await expect(video).toHaveAttribute('autoplay', '');
  await expect(video).toHaveAttribute('loop', '');
  await expect(video.locator('source')).toHaveAttribute('src', '/video/landing-ambient.mp4');
  await expect(video).toHaveAttribute('playsinline', '');
  await expect(video).toHaveAttribute('aria-hidden', 'true');
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.readyState), { timeout: 20_000 }).toBeGreaterThanOrEqual(2);
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime), { timeout: 15_000 }).toBeGreaterThan(0);
  expect(await video.evaluate((element: HTMLVideoElement) => element.muted)).toBe(true);
  await page.getByRole('button', { name: 'Pause background video' }).focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.paused)).toBe(true);
  await page.getByRole('button', { name: 'Play background video' }).click();
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.paused)).toBe(false);
});

test('reduced motion pauses media, removes zoom, and preserves Frame access', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => page.locator('video').evaluate((element: HTMLVideoElement) => element.paused)).toBe(true);
  await expect(page.locator('video')).not.toHaveAttribute('autoplay', '');
  await expect(page.locator('.headline')).toHaveCSS('animation-name', 'none');
  await expect(page.locator('.frame-visual')).toHaveCSS('transform', 'none');
  await expect(page.locator('.plate-poster')).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, innerHeight * 4));
  await expect(page.locator('.app-shell')).toHaveAttribute('data-experience-state', 'core');
});

test('landing and signup pass WCAG A/AA automated accessibility checks', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);
  if (testInfo.project.name !== 'desktop') {
    await page.getByRole('button', { name: 'Open menu' }).click();
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);
    await page.keyboard.press('Escape');
  }
  await page.locator('.pill-cta').click();
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);
  await page.screenshot({ path: `docs/scroll-transition/screenshots/signup-${testInfo.project.name}.png` });
});

test('page has no browser console or runtime errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
  await expect.poll(() => page.locator('video').evaluate((element: HTMLVideoElement) => element.readyState), { timeout: 20_000 }).toBeGreaterThanOrEqual(2);
  await page.locator('.pill-cta').click();
  await page.keyboard.press('Escape');
  await page.evaluate(() => window.scrollTo(0, innerHeight * 4));
  await expect(page.locator('.app-shell')).toHaveAttribute('data-experience-state', 'core');
  expect(errors).toEqual([]);
});

test('mobile menu closes on Escape and landscape resize; native touch scroll works', async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name === 'desktop', 'Mobile-specific behavior');
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.keyboard.press('Escape');
  await expect(page.locator('#mobile-menu')).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Open menu' })).toBeFocused();
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.setViewportSize({ width: 1024, height: 600 });
  await expect(page.locator('#mobile-menu')).not.toBeVisible();
  await expect(page.locator('body')).toHaveCSS('position', 'static');
  await page.setViewportSize({ width: 393, height: 851 });
  const client = await context.newCDPSession(page);
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 200, y: 700 }] });
  for (const y of [620, 520, 420, 320, 220]) {
    await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 200, y }] });
  }
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(100);
  await expect.poll(async () => Number(await page.locator('.experience-track').getAttribute('data-progress'))).toBeGreaterThan(0);
  const forward = Number(await page.locator('.experience-track').getAttribute('data-progress'));
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 200, y: 180 }] });
  for (const y of [260, 360, 460, 560, 700]) {
    await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 200, y }] });
  }
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(async () => Number(await page.locator('.experience-track').getAttribute('data-progress'))).toBeLessThan(forward);
  await client.detach();
});


test('native background looping continues under Connect and on return without driving the camera', async ({ page }) => {
  const video = page.locator('video');
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeGreaterThan(.1);
  await page.evaluate(() => scrollTo(0, innerHeight * 4));
  await expect(page.locator('.app-shell')).toHaveAttribute('data-experience-state', 'core');
  // Observe a real end-of-clip wrap, without seeking or accelerating the media.
  const looping = await video.evaluate((element: HTMLVideoElement) => new Promise<boolean>(resolve => {
    let previous = element.currentTime;
    const startedAt = performance.now();
    const interval = setInterval(() => {
      const current = element.currentTime;
      if (current < previous && !element.paused && !element.ended) {
        clearInterval(interval);
        resolve(true);
      } else if (performance.now() - startedAt > (element.duration + 2) * 1000) {
        clearInterval(interval);
        resolve(false);
      }
      previous = current;
    }, 100);
  }));
  expect(looping).toBe(true);
  await expect(page.locator('.app-shell')).toHaveAttribute('data-experience-state', 'core');
  await page.evaluate(() => scrollTo(0, 0));
  await expect(page.locator('.app-shell')).toHaveAttribute('data-experience-state', 'landing');
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.paused)).toBe(false);
  await expect(page.locator('.frame-visual')).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
});

test('one pinned scene stays on the same route and retraces the same visual', async ({ page }) => {
  const originalUrl = page.url();
  const originalVideo = await page.locator('video').elementHandle();
  const geometry = await page.locator('.experience-track').evaluate(element => ({
    start: innerHeight * 0.25,
    distance: element.getBoundingClientRect().height - innerHeight * 6.25,
  }));
  await page.evaluate(y => scrollTo(0, y), geometry.start + geometry.distance * 0.35);
  await expect(page.locator('.app-shell')).toHaveAttribute('data-experience-state', 'frame-transition');
  await expect.poll(() => page.locator('video').evaluate((element: HTMLVideoElement) => element.paused)).toBe(false);
  const firstTransform = await page.locator('.frame-visual').evaluate(element => getComputedStyle(element).transform);

  expect((await page.locator('.frame-sticky').boundingBox())!.y).toBeCloseTo(0, 0);
  await page.evaluate(y => scrollTo(0, y), geometry.start + geometry.distance * 0.8);
  await expect.poll(async () => Number(await page.locator('.experience-track').getAttribute('data-progress'))).toBeCloseTo(0.8, 2);
  await page.evaluate(y => scrollTo(0, y), geometry.start + geometry.distance * 0.35);
  await expect.poll(async () => Number(await page.locator('.experience-track').getAttribute('data-progress'))).toBeCloseTo(0.35, 2);
  expect(await page.locator('.frame-visual').evaluate(element => getComputedStyle(element).transform)).toBe(firstTransform);
  expect(await page.locator('video').evaluate((element: HTMLVideoElement) => element.paused)).toBe(false);
  expect(await originalVideo!.evaluate(element => element === document.querySelector('video'))).toBe(true);
  expect(page.url()).toBe(originalUrl);
  await page.evaluate(() => scrollTo(0, 0));
  await expect(page.locator('.app-shell')).toHaveAttribute('data-experience-state', 'landing');
  expect((await page.locator('.frame-sticky').boundingBox())!.y).toBeCloseTo(0, 0);
});

test('desktop wheel scrolling controls continuous progress without a one-shot animation', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Native wheel-specific check');
  await page.mouse.wheel(0, 150);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
  await expect(page.locator('.experience-track')).toHaveAttribute('data-progress', '0.0000');
  await page.mouse.wheel(0, 700);
  await expect.poll(async () => Number(await page.locator('.experience-track').getAttribute('data-progress'))).toBeGreaterThan(0.1);
  const forward = Number(await page.locator('.experience-track').getAttribute('data-progress'));
  await page.waitForTimeout(250);
  expect(Number(await page.locator('.experience-track').getAttribute('data-progress'))).toBe(forward);
  await page.mouse.wheel(0, -500);
  await expect.poll(async () => Number(await page.locator('.experience-track').getAttribute('data-progress'))).toBeLessThan(forward);
});




