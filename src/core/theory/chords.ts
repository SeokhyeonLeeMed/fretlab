/**
 * chords.ts — chord catalogue, pitch-class sets and chord-to-scale relations.
 *
 * A chord here is a *pitch-class recipe*, never a fret pattern. Fret patterns
 * are produced later by voicing.ts from the live tuning, which is what keeps
 * alternate tunings correct.
 */

import { mod, noteNameToPc } from './pitch';
import { degreeLabel } from './scales';

export type ChordCategory = 'Triads' | 'Sevenths' | 'Suspended' | 'Power' | 'Extended';

export interface ChordDef {
  id: string;
  /** Suffix appended to the root for display: "" , "m", "maj7"… */
  symbol: string;
  name: string;
  category: ChordCategory;
  intervals: number[];
  degrees: number[];
  /**
   * Chord tones that may be dropped when no voicing can fit them all.
   * Given as semitone intervals, most-droppable first.
   */
  optional: number[];
  /** Scale ids that fit this chord, best first. */
  relatedScales: string[];
  about: string;
}

export const CHORDS: ChordDef[] = [
  // ---- Triads ------------------------------------------------------------
  {
    id: 'maj',
    symbol: '',
    name: 'Major',
    category: 'Triads',
    intervals: [0, 4, 7],
    degrees: [1, 3, 5],
    optional: [],
    relatedScales: ['major', 'lydian', 'mixolydian', 'major-pentatonic'],
    about: 'Root, major 3rd, perfect 5th.',
  },
  {
    id: 'min',
    symbol: 'm',
    name: 'Minor',
    category: 'Triads',
    intervals: [0, 3, 7],
    degrees: [1, 3, 5],
    optional: [],
    relatedScales: ['natural-minor', 'dorian', 'minor-pentatonic', 'phrygian'],
    about: 'Root, minor 3rd, perfect 5th.',
  },
  {
    id: 'dim',
    symbol: 'dim',
    name: 'Diminished',
    category: 'Triads',
    intervals: [0, 3, 6],
    degrees: [1, 3, 5],
    optional: [],
    relatedScales: ['locrian', 'dim-whole-half', 'harmonic-minor'],
    about: 'Root, minor 3rd, diminished 5th.',
  },
  {
    id: 'aug',
    symbol: 'aug',
    name: 'Augmented',
    category: 'Triads',
    intervals: [0, 4, 8],
    degrees: [1, 3, 5],
    optional: [],
    relatedScales: ['whole-tone', 'harmonic-minor', 'melodic-minor'],
    about: 'Root, major 3rd, augmented 5th.',
  },
  {
    id: '6',
    symbol: '6',
    name: 'Major 6th',
    category: 'Triads',
    intervals: [0, 4, 7, 9],
    degrees: [1, 3, 5, 6],
    optional: [7],
    relatedScales: ['major', 'major-pentatonic', 'mixolydian'],
    about: 'Major triad with an added 6th.',
  },
  {
    id: 'm6',
    symbol: 'm6',
    name: 'Minor 6th',
    category: 'Triads',
    intervals: [0, 3, 7, 9],
    degrees: [1, 3, 5, 6],
    optional: [7],
    relatedScales: ['dorian', 'melodic-minor'],
    about: 'Minor triad with an added 6th.',
  },

  // ---- Sevenths ----------------------------------------------------------
  {
    id: '7',
    symbol: '7',
    name: 'Dominant 7th',
    category: 'Sevenths',
    intervals: [0, 4, 7, 10],
    degrees: [1, 3, 5, 7],
    optional: [7],
    relatedScales: ['mixolydian', 'blues', 'lydian-dominant', 'bebop-dominant', 'altered'],
    about: 'Major triad with a flat 7th. The blues and dominant-function chord.',
  },
  {
    id: 'maj7',
    symbol: 'maj7',
    name: 'Major 7th',
    category: 'Sevenths',
    intervals: [0, 4, 7, 11],
    degrees: [1, 3, 5, 7],
    optional: [7],
    relatedScales: ['major', 'lydian', 'major-pentatonic'],
    about: 'Major triad with a natural 7th.',
  },
  {
    id: 'm7',
    symbol: 'm7',
    name: 'Minor 7th',
    category: 'Sevenths',
    intervals: [0, 3, 7, 10],
    degrees: [1, 3, 5, 7],
    optional: [7],
    relatedScales: ['dorian', 'natural-minor', 'minor-pentatonic', 'phrygian'],
    about: 'Minor triad with a flat 7th.',
  },
  {
    id: 'm7b5',
    symbol: 'm7b5',
    name: 'Minor 7th flat 5 (half-diminished)',
    category: 'Sevenths',
    intervals: [0, 3, 6, 10],
    degrees: [1, 3, 5, 7],
    optional: [],
    relatedScales: ['locrian', 'dim-half-whole', 'melodic-minor'],
    about: 'Diminished triad with a flat 7th. The ii chord of a minor key.',
  },
  {
    id: 'dim7',
    symbol: 'dim7',
    name: 'Diminished 7th',
    category: 'Sevenths',
    intervals: [0, 3, 6, 9],
    degrees: [1, 3, 5, 7],
    optional: [],
    relatedScales: ['dim-whole-half', 'harmonic-minor'],
    about: 'Fully diminished: a stack of minor 3rds.',
  },
  {
    id: 'mMaj7',
    symbol: 'mMaj7',
    name: 'Minor major 7th',
    category: 'Sevenths',
    intervals: [0, 3, 7, 11],
    degrees: [1, 3, 5, 7],
    optional: [7],
    relatedScales: ['melodic-minor', 'harmonic-minor'],
    about: 'Minor triad with a natural 7th.',
  },
  {
    id: '7sus4',
    symbol: '7sus4',
    name: 'Dominant 7th suspended 4th',
    category: 'Sevenths',
    intervals: [0, 5, 7, 10],
    degrees: [1, 4, 5, 7],
    optional: [7],
    relatedScales: ['mixolydian', 'dorian'],
    about: 'The 3rd replaced by the 4th, over a flat 7th.',
  },

  // ---- Suspended ---------------------------------------------------------
  {
    id: 'sus2',
    symbol: 'sus2',
    name: 'Suspended 2nd',
    category: 'Suspended',
    intervals: [0, 2, 7],
    degrees: [1, 2, 5],
    optional: [],
    relatedScales: ['major', 'mixolydian', 'dorian', 'major-pentatonic'],
    about: 'The 3rd replaced by the 2nd. Neither major nor minor.',
  },
  {
    id: 'sus4',
    symbol: 'sus4',
    name: 'Suspended 4th',
    category: 'Suspended',
    intervals: [0, 5, 7],
    degrees: [1, 4, 5],
    optional: [],
    relatedScales: ['major', 'mixolydian', 'dorian'],
    about: 'The 3rd replaced by the 4th. Wants to resolve down to the 3rd.',
  },

  // ---- Power -------------------------------------------------------------
  {
    id: '5',
    symbol: '5',
    name: 'Power chord (root + 5th)',
    category: 'Power',
    intervals: [0, 7],
    degrees: [1, 5],
    optional: [],
    relatedScales: ['minor-pentatonic', 'blues', 'natural-minor', 'phrygian', 'mixolydian'],
    about: 'No 3rd, so it works over both major and minor riffs.',
  },
  {
    id: '5oct',
    symbol: '5',
    name: 'Power chord (root + 5th + octave)',
    category: 'Power',
    intervals: [0, 7, 12],
    degrees: [1, 5, 8],
    optional: [12],
    relatedScales: ['minor-pentatonic', 'blues', 'natural-minor', 'phrygian'],
    about: 'The three-string power chord shape, octave on top.',
  },

  // ---- Extended ----------------------------------------------------------
  {
    id: 'add9',
    symbol: 'add9',
    name: 'Added 9th',
    category: 'Extended',
    intervals: [0, 4, 7, 14],
    degrees: [1, 3, 5, 9],
    optional: [7],
    relatedScales: ['major', 'major-pentatonic', 'lydian'],
    about: 'Major triad with a 9th added but no 7th.',
  },
  {
    id: '9',
    symbol: '9',
    name: 'Dominant 9th',
    category: 'Extended',
    intervals: [0, 4, 7, 10, 14],
    degrees: [1, 3, 5, 7, 9],
    optional: [7, 14],
    relatedScales: ['mixolydian', 'bebop-dominant', 'blues'],
    about: 'Dominant 7th with a 9th.',
  },
  {
    id: 'm9',
    symbol: 'm9',
    name: 'Minor 9th',
    category: 'Extended',
    intervals: [0, 3, 7, 10, 14],
    degrees: [1, 3, 5, 7, 9],
    optional: [7, 14],
    relatedScales: ['dorian', 'natural-minor'],
    about: 'Minor 7th with a 9th.',
  },
  {
    id: 'maj9',
    symbol: 'maj9',
    name: 'Major 9th',
    category: 'Extended',
    intervals: [0, 4, 7, 11, 14],
    degrees: [1, 3, 5, 7, 9],
    optional: [7, 14],
    relatedScales: ['major', 'lydian'],
    about: 'Major 7th with a 9th.',
  },
];

export const CHORD_BY_ID: Record<string, ChordDef> = Object.fromEntries(
  CHORDS.map((c) => [c.id, c]),
);

export function getChord(id: string): ChordDef {
  const c = CHORD_BY_ID[id];
  if (!c) throw new Error(`Unknown chord: ${id}`);
  return c;
}

export const CHORD_CATEGORIES: ChordCategory[] = [
  'Triads',
  'Sevenths',
  'Suspended',
  'Power',
  'Extended',
];

/** chord + root -> the set of pitch classes it contains. */
export function chordPitchClasses(rootName: string, chord: ChordDef): Set<number> {
  const rootPc = noteNameToPc(rootName);
  return new Set(chord.intervals.map((i) => mod(rootPc + i, 12)));
}

/** chord + root -> pitch class => chord-tone label ("1", "3", "b7"...). */
export function chordDegreeLabels(rootName: string, chord: ChordDef): Map<number, string> {
  const rootPc = noteNameToPc(rootName);
  const out = new Map<number, string>();
  chord.intervals.forEach((semis, i) => {
    const pc = mod(rootPc + semis, 12);
    const degree = chord.degrees[i] ?? i + 1;
    // Compound degrees (9, 11, 13) are labelled by their compound number but
    // the accidental is worked out from the simple interval inside an octave.
    const simple = degree > 7 ? degree - 7 : degree;
    const simpleLabel = degreeLabel(simple, mod(semis, 12));
    const label = degree > 7 ? simpleLabel.replace(String(simple), String(degree)) : simpleLabel;
    if (!out.has(pc)) out.set(pc, label);
  });
  return out;
}

/** Full display name, e.g. root "C" + chord "m7" -> "Cm7". */
export function chordDisplayName(rootName: string, chord: ChordDef): string {
  return `${rootName}${chord.symbol}`;
}

export interface ScaleSuggestion {
  scaleId: string;
  /** Why this scale fits, in one short phrase. */
  reason: string;
}

/**
 * chord -> musically sensible scale suggestions.
 *
 * The reason strings matter: the UI shows them so a learner never mistakes
 * "the chord" (a few notes you fret together) for "the scale" (the note pool
 * you solo with). The suggestion list is derived from the catalogue's
 * `relatedScales`, and each entry is checked so a suggested scale actually
 * contains every chord tone — a suggestion that contradicts the chord would
 * be worse than none.
 */
export function suggestScalesForChord(
  rootName: string,
  chord: ChordDef,
  scaleContains: (scaleId: string, pcs: Set<number>) => boolean,
): ScaleSuggestion[] {
  const pcs = chordPitchClasses(rootName, chord);
  const reasons: Record<string, string> = {
    major: 'contains the chord tones and resolves to the root',
    'major-pentatonic': 'safe five-note subset, no half steps',
    'minor-pentatonic': 'the standard rock and blues choice',
    blues: 'adds the blue note over the chord',
    mixolydian: 'major sound with the flat 7th of the chord',
    dorian: 'minor sound with a bright natural 6th',
    phrygian: 'darker minor colour, flat 2nd',
    'natural-minor': 'plain minor note pool',
    locrian: 'the mode built on the chord root for m7b5',
    lydian: 'major with a sharp 4th for an open sound',
    'lydian-dominant': 'dominant sound with a sharp 4th',
    altered: 'maximum tension over a dominant chord',
    'melodic-minor': 'raises the 6th and 7th over a minor chord',
    'harmonic-minor': 'raised 7th, matches a dominant V in minor',
    'whole-tone': 'symmetric match for the augmented 5th',
    'dim-half-whole': 'octatonic option over altered dominants',
    'dim-whole-half': 'octatonic match for diminished chords',
    'bebop-dominant': 'dominant scale with an extra passing tone',
  };
  return chord.relatedScales
    .filter((id) => scaleContains(id, pcs))
    .map((id) => ({ scaleId: id, reason: reasons[id] ?? 'shares the chord tones' }));
}
