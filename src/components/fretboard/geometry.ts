/**
 * geometry.ts — the drawing geometry of the whole instrument.
 *
 * Pure maths, no React. One coordinate system ("world units") holds the
 * headstock, the nut, the fretboard and the body, which is what makes the
 * fretboard and the instrument graphic a single object rather than two
 * unrelated pictures: the body is positioned from where the frets end, and
 * the strings are drawn as one continuous run from the tuning pegs to the
 * bridge.
 *
 * Fret spacing uses the real equal-tempered rule, so the neck looks like a
 * neck and the 12th fret falls exactly halfway to the bridge.
 */

import { fretDistanceRatio } from '../../core/theory/fretboard';
import type { InstrumentDef } from '../../core/instruments/definitions';

/**
 * World height. Kept tight around the body so the neck occupies as much of
 * the viewport as possible: a photographically exact body would be three
 * times the neck's height and would squash the fretboard, which is the part
 * people actually use.
 */
export const WORLD_H = 272;
export const CENTRE_Y = 136;
/** Left edge of the headstock. */
export const HEAD_X = 12;
/** The nut: origin of all fret measurements. */
export const NUT_X = 276;
/** Nut-to-bridge distance in world units. */
export const SCALE_PX = 1560;
/** How much wider the neck is at the body end than at the nut. */
const TAPER = 1.24;

export interface Peg {
  stringIndex: number;
  /** Centre of the tuner button. */
  x: number;
  y: number;
  /** Where the string leaves the post, on the nut side. */
  postX: number;
  postY: number;
  side: 'top' | 'bottom';
}

export interface Geometry {
  instrument: InstrumentDef;
  width: number;
  height: number;
  nutX: number;
  bridgeX: number;
  /** Right-hand end of the fretted part of the neck. */
  boardEndX: number;
  fretCount: number;
  stringCount: number;
  /** Half the string field's height at the nut. */
  nutHalf: number;
  spacing: number;
  headPath: string;
  bodyPath: string;
  bodyX0: number;
  bodyX1: number;
  pegs: Peg[];
  /** Centre of the headstock, used as the tuner camera's target. */
  headCentre: { x: number; y: number };
  fretX: (fret: number) => number;
  /** x of the note marker for a fret (midpoint of the fret space). */
  noteX: (fret: number) => number;
  /** y of a string at a given x, accounting for the neck taper. */
  stringY: (stringIndex: number, x: number) => number;
  /** Half-height of the neck at a given x. */
  neckHalf: (x: number) => number;
  /** Drawn string thickness at a given x. */
  stringWidth: (stringIndex: number) => number;
  /** Radius of a note marker. */
  noteRadius: number;
}

/**
 * Convert a list of points into a smooth path using Catmull-Rom segments
 * expressed as cubic Béziers. Body and headstock silhouettes are described as
 * a handful of profile points and smoothed, which keeps the shapes editable
 * as data instead of as hand-tuned curve commands.
 */
export function smoothPath(points: [number, number][], close = false): string {
  if (points.length < 2) return '';
  const p = points;
  let d = `M ${r(p[0][0])} ${r(p[0][1])}`;
  const n = p.length;
  for (let i = 0; i < n - 1; i++) {
    const p0 = p[i - 1] ?? p[i];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${r(c1x)} ${r(c1y)}, ${r(c2x)} ${r(c2y)}, ${r(p2[0])} ${r(p2[1])}`;
  }
  return close ? `${d} Z` : d;
}

const r = (v: number): number => Math.round(v * 100) / 100;

/**
 * Body silhouettes as profiles: [fraction along the body, half-height].
 * Top and bottom are given separately, because a real electric guitar body
 * is not symmetric about its centre line.
 */
const BODY_PROFILES: Record<
  InstrumentDef['display']['bodyStyle'],
  { length: number; height: number; top: [number, number][]; bottom: [number, number][] }
> = {
  // Double cutaway: two horns, a waist, a bigger lower bout.
  'guitar-dc': {
    length: 560,
    height: 220,
    top: [
      [0, 0.1],
      [0.03, 0.34],
      [0.09, 0.47],
      [0.16, 0.49],
      [0.24, 0.38],
      [0.34, 0.42],
      [0.46, 0.47],
      [0.6, 0.42],
      [0.75, 0.46],
      [0.88, 0.38],
      [0.97, 0.19],
      [1, 0.03],
    ],
    bottom: [
      [0, 0.12],
      [0.04, 0.4],
      [0.11, 0.55],
      [0.19, 0.56],
      [0.28, 0.44],
      [0.38, 0.47],
      [0.5, 0.52],
      [0.63, 0.47],
      [0.77, 0.54],
      [0.89, 0.44],
      [0.97, 0.22],
      [1, 0.03],
    ],
  },
  // Offset bass body: longer upper horn reaching back towards the neck.
  'bass-jazz': {
    length: 580,
    height: 228,
    top: [
      [0, 0.09],
      [0.02, 0.36],
      [0.07, 0.52],
      [0.14, 0.55],
      [0.23, 0.41],
      [0.33, 0.43],
      [0.45, 0.46],
      [0.59, 0.41],
      [0.74, 0.45],
      [0.87, 0.37],
      [0.96, 0.18],
      [1, 0.03],
    ],
    bottom: [
      [0, 0.11],
      [0.05, 0.36],
      [0.13, 0.48],
      [0.22, 0.5],
      [0.31, 0.42],
      [0.41, 0.46],
      [0.53, 0.53],
      [0.66, 0.5],
      [0.79, 0.55],
      [0.9, 0.44],
      [0.97, 0.21],
      [1, 0.03],
    ],
  },
};

/**
 * Headstock profiles: [fraction from the nut to the tip, half-width as a
 * multiple of the nut's half-width]. Expressing it this way guarantees the
 * headstock meets the nut at exactly the nut's width, whatever the
 * instrument.
 */
const HEAD_PROFILES: Record<
  InstrumentDef['display']['headstock'],
  { top: [number, number][]; bottom: [number, number][] }
> = {
  // Asymmetric paddle, widening towards the tip, as on an in-line headstock.
  inline: {
    top: [
      [0, 1],
      [0.14, 1.2],
      [0.46, 1.3],
      [0.78, 1.42],
      [1, 1.46],
    ],
    bottom: [
      [0, 1],
      [0.22, 1.02],
      [0.56, 1.08],
      [0.84, 1.26],
      [1, 1.46],
    ],
  },
  // Symmetric, for a headstock with tuners on both sides.
  split: {
    top: [
      [0, 1],
      [0.2, 1.42],
      [0.55, 1.46],
      [0.85, 1.44],
      [1, 1.3],
    ],
    bottom: [
      [0, 1],
      [0.2, 1.42],
      [0.55, 1.46],
      [0.85, 1.44],
      [1, 1.3],
    ],
  },
};

/** Build the complete drawing geometry for an instrument. */
export function buildGeometry(instrument: InstrumentDef): Geometry {
  const stringCount = instrument.stringCount;
  const fretCount = instrument.fretCount;
  const spacing = instrument.family === 'bass' ? 18 : 16;
  const nutHalf = ((stringCount - 1) * spacing) / 2 + 15;

  const fretX = (fret: number): number => NUT_X + SCALE_PX * fretDistanceRatio(fret);
  const boardEndX = fretX(fretCount) + (fretX(fretCount) - fretX(fretCount - 1)) * 0.9;
  const bridgeX = NUT_X + SCALE_PX;

  const neckHalf = (x: number): number => {
    const t = Math.max(0, Math.min(1.25, (x - NUT_X) / (boardEndX - NUT_X)));
    return nutHalf * (1 + (TAPER - 1) * t);
  };

  const stringY = (stringIndex: number, x: number): number => {
    // The string field grows with the neck, so strings fan out exactly as
    // they do on a real tapered neck.
    const scale = neckHalf(x) / nutHalf;
    const sp = spacing * scale;
    const top = CENTRE_Y - ((stringCount - 1) * sp) / 2;
    return top + stringIndex * sp;
  };

  const noteX = (fret: number): number =>
    // Open-string markers sit just behind the nut, where the string is open.
    fret === 0 ? NUT_X - 30 : (fretX(fret - 1) + fretX(fret)) / 2;

  // ---- body -------------------------------------------------------------
  const profile = BODY_PROFILES[instrument.display.bodyStyle];
  // The neck disappears into the body a little before the last fret, which is
  // what visually fuses the fretboard and the instrument graphic.
  const bodyX0 = boardEndX - 165;
  const bodyX1 = bodyX0 + profile.length;
  const bodyPath = smoothPath(
    [
      ...profile.top.map(([f, h]): [number, number] => [
        bodyX0 + f * profile.length,
        CENTRE_Y - h * profile.height,
      ]),
      ...[...profile.bottom]
        .reverse()
        .map(([f, h]): [number, number] => [
          bodyX0 + f * profile.length,
          CENTRE_Y + h * profile.height,
        ]),
    ],
    true,
  );

  // ---- headstock --------------------------------------------------------
  const headLen = NUT_X - HEAD_X;
  const headProfile = HEAD_PROFILES[instrument.display.headstock];
  const headPts: [number, number][] = [
    ...headProfile.top.map(([f, h]): [number, number] => [
      NUT_X - f * headLen,
      CENTRE_Y - h * nutHalf,
    ]),
    ...[...headProfile.bottom]
      .reverse()
      .map(([f, h]): [number, number] => [NUT_X - f * headLen, CENTRE_Y + h * nutHalf]),
  ];
  const headPath = smoothPath(headPts, true);

  // ---- tuning pegs ------------------------------------------------------
  // Each string's post sits at the string's own height, so the strings run
  // straight from the nut to their post without crossing one another. The
  // tuner button is then offset to the edge of the headstock and joined to
  // the post by a short stem, which is how a real headstock is laid out.
  const pegs: Peg[] = [];
  const split = instrument.display.headstock === 'split';
  const half = Math.ceil(stringCount / 2);
  for (let i = 0; i < stringCount; i++) {
    const onTop = split ? i < half : true;
    const t = stringCount === 1 ? 0.5 : i / (stringCount - 1);
    let x: number;
    if (split) {
      const groupIndex = onTop ? i : stringCount - 1 - i;
      const groupSize = onTop ? half : stringCount - half;
      const u = groupSize === 1 ? 0.5 : groupIndex / (groupSize - 1);
      x = NUT_X - headLen * (0.22 + u * 0.56);
    } else {
      x = NUT_X - headLen * (0.17 + t * 0.66);
    }
    const postY = stringY(i, x);
    const edge = nutHalf * 1.34;
    pegs.push({
      stringIndex: i,
      x,
      y: CENTRE_Y + (onTop ? -edge : edge),
      postX: x,
      postY,
      side: onTop ? 'top' : 'bottom',
    });
  }

  const stringWidth = (stringIndex: number): number => {
    const gauge = instrument.stringGauges[stringIndex] ?? 0.7;
    return 1.1 + gauge * 2.6;
  };

  return {
    instrument,
    width: Math.round(bodyX1 + 30),
    height: WORLD_H,
    nutX: NUT_X,
    bridgeX,
    boardEndX,
    fretCount,
    stringCount,
    nutHalf,
    spacing,
    headPath,
    bodyPath,
    bodyX0,
    bodyX1,
    pegs,
    headCentre: { x: HEAD_X + headLen * 0.5, y: CENTRE_Y },
    fretX,
    noteX,
    stringY,
    neckHalf,
    stringWidth,
    // Sized so that a highlighted marker never overlaps its neighbour
    // on the next string.
    noteRadius: instrument.family === 'bass' ? 6.6 : 6.0,
  };
}
