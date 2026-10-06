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
 * Orientation: **string index 0 is the lowest-pitched string and is drawn at
 * the bottom**, the way a chord chart or a tab staff is read. The body and
 * headstock outlines are authored for that orientation, so the long bass-side
 * horn and the tuning pegs sit on the bottom edge and the instrument reads
 * the right way up.
 *
 * Fret spacing uses the real equal-tempered rule, so the neck looks like a
 * neck and the 12th fret falls exactly halfway to the bridge.
 */

import { fretDistanceRatio } from '../../core/theory/fretboard';
import type { InstrumentDef } from '../../core/instruments/definitions';

export const WORLD_H = 500;
export const CENTRE_Y = 250;
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
  /** Where the string leaves the post, in line with the string itself. */
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
  bodyLength: number;
  /** Where the neck disappears into the body. */
  neckJoinX: number;
  /** Normalised body-box (1000 x 700) coordinates -> world coordinates. */
  bodyPoint: (nx: number, ny: number) => [number, number];
  /** World x -> normalised body-box x. */
  bodyBoxX: (x: number) => number;
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
  /** Drawn string thickness. */
  stringWidth: (stringIndex: number) => number;
  /** Radius of a note marker. */
  noteRadius: number;
}

/**
 * Convert a list of points into a smooth path using Catmull-Rom segments
 * expressed as cubic Béziers. Body and headstock silhouettes are described as
 * traced outlines and smoothed, which keeps the shapes editable as data
 * instead of as hand-tuned curve commands.
 */
export function smoothPath(points: [number, number][], close = false): string {
  if (points.length < 2) return '';
  const p = points;
  let d = `M ${r(p[0][0])} ${r(p[0][1])}`;
  const n = p.length;
  for (let i = 0; i < n - 1; i++) {
    const p1 = p[i];
    const p2 = p[i + 1];
    // A repeated point is a corner: the curve arrives with one tangent and
    // leaves with another instead of being smoothed through. That is what
    // gives the body's horn tips a point rather than a rounded shoulder.
    if (p1[0] === p2[0] && p1[1] === p2[1]) continue;
    const p0 = p[i - 1] ?? p1;
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
 * Body outlines, traced as absolute points in a normalised 1000 x 700 box.
 *
 * x runs from the tip of the long horn (0) to the end of the body (1000);
 * y runs across the body with the neck's centre line at 350. The outline is
 * traced in one continuous loop, counter-clockwise from the neck pocket on
 * the treble side: up the cutaway scoop, round the horn tip, out along the
 * bout, round the end of the body, back along the bass side, round the long
 * bass horn, and down its cutaway to the neck pocket again.
 *
 * Tracing the real outline — rather than describing each side as a
 * half-height per x — is what gives genuine pointed horns and cutaway
 * scoops. Points are deliberately close together at the horn tips so the
 * smoothing keeps them sharp.
 *
 * The bass side is drawn at the *bottom*, because the lowest string is at the
 * bottom, so these are the familiar outlines seen from the far side.
 */
const BODY_BOX_W = 1000;
const BODY_BOX_H = 800;
/** The neck's centre line within the body box. */
const BODY_CENTRE = 350;

const BODY_PROFILES: Record<
  InstrumentDef['display']['bodyStyle'],
  { length: number; height: number; bridgeFraction: number; outline: [number, number][] }
> = {
  // Offset double cutaway: short treble horn, long bass horn, pinched waist.
  'offset-double-cutaway': {
    length: 700,
    height: 500,
    // Where the bridge sits along the body. The body is positioned from this
    // so the strings always terminate on the bridge.
    bridgeFraction: 0.84,
    outline: [
      // Treble-side cutaway: a deep scoop hugging the neck, then out to a
      // horn that projects well forward of the neck pocket.
      [216, 232],
      [210, 202],
      [200, 178],
      [182, 160],
      [154, 148],
      [118, 142],
      // treble horn tip (repeated point = a corner, not a smooth shoulder)
      [68, 136],
      [68, 136],
      // outer edge of the treble horn, rising to the upper bout
      [54, 108],
      [66, 80],
      [102, 56],
      [154, 40],
      [216, 30],
      [286, 28],
      // a gently waisted top edge rather than one continuous arc
      [352, 34],
      [410, 50],
      [452, 74],
      [478, 96],
      [520, 78],
      [574, 58],
      [640, 44],
      [706, 42],
      [772, 54],
      // blunt, slightly squared end of the body
      [832, 80],
      [882, 122],
      [920, 178],
      [944, 244],
      [952, 316],
      [948, 392],
      [930, 462],
      // bass-side lower bout
      [900, 528],
      [856, 584],
      [798, 628],
      [730, 656],
      [656, 666],
      // waist
      [588, 656],
      [536, 630],
      [500, 600],
      [480, 578],
      // the long bass horn
      [436, 566],
      [380, 560],
      [320, 574],
      [258, 612],
      [200, 642],
      [142, 660],
      [86, 660],
      [46, 636],
      // bass horn tip
      [14, 572],
      [14, 572],
      // cutaway scoop back to the neck pocket
      [28, 540],
      [56, 516],
      [98, 496],
      [152, 480],
      [216, 468],
    ],
  },
  // The bass: a longer body, a markedly longer bass horn reaching back
  // towards the neck, and bouts offset from one another.
  'offset-bass': {
    length: 760,
    height: 510,
    bridgeFraction: 0.84,
    outline: [
      // Treble-side cutaway.
      [228, 230],
      [222, 198],
      [212, 172],
      [194, 152],
      [166, 138],
      [128, 130],
      // treble horn tip
      [78, 124],
      [78, 124],
      [62, 96],
      [74, 66],
      [112, 42],
      [168, 26],
      [234, 18],
      [304, 18],
      [372, 28],
      [428, 50],
      [468, 78],
      [494, 100],
      [536, 80],
      [590, 58],
      [656, 44],
      [724, 42],
      [790, 56],
      // blunt end of the body
      [850, 84],
      [900, 128],
      [938, 186],
      [962, 254],
      [970, 328],
      [966, 406],
      [948, 478],
      [916, 548],
      [868, 606],
      [806, 650],
      [736, 678],
      [660, 686],
      [592, 674],
      [540, 646],
      [504, 614],
      [484, 590],
      // the long bass horn of an offset bass, reaching back up the neck
      [440, 578],
      [382, 572],
      [320, 586],
      [254, 626],
      [192, 660],
      [128, 682],
      [66, 684],
      [26, 656],
      // bass horn tip
      [2, 582],
      [2, 582],
      [16, 548],
      [44, 524],
      [88, 502],
      [150, 484],
      [228, 470],
    ],
  },
};

/**
 * Headstock outlines: [fraction from the nut to the tip, half-width as a
 * multiple of the nut's half-width]. Expressing it this way guarantees the
 * headstock meets the nut at exactly the nut's width, whatever the
 * instrument. The tuners sit along the bottom edge, matching the bass side.
 */
const HEAD_PROFILES: Record<
  InstrumentDef['display']['headstock'],
  { top: [number, number][]; bottom: [number, number][] }
> = {
  // Six in a row: a slim treble edge and a broad, swept bass edge.
  'inline-guitar': {
    top: [
      [0, 1],
      [0.18, 1.02],
      [0.46, 1.04],
      [0.72, 1.12],
      [0.89, 1.22],
      [1, 1.16],
    ],
    bottom: [
      [0, 1],
      [0.14, 1.32],
      [0.34, 1.62],
      [0.58, 1.82],
      [0.8, 1.86],
      [0.94, 1.64],
      [1, 1.16],
    ],
  },
  // Four in a row: broader and blunter, as on a long-scale bass.
  'inline-bass': {
    top: [
      [0, 1],
      [0.2, 1.04],
      [0.5, 1.08],
      [0.76, 1.16],
      [0.92, 1.24],
      [1, 1.18],
    ],
    bottom: [
      [0, 1],
      [0.16, 1.38],
      [0.4, 1.72],
      [0.64, 1.9],
      [0.84, 1.9],
      [0.95, 1.68],
      [1, 1.18],
    ],
  },
};

/** Build the complete drawing geometry for an instrument. */
export function buildGeometry(instrument: InstrumentDef): Geometry {
  const stringCount = instrument.stringCount;
  const fretCount = instrument.fretCount;
  const spacing = instrument.family === 'bass' ? 19 : 17;
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
    // they do on a real tapered neck. Index 0 is the lowest-pitched string
    // and sits at the bottom, so the index counts upwards from there.
    const scale = neckHalf(x) / nutHalf;
    const sp = spacing * scale;
    const bottom = CENTRE_Y + ((stringCount - 1) * sp) / 2;
    return bottom - stringIndex * sp;
  };

  const noteX = (fret: number): number =>
    // Open-string markers sit just behind the nut, where the string is open.
    fret === 0 ? NUT_X - 30 : (fretX(fret - 1) + fretX(fret)) / 2;

  // ---- body -------------------------------------------------------------
  const profile = BODY_PROFILES[instrument.display.bodyStyle];
  // The horns reach back past the last frets, which is what visually fuses
  // the fretboard and the instrument graphic into one object.
  // Anchor the body to the bridge rather than to the end of the fretboard,
  // so the bridge graphic lands exactly where the strings terminate.
  const bodyX0 = bridgeX - profile.length * profile.bridgeFraction;
  const bodyX1 = bodyX0 + profile.length;
  /** Normalised body-box coordinates -> world coordinates. */
  const bodyPoint = (nx: number, ny: number): [number, number] => [
    bodyX0 + (nx / BODY_BOX_W) * profile.length,
    CENTRE_Y + ((ny - BODY_CENTRE) / BODY_BOX_H) * profile.height,
  ];
  /** World x -> normalised body-box x, for aligning hardware to the strings. */
  const bodyBoxX = (x: number): number => ((x - bodyX0) / profile.length) * BODY_BOX_W;
  const bodyPath = smoothPath(profile.outline.map(([nx, ny]) => bodyPoint(nx, ny)), true);
  // The neck disappears into the body at the neck pocket, which the outline
  // starts and ends on.
  const neckJoinX = bodyPoint(profile.outline[0][0], 0)[0];

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
  // tuner button is then offset to the bass edge of the headstock and joined
  // to the post by a short stem, which is how an in-line headstock is laid
  // out. The lowest string takes the post nearest the nut.
  const pegs: Peg[] = [];
  for (let i = 0; i < stringCount; i++) {
    const t = stringCount === 1 ? 0.5 : i / (stringCount - 1);
    const x = NUT_X - headLen * (0.17 + t * 0.66);
    pegs.push({
      stringIndex: i,
      x,
      y: CENTRE_Y + nutHalf * 1.5,
      postX: x,
      postY: stringY(i, x),
      side: 'bottom',
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
    bodyLength: profile.length,
    neckJoinX,
    bodyPoint,
    bodyBoxX,
    pegs,
    headCentre: { x: HEAD_X + headLen * 0.5, y: CENTRE_Y + nutHalf * 0.3 },
    fretX,
    noteX,
    stringY,
    neckHalf,
    stringWidth,
    // Sized so that a highlighted marker never overlaps its neighbour on the
    // next string.
    noteRadius: instrument.family === 'bass' ? 6.6 : 6.0,
  };
}
