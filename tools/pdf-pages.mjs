// Renders PDF pages to PNG with Chrome's built-in PDF viewer, for checking.
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
const pdf = path.resolve(process.argv[2]);
const out = process.argv[3] || '.shots';
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1000, height: 1300 } });
const pages = (process.argv[4] || '1').split(',').map(Number);
for (const n of pages) {
  await page.goto(`${pathToFileURL(pdf).href}#page=${n}&zoom=100`);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${out}/pdf-${n}.png` });
}
await browser.close();
console.log('ok');
