/**
 * extract-artwork.mjs — build src/components/fretboard/artwork.ts from the
 * traced reference data in reference/.
 *
 * The tracing itself is done by the Python scripts in reference/trace/, which
 * segment two photographs of real instruments, rectify them so the nut is at
 * the origin and the scale length is exactly 1000 units, and write out the
 * outline of each part. This script only assembles that data into a typed
 * TypeScript module.
 *
 * Usage: node tools/extract-artwork.mjs
 */

import fs from 'node:fs';

const round1 = (v) => Math.round(v * 10) / 10;

/**
 * Both photographs show the instrument from the front, so their bass side is
 * uppermost. FretLab draws the lowest string at the bottom, so every y is
 * mirrored here, once, at the point the artwork is generated.
 */
const flipY = (pts) => pts.map(([x, y]) => [x, -y]);
const toPath = (pts) => `M${pts.map(([x, y]) => `${round1(x)} ${round1(y)}`).join('L')}Z`;

/** Rounded bar, centred at (cx, cy), long axis `angle` degrees from vertical. */
function stadium(cx, cy, w, h, angle = 0, n = 9) {
  const r = w / 2;
  const half = Math.max(0, h / 2 - r);
  const a = (angle * Math.PI) / 180;
  const ax = Math.sin(a);
  const ay = Math.cos(a);
  const pts = [];
  for (const sgn of [1, -1]) {
    const ex = cx + sgn * half * ax;
    const ey = cy + sgn * half * ay;
    for (let i = 0; i < n; i++) {
      const t = -Math.PI / 2 + (i / (n - 1)) * Math.PI;
      const c = Math.cos(t) * sgn;
      const s = Math.sin(t) * sgn;
      pts.push([ex + r * (c * ax + s * ay), ey + r * (c * ay - s * ax)]);
    }
  }
  return pts;
}

function circle(cx, cy, r, n = 28) {
  return Array.from({ length: n }, (_, i) => {
    const t = (i / n) * Math.PI * 2;
    return [cx + r * Math.cos(t), cy + r * Math.sin(t)];
  });
}

function rect(x0, y0, x1, y1, r = 0) {
  if (!r) return [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  const pts = [];
  const corners = [[x1 - r, y0 + r, -Math.PI / 2], [x1 - r, y1 - r, 0], [x0 + r, y1 - r, Math.PI / 2], [x0 + r, y0 + r, Math.PI]];
  for (const [cx, cy, a0] of corners) {
    for (let i = 0; i <= 5; i++) {
      const t = a0 + (i / 5) * (Math.PI / 2);
      pts.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]);
    }
  }
  return pts;
}

const part = (role, pts, fill, extra = {}) => ({ role, d: toPath(flipY(pts)), fill, ...extra });

function boundsOf(parts) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of parts) {
    for (const m of p.d.matchAll(/(-?[\d.]+) (-?[\d.]+)/g)) {
      const x = +m[1], y = +m[2];
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
  }
  return { minX: round1(minX), maxX: round1(maxX), minY: round1(minY), maxY: round1(maxY) };
}

// ---------------------------------------------------------------------------

const strat = JSON.parse(fs.readFileSync('reference/trace/strat-parts.json', 'utf8'));
const jazz = JSON.parse(fs.readFileSync('reference/trace/jazz-parts.json', 'utf8'));

/** Tuner posts, evenly spaced along the line the photo's posts lie on. */
function postLine(keys, count) {
  // The photo's tuner keys give the direction the posts run in; the first is
  // nearest the nut and belongs to the lowest string.
  const xs = keys.map((k) => k[0]);
  const ys = keys.map((k) => k[1]);
  const n = xs.length;
  const sx = xs.reduce((a, b) => a + b, 0) / n;
  const sy = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (xs[i] - sx) * (ys[i] - sy); den += (xs[i] - sx) ** 2; }
  const slope = den ? num / den : 0;
  return { sx, sy, slope };
}

function build(src, cfg) {
  const under = [];
  const over = [];

  under.push(part('guard', src.guard, cfg.guardFill, { stroke: cfg.guardStroke, sw: 2.5 }));
  for (const p of cfg.pickups(src)) under.push(p);
  for (const p of cfg.extraUnder(src)) under.push(p);
  for (const [kx, ky, kr] of cfg.knobs(src)) under.push(part('knob', circle(kx, ky, kr), '#e8ebef', { stroke: '#7d8794', sw: 2 }));

  const b = src.bridge;
  under.push(part('bridge', rect(b[0], b[1], b[2], b[3], 6), '#aeb6c0', { stroke: '#6b7480', sw: 2.5 }));
  // Mirrored too, so the geometry that reads these agrees with the paths.
  const bridgeFlipped = [b[0], -b[3], b[2], -b[1]];

  return {
    source: cfg.source,
    body: part('body', src.body, cfg.bodyFill, { stroke: cfg.bodyStroke, sw: 3 }),
    head: part('head', src.head, cfg.headFill, { stroke: cfg.headStroke, sw: 3 }),
    under,
    over,
    neckHalfNut: src.neckHalfNut,
    neckHalfSlope: src.neckHalfSlope,
    fretboardEnd: src.fretboardEnd,
    bodyStart: src.bodyStart,
    bridge: bridgeFlipped,
    headBounds: boundsOf([part('head', src.head, '#000')]),
    postLine: (() => {
      const l = postLine((src.keys.length >= 3 ? src.keys : src.posts).map(([x, y]) => [x, -y]), 6);
      return { sx: round1(l.sx), sy: round1(l.sy), slope: Math.round(l.slope * 1e4) / 1e4 };
    })(),
    postR: src.postR,
    keySize: cfg.keySize,
  };
}

const art = {
  guitar: build(strat, {
    source: 'Fender Custom Shop Stratocaster, photographed by AvR (CC BY-SA 4.0, Wikimedia Commons)',
    bodyFill: '#efe7d2', bodyStroke: '#8d8468',
    headFill: '#e3c88a', headStroke: '#9c7f45',
    guardFill: '#dfe3d2', guardStroke: '#2b2f33',
    keySize: [26, 15],
    pickups: (s) => s.pickups.map((p) => part('pickup', stadium(p.cx, p.cy, 30, 126, p.angle), '#f2f0e6', { stroke: '#8d8a7e', sw: 2 })),
    extraUnder: (s) => [part('jack', s.jack, '#c9d1da', { stroke: '#6b7480', sw: 2 })],
    knobs: (s) => s.knobs.filter((k) => k[0] < 1060).slice(0, 3),
  }),
  bass: build(jazz, {
    source: 'Fender Jazz Bass 1966, photographed by Freebird (CC BY 2.5, Wikimedia Commons)',
    bodyFill: '#f0e8d4', bodyStroke: '#8d8468',
    headFill: '#e3c88a', headStroke: '#9c7f45',
    guardFill: '#7a1d22', guardStroke: '#3a1012',
    keySize: [30, 17],
    pickups: (s) => s.pickups.map((p) => part('pickup', rect(p.cx - p.w / 2, p.cy - p.h / 2, p.cx + p.w / 2, p.cy + p.h / 2, 5), '#1b1e22', { stroke: '#4a5058', sw: 2 })),
    extraUnder: (s) => [part('plate', s.plate, '#c9d1da', { stroke: '#6b7480', sw: 2 })],
    knobs: (s) => s.knobs.slice(0, 3),
  }),
};

for (const a of Object.values(art)) {
  a.bounds = boundsOf([a.body, a.head, ...a.under, ...a.over]);
}

const banner = `/**
 * artwork.ts — instrument artwork. GENERATED FILE, do not edit by hand.
 *
 * Run \`node tools/extract-artwork.mjs\` to rebuild it. The outlines are traced
 * from photographs of real instruments by the scripts in reference/trace/;
 * see reference/README.md for the sources and their licences.
 *
 * Everything is in the "instrument frame": the origin is the centre of the
 * nut, +x runs along the strings towards the bridge, +y is the bass side
 * (drawn at the bottom), and the scale length is exactly 1000 units. Placing
 * the artwork is therefore a single transform, and because the frame was fitted
 * to the photographs' own fret positions, the computed frets land on the real
 * ones.
 */

export interface ArtBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface ArtPart {
  /** body, head, guard, pickup, knob, bridge, jack, plate. */
  role: string;
  /** Closed outline as SVG path data, in instrument-frame units. */
  d: string;
  fill: string;
  stroke?: string;
  /** Stroke width in instrument-frame units. */
  sw?: number;
}

export interface Artwork {
  /** Photograph the outlines were traced from. */
  source: string;
  /** Extent of every part. */
  bounds: ArtBounds;
  body: ArtPart;
  head: ArtPart;
  /** Parts beneath the strings, in drawing order. */
  under: ArtPart[];
  /** Parts over the strings. */
  over: ArtPart[];
  /** Half-width of the neck at the nut, and how it grows per unit of x. */
  neckHalfNut: number;
  neckHalfSlope: number;
  /** Where the fretboard ends and where the body silhouette begins. */
  fretboardEnd: number;
  bodyStart: number;
  /** Bridge plate box: x0, y0, x1, y1. */
  bridge: number[];
  /** Extent of the headstock alone, used to lay the tuners out. */
  headBounds: ArtBounds;
  /** The line the tuner posts run along, from the photograph. */
  postLine: { sx: number; sy: number; slope: number };
  postR: number;
  /** Tuner key size, width by height. */
  keySize: number[];
}
`;

fs.writeFileSync(
  'src/components/fretboard/artwork.ts',
  `${banner}\nexport const ARTWORK: Record<'guitar' | 'bass', Artwork> = ${JSON.stringify(art, null, 2)};\n`,
);
for (const [k, a] of Object.entries(art)) {
  console.log(`${k}: bounds x ${a.bounds.minX}..${a.bounds.maxX}, y ${a.bounds.minY}..${a.bounds.maxY}; ${a.under.length} parts under; neck half ${a.neckHalfNut}+${a.neckHalfSlope}x`);
}
console.log('wrote src/components/fretboard/artwork.ts');
