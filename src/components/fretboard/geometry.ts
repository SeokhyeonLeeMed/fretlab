/**
 * geometry.ts — the drawing geometry of the whole instrument.
 *
 * Pure maths, no React. One coordinate system ("world units") holds the
 * headstock, the nut, the fretboard and the body, so the fretboard and the
 * instrument graphic are a single object rather than two unrelated pictures.
 *
 * The body, pickguard, hardware and headstock come from artwork.ts, which is
 * traced from photographs of real instruments and expressed in an "instrument
 * frame" whose origin is the nut and whose scale length is 1000 units. This
 * file places that artwork with one transform, at true scale: nothing is
 * squashed to fit. The frets and strings are computed here with
 * equal-tempered spacing and land on the artwork exactly, because the frame
 * was fitted to the photographs' own frets.
 *
 * Orientation: **string index 0 is the lowest-pitched string and is drawn at
 * the bottom**, the way a chord chart or a tab staff is read.
 */

import { fretDistanceRatio } from '../../core/theory/fretboard';
import type { InstrumentDef } from '../../core/instruments/definitions';
import { ARTWORK, type Artwork } from './artwork';

/** Nut-to-bridge distance in world units. */
export const SCALE_PX = 1560;
/** World units per instrument-frame unit. */
export const ART_UNIT = SCALE_PX / 1000;
/** Clear space around the instrument. */
const MARGIN = 26;

export interface Peg {
  stringIndex: number;
  /** Centre of the string post, where the string is anchored. */
  postX: number;
  postY: number;
  /** Centre of the tuner key, used by the tuner's per-string indicator. */
  x: number;
  y: number;
}

export interface Geometry {
  instrument: InstrumentDef;
  art: Artwork;
  width: number;
  height: number;
  /** y of the neck's centre line. */
  centreY: number;
  nutX: number;
  bridgeX: number;
  /** Right-hand end of the fretboard. */
  boardEndX: number;
  fretCount: number;
  stringCount: number;
  /** Half the neck's width at the nut. */
  nutHalf: number;
  spacing: number;
  /** Places the artwork in the world. */
  artTransform: string;
  pegs: Peg[];
  postR: number;
  keySize: [number, number];
  /** Extent of the headstock and its tuners, for framing the tuner camera. */
  headBox: { x0: number; y0: number; x1: number; y1: number };
  headCentre: { x: number; y: number };
  fretX: (fret: number) => number;
  /** x of the note marker for a fret (midpoint of the fret space). */
  noteX: (fret: number) => number;
  /** y of a string at a given x, following the neck's real taper. */
  stringY: (stringIndex: number, x: number) => number;
  /** Half-height of the string field at a given x. */
  neckHalf: (x: number) => number;
  /** Drawn string thickness. */
  stringWidth: (stringIndex: number) => number;
  /** Radius of a note marker. */
  noteRadius: number;
}

/**
 * Build the complete drawing geometry for an instrument.
 *
 * The artwork is drawn at a fixed size whatever the instrument, so a 7-string
 * guitar has the same neck length and the same number of usable frets as a
 * 6-string: only the string spacing changes, spread across the same neck.
 */
export function buildGeometry(instrument: InstrumentDef): Geometry {
  const art = ARTWORK[instrument.family];
  const stringCount = instrument.stringCount;
  const fretCount = instrument.fretCount;

  const nutX = Math.round(MARGIN - art.bounds.minX * ART_UNIT);
  const centreY = Math.round(MARGIN - art.bounds.minY * ART_UNIT);
  const width = Math.round(nutX + art.bounds.maxX * ART_UNIT + MARGIN);
  const height = Math.round(centreY + art.bounds.maxY * ART_UNIT + MARGIN);

  const bridgeX = nutX + SCALE_PX;
  const fretX = (fret: number): number => nutX + SCALE_PX * fretDistanceRatio(fret);
  // The board runs a little past the last fret, as a real one does.
  const boardEndX = fretX(fretCount) + (fretX(fretCount) - fretX(fretCount - 1)) * 1.1;

  // The strings occupy a margin inside the neck's edges, exactly as on the
  // instrument the artwork was traced from.
  const EDGE = 0.86;
  const neckHalf = (x: number): number =>
    (art.neckHalfNut + art.neckHalfSlope * ((x - nutX) / ART_UNIT)) * ART_UNIT * EDGE;
  const nutHalf = neckHalf(nutX);
  const spacing = (2 * nutHalf) / Math.max(1, stringCount - 1 + 0.9);

  const stringY = (stringIndex: number, x: number): number => {
    const sp = (2 * neckHalf(x)) / Math.max(1, stringCount - 1 + 0.9);
    const bottom = centreY + ((stringCount - 1) * sp) / 2;
    return bottom - stringIndex * sp;
  };

  const noteX = (fret: number): number =>
    fret === 0 ? nutX - 30 : (fretX(fret - 1) + fretX(fret)) / 2;

  // ---- tuners -------------------------------------------------------------
  // Posts run down the middle of the headstock, from near the tip to near the
  // nut, nearest the nut first — which is the lowest string's post, as on the
  // real instrument. Spacing them along the headstock's own length means any
  // string count is laid out sensibly.
  const hb = art.headBounds;
  const headLen = Math.abs(hb.minX);
  const pegs: Peg[] = [];
  for (let i = 0; i < stringCount; i++) {
    const t = stringCount === 1 ? 0.5 : i / (stringCount - 1);
    // t = 0 is the post closest to the nut.
    const ax = -headLen * (0.17 + t * 0.66);
    // Follow the headstock's taper so the posts sit on its centre line.
    const ay = (hb.minY + hb.maxY) / 2 + art.postLine.slope * (ax - art.postLine.sx) * 0.35;
    pegs.push({
      stringIndex: i,
      postX: nutX + ax * ART_UNIT,
      postY: centreY + ay * ART_UNIT,
      x: nutX + ax * ART_UNIT,
      y: centreY + (hb.maxY * 0.82 + art.keySize[1] * 0.75) * ART_UNIT,
    });
  }

  const headBox = {
    x0: nutX + (hb.minX - 14) * ART_UNIT,
    y0: centreY + (hb.minY - 10) * ART_UNIT,
    x1: nutX + 16,
    y1: Math.max(...pegs.map((p) => p.y)) + art.keySize[1] * ART_UNIT,
  };

  const stringWidth = (stringIndex: number): number => {
    const gauge = instrument.stringGauges[stringIndex] ?? 0.7;
    return 1.1 + gauge * 2.6;
  };

  return {
    instrument,
    art,
    width,
    height,
    centreY,
    nutX,
    bridgeX,
    boardEndX,
    fretCount,
    stringCount,
    nutHalf,
    spacing,
    artTransform: `translate(${nutX} ${centreY}) scale(${ART_UNIT})`,
    pegs,
    postR: art.postR * ART_UNIT,
    keySize: [art.keySize[0] * ART_UNIT, art.keySize[1] * ART_UNIT],
    headBox,
    headCentre: { x: (headBox.x0 + headBox.x1) / 2, y: (headBox.y0 + headBox.y1) / 2 },
    fretX,
    noteX,
    stringY,
    neckHalf,
    stringWidth,
    noteRadius: Math.min(9.5, spacing * 0.42),
  };
}
