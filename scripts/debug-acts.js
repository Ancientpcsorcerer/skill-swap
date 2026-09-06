import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);

const info = await page.evaluate(() => {
  const acts = document.querySelectorAll('main > article > div > div > section');
  return Array.from(acts).map((a, i) => {
    const rect = a.getBoundingClientRect();
    const cs = window.getComputedStyle(a);
    return {
      i,
      cls: a.className.slice(0, 60),
      y: Math.round(rect.top),
      h: Math.round(rect.height),
      opacity: cs.opacity,
      transform: cs.transform,
      text: (a.textContent ?? '').slice(0, 60),
    };
  });
});

console.log(JSON.stringify(info, null, 2));
await browser.close();
