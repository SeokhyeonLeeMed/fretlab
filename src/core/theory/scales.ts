/**
 * scales.ts — scale / mode catalogue and pitch-class set maths.
 *
 * Every scale carries both its chromatic `intervals` (semitones from the
 * root) and its generic `degrees` (which letter each note is written on).
 * The second array is what makes spelling systematic — see spelling.ts.
 */

import { mod, noteNameToPc } from './pitch';

export type ScaleCategory =
  | 'Major / minor'
  | 'Modes'
  | 'Pentatonic'
  | 'Blues'
  | 'Symmetric'
  | 'Exotic';

export interface ScaleDef {
  id: string;
  name: string;
  category: ScaleCategory;
  intervals: number[];
  degrees: number[];
  /** Short plain-language note shown as help text in the UI. */
  about: string;
  /**
   * The chromatic scale has no diatonic degrees, so spelling it by degree
   * would produce oddities such as Fb in Eb. Scales marked this way are
   * spelled purely on the key's accidental side instead.
   */
  spellByKey?: boolean;
}

const HEPT = [1, 2, 3, 4, 5, 6, 7];

export const SCALES: ScaleDef[] = [
  // ---- Major / minor -----------------------------------------------------
  {
    id: 'major',
    name: 'Major (Ionian)',
    category: 'Major / minor',
    intervals: [0, 2, 4, 5, 7, 9, 11],
    degrees: HEPT,
    about: 'The reference major scale. Bright and resolved.',
  },
  {
    id: 'natural-minor',
    name: 'Natural minor (Aeolian)',
    category: 'Major / minor',
    intervals: [0, 2, 3, 5, 7, 8, 10],
    degrees: HEPT,
    about: 'The standard minor scale: the same notes as the major a minor 3rd above.',
  },
  {
    id: 'harmonic-minor',
    name: 'Harmonic minor',
    category: 'Major / minor',
    intervals: [0, 2, 3, 5, 7, 8, 11],
    degrees: HEPT,
    about: 'Natural minor with a raised 7th, which yields a dominant V chord in minor.',
  },
  {
    id: 'melodic-minor',
    name: 'Melodic minor (ascending)',
    category: 'Major / minor',
    intervals: [0, 2, 3, 5, 7, 9, 11],
    degrees: HEPT,
    about: 'Minor 3rd with major 6th and 7th. The jazz minor scale.',
  },
  {
    id: 'harmonic-major',
    name: 'Harmonic major',
    category: 'Major / minor',
    intervals: [0, 2, 4, 5, 7, 8, 11],
    degrees: HEPT,
    about: 'Major scale with a flattened 6th.',
  },

  // ---- Modes -------------------------------------------------------------
  {
    id: 'ionian',
    name: 'Ionian',
    category: 'Modes',
    intervals: [0, 2, 4, 5, 7, 9, 11],
    degrees: HEPT,
    about: '1st mode of the major scale, identical to the major scale.',
  },
  {
    id: 'dorian',
    name: 'Dorian',
    category: 'Modes',
    intervals: [0, 2, 3, 5, 7, 9, 10],
    degrees: HEPT,
    about: '2nd mode: minor with a natural 6th. Very common over m7 chords.',
  },
  {
    id: 'phrygian',
    name: 'Phrygian',
    category: 'Modes',
    intervals: [0, 1, 3, 5, 7, 8, 10],
    degrees: HEPT,
    about: '3rd mode: minor with a flat 2nd. Spanish and metal flavour.',
  },
  {
    id: 'lydian',
    name: 'Lydian',
    category: 'Modes',
    intervals: [0, 2, 4, 6, 7, 9, 11],
    degrees: HEPT,
    about: '4th mode: major with a sharp 4th. Floating and filmic.',
  },
  {
    id: 'mixolydian',
    name: 'Mixolydian',
    category: 'Modes',
    intervals: [0, 2, 4, 5, 7, 9, 10],
    degrees: HEPT,
    about: '5th mode: major with a flat 7th. The dominant-7th sound.',
  },
  {
    id: 'aeolian',
    name: 'Aeolian',
    category: 'Modes',
    intervals: [0, 2, 3, 5, 7, 8, 10],
    degrees: HEPT,
    about: '6th mode, identical to the natural minor scale.',
  },
  {
    id: 'locrian',
    name: 'Locrian',
    category: 'Modes',
    intervals: [0, 1, 3, 5, 6, 8, 10],
    degrees: HEPT,
    about: '7th mode: flat 2nd and flat 5th. Fits m7b5 chords.',
  },
  {
    id: 'lydian-dominant',
    name: 'Lydian dominant',
    category: 'Modes',
    intervals: [0, 2, 4, 6, 7, 9, 10],
    degrees: HEPT,
    about: '4th mode of melodic minor: sharp 4th and flat 7th together.',
  },
  {
    id: 'phrygian-dominant',
    name: 'Phrygian dominant',
    category: 'Modes',
    intervals: [0, 1, 4, 5, 7, 8, 10],
    degrees: HEPT,
    about: '5th mode of harmonic minor. The flamenco / Phrygian-major sound.',
  },
  {
    id: 'altered',
    name: 'Altered (super-Locrian)',
    category: 'Modes',
    intervals: [0, 1, 3, 4, 6, 8, 10],
    degrees: HEPT,
    about: '7th mode of melodic minor, the altered-dominant scale.',
  },

  // ---- Pentatonic --------------------------------------------------------
  {
    id: 'major-pentatonic',
    name: 'Major pentatonic',
    category: 'Pentatonic',
    intervals: [0, 2, 4, 7, 9],
    degrees: [1, 2, 3, 5, 6],
    about: 'Major scale without the 4th and 7th, so it contains no half steps.',
  },
  {
    id: 'minor-pentatonic',
    name: 'Minor pentatonic',
    category: 'Pentatonic',
    intervals: [0, 3, 5, 7, 10],
    degrees: [1, 3, 4, 5, 7],
    about: 'The core rock and blues lead scale.',
  },
  {
    id: 'hirajoshi',
    name: 'Hirajoshi',
    category: 'Pentatonic',
    intervals: [0, 2, 3, 7, 8],
    degrees: [1, 2, 3, 5, 6],
    about: 'Japanese pentatonic containing two half steps.',
  },

  // ---- Blues -------------------------------------------------------------
  {
    id: 'blues',
    name: 'Blues (minor)',
    category: 'Blues',
    intervals: [0, 3, 5, 6, 7, 10],
    degrees: [1, 3, 4, 5, 5, 7],
    about: 'Minor pentatonic plus the flat-5th blue note.',
  },
  {
    id: 'major-blues',
    name: 'Blues (major)',
    category: 'Blues',
    intervals: [0, 2, 3, 4, 7, 9],
    degrees: [1, 2, 3, 3, 5, 6],
    about: 'Major pentatonic plus the flat-3rd passing tone.',
  },

  // ---- Symmetric ---------------------------------------------------------
  {
    id: 'whole-tone',
    name: 'Whole tone',
    category: 'Symmetric',
    intervals: [0, 2, 4, 6, 8, 10],
    degrees: [1, 2, 3, 4, 5, 6],
    about: 'All whole steps. Pairs with augmented chords.',
  },
  {
    id: 'dim-half-whole',
    name: 'Diminished (half-whole)',
    category: 'Symmetric',
    intervals: [0, 1, 3, 4, 6, 7, 9, 10],
    degrees: [1, 2, 3, 3, 5, 5, 6, 7],
    about: 'Octatonic scale used over altered dominant chords.',
  },
  {
    id: 'dim-whole-half',
    name: 'Diminished (whole-half)',
    category: 'Symmetric',
    intervals: [0, 2, 3, 5, 6, 8, 9, 11],
    degrees: [1, 2, 3, 4, 5, 6, 6, 7],
    about: 'Octatonic scale used over diminished-7th chords.',
  },
  {
    id: 'chromatic',
    name: 'Chromatic',
    category: 'Symmetric',
    intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    degrees: [1, 2, 2, 3, 3, 4, 5, 5, 6, 6, 7, 7],
    spellByKey: true,
    about: 'Every semitone. Useful as a plain fretboard reference.',
  },

  // ---- Exotic ------------------------------------------------------------
  {
    id: 'hungarian-minor',
    name: 'Hungarian minor',
    category: 'Exotic',
    intervals: [0, 2, 3, 6, 7, 8, 11],
    degrees: HEPT,
    about: 'Harmonic minor with a raised 4th.',
  },
  {
    id: 'double-harmonic',
    name: 'Double harmonic (Byzantine)',
    category: 'Exotic',
    intervals: [0, 1, 4, 5, 7, 8, 11],
    degrees: HEPT,
    about: 'Flat 2nd and flat 6th against a major 3rd and 7th.',
  },
  {
    id: 'bebop-dominant',
    name: 'Bebop dominant',
    category: 'Exotic',
    intervals: [0, 2, 4, 5, 7, 9, 10, 11],
    degrees: [1, 2, 3, 4, 5, 6, 7, 7],
    about: 'Mixolydian with the natural 7th added as a passing tone.',
  },
];

export const SCALE_BY_ID: Record<string, ScaleDef> = Object.fromEntries(
  SCALES.map((s) => [s.id, s]),
);

export function getScale(id: string): ScaleDef {
  const s = SCALE_BY_ID[id];
  if (!s) throw new Error(`Unknown scale: ${id}`);
  return s;
}

/** scale + root -> the set of pitch classes it occupies. */
export function scalePitchClasses(rootName: string, scale: ScaleDef): Set<number> {
  const rootPc = noteNameToPc(rootName);
  return new Set(scale.intervals.map((i) => mod(rootPc + i, 12)));
}

/** Generic degree + semitone distance -> the usual written degree label. */
export function degreeLabel(degree: number, semitones: number): string {
  const naturalMajor = [0, 2, 4, 5, 7, 9, 11];
  const expected = naturalMajor[(degree - 1) % 7];
  let diff = mod(semitones - expected, 12);
  if (diff > 6) diff -= 12;
  const prefix = diff === 0 ? '' : diff > 0 ? '♯'.repeat(diff) : '♭'.repeat(-diff);
  return `${prefix}${degree}`;
}

/**
 * scale + root -> pitch class => scale-degree label ("1", "b3", "5"...).
 * Used for the fretboard's interval-label mode.
 */
export function scaleDegreeLabels(rootName: string, scale: ScaleDef): Map<number, string> {
  const rootPc = noteNameToPc(rootName);
  const out = new Map<number, string>();
  scale.intervals.forEach((semis, i) => {
    const pc = mod(rootPc + semis, 12);
    if (!out.has(pc)) out.set(pc, degreeLabel(scale.degrees[i] ?? i + 1, semis));
  });
  return out;
}

export const SCALE_CATEGORIES: ScaleCategory[] = [
  'Major / minor',
  'Modes',
  'Pentatonic',
  'Blues',
  'Symmetric',
  'Exotic',
];
