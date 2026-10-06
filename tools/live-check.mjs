import { chromium } from 'playwright';
const URL = process.argv[2];
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
const errors = [];
const failed = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('response', (r) => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`); });

const resp = await page.goto(URL, { waitUntil: 'networkidle', timeout: 45000 });
let svg = false, cells = 0, title = '';
try {
  await page.waitForSelector('svg[role="group"]', { timeout: 15000 });
  svg = true;
  cells = await page.locator('[role="gridcell"]').count();
  title = await page.title();
} catch (e) { errors.push('no fretboard: ' + e.message); }
await page.screenshot({ path: '.shots/live.png' });
console.log(JSON.stringify({ status: resp?.status(), title, svg, cells, failed, errors }, null, 2));
await browser.close();
