import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);

// Scroll to progress 0.375 (middle of Act 02)
await page.evaluate(() => {
  const pin = document.querySelector('[class*="pinWrap"]');
  if (pin) {
    const pinTop = pin.getBoundingClientRect().top + window.scrollY;
    const pinHeight = pin.offsetHeight;
    const targetY = pinTop + pinHeight * 0.375;
    window.scrollTo({ top: targetY, behavior: 'instant' });
  }
});
await page.waitForTimeout(800);

const info = await page.evaluate(() => {
  const acts = document.querySelectorAll('main > article > div > div > section');
  return Array.from(acts).map((a, i) => {
    const rect = a.getBoundingClientRect();
    const cs = window.getComputedStyle(a);
    // Find the inner panel
    const panel = a.querySelector('[class*="left"], [class*="right"]');
    const panelRect = panel?.getBoundingClientRect();
    return {
      i,
      y: Math.round(rect.top),
      h: Math.round(rect.height),
      opacity: cs.opacity,
      hasPanel: !!panel,
      panelY: panelRect ? Math.round(panelRect.top) : null,
      panelH: panelRect ? Math.round(panelRect.height) : null,
      panelBg: panel ? window.getComputedStyle(panel).background.slice(0, 60) : null,
    };
  });
});

console.log(JSON.stringify(info, null, 2));
await browser.close();
