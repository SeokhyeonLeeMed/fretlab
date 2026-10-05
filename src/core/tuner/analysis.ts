/**
 * analysis.ts — turning a detected frequency into tuner readings.
 *
 * Pure functions, so every rule the tuner display follows is unit-tested
 * rather than tangled into a React component.
 */

import { centsBetween, freqToNearestNote, midiToFreq } from '../theory/pitch';
import { spellMidi, type SpellingMap } from '../theory/spelling';

export type TuningVerdict = 'flat' | 'in-tune' | 'sharp';

/** Cents within which a string counts as in tune. +/-5 cents is inaudible. */
export const IN_TUNE_CENTS = 5;

export function verdictFor(cents: number, tolerance = IN_TUNE_CENTS): TuningVerdict {
  if (cents < -tolerance) return 'flat';
  if (cents > tolerance) return 'sharp';
  return 'in-tune';
}

export interface ChromaticReading {
  freq: number;
  midi: number;
  noteName: string;
  fullName: string;
  cents: number;
  verdict: TuningVerdict;
  targetFreq: number;
}

/** Nearest note of the chromatic scale, with its cents deviation. */
export function chromaticReading(freq: number, map: SpellingMap, a4 = 440): ChromaticReading {
  const near = freqToNearestNote(freq, a4);
  const spelled = spellMidi(near.midi, map);
  return {
    freq,
    midi: near.midi,
    noteName: spelled.name,
    fullName: spelled.full,
    cents: near.cents,
    verdict: verdictFor(near.cents),
    targetFreq: near.targetFreq,
  };
}

export interface StringReading {
  /** Index into the tuning, 0 = lowest-pitched string. */
  stringIndex: number;
  targetMidi: number;
  targetFreq: number;
  targetName: string;
  cents: number;
  verdict: TuningVerdict;
  /** Semitones away from the target, for "you are on the wrong string". */
  semitonesOff: number;
}

export interface ReadingOptions {
  /**
   * Display names for the strings, normally the tuning preset's own note
   * names. A tuning written "Eb Ab Db Gb Bb Eb" should read back as Eb, not
   * D#, and a custom tuning should read back exactly as the player typed it.
   */
  names?: string[];
  a4?: number;
}

/**
 * Compare a detected frequency against the strings of the *current* tuning.
 *
 * The tuner is never restricted to standard tuning: it is handed whatever
 * open-string MIDI numbers the instrument is currently set to, so Drop C or a
 * fully custom tuning works with no special case.
 */
export function nearestStringReading(
  freq: number,
  openMidis: number[],
  map: SpellingMap,
  options: ReadingOptions = {},
): StringReading | null {
  if (openMidis.length === 0) return null;
  const a4 = options.a4 ?? 440;
  let best: StringReading | null = null;
  openMidis.forEach((midi, stringIndex) => {
    const targetFreq = midiToFreq(midi, a4);
    const cents = centsBetween(freq, targetFreq);
    const reading: StringReading = {
      stringIndex,
      targetMidi: midi,
      targetFreq,
      targetName: options.names?.[stringIndex] ?? spellMidi(midi, map).full,
      cents,
      verdict: verdictFor(cents),
      semitonesOff: Math.round(cents / 100),
    };
    if (!best || Math.abs(reading.cents) < Math.abs(best.cents)) best = reading;
  });
  return best;
}

/**
 * Reading against one specific string, for when the player has pinned a
 * string in the UI instead of letting the tuner guess.
 */
export function readingForString(
  freq: number,
  openMidis: number[],
  stringIndex: number,
  map: SpellingMap,
  options: ReadingOptions = {},
): StringReading | null {
  const midi = openMidis[stringIndex];
  if (midi === undefined) return null;
  const a4 = options.a4 ?? 440;
  const targetFreq = midiToFreq(midi, a4);
  const cents = centsBetween(freq, targetFreq);
  return {
    stringIndex,
    targetMidi: midi,
    targetFreq,
    targetName: options.names?.[stringIndex] ?? spellMidi(midi, map).full,
    cents,
    verdict: verdictFor(cents),
    semitonesOff: Math.round(cents / 100),
  };
}

/**
 * Needle position, -1..1, for the tuning meter.
 * Clamped at +/-50 cents, which is the point where the nearest note changes.
 */
export function needlePosition(cents: number, range = 50): number {
  const v = cents / range;
  return v < -1 ? -1 : v > 1 ? 1 : v;
}
