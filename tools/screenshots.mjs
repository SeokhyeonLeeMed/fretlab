import { chromium } from 'playwright';
import fs from 'node:fs';

const OUT = process.argv[2] || '.shots';
fs.mkdirSync(OUT, { recursive: true });
const errors = [];
const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`); });
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));

await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
await page.waitForSelector('svg[role="group"]');

const shot = async (name) => {
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
};

// 1. default: scale mode, 6-string guitar
await shot('01-scale-guitar6');

// Report what font actually resolved.
const font = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
const notoLoaded = await page.evaluate(() =>
  document.fonts ? document.fonts.check('16px "Noto Sans"') : null);

// 1b. the whole instrument, body included
await page.getByRole('button', { name: 'Whole instrument' }).click();
await shot('01b-whole-instrument');
await page.getByRole('button', { name: 'Reset', exact: true }).click();

// 2. chord mode
await page.getByRole('button', { name: 'Chords', exact: true }).click();
await shot('02-chord-guitar6');

// 3. 7-string + drop G
await page.getByRole('button', { name: 'Guitar', exact: true }).click();
await page.getByRole('button', { name: '7-string' }).click();
await page.selectOption('select >> nth=0', 'drop-g');
await shot('03-guitar7-dropg');

// 4. 5-string bass, scale mode
await page.getByRole('button', { name: 'Scale', exact: true }).click();
await page.getByRole('button', { name: 'Bass', exact: true }).click();
await page.getByRole('button', { name: '5-string' }).click();
await shot('04-bass5-scale');

// 5. tuner camera (denied mic, so the error path shows)
await page.getByRole('button', { name: 'Guitar', exact: true }).click();
await page.getByRole('button', { name: '6-string' }).click();
await page.getByRole('button', { name: 'Tuner', exact: true }).click();
await page.waitForTimeout(1200);
await shot('05-tuner-camera');
const camera = await page.$eval('.stage-camera', (el) => getComputedStyle(el).transform);

// 6. back out of the tuner
await page.getByRole('button', { name: 'Scale', exact: true }).click();
await page.waitForTimeout(1300);
await shot('06-after-tuner');
const cameraAfter = await page.$eval('.stage-camera', (el) => getComputedStyle(el).transform);

// 7. light theme
await page.getByRole('button', { name: 'Light' }).click();
await shot('07-light');

// 8. mobile
await page.getByRole('button', { name: 'Dark' }).click();
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(500);
await shot('08-mobile');

// 9. mobile, scrolled along the neck
await page.$eval('.stage-scroll', (el) => { el.scrollLeft = 420; });
await shot('09-mobile-scrolled');

fs.writeFileSync(`${OUT}/report.json`, JSON.stringify({ font, notoLoaded, camera, cameraAfter, errors }, null, 2));
console.log(JSON.stringify({ font, notoLoaded, camera, cameraAfter, errors }, null, 2));
await browser.close();
