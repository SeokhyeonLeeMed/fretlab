/**
 * fretboard.ts — string + fret + tuning -> pitch.
 *
 * Nothing in this file knows about standard tuning. A fretboard is derived
 * purely from the open-string MIDI numbers it is handed, so changing one
 * string's tuning changes exactly that string's notes and nothing else.
 */

import { isValidPitchName, midiToFreq, mod, noteNameToMidi } from './pitch';
import { spellMidi, type SpellingMap } from './spelling';

/**
 * A tuning, lowest-pitched string first.
 * Index 0 is the thickest string (the 6th string on a guitar).
 */
export interface Tuning {
  id: string;
  name: string;
  /** Open-string note names with octave, low to high. e.g. ["E2","A2",...] */
  notes: string[];
}

export interface TuningValidation {
  ok: boolean;
  /** Per-string error message, or null when that string is fine. */
  errors: (string | null)[];
  message?: string;
}

/**
 * Validate a custom tuning before it is allowed into the store, so a typo
 * can never crash the fretboard.
 */
export function validateTuning(notes: string[], expectedStrings: number): TuningValidation {
  const errors: (string | null)[] = notes.map((n) =>
    isValidPitchName(n) ? null : 'Use a note name with an octave, such as E2 or Bb1.',
  );
  if (notes.length !== expectedStrings) {
    return {
      ok: false,
      errors,
      message: `This instrument has ${expectedStrings} strings but ${notes.length} were given.`,
    };
  }
  if (errors.some(Boolean)) {
    return { ok: false, errors, message: 'One or more strings are not valid note names.' };
  }
  return { ok: true, errors };
}

/** Open-string MIDI numbers for a tuning, lowest string first. */
export function tuningMidis(tuning: Tuning): number[] {
  return tuning.notes.map(noteNameToMidi);
}

/**
 * The note sounding at a given string and fret.
 * `stringIndex` is 0 for the lowest-pitched string.
 */
export function midiAt(openMidis: number[], stringIndex: number, fret: number): number {
  const open = openMidis[stringIndex];
  if (open === undefined) throw new Error(`No string at index ${stringIndex}`);
  if (fret < 0) throw new Error(`Negative fret: ${fret}`);
  return open + fret;
}

export interface FretCell {
  stringIndex: number;
  fret: number;
  midi: number;
  pc: number;
  freq: number;
}

/**
 * The whole fretboard as a matrix of cells, `[stringIndex][fret]`.
 * Fret 0 is the open string.
 */
export function buildFretboard(openMidis: number[], fretCount: number, a4 = 440): FretCell[][] {
  return openMidis.map((open, stringIndex) => {
    const row: FretCell[] = [];
    for (let fret = 0; fret <= fretCount; fret++) {
      const midi = open + fret;
      row.push({ stringIndex, fret, midi, pc: mod(midi, 12), freq: midiToFreq(midi, a4) });
    }
    return row;
  });
}

/** Every (string, fret) position whose pitch class is in `pcs`. */
export function findPositions(
  openMidis: number[],
  fretCount: number,
  pcs: Set<number>,
): { stringIndex: number; fret: number; midi: number }[] {
  const out: { stringIndex: number; fret: number; midi: number }[] = [];
  openMidis.forEach((open, stringIndex) => {
    for (let fret = 0; fret <= fretCount; fret++) {
      const midi = open + fret;
      if (pcs.has(mod(midi, 12))) out.push({ stringIndex, fret, midi });
    }
  });
  return out;
}

/** Lowest fret on `stringIndex` that sounds the given pitch class. */
export function lowestFretForPc(
  openMidis: number[],
  stringIndex: number,
  pc: number,
  fretCount: number,
): number | null {
  const open = openMidis[stringIndex];
  if (open === undefined) return null;
  if (!Number.isInteger(pc) || pc < 0 || pc > 11) return null;
  const fret = mod(pc - mod(open, 12), 12);
  return fret <= fretCount ? fret : null;
}

/** All frets on `stringIndex` sounding `pc`, within range. */
export function fretsForPc(
  openMidis: number[],
  stringIndex: number,
  pc: number,
  fretCount: number,
): number[] {
  const first = lowestFretForPc(openMidis, stringIndex, pc, fretCount);
  if (first === null) return [];
  const out: number[] = [];
  for (let f = first; f <= fretCount; f += 12) out.push(f);
  return out;
}

/** Label for one fretboard position, spelled in the current key context. */
export function labelAt(
  openMidis: number[],
  stringIndex: number,
  fret: number,
  map: SpellingMap,
): { name: string; full: string; midi: number } {
  const midi = midiAt(openMidis, stringIndex, fret);
  const { name, full } = spellMidi(midi, map);
  return { name, full, midi };
}

/**
 * Fret positions that carry a position marker (inlay) on a real neck.
 * Single dots at 3, 5, 7, 9, 15, 17, 19, 21; double dots at 12 and 24.
 */
export function inlayKind(fret: number): 'none' | 'single' | 'double' {
  if (fret === 12 || fret === 24) return 'double';
  const m = fret % 12;
  if (fret > 0 && (m === 3 || m === 5 || m === 7 || m === 9)) return 'single';
  return 'none';
}

/**
 * Horizontal position of a fret as a fraction of the scale length, using the
 * real "rule of 18" (equal temperament) spacing so the neck narrows the way
 * an actual fretboard does.
 */
export function fretDistanceRatio(fret: number): number {
  return 1 - Math.pow(2, -fret / 12);
}
