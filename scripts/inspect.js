// Better inspection — scrolls to specific known positions
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const BASE = 'http://localhost:5173';
const OUT = './docs/iteration/screens';

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 820, height: 1180 },
  { name: 'mobile', width: 390, height: 844 },
];

async function inspectHome(page, vp) {
  await page.setViewportSize({ width: vp.width, height: vp.height });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Get the actual masthead height and pin position
  const layout = await page.evaluate(() => {
    const masthead = document.querySelector('main section');
    const pin = document.querySelector('[class*="pinWrap"]');
    const beone = document.querySelector('[id="be-one-of-them"]');
    return {
      mastheadBottom: masthead?.getBoundingClientRect().bottom ?? 0,
      pinHeight: pin?.getBoundingClientRect().height ?? 0,
      pinTop: pin?.getBoundingClientRect().top ?? 0,
      documentHeight: document.body.scrollHeight,
      viewportHeight: window.innerHeight,
    };
  });

  console.log(`  layout:`, layout);

  // Capture top
  await page.screenshot({ path: `${OUT}/${vp.name}-home-top.png`, fullPage: false });

  // Capture at start of pin (top of 3D)
  const yStart = layout.mastheadBottom;
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), yStart);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/${vp.name}-home-pin-start.png`, fullPage: false });

  // Capture at each quarter of the pin (offset to land in middle of each act)
  const pinQuarter = layout.pinHeight / 5; // 5 viewports now
  for (let i = 1; i <= 4; i++) {
    const y = yStart + pinQuarter * (i - 0.5); // 0.5, 1.5, 2.5, 3.5 of 5
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y);
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}/${vp.name}-home-pin-q${i}.png`, fullPage: false });
  }

  // Capture end of pin (just before BeOneOfThem)
  const yEnd = yStart + layout.pinHeight;
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), yEnd);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/${vp.name}-home-pin-end.png`, fullPage: false });

  // Full page screenshot
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/${vp.name}-home-fullpage.png`, fullPage: true });
}

async function inspectRoute(page, path, vp, name) {
  await page.setViewportSize({ width: vp.width, height: vp.height });
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/${vp.name}-${name}-top.png`, fullPage: false });
  await page.screenshot({ path: `${OUT}/${vp.name}-${name}-fullpage.png`, fullPage: true });
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({ deviceScaleFactor: 1 });
  const page = await context.newPage();

  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));

  for (const vp of viewports) {
    console.log(`[${vp.name}] home`);
    await inspectHome(page, vp);
    for (const [path, name] of [
      ['/discover', 'discover'],
      ['/people/p.aria', 'profile-aria'],
      ['/inbox', 'inbox'],
      ['/me', 'me'],
      ['/onboard', 'onboard'],
    ]) {
      console.log(`[${vp.name}] ${path}`);
      await inspectRoute(page, path, vp, name);
    }
  }

  await browser.close();
  if (errors.length) {
    console.error('ERRORS:');
    errors.forEach((e) => console.error('  ' + e));
  } else {
    console.log('No errors.');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
