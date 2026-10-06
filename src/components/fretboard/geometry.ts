/**
 * geometry.ts — the drawing geometry of the whole instrument.
 *
 * Pure maths, no React. One coordinate system ("world units") holds the
 * headstock, the nut, the fretboard and the body, so the fretboard and the
 * instrument graphic are a single object rather than two unrelated pictures.
 *
 * The instrument itself is artwork (see artwork.ts), expressed in an
 * "instrument frame" whose origin is the nut and whose scale length is 1000
 * units. This file places that artwork with one transform, at true scale, and
 * computes the strings and note positions in the same frame. Because the
 * frame was fitted to the drawing's own fret lines, the notes land on the
 * drawn frets.
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
  /** Centre of the tuning machine, for the tuner's per-string indicator. */
  x: number;
  y: number;
  r: number;
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
  /** Right-hand end of the last fret. */
  boardEndX: number;
  fretCount: number;
  stringCount: number;
  /** Half the string field's height at the nut. */
  nutHalf: number;
  spacing: number;
  /** Places the artwork in the world. */
  artTransform: string;
  pegs: Peg[];
  /** Extent of the headstock and its tuners, for framing the tuner camera. */
  headBox: { x0: number; y0: number; x1: number; y1: number };
  headCentre: { x: number; y: number };
  fretX: (fret: number) => number;
  /** x of the note marker for a fret (midpoint of the fret space). */
  noteX: (fret: number) => number;
  /** y of a string at a given x, following the neck's taper. */
  stringY: (stringIndex: number, x: number) => number;
  /** Half-height of the string field at a given x. */
  neckHalf: (x: number) => number;
  /** Drawn string thickness. */
  stringWidth: (stringIndex: number) => number;
  /** Radius of a note marker. */
  noteRadius: number;
}

/** Build the complete drawing geometry for an instrument. */
export function buildGeometry(instrument: InstrumentDef): Geometry {
  const art = ARTWORK[instrument.family];
  const stringCount = instrument.stringCount;
  const fretCount = Math.min(instrument.fretCount, art.fretCount);

  const nutX = Math.round(MARGIN - art.bounds.minX * ART_UNIT);
  const centreY = Math.round(MARGIN - art.bounds.minY * ART_UNIT);
  const width = Math.round(nutX + art.bounds.maxX * ART_UNIT + MARGIN);
  const height = Math.round(centreY + art.bounds.maxY * ART_UNIT + MARGIN);

  const bridgeX = nutX + SCALE_PX;
  const fretX = (fret: number): number => nutX + SCALE_PX * fretDistanceRatio(fret);
  const boardEndX = fretX(fretCount);

  // The strings sit inside the drawn neck's edges, as they do on the
  // instrument, and the field widens along the neck just as the neck does.
  const EDGE = 0.84;
  const TAPER = 1.22;
  const neckHalf = (x: number): number => {
    const t = Math.max(0, Math.min(1.3, (x - nutX) / Math.max(1, boardEndX - nutX)));
    return art.neckHalfNut * ART_UNIT * EDGE * (1 + (TAPER - 1) * t);
  };
  const nutHalf = neckHalf(nutX);
  // A margin of about half a string space is left outside the two outer
  // strings, which is what stops them running off the edge of the fretboard.
  const spacing = (2 * nutHalf) / (stringCount - 1 + 0.9);

  const stringY = (stringIndex: number, x: number): number => {
    const sp = (2 * neckHalf(x)) / (stringCount - 1 + 0.9);
    const bottom = centreY + ((stringCount - 1) * sp) / 2;
    return bottom - stringIndex * sp;
  };

  const noteX = (fret: number): number =>
    fret === 0 ? nutX - 32 : (fretX(fret - 1) + fretX(fret)) / 2;

  // The artwork's tuning machines, nearest the nut first — which is the
  // lowest string's, as on the instrument.
  const pegR =
    art.pegs.length > 1
      ? Math.abs(art.pegs[1][0] - art.pegs[0][0]) * ART_UNIT * 0.36
      : 16;
  const pegs: Peg[] = art.pegs.slice(0, stringCount).map(([ax, ay], i) => ({
    stringIndex: i,
    x: nutX + ax * ART_UNIT,
    y: centreY + ay * ART_UNIT,
    r: pegR,
  }));

  const headBox = {
    x0: MARGIN - 8,
    y0: centreY + art.bounds.minY * ART_UNIT - 8,
    x1: nutX + 18,
    y1: centreY + art.bounds.maxY * ART_UNIT + 8,
  };

  const stringWidth = (stringIndex: number): number => {
    const gauge = instrument.stringGauges[stringIndex] ?? 0.7;
    return 1.1 + gauge * 2.4;
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
    headBox,
    headCentre: { x: (headBox.x0 + headBox.x1) / 2, y: (headBox.y0 + headBox.y1) / 2 },
    fretX,
    noteX,
    stringY,
    neckHalf,
    stringWidth,
    noteRadius: Math.min(10, spacing * 0.44),
  };
}
