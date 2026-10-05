/**
 * spelling.ts — systematic enharmonic spelling.
 *
 * Rather than a table of exceptions ("use Bb here, F# there"), names are
 * derived from *generic interval* (scale degree) plus *chromatic interval*
 * (semitones). A degree fixes the letter; the semitone count then fixes the
 * accidental. That is exactly how notation works, so Bb major comes out
 * Bb C D Eb F G A and F# major comes out F# G# A# B C# D# E# with no
 * special-casing anywhere.
 */

import {
  type Accidental,
  type Letter,
  LETTERS,
  LETTER_PC,
  FLAT_NAMES,
  SHARP_NAMES,
  mod,
  parseNoteName,
} from './pitch';

const letterIndex = (l: Letter): number => LETTERS.indexOf(l);

function accidentalString(alter: number): string | null {
  if (alter === 0) return '';
  if (alter > 0 && alter <= 2) return '#'.repeat(alter);
  if (alter < 0 && alter >= -2) return 'b'.repeat(-alter);
  return null; // triple accidental — refuse and let the caller fall back
}

/**
 * Spell one note from a root, a generic degree (1 = unison, 3 = a third, …)
 * and the chromatic distance in semitones.
 * Returns `null` when the result would need a triple accidental.
 */
export function spellDegree(rootName: string, degree: number, semitones: number): string | null {
  const root = parseNoteName(rootName);
  const li = mod(letterIndex(root.letter) + (degree - 1), 7);
  const letter = LETTERS[li];
  const targetPc = mod(root.pc + semitones, 12);
  // Signed distance from the natural letter to the target, folded to -6..6.
  let alter = mod(targetPc - LETTER_PC[letter], 12);
  if (alter > 6) alter -= 12;
  const acc = accidentalString(alter);
  return acc === null ? null : `${letter}${acc}`;
}

/**
 * Spell a whole pitch collection. `intervals` and `degrees` are parallel
 * arrays, so a blues scale (degrees 1 3 4 5 5 7) spells its ♭5 and ♮5 on the
 * same letter, which is what players read.
 */
export function spellCollection(rootName: string, intervals: number[], degrees: number[]): string[] {
  const fallbackAcc = preferredAccidentalForRoot(rootName);
  const fallbackNames = fallbackAcc === 'flat' ? FLAT_NAMES : SHARP_NAMES;
  const rootPc = parseNoteName(rootName).pc;
  return intervals.map((semis, i) => {
    const degree = degrees[i] ?? ((i % 7) + 1);
    return spellDegree(rootName, degree, semis) ?? fallbackNames[mod(rootPc + semis, 12)];
  });
}

/**
 * Sharps or flats for a key, from the circle of fifths rather than taste:
 * keys whose tonic sits on the flat side of C get flats.
 */
export function preferredAccidentalForRoot(rootName: string): Accidental {
  const { letter, alter } = parseNoteName(rootName);
  if (alter < 0) return 'flat';
  if (alter > 0) return 'sharp';
  // Natural tonics: F is the only one notated with a flat.
  return letter === 'F' ? 'flat' : 'sharp';
}

/** pitch class → display name, for every one of the 12 pitch classes. */
export type SpellingMap = Readonly<Record<number, string>>;

/**
 * A spelling map for the current musical context. Notes inside the selected
 * collection get their diatonic names; the remaining (chromatic) pitch
 * classes fall back to the key's accidental preference, so a fretboard in
 * Eb minor never shows a stray "A#" next to "Bb".
 */
export function buildSpellingMap(
  rootName: string | null,
  intervals: number[] = [],
  degrees: number[] = [],
): SpellingMap {
  const acc: Accidental = rootName ? preferredAccidentalForRoot(rootName) : 'sharp';
  const base = acc === 'flat' ? FLAT_NAMES : SHARP_NAMES;
  const map: Record<number, string> = {};
  for (let pc = 0; pc < 12; pc++) map[pc] = base[pc];
  if (!rootName || intervals.length === 0) return map;

  const rootPc = parseNoteName(rootName).pc;
  const names = spellCollection(rootName, intervals, degrees);
  const flats = names.filter((n) => n.includes('b')).length;
  const sharps = names.filter((n) => n.includes('#')).length;
  // Let the collection itself decide the fallback side if it disagrees with
  // the tonic (e.g. D phrygian dominant, which is written with flats).
  if (flats !== sharps) {
    const side = flats > sharps ? FLAT_NAMES : SHARP_NAMES;
    for (let pc = 0; pc < 12; pc++) map[pc] = side[pc];
  }
  const assigned = new Set<number>();
  intervals.forEach((semis, i) => {
    const pc = mod(rootPc + semis, 12);
    // First spelling wins, so a blues ♭5 does not overwrite the ♮5.
    if (assigned.has(pc)) return;
    assigned.add(pc);
    map[pc] = names[i];
  });
  return map;
}

/** Name a MIDI note through a spelling map, including its octave. */
export function spellMidi(midi: number, map: SpellingMap): { name: string; full: string } {
  const pc = mod(midi, 12);
  const name = map[pc] ?? SHARP_NAMES[pc];
  // Octave must follow the *letter*, not the pitch class: Cb4 sounds as B3.
  const letter = name[0] as Letter;
  const alter = name.slice(1).split('').reduce((a, c) => a + (c === '#' ? 1 : c === 'b' ? -1 : 0), 0);
  const soundingOctave = Math.floor(midi / 12) - 1;
  const naturalPc = LETTER_PC[letter];
  let octave = soundingOctave;
  if (naturalPc + alter >= 12) octave -= 1; // e.g. B#3 is written an octave below its sound
  else if (naturalPc + alter < 0) octave += 1; // e.g. Cb4
  return { name, full: `${name}${octave}` };
}
