/**
 * extract-artwork.mjs — build src/components/fretboard/artwork.ts from the
 * layered SVG drawings in reference/.
 *
 * Each instrument is supplied as one drawing of the whole instrument plus a
 * file per part. The part files are cropped to their own bounds, so the first
 * job is to put them back into one coordinate system: every part's path data
 * is the whole drawing's path data translated by a constant, so matching one
 * path recovers that constant exactly.
 *
 * The second job is to find the instrument frame. The drawing's own fret lines
 * are measured and the equal-tempered fret rule is fitted to them, which gives
 * the nut position and the scale length in drawing units. Everything is then
 * re-expressed with the nut at the origin and the scale length exactly 1000
 * units, so FretLab's computed notes land on the drawn frets.
 *
 * Usage: node tools/extract-artwork.mjs
 */

import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const SOURCES = {
  guitar: {
    dir: 'reference/Stratocaster',
    name: 'Stratocaster',
    strings: 6,
    full: 'Full Guitar.svg',
    frets: 'Frets.svg',
    neck: 'Neck.svg',
    machine: 'Tuning Machine.svg',
    // Drawn in this order, beneath the strings.
    parts: [
      ['body', 'Body without Pickguard.svg'],
      ['pickguard', 'Pickguard.svg'],
      ['bridge', 'Bridge.svg'],
      ['head', 'Head.svg'],
      ['neck', 'Neck.svg'],
    ],
    // Drawn over the strings.
    over: [
      ['holder', 'String Holder.svg'],
      ['arm', 'Tremolo Arm.svg'],
    ],
  },
  bass: {
    dir: 'reference/Precision Bass',
    name: 'Precision Bass',
    strings: 4,
    full: 'Full Guitar.svg',
    frets: 'Frets.svg',
    neck: 'Neck.svg',
    machine: 'Tuning Machine.svg',
    parts: [
      ['body', 'Body Without Pickguard.svg'],
      ['pickguard', 'Pickguard.svg'],
      ['bridge', 'Bridge.svg'],
      ['head', 'Head.svg'],
      ['neck', 'Neck.svg'],
    ],
    over: [['holder', 'String Holder.svg']],
  },
};

const read = (p) => fs.readFileSync(p, 'utf8').replace(/<\?xml[^>]*\?>/, '');
const round = (v, n = 2) => {
  const f = 10 ** n;
  return Math.round(v * f) / f;
};

/**
 * Offset of a part within the whole drawing.
 *
 * A shape's size does not change when it is moved, so each of the part's
 * shapes is matched to the whole drawing's shape of the same size, and the
 * difference in position is the offset. Taking the commonest answer across
 * all of a part's shapes makes it immune to any one coincidental match.
 */
function offsetOf(fullShapes, partShapes) {
  const votes = new Map();
  for (const p of partShapes) {
    const pb = bboxOf(p.pts);
    const pw = pb.maxX - pb.minX;
    const ph = pb.maxY - pb.minY;
    for (const f of fullShapes) {
      const fb = bboxOf(f.pts);
      const tol = Math.max(0.05, (pw + ph) * 0.004);
      if (Math.abs(fb.maxX - fb.minX - pw) > tol || Math.abs(fb.maxY - fb.minY - ph) > tol) continue;
      const key = `${round(fb.minX - pb.minX, 1)}|${round(fb.minY - pb.minY, 1)}`;
      votes.set(key, (votes.get(key) ?? 0) + 1);
    }
  }
  if (votes.size === 0) throw new Error('part not found in the full drawing');
  const ranked = [...votes.entries()].sort((a, b) => b[1] - a[1]);
  const [best] = ranked[0];
  const [dx, dy] = best.split('|').map(Number);
  // A part that is repeated -- a tuning machine, say -- shows up as several
  // offsets that each account for all of its shapes.
  const repeats = ranked
    .filter(([, v]) => v >= Math.max(2, votes.get(best) * 0.9))
    .map(([k]) => k.split('|').map(Number));
  return { dx, dy, agree: votes.get(best), repeats };
}

/** Sample every shape of an SVG into polylines, with its resolved paint. */
async function shapesOf(browser, svg) {
  const page = await browser.newPage({ viewport: { width: 600, height: 400 } });
  await page.setContent(`<body style="margin:0">${svg}</body>`);
  const out = await page.evaluate(() => {
    const res = [];
    const root = document.querySelector('svg');
    // Render at the viewBox's own scale, so every file is measured in the
    // same units as its drawing rather than scaled to fit the window.
    const vb = root.viewBox.baseVal;
    root.setAttribute('width', String(vb.width));
    root.setAttribute('height', String(vb.height));
    root.style.width = `${vb.width}px`;
    root.style.height = `${vb.height}px`;
    for (const el of root.querySelectorAll('path, circle, ellipse, rect, polygon, polyline, line')) {
      const cs = getComputedStyle(el);
      const m = el.getCTM();
      const pts = [];
      let closed = true;
      if (typeof el.getTotalLength === 'function' && el.getTotalLength() > 0) {
        const total = el.getTotalLength();
        const n = Math.max(16, Math.min(900, Math.ceil(total / 0.12)));
        for (let i = 0; i < n; i++) {
          const p = el.getPointAtLength((i / n) * total);
          pts.push([m.a * p.x + m.c * p.y + m.e, m.b * p.x + m.d * p.y + m.f]);
        }
        if (el.tagName === 'path') closed = /z\s*$/i.test(el.getAttribute('d') || '');
        if (el.tagName === 'line' || el.tagName === 'polyline') closed = false;
      } else continue;
      const sw = parseFloat(cs.strokeWidth) || 0;
      const scale = Math.hypot(m.a, m.b);
      res.push({
        tag: el.tagName,
        pts,
        closed,
        fill: cs.fill === 'none' ? 'none' : cs.fill,
        stroke: cs.stroke === 'none' ? 'none' : cs.stroke,
        sw: sw * scale,
        opacity: parseFloat(cs.opacity || '1'),
      });
    }
    return res;
  });
  await page.close();
  return out;
}

/** Ramer–Douglas–Peucker simplification. */
function rdp(points, eps) {
  if (points.length < 3) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = points[a];
    const [bx, by] = points[b];
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy) || 1;
    let worst = -1;
    let worstD = eps;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs(dy * (points[i][0] - ax) - dx * (points[i][1] - ay)) / len;
      if (d > worstD) {
        worstD = d;
        worst = i;
      }
    }
    if (worst > 0) {
      keep[worst] = 1;
      stack.push([a, worst], [worst, b]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

const toPath = (pts, closed) =>
  `M${pts.map(([x, y]) => `${round(x, 1)} ${round(y, 1)}`).join('L')}${closed ? 'Z' : ''}`;

const bboxOf = (pts) => {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
};

const R = (n) => 1 - 2 ** (-n / 12);

const browser = await chromium.launch({ channel: 'chrome' });
const artwork = {};

for (const [family, src] of Object.entries(SOURCES)) {
  const fullShapes = await shapesOf(browser, read(path.join(src.dir, src.full)));

  // ---- every part, in the whole drawing's coordinates ---------------------
  const collected = [];
  for (const [role, file, over] of [
    ...src.parts.map((p) => [...p, false]),
    ...src.over.map((p) => [...p, true]),
  ]) {
    const shapes = await shapesOf(browser, read(path.join(src.dir, file)));
    const { dx, dy, agree } = offsetOf(fullShapes, shapes);
    collected.push({ role, over, dx, dy, shapes });
    console.log(`  ${family}/${file}: ${shapes.length} shapes, offset ${round(dx)} ${round(dy)} (${agree} agree)`);
  }

  // ---- the frame, from the drawing's own fret lines -----------------------
  const fretShapes = await shapesOf(browser, read(path.join(src.dir, src.frets)));
  const fretOff = offsetOf(fullShapes, fretShapes);
  // Fret wires are the tall narrow shapes; take each one's centre x.
  const boxes = fretShapes.map((s) => bboxOf(s.pts));
  const tallest = Math.max(...boxes.map((b) => b.maxY - b.minY));
  const fretXs = [
    ...new Set(
      boxes
        .filter((b) => b.maxY - b.minY > tallest * 0.55 && b.maxX - b.minX < tallest * 0.35)
        .map((b) => round((b.minX + b.maxX) / 2 + fretOff.dx, 2)),
    ),
  ].sort((a, b) => a - b);

  // Fit nut and scale length to those positions.
  let best = null;
  for (let i = 0; i < fretXs.length; i++) {
    for (let j = i + 4; j < fretXs.length; j++) {
      for (let m = 0; m <= 2; m++) {
        for (let n = m + (j - i); n <= m + (j - i) + 1; n++) {
          const S = (fretXs[j] - fretXs[i]) / (R(n) - R(m));
          const x0 = fretXs[i] - S * R(m);
          const pred = Array.from({ length: 30 }, (_, k) => x0 + S * R(k));
          const d = fretXs.map((x) => Math.min(...pred.map((p) => Math.abs(p - x))));
          const inl = d.filter((v) => v < S * 0.0025).length;
          const err = d.filter((v) => v < S * 0.0025).reduce((a, v) => a + v, 0);
          if (!best || inl > best.inl || (inl === best.inl && err < best.err)) {
            best = { inl, err, S, x0 };
          }
        }
      }
    }
  }
  // Least-squares refinement on the matched frets.
  const pred = Array.from({ length: 30 }, (_, k) => best.x0 + best.S * R(k));
  const matched = fretXs
    .map((x) => {
      const k = pred.reduce((bi, p, i) => (Math.abs(p - x) < Math.abs(pred[bi] - x) ? i : bi), 0);
      return { x, k, d: Math.abs(pred[k] - x) };
    })
    .filter((m) => m.d < best.S * 0.003);
  const n = matched.length;
  const sr = matched.reduce((a, m) => a + R(m.k), 0);
  const sx = matched.reduce((a, m) => a + m.x, 0);
  const srr = matched.reduce((a, m) => a + R(m.k) ** 2, 0);
  const srx = matched.reduce((a, m) => a + R(m.k) * m.x, 0);
  const S = (n * srx - sr * sx) / (n * srr - sr * sr);
  const x0 = (sx - S * sr) / n;
  const resid = matched.map((m) => m.x - (x0 + S * R(m.k)));
  const fretCount = Math.max(...matched.map((m) => m.k));
  console.log(
    `  ${family}: ${fretXs.length} fret lines, ${n} matched (0..${fretCount}); nut x=${round(x0)}, scale=${round(S)}; ` +
      `residual rms ${round(Math.sqrt(resid.reduce((a, v) => a + v * v, 0) / n), 3)} units ` +
      `(${round((Math.sqrt(resid.reduce((a, v) => a + v * v, 0) / n) / S) * 1000, 3)} per mille)`,
  );

  // ---- the neck, for string placement -------------------------------------
  const neckShapes = await shapesOf(browser, read(path.join(src.dir, src.neck)));
  const neckOff = offsetOf(fullShapes, neckShapes);
  const neckBox = neckShapes
    .map((s) => bboxOf(s.pts))
    .reduce((a, b) => (b.maxX - b.minX > a.maxX - a.minX ? b : a));
  const K = 1000 / S;
  const frame = ([x, y], dx = 0, dy = 0) => [(x + dx - x0) * K, (y + dy - 0) * K];

  // The drawing's neck centre line becomes y = 0.
  const centreY = ((neckBox.minY + neckBox.maxY) / 2 + neckOff.dy);
  const toFrame = ([x, y], dx, dy) => [(x + dx - x0) * K, (y + dy - centreY) * K];

  // ---- assemble -----------------------------------------------------------
  const parts = [];
  // The drawings are laid out with the bass side downwards, which is how
  // FretLab reads a fretboard, but that leaves the headstock logo upside
  // down. Turning just the logo back the right way up keeps everything else
  // exactly as drawn.
  const logoFill = 'rgb(35, 24, 21)';
  const logoBox = (() => {
    const head = collected.find((c) => c.role === 'head');
    if (!head) return null;
    const glyphs = head.shapes.filter((sh) => sh.fill === logoFill);
    if (glyphs.length < 3) return null;
    const b = bboxOf(glyphs.flatMap((sh) => sh.pts));
    return { cx: (b.minX + b.maxX) / 2, cy: (b.minY + b.maxY) / 2 };
  })();

  for (const c of collected) {
    for (const s of c.shapes) {
      const isLogo = c.role === 'head' && logoBox && s.fill === logoFill;
      const src2 = isLogo
        ? s.pts.map(([x, y]) => [2 * logoBox.cx - x, 2 * logoBox.cy - y])
        : s.pts;
      let pts = src2.map((p) => toFrame(p, c.dx, c.dy));
      pts = rdp(pts, 0.35);
      if (pts.length < 2) continue;
      parts.push({
        role: c.role,
        over: c.over,
        d: toPath(pts, s.closed),
        fill: s.fill,
        stroke: s.stroke,
        sw: round(s.sw * K, 2),
        opacity: s.opacity === 1 ? undefined : round(s.opacity, 2),
      });
    }
  }

  const all = parts.flatMap((p) => [...p.d.matchAll(/(-?[\d.]+) (-?[\d.]+)/g)].map((m) => [+m[1], +m[2]]));
  const bounds = bboxOf(all);

  const neckHalfNut = ((neckBox.maxY - neckBox.minY) / 2) * K;
  const neckAt = (frac) => {
    // Half-width of the drawn neck at a fraction along the fretboard.
    const xs = neckShapes.flatMap((s) => s.pts).filter(() => true);
    return xs.length;
  };

  // Peg positions: the drawing repeats one tuning machine per string, so find
  // every shape in the whole drawing the size of the machine's largest shape.
  // Nearest the nut first, which is the lowest string's.
  const machineShapes = await shapesOf(browser, read(path.join(src.dir, src.machine)));
  const mb = machineShapes.map((sh) => bboxOf(sh.pts)).sort((a, b2) => (b2.maxX - b2.minX) - (a.maxX - a.minX))[0];
  const mw = mb.maxX - mb.minX;
  const mh = mb.maxY - mb.minY;
  const pegs = fullShapes
    .map((sh) => bboxOf(sh.pts))
    .filter((b2) => Math.abs(b2.maxX - b2.minX - mw) < mw * 0.08 && Math.abs(b2.maxY - b2.minY - mh) < mh * 0.08)
    .map((b2) => toFrame([(b2.minX + b2.maxX) / 2, (b2.minY + b2.maxY) / 2], 0, 0))
    // Only those on the headstock: the same size can occur on the body.
    .filter(([x]) => x < 0)
    .map(([x, y]) => [round(x, 1), round(y, 1)])
    .sort((a, b2) => b2[0] - a[0])
    .slice(0, src.strings);

  artwork[family] = {
    source: src.name,
    strings: src.strings,
    fretCount,
    bounds: {
      minX: round(bounds.minX, 1),
      maxX: round(bounds.maxX, 1),
      minY: round(bounds.minY, 1),
      maxY: round(bounds.maxY, 1),
    },
    neckHalfNut: round(neckHalfNut, 2),
    pegs,
    parts,
  };
  void neckAt;
  void frame;
}

await browser.close();

const banner = `/**
 * artwork.ts — instrument artwork. GENERATED FILE, do not edit by hand.
 *
 * Rebuild with \`node tools/extract-artwork.mjs\`, which assembles it from the
 * layered SVG drawings in reference/. See reference/README.md.
 *
 * Everything is in the "instrument frame": the origin is the centre of the
 * nut, +x runs along the strings towards the bridge, +y is the bass side
 * (drawn at the bottom), and the scale length is exactly 1000 units. The frame
 * is fitted to the drawings' own fret lines, so FretLab's computed fret
 * positions land on the drawn frets.
 */

export interface ArtBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface ArtPart {
  /** body, pickguard, bridge, head, tuner, knob, neck, holder, arm. */
  role: string;
  /** True for parts drawn over the strings. */
  over?: boolean;
  d: string;
  fill: string;
  stroke: string;
  /** Stroke width in instrument-frame units. */
  sw: number;
  opacity?: number;
}

export interface Artwork {
  /** The instrument the drawing depicts. */
  source: string;
  /** How many strings it is drawn with. */
  strings: number;
  /** Highest fret the drawing has a wire for. */
  fretCount: number;
  bounds: ArtBounds;
  /** Half the drawn neck's width at the nut. */
  neckHalfNut: number;
  /** Centre of each tuning machine, the lowest string's first. */
  pegs: [number, number][];
  parts: ArtPart[];
}
`;

const body = `${banner}\nexport const ARTWORK: Record<'guitar' | 'bass', Artwork> = ${JSON.stringify(artwork, null, 1)};\n`;
fs.writeFileSync('src/components/fretboard/artwork.ts', body);
for (const [k, a] of Object.entries(artwork)) {
  console.log(
    `${k}: ${a.parts.length} parts, ${a.fretCount} frets, bounds x ${a.bounds.minX}..${a.bounds.maxX} y ${a.bounds.minY}..${a.bounds.maxY}`,
  );
}
console.log(`wrote src/components/fretboard/artwork.ts (${(body.length / 1024).toFixed(0)} kB)`);
