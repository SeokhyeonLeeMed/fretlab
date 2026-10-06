/**
 * music-en.ts — English names and descriptions for the scale and chord
 * catalogues.
 *
 * These live apart from the interface strings because they are keyed by the
 * catalogue ids in core/theory, and because they are the part a translator is
 * most likely to want to work on in one piece. `MusicMessages` is derived
 * from this file, so every locale must cover every scale and chord or the
 * build fails.
 */

export const musicEn = {
  scales: {
    major: ['Major (Ionian)', 'The reference major scale. Bright and resolved.'],
    'natural-minor': [
      'Natural minor (Aeolian)',
      'The standard minor scale: the same notes as the major a minor 3rd above.',
    ],
    'harmonic-minor': [
      'Harmonic minor',
      'Natural minor with a raised 7th, which yields a dominant V chord in minor.',
    ],
    'melodic-minor': [
      'Melodic minor (ascending)',
      'Minor 3rd with major 6th and 7th. The jazz minor scale.',
    ],
    'harmonic-major': ['Harmonic major', 'Major scale with a flattened 6th.'],
    ionian: ['Ionian', '1st mode of the major scale, identical to the major scale.'],
    dorian: ['Dorian', '2nd mode: minor with a natural 6th. Very common over m7 chords.'],
    phrygian: ['Phrygian', '3rd mode: minor with a flat 2nd. Spanish and metal flavour.'],
    lydian: ['Lydian', '4th mode: major with a sharp 4th. Floating and filmic.'],
    mixolydian: ['Mixolydian', '5th mode: major with a flat 7th. The dominant-7th sound.'],
    aeolian: ['Aeolian', '6th mode, identical to the natural minor scale.'],
    locrian: ['Locrian', '7th mode: flat 2nd and flat 5th. Fits m7b5 chords.'],
    'lydian-dominant': [
      'Lydian dominant',
      '4th mode of melodic minor: sharp 4th and flat 7th together.',
    ],
    'phrygian-dominant': [
      'Phrygian dominant',
      '5th mode of harmonic minor. The flamenco / Phrygian-major sound.',
    ],
    altered: ['Altered (super-Locrian)', '7th mode of melodic minor, the altered-dominant scale.'],
    'major-pentatonic': [
      'Major pentatonic',
      'Major scale without the 4th and 7th, so it contains no half steps.',
    ],
    'minor-pentatonic': ['Minor pentatonic', 'The core rock and blues lead scale.'],
    hirajoshi: ['Hirajoshi', 'Japanese pentatonic containing two half steps.'],
    blues: ['Blues (minor)', 'Minor pentatonic plus the flat-5th blue note.'],
    'major-blues': ['Blues (major)', 'Major pentatonic plus the flat-3rd passing tone.'],
    'whole-tone': ['Whole tone', 'All whole steps. Pairs with augmented chords.'],
    'dim-half-whole': [
      'Diminished (half-whole)',
      'Octatonic scale used over altered dominant chords.',
    ],
    'dim-whole-half': [
      'Diminished (whole-half)',
      'Octatonic scale used over diminished-7th chords.',
    ],
    chromatic: ['Chromatic', 'Every semitone. Useful as a plain fretboard reference.'],
    'hungarian-minor': ['Hungarian minor', 'Harmonic minor with a raised 4th.'],
    'double-harmonic': [
      'Double harmonic (Byzantine)',
      'Flat 2nd and flat 6th against a major 3rd and 7th.',
    ],
    'bebop-dominant': [
      'Bebop dominant',
      'Mixolydian with the natural 7th added as a passing tone.',
    ],
  },
  chords: {
    maj: ['Major', 'Root, major 3rd, perfect 5th.'],
    min: ['Minor', 'Root, minor 3rd, perfect 5th.'],
    dim: ['Diminished', 'Root, minor 3rd, diminished 5th.'],
    aug: ['Augmented', 'Root, major 3rd, augmented 5th.'],
    '6': ['Major 6th', 'Major triad with an added 6th.'],
    m6: ['Minor 6th', 'Minor triad with an added 6th.'],
    '7': ['Dominant 7th', 'Major triad with a flat 7th. The blues and dominant-function chord.'],
    maj7: ['Major 7th', 'Major triad with a natural 7th.'],
    m7: ['Minor 7th', 'Minor triad with a flat 7th.'],
    m7b5: [
      'Minor 7th flat 5 (half-diminished)',
      'Diminished triad with a flat 7th. The ii chord of a minor key.',
    ],
    dim7: ['Diminished 7th', 'Fully diminished: a stack of minor 3rds.'],
    mMaj7: ['Minor major 7th', 'Minor triad with a natural 7th.'],
    '7sus4': ['Dominant 7th suspended 4th', 'The 3rd replaced by the 4th, over a flat 7th.'],
    sus2: ['Suspended 2nd', 'The 3rd replaced by the 2nd. Neither major nor minor.'],
    sus4: ['Suspended 4th', 'The 3rd replaced by the 4th. Wants to resolve down to the 3rd.'],
    '5': ['Power chord (root + 5th)', 'No 3rd, so it works over both major and minor riffs.'],
    '5oct': [
      'Power chord (root + 5th + octave)',
      'The three-string power chord shape, octave on top.',
    ],
    add9: ['Added 9th', 'Major triad with a 9th added but no 7th.'],
    '9': ['Dominant 9th', 'Dominant 7th with a 9th.'],
    m9: ['Minor 9th', 'Minor 7th with a 9th.'],
    maj9: ['Major 9th', 'Major 7th with a 9th.'],
  },
  tunings: {
    standard: 'Standard',
    'half-down': 'Half step down',
    'd-standard': 'D standard (whole step down)',
    'c-sharp-standard': 'C# standard',
    'drop-d': 'Drop D',
    'drop-c-sharp': 'Drop C#',
    'drop-c': 'Drop C',
    'drop-b': 'Drop B',
    'drop-a': 'Drop A',
    'open-g': 'Open G',
    'open-d': 'Open D',
    'open-e': 'Open E',
    dadgad: 'DADGAD',
    bead: 'BEAD (low B)',
    tenor: 'Tenor',
    custom: 'Custom',
  },
  categories: {
    'Major / minor': 'Major / minor',
    Modes: 'Modes',
    Pentatonic: 'Pentatonic',
    Blues: 'Blues',
    Symmetric: 'Symmetric',
    Exotic: 'Exotic',
    Triads: 'Triads',
    Sevenths: 'Sevenths',
    Suspended: 'Suspended',
    Power: 'Power',
    Extended: 'Extended',
  },
  /** Why a scale is suggested for a chord, keyed by scale id. */
  reasons: {
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
    'harmonic-major': 'major with a flattened 6th',
    aeolian: 'plain minor note pool',
    ionian: 'contains the chord tones and resolves to the root',
    hirajoshi: 'shares the chord tones',
    'major-blues': 'shares the chord tones',
    chromatic: 'every note, as a reference',
    'hungarian-minor': 'shares the chord tones',
    'double-harmonic': 'shares the chord tones',
    'phrygian-dominant': 'shares the chord tones',
  },
} as const;

export type MusicMessages = {
  scales: Record<keyof typeof musicEn.scales, readonly [string, string]>;
  chords: Record<keyof typeof musicEn.chords, readonly [string, string]>;
  categories: Record<keyof typeof musicEn.categories, string>;
  tunings: Record<keyof typeof musicEn.tunings, string>;
  reasons: Record<keyof typeof musicEn.reasons, string>;
};
