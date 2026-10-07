/**
 * Stage check: the neck map, the zoom slider, the wheel and the narrow layout,
 * driven in a real browser against `vite preview` on port 4173.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';

const OUT = process.argv[2] || '.shots/stage';
fs.mkdirSync(OUT, { recursive: true });
const errors = [];
const browser = await chromium.launch({ channel: 'chrome' });
const result = {};

// ---------- desktop ----------
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
  await page.waitForSelector('.neck-map');

  const scrollLeft = () => page.$eval('.stage-scroll', (el) => el.scrollLeft);
  const box = () => page.$eval('.neck-map-view', (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  const zoom = () => page.$eval('.zoom-slider', (el) => Number(el.value));

  result.startsAtHeadstock = (await scrollLeft()) === 0;
  // Zoom in a little so there is somewhere to go, then drag the box right.
  await page.getByRole('button', { name: 'Zoom in' }).click();
  await page.getByRole('button', { name: 'Zoom in' }).click();
  await page.waitForTimeout(200);
  const b0 = await box();
  await page.mouse.move(b0.x + b0.w / 2, b0.y + b0.h / 2);
  await page.mouse.down();
  await page.mouse.move(b0.x + b0.w / 2 + 200, b0.y + b0.h / 2, { steps: 8 });
  await page.mouse.up();
  const b1 = await box();
  result.dragMovedBoxPx = Math.round(b1.x - b0.x);
  result.dragScrolledStagePx = Math.round(await scrollLeft());
  await page.screenshot({ path: `${OUT}/desktop-dragged.png` });

  // The wheel over the instrument: no zoom, no sideways movement, page scrolls.
  const stage = await page.$eval('.stage-scroll', (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  const before = { zoom: await zoom(), left: await scrollLeft(), pageY: await page.evaluate(() => window.scrollY) };
  await page.mouse.move(stage.x, stage.y);
  // Vertical first, and well apart from the sideways one: Chrome latches a
  // run of wheel events onto whatever the first of them could scroll.
  await page.mouse.wheel(0, 400);
  await page.waitForTimeout(1200);
  const pageMoved = (await page.evaluate(() => window.scrollY)) - before.pageY;
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1200);
  await page.mouse.move(stage.x, stage.y);
  await page.mouse.wheel(300, 0);
  await page.waitForTimeout(600);
  result.wheelMovedStageSideways = (await scrollLeft()) !== before.left;
  result.wheelChangedZoom = (await zoom()) !== before.zoom;
  result.wheelScrolledPageBy = pageMoved;
  await page.evaluate(() => window.scrollTo(0, 0));

  // The slider zooms, and keeps the middle of the view in the middle.
  const centreBefore = await page.$eval('.stage-scroll', (el) => (el.scrollLeft + el.clientWidth / 2) / el.scrollWidth);
  await page.$eval('.zoom-slider', (el) => {
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    set.call(el, '1.8');
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.waitForTimeout(300);
  const centreAfter = await page.$eval('.stage-scroll', (el) => (el.scrollLeft + el.clientWidth / 2) / el.scrollWidth);
  result.sliderZoom = await zoom();
  result.centreBefore = Number(centreBefore.toFixed(3));
  result.centreAfter = Number(centreAfter.toFixed(3));
  await page.screenshot({ path: `${OUT}/desktop-zoomed.png` });

  // Slider is directly under the buttons.
  result.sliderBelowButtons = await page.evaluate(() => {
    const b = document.querySelector('.zoom-buttons').getBoundingClientRect();
    const s = document.querySelector('.zoom-slider').getBoundingClientRect();
    return s.top >= b.bottom - 1 && Math.abs(s.left - b.left) < 4;
  });

  // Keyboard on the map.
  await page.focus('.neck-map');
  await page.keyboard.press('Home');
  result.homeScrollLeft = await scrollLeft();
  await page.keyboard.press('End');
  result.endAtRightEdge = await page.$eval('.stage-scroll', (el) => Math.abs(el.scrollLeft + el.clientWidth - el.scrollWidth) < 2);
  await page.close();
}

// ---------- phone ----------
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
  await page.waitForSelector('.family-bar');
  result.mobile = await page.evaluate(() => {
    const bar = document.querySelector('.family-bar').getBoundingClientRect();
    const header = document.querySelector('.app-header').getBoundingClientRect();
    const stage = document.querySelector('#stage').getBoundingClientRect();
    return {
      switchesOnPage: document.querySelectorAll('[aria-labelledby="family-label"]').length,
      barBelowHeader: bar.top >= header.bottom - 1,
      barAboveStage: bar.bottom <= stage.top + 1,
      pageScrollsSideways: document.documentElement.scrollWidth > window.innerWidth + 1,
    };
  });
  await page.screenshot({ path: `${OUT}/mobile-top.png` });
  await page.getByRole('button', { name: 'Bass', exact: true }).tap();
  await page.waitForTimeout(300);
  result.mobile.bassSelected = await page.$eval('svg[role="group"]', (el) => el.getAttribute('aria-label'));

  // Drag the box with a finger.
  const b0 = await page.$eval('.neck-map-view', (el) => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  const client = await ctx.newCDPSession(page);
  const touch = (type, x, y) => client.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
  await touch('touchStart', b0.x + b0.w / 2, b0.y + b0.h / 2);
  for (let i = 1; i <= 6; i++) await touch('touchMove', b0.x + b0.w / 2 + i * 20, b0.y + b0.h / 2);
  await touch('touchEnd');
  await page.waitForTimeout(200);
  result.mobile.touchDragScrolledPx = Math.round(await page.$eval('.stage-scroll', (el) => el.scrollLeft));
  await page.screenshot({ path: `${OUT}/mobile-dragged.png` });
  await ctx.close();
}

result.errors = errors;
console.log(JSON.stringify(result, null, 2));
await browser.close();
