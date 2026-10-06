/**
 * definitions.ts — instruments as data.
 *
 * Adding an 8-string guitar, a 6-string bass or a ukulele means adding one
 * object to the array below. No renderer, engine or component branches on
 * instrument identity: they all read these fields.
 */

import type { Tuning } from '../theory/fretboard';

export type InstrumentFamily = 'guitar' | 'bass';

export interface InstrumentDef {
  id: string;
  name: string;
  shortName: string;
  family: InstrumentFamily;
  stringCount: number;
  /** Number of frets drawn on the neck. */
  fretCount: number;
  /** id of the tuning preset used when the instrument is first selected. */
  defaultTuningId: string;
  tunings: Tuning[];
  /**
   * String gauge hint, thickest string first, in relative units. Drives both
   * the drawn string thickness and the synth's brightness per string.
   */
  stringGauges: number[];
  /** Scale length in inches; used for proportionate neck drawing. */
  scaleLengthIn: number;
  display: {
    /**
     * Body silhouette. 'offset-double-cutaway' is the classic bolt-on
     * electric guitar outline; 'offset-bass' is its long-horned bass
     * counterpart. Both are drawn from original profile data in
     * components/fretboard/geometry.ts.
     */
    bodyStyle: 'offset-double-cutaway' | 'offset-bass';
    /** Headstock outline; both are six/four-in-a-row designs. */
    headstock: 'inline-guitar' | 'inline-bass';
    bodyColor: string;
    bodyEdgeColor: string;
    fretboardColor: string;
    pickguardColor: string;
  };
}

const t = (id: string, name: string, notes: string[]): Tuning => ({ id, name, notes });

export const GUITAR6_TUNINGS: Tuning[] = [
  t('standard', 'Standard — E A D G B E', ['E2', 'A2', 'D3', 'G3', 'B3', 'E4']),
  t('half-down', 'Half step down — Eb Ab Db Gb Bb Eb', ['Eb2', 'Ab2', 'Db3', 'Gb3', 'Bb3', 'Eb4']),
  t('d-standard', 'D standard (whole step down) — D G C F A D', ['D2', 'G2', 'C3', 'F3', 'A3', 'D4']),
  t('c-sharp-standard', 'C# standard — C# F# B E G# C#', ['C#2', 'F#2', 'B2', 'E3', 'G#3', 'C#4']),
  t('drop-d', 'Drop D — D A D G B E', ['D2', 'A2', 'D3', 'G3', 'B3', 'E4']),
  t('drop-c-sharp', 'Drop C# — C# G# C# F# A# C#', ['C#2', 'G#2', 'C#3', 'F#3', 'A#3', 'C#4']),
  t('drop-c', 'Drop C — C G C F A D', ['C2', 'G2', 'C3', 'F3', 'A3', 'D4']),
  t('drop-b', 'Drop B — B F# B E G# C#', ['B1', 'F#2', 'B2', 'E3', 'G#3', 'C#4']),
  t('drop-a', 'Drop A — A E A D F# B', ['A1', 'E2', 'A2', 'D3', 'F#3', 'B3']),
  t('open-g', 'Open G — D G D G B D', ['D2', 'G2', 'D3', 'G3', 'B3', 'D4']),
  t('open-d', 'Open D — D A D F# A D', ['D2', 'A2', 'D3', 'F#3', 'A3', 'D4']),
  t('open-e', 'Open E — E B E G# B E', ['E2', 'B2', 'E3', 'G#3', 'B3', 'E4']),
  t('dadgad', 'DADGAD — D A D G A D', ['D2', 'A2', 'D3', 'G3', 'A3', 'D4']),
];

export const GUITAR7_TUNINGS: Tuning[] = [
  t('standard', 'Standard — B E A D G B E', ['B1', 'E2', 'A2', 'D3', 'G3', 'B3', 'E4']),
  t('half-down', 'Half step down — Bb Eb Ab Db Gb Bb Eb', ['Bb1', 'Eb2', 'Ab2', 'Db3', 'Gb3', 'Bb3', 'Eb4']),
  t('a-standard', 'A standard (whole step down) — A D G C F A D', ['A1', 'D2', 'G2', 'C3', 'F3', 'A3', 'D4']),
  t('drop-a', 'Drop A — A E A D G B E', ['A1', 'E2', 'A2', 'D3', 'G3', 'B3', 'E4']),
  t('drop-g', 'Drop G — G D G C F A D', ['G1', 'D2', 'G2', 'C3', 'F3', 'A3', 'D4']),
  t('drop-g-sharp', 'Drop G# — G# D# G# C# F# A# D#', ['G#1', 'D#2', 'G#2', 'C#3', 'F#3', 'A#3', 'D#4']),
  t('russian', 'Russian / Lydian 7 — A E A C# E A E', ['A1', 'E2', 'A2', 'C#3', 'E3', 'A3', 'E4']),
];

export const BASS4_TUNINGS: Tuning[] = [
  t('standard', 'Standard — E A D G', ['E1', 'A1', 'D2', 'G2']),
  t('half-down', 'Half step down — Eb Ab Db Gb', ['Eb1', 'Ab1', 'Db2', 'Gb2']),
  t('d-standard', 'D standard (whole step down) — D G C F', ['D1', 'G1', 'C2', 'F2']),
  t('drop-d', 'Drop D — D A D G', ['D1', 'A1', 'D2', 'G2']),
  t('drop-c', 'Drop C — C G C F', ['C1', 'G1', 'C2', 'F2']),
  t('bead', 'BEAD (low B) — B E A D', ['B0', 'E1', 'A1', 'D2']),
  t('tenor', 'Tenor — A D G C', ['A1', 'D2', 'G2', 'C3']),
];

export const BASS5_TUNINGS: Tuning[] = [
  t('standard', 'Standard — B E A D G', ['B0', 'E1', 'A1', 'D2', 'G2']),
  t('half-down', 'Half step down — Bb Eb Ab Db Gb', ['Bb0', 'Eb1', 'Ab1', 'Db2', 'Gb2']),
  t('d-standard', 'Whole step down — A D G C F', ['A0', 'D1', 'G1', 'C2', 'F2']),
  t('drop-a', 'Drop A — A E A D G', ['A0', 'E1', 'A1', 'D2', 'G2']),
  t('tenor', 'Tenor — E A D G C', ['E1', 'A1', 'D2', 'G2', 'C3']),
];

export const INSTRUMENTS: InstrumentDef[] = [
  {
    id: 'guitar6',
    name: '6-string guitar',
    shortName: 'Guitar 6',
    family: 'guitar',
    stringCount: 6,
    fretCount: 22,
    defaultTuningId: 'standard',
    tunings: GUITAR6_TUNINGS,
    stringGauges: [1.0, 0.86, 0.72, 0.58, 0.46, 0.36],
    scaleLengthIn: 25.5,
    display: {
      bodyStyle: 'offset-double-cutaway',
      headstock: 'inline-guitar',
      bodyColor: '#b5472b',
      bodyEdgeColor: '#6d2214',
      fretboardColor: '#43281a',
      pickguardColor: '#efe6d3',
    },
  },
  {
    id: 'guitar7',
    name: '7-string guitar',
    shortName: 'Guitar 7',
    family: 'guitar',
    stringCount: 7,
    fretCount: 24,
    defaultTuningId: 'standard',
    tunings: GUITAR7_TUNINGS,
    stringGauges: [1.12, 1.0, 0.86, 0.72, 0.58, 0.46, 0.36],
    scaleLengthIn: 26.5,
    display: {
      bodyStyle: 'offset-double-cutaway',
      headstock: 'inline-guitar',
      bodyColor: '#2f3b52',
      bodyEdgeColor: '#161e2c',
      fretboardColor: '#2c2320',
      pickguardColor: '#d9dde4',
    },
  },
  {
    id: 'bass4',
    name: '4-string bass',
    shortName: 'Bass 4',
    family: 'bass',
    stringCount: 4,
    fretCount: 21,
    defaultTuningId: 'standard',
    tunings: BASS4_TUNINGS,
    stringGauges: [1.45, 1.22, 1.02, 0.84],
    scaleLengthIn: 34,
    display: {
      bodyStyle: 'offset-bass',
      headstock: 'inline-bass',
      bodyColor: '#2d6a5a',
      bodyEdgeColor: '#13382f',
      fretboardColor: '#3a2a1e',
      pickguardColor: '#e8e2d2',
    },
  },
  {
    id: 'bass5',
    name: '5-string bass',
    shortName: 'Bass 5',
    family: 'bass',
    stringCount: 5,
    fretCount: 22,
    defaultTuningId: 'standard',
    tunings: BASS5_TUNINGS,
    stringGauges: [1.62, 1.45, 1.22, 1.02, 0.84],
    scaleLengthIn: 35,
    display: {
      bodyStyle: 'offset-bass',
      headstock: 'inline-bass',
      bodyColor: '#473169',
      bodyEdgeColor: '#241440',
      fretboardColor: '#241a14',
      pickguardColor: '#ded6e6',
    },
  },
];

export const INSTRUMENT_BY_ID: Record<string, InstrumentDef> = Object.fromEntries(
  INSTRUMENTS.map((i) => [i.id, i]),
);

export function getInstrument(id: string): InstrumentDef {
  const i = INSTRUMENT_BY_ID[id];
  if (!i) throw new Error(`Unknown instrument: ${id}`);
  return i;
}

export function getTuning(instrument: InstrumentDef, tuningId: string): Tuning {
  return (
    instrument.tunings.find((x) => x.id === tuningId) ??
    instrument.tunings.find((x) => x.id === instrument.defaultTuningId) ??
    instrument.tunings[0]
  );
}

export const FAMILIES: { id: InstrumentFamily; name: string }[] = [
  { id: 'guitar', name: 'Guitar' },
  { id: 'bass', name: 'Bass' },
];

/** The instruments of one family, fewest strings first. */
export function instrumentsOfFamily(family: InstrumentFamily): InstrumentDef[] {
  return INSTRUMENTS.filter((i) => i.family === family).sort(
    (a, b) => a.stringCount - b.stringCount,
  );
}

/** Every preset across every instrument, for the README/report tables. */
export function allTuningPresets(): { instrument: string; tunings: Tuning[] }[] {
  return INSTRUMENTS.map((i) => ({ instrument: i.name, tunings: i.tunings }));
}
