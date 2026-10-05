/**
 * pitch.ts — pitch representation primitives.
 *
 * The whole application represents pitch as an integer MIDI note number
 * (C4 = 60, A4 = 69). Note *names* are only ever produced at the edge, for
 * display, and are always derived — never parsed-and-patched with ad-hoc
 * string surgery.
 */

export type Accidental = 'sharp' | 'flat';

/** Letter names in diatonic order with their natural pitch classes. */
export const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
export type Letter = (typeof LETTERS)[number];
export const LETTER_PC: Record<Letter, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

export const A4_MIDI = 69;
export const DEFAULT_A4 = 440;

/** Positive modulo — JS `%` keeps the sign of the dividend. */
export const mod = (n: number, m: number): number => ((n % m) + m) % m;

/** Pitch class (0..11) of a MIDI number. */
export const pitchClass = (midi: number): number => mod(midi, 12);

/** Scientific-pitch octave of a MIDI number (C4 = 60 → octave 4). */
export const octaveOf = (midi: number): number => Math.floor(midi / 12) - 1;

export interface SpelledNote {
  /** Letter + accidentals, no octave. e.g. "Bb" */
  name: string;
  /** Letter + accidentals + octave. e.g. "Bb2" */
  full: string;
  letter: Letter;
  /** -2..+2 in semitones; negative = flats. */
  alter: number;
  pc: number;
  octave: number;
  midi: number;
}

// Accidentals must be homogeneous: "C#b4" is not a note, it is a typo.
const NOTE_RE = /^([A-Ga-g])(#{1,3}|b{1,3}|♯{1,3}|♭{1,3}|x|)(-?\d+)?$/;

/**
 * Parse a note name into a pitch class and (if present) a MIDI number.
 * Accepts "C", "c", "F#", "Bb", "Db4", "A-1", "Fx" (double sharp), "B♭".
 * @throws if the name is not a valid note.
 */
export function parseNoteName(input: string): { pc: number; alter: number; letter: Letter; octave: number | null } {
  const text = input.trim();
  const m = NOTE_RE.exec(text);
  if (!m) throw new Error(`Invalid note name: "${input}"`);
  const letter = m[1].toUpperCase() as Letter;
  let alter = 0;
  for (const ch of m[2] ?? '') {
    if (ch === '#' || ch === '♯') alter += 1;
    else if (ch === 'b' || ch === '♭') alter -= 1;
    else if (ch === 'x') alter += 2;
  }
  if (alter < -3 || alter > 3) throw new Error(`Too many accidentals: "${input}"`);
  const octave = m[3] === undefined ? null : parseInt(m[3], 10);
  return { pc: mod(LETTER_PC[letter] + alter, 12), alter, letter, octave };
}

/** Pitch class of a note name, ignoring any octave. */
export function noteNameToPc(input: string): number {
  return parseNoteName(input).pc;
}

/**
 * Note name (octave required) → MIDI number. "E2" → 40, "C4" → 60.
 * @throws if the name has no octave or is invalid.
 */
export function noteNameToMidi(input: string): number {
  const { letter, alter, octave } = parseNoteName(input);
  if (octave === null) throw new Error(`Note name needs an octave: "${input}"`);
  const midi = (octave + 1) * 12 + LETTER_PC[letter] + alter;
  if (midi < 0 || midi > 127) throw new Error(`Note out of MIDI range: "${input}"`);
  return midi;
}

/** True when `input` is a note name with an octave that maps into MIDI range. */
export function isValidPitchName(input: string): boolean {
  try {
    noteNameToMidi(input);
    return true;
  } catch {
    return false;
  }
}

/**
 * MIDI number → spelled note, using a plain chromatic spelling.
 * Pass a `SpellingMap` (see spelling.ts) for key-aware names.
 */
export function midiToNote(midi: number, accidental: Accidental = 'sharp'): SpelledNote {
  const pc = pitchClass(midi);
  const octave = octaveOf(midi);
  const name = (accidental === 'flat' ? FLAT_NAMES : SHARP_NAMES)[pc];
  return nameToSpelled(name, octave, midi, pc);
}

/** Build a SpelledNote from an already-chosen name. */
export function nameToSpelled(name: string, octave: number, midi: number, pc: number): SpelledNote {
  const letter = name[0] as Letter;
  const alter = name.slice(1).split('').reduce((a, c) => a + (c === '#' ? 1 : c === 'b' ? -1 : 0), 0);
  return { name, full: `${name}${octave}`, letter, alter, pc, octave, midi };
}

/** MIDI number → frequency in Hz (equal temperament). */
export function midiToFreq(midi: number, a4 = DEFAULT_A4): number {
  return a4 * Math.pow(2, (midi - A4_MIDI) / 12);
}

/** Frequency → fractional MIDI number. */
export function freqToMidiFloat(freq: number, a4 = DEFAULT_A4): number {
  if (freq <= 0) throw new Error('Frequency must be positive');
  return A4_MIDI + 12 * Math.log2(freq / a4);
}

/** Cents from `refFreq` to `freq`. Positive = sharp. */
export function centsBetween(freq: number, refFreq: number): number {
  if (freq <= 0 || refFreq <= 0) throw new Error('Frequencies must be positive');
  return 1200 * Math.log2(freq / refFreq);
}

export interface NearestNote {
  midi: number;
  /** Signed cents deviation from the nearest equal-tempered note. */
  cents: number;
  freq: number;
  targetFreq: number;
}

/** Frequency → nearest equal-tempered note plus its cents deviation. */
export function freqToNearestNote(freq: number, a4 = DEFAULT_A4): NearestNote {
  const exact = freqToMidiFloat(freq, a4);
  const midi = Math.round(exact);
  return { midi, cents: (exact - midi) * 100, freq, targetFreq: midiToFreq(midi, a4) };
}

/** Interval in semitones between two MIDI numbers. */
export const semitonesBetween = (a: number, b: number): number => b - a;

/** Transpose helper kept explicit so call sites read as music, not arithmetic. */
export const transpose = (midi: number, semitones: number): number => midi + semitones;
