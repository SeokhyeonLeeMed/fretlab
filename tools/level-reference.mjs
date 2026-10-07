/**
 * level-reference.mjs — rotate the reference drawings so the neck is level.
 *
 *   node tools/level-reference.mjs
 *
 * The supplied drawings are each slightly tilted. This turns every SVG in an
 * instrument's folder — the whole instrument and each part file — by that
 * instrument's own angle, so the files themselves are level and the parts
 * still fit together exactly as before.
 *
 * Nothing inside a drawing is rewritten: its contents are wrapped in one
 * `<g transform="rotate(...)">`, and the viewBox is widened by just enough to
 * hold the turned artwork with the margins it had. A file already levelled is
 * left alone, so the script is safe to run twice.
 *
 * The angles were measured by tools/extract-artwork.mjs as the slope of a
 * line fitted through the middle of each fretboard.
 */

import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

/** Measured tilt of each neck, in degrees (negative: rising to the right). */
const TILT = {
  'reference/Stratocaster': -0.63375,
  'reference/Precision Bass': -0.08936,
};

const MARK = 'data-levelled';
const r3 = (v) => Math.round(v * 1000) / 1000;

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 800, height: 600 } });

for (const [dir, tilt] of Object.entries(TILT)) {
  // Turning by the opposite of the tilt brings the neck to horizontal.
  const angle = -tilt;
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.svg')).sort()) {
    const full = path.join(dir, file);
    const text = fs.readFileSync(full, 'utf8');
    if (text.includes(MARK)) {
      console.log(`  ${full}: already level, skipped`);
      continue;
    }
    const open = text.match(/<svg\b[^>]*>/);
    const vbMatch = open && open[0].match(/viewBox="([^"]+)"/);
    const close = text.lastIndexOf('</svg>');
    if (!open || !vbMatch || close < 0) throw new Error(`${full}: not an SVG with a viewBox`);
    const [vx, vy, vw, vh] = vbMatch[1].trim().split(/[\s,]+/).map(Number);
    const cx = r3(vx + vw / 2);
    const cy = r3(vy + vh / 2);

    const start = open.index + open[0].length;
    const wrapped =
      text.slice(0, start) +
      `\n  <g ${MARK}="${angle}" transform="rotate(${angle} ${cx} ${cy})">` +
      text.slice(start, close) +
      `</g>\n` +
      text.slice(close);

    // Measure the artwork before and after, in the drawing's own units, to
    // carry the original margins over to the new viewBox.
    const measure = async (svg) => {
      await page.setContent(`<body style="margin:0">${svg.replace(/<\?xml[^>]*\?>/, '')}</body>`);
      return page.evaluate(() => {
        const root = document.querySelector('svg');
        const vb = root.viewBox.baseVal;
        root.setAttribute('width', String(vb.width));
        root.setAttribute('height', String(vb.height));
        root.style.width = `${vb.width}px`;
        root.style.height = `${vb.height}px`;
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        for (const el of root.querySelectorAll('path, circle, ellipse, rect, polygon, polyline, line')) {
          if (typeof el.getTotalLength !== 'function') continue;
          const total = el.getTotalLength();
          if (!(total > 0)) continue;
          const m = el.getCTM();
          const sw = (parseFloat(getComputedStyle(el).strokeWidth) || 0) / 2;
          const n = Math.max(16, Math.min(600, Math.ceil(total / 0.2)));
          for (let i = 0; i <= n; i++) {
            const p = el.getPointAtLength((i / n) * total);
            const x = m.a * p.x + m.c * p.y + m.e + vb.x;
            const y = m.b * p.x + m.d * p.y + m.f + vb.y;
            x0 = Math.min(x0, x - sw); y0 = Math.min(y0, y - sw);
            x1 = Math.max(x1, x + sw); y1 = Math.max(y1, y + sw);
          }
        }
        return { x0, y0, x1, y1 };
      });
    };
    const before = await measure(text);
    const after = await measure(wrapped);
    // The margins the drawing had around its artwork, kept on every side.
    const pad = {
      l: Math.max(0, before.x0 - vx),
      t: Math.max(0, before.y0 - vy),
      r: Math.max(0, vx + vw - before.x1),
      b: Math.max(0, vy + vh - before.y1),
    };
    const nx = r3(after.x0 - pad.l);
    const ny = r3(after.y0 - pad.t);
    const nw = r3(after.x1 + pad.r - nx);
    const nh = r3(after.y1 + pad.b - ny);
    const out = wrapped.replace(vbMatch[0], `viewBox="${nx} ${ny} ${nw} ${nh}"`);
    fs.writeFileSync(full, out);
    console.log(`  ${full}: rotated ${angle} deg; viewBox ${vbMatch[1]} -> ${nx} ${ny} ${nw} ${nh}`);
  }
}

await browser.close();
