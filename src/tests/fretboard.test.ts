import { describe, expect, it } from 'vitest';
import {
  buildFretboard,
  findPositions,
  fretDistanceRatio,
  fretsForPc,
  inlayKind,
  labelAt,
  lowestFretForPc,
  midiAt,
  tuningMidis,
  validateTuning,
} from '../core/theory/fretboard';
import { getInstrument, getTuning } from '../core/instruments/definitions';
import { midiToNote, noteNameToMidi, noteNameToPc } from '../core/theory/pitch';
import { buildSpellingMap } from '../core/theory/spelling';
import { getScale, scalePitchClasses } from '../core/theory/scales';

const openOf = (instrumentId: string, tuningId: string): number[] => {
  const inst = getInstrument(instrumentId);
  return tuningMidis(getTuning(inst, tuningId));
};

/** Note names, no octave, for one string across `frets` frets. */
const stringNames = (open: number[], stringIndex: number, frets: number, root = 'C'): string[] => {
  const map = buildSpellingMap(root);
  const out: string[] = [];
  for (let f = 0; f <= frets; f++) out.push(labelAt(open, stringIndex, f, map).name);
  return out;
};

describe('string + fret + tuning -> note', () => {
  it('derives the note from the open string, not from a lookup table', () => {
    const std = openOf('guitar6', 'standard');
    expect(midiAt(std, 0, 0)).toBe(noteNameToMidi('E2'));
    expect(midiAt(std, 0, 5)).toBe(noteNameToMidi('A2'));
    expect(midiAt(std, 0, 12)).toBe(noteNameToMidi('E3'));
    expect(midiAt(std, 5, 12)).toBe(noteNameToMidi('E5'));
    // 5th fret of the 5th string equals the open 4th string, as on a real neck
    expect(midiAt(std, 1, 5)).toBe(midiAt(std, 2, 0));
  });

  it('builds a complete fretboard matrix with frequencies', () => {
    const board = buildFretboard(openOf('guitar6', 'standard'), 22);
    expect(board).toHaveLength(6);
    expect(board[0]).toHaveLength(23);
    expect(board[0][0].freq).toBeCloseTo(82.4069, 3);
    expect(board[5][0].midi).toBe(64);
    expect(board[0][22].midi).toBe(62);
  });

  it('rejects impossible positions', () => {
    const std = openOf('guitar6', 'standard');
    expect(() => midiAt(std, 9, 0)).toThrow(/No string/);
    expect(() => midiAt(std, 0, -1)).toThrow(/Negative fret/);
  });
});

describe('every tuning preset recalculates the whole neck', () => {
  it('6-string standard: E A D G B E', () => {
    expect(openOf('guitar6', 'standard').map((m) => midiToNote(m).full)).toEqual([
      'E2',
      'A2',
      'D3',
      'G3',
      'B3',
      'E4',
    ]);
  });

  it('half step down shifts every string by one semitone', () => {
    const std = openOf('guitar6', 'standard');
    const half = openOf('guitar6', 'half-down');
    expect(half).toEqual(std.map((m) => m - 1));
    expect(stringNames(half, 0, 3, 'Eb')).toEqual(['Eb', 'E', 'F', 'Gb']);
  });

  it('D standard shifts every string by two semitones', () => {
    const std = openOf('guitar6', 'standard');
    const d = openOf('guitar6', 'd-standard');
    expect(d).toEqual(std.map((m) => m - 2));
    expect(d.map((m) => midiToNote(m).name)).toEqual(['D', 'G', 'C', 'F', 'A', 'D']);
    // The 2nd fret of D standard sounds what the open string does in standard.
    for (let s = 0; s < 6; s++) expect(midiAt(d, s, 2)).toBe(midiAt(std, s, 0));
  });

  it('Drop D lowers only the 6th string', () => {
    const std = openOf('guitar6', 'standard');
    const drop = openOf('guitar6', 'drop-d');
    expect(drop[0]).toBe(noteNameToMidi('D2'));
    expect(midiToNote(drop[0]).name).toBe('D');
    expect(drop.slice(1)).toEqual(std.slice(1));
    // Only that one string's note names change.
    expect(stringNames(drop, 0, 4, 'D')).toEqual(['D', 'D#', 'E', 'F', 'F#']);
    expect(stringNames(drop, 1, 4, 'D')).toEqual(stringNames(std, 1, 4, 'D'));
  });

  it('Drop C and Drop B land on the right open notes', () => {
    expect(openOf('guitar6', 'drop-c').map((m) => midiToNote(m).name)).toEqual([
      'C',
      'G',
      'C',
      'F',
      'A',
      'D',
    ]);
    const dropB = openOf('guitar6', 'drop-b');
    expect(midiToNote(dropB[0]).full).toBe('B1');
    expect(dropB[1] - dropB[0]).toBe(7); // the dropped string sits a 5th below
  });

  it('4-string bass standard: E A D G an octave below the guitar', () => {
    const bass = openOf('bass4', 'standard');
    expect(bass).toHaveLength(4);
    expect(bass.map((m) => midiToNote(m).full)).toEqual(['E1', 'A1', 'D2', 'G2']);
    const guitar = openOf('guitar6', 'standard');
    expect(bass[0]).toBe(guitar[0] - 12);
  });

  it('a bass tuned BEAD puts a low B on the lowest string', () => {
    const bead = openOf('bass4', 'bead');
    expect(bead.map((m) => midiToNote(m).full)).toEqual(['B0', 'E1', 'A1', 'D2']);
    expect(buildFretboard(bead, 5)[0][0].freq).toBeCloseTo(30.8677, 3);
  });

  it('bass drop tunings move only the string they name', () => {
    const std = openOf('bass4', 'standard');
    const drop = openOf('bass4', 'drop-d');
    expect(drop[0]).toBe(std[0] - 2);
    expect(drop.slice(1)).toEqual(std.slice(1));
  });

  it('every preset of every instrument has the right string count and ascends', () => {
    for (const id of ['guitar6', 'bass4']) {
      const inst = getInstrument(id);
      for (const tuning of inst.tunings) {
        expect(tuning.notes).toHaveLength(inst.stringCount);
        const midis = tuningMidis(tuning);
        // Index 0 must be the lowest-pitched string; drop tunings must not
        // accidentally reorder it.
        expect(midis[0]).toBe(Math.min(...midis));
        expect(midis.every((m) => m >= 0 && m <= 127)).toBe(true);
      }
    }
  });
});

describe('alternate tuning changes the resulting notes', () => {
  it('the same string and fret sounds a different note in a different tuning', () => {
    const std = openOf('guitar6', 'standard');
    const drop = openOf('guitar6', 'drop-d');
    const dStd = openOf('guitar6', 'd-standard');
    const map = buildSpellingMap('C');

    expect(labelAt(std, 0, 3, map).full).toBe('G2');
    expect(labelAt(drop, 0, 3, map).full).toBe('F2');
    expect(labelAt(dStd, 0, 3, map).full).toBe('F2');
    // ...while an untouched string is unaffected by Drop D
    expect(labelAt(std, 3, 3, map).full).toBe(labelAt(drop, 3, 3, map).full);
    // ...but is affected by D standard
    expect(labelAt(dStd, 3, 3, map).full).toBe('G#3');
  });

  it('scale highlighting follows pitch class, so it moves with the tuning', () => {
    const pcs = scalePitchClasses('E', getScale('minor-pentatonic'));
    const std = findPositions(openOf('guitar6', 'standard'), 12, pcs);
    const drop = findPositions(openOf('guitar6', 'drop-d'), 12, pcs);

    // In standard tuning the open low E is in E minor pentatonic.
    expect(std.some((p) => p.stringIndex === 0 && p.fret === 0)).toBe(true);
    // In Drop D the open low string is D, which is also in the scale, but the
    // positions along that string are not the same ones.
    const stdLow = std.filter((p) => p.stringIndex === 0).map((p) => p.fret);
    const dropLow = drop.filter((p) => p.stringIndex === 0).map((p) => p.fret);
    expect(stdLow).toEqual([0, 3, 5, 7, 10, 12]);
    // Drop D's open low string is D, which is itself a note of E minor
    // pentatonic, so fret 0 stays lit while the rest of the string shifts.
    expect(dropLow).toEqual([0, 2, 5, 7, 9, 12]);
    // Strings that did not change keep identical highlighting.
    expect(std.filter((p) => p.stringIndex === 3)).toEqual(drop.filter((p) => p.stringIndex === 3));
  });

  it('a custom tuning is honoured exactly', () => {
    const custom = ['C2', 'G2', 'C3', 'G3', 'C4', 'E4'].map(noteNameToMidi);
    const map = buildSpellingMap('C', getScale('major').intervals, getScale('major').degrees);
    expect(labelAt(custom, 0, 0, map).full).toBe('C2');
    expect(labelAt(custom, 4, 0, map).full).toBe('C4');
    expect(labelAt(custom, 5, 5, map).full).toBe('A4');
  });
});

describe('position helpers', () => {
  it('finds the lowest fret for a pitch class on each string', () => {
    const std = openOf('guitar6', 'standard');
    expect(lowestFretForPc(std, 0, noteNameToPc('G'), 22)).toBe(3);
    expect(lowestFretForPc(std, 0, noteNameToPc('E'), 22)).toBe(0);
    expect(lowestFretForPc(std, 4, noteNameToPc('C'), 22)).toBe(1);
    expect(lowestFretForPc(std, 0, 99, 22)).toBe(null); // nonsense pitch class
  });

  it('lists every octave of a pitch class on a string', () => {
    const std = openOf('guitar6', 'standard');
    expect(fretsForPc(std, 0, noteNameToPc('E'), 22)).toEqual([0, 12]);
    expect(fretsForPc(std, 0, noteNameToPc('G'), 22)).toEqual([3, 15]);
    expect(fretsForPc(std, 0, noteNameToPc('G'), 2)).toEqual([]);
  });

  it('places inlays where a real neck has them', () => {
    expect(inlayKind(0)).toBe('none');
    expect([3, 5, 7, 9, 15, 17, 19, 21].map(inlayKind)).toEqual(Array(8).fill('single'));
    expect(inlayKind(12)).toBe('double');
    expect(inlayKind(24)).toBe('double');
    expect([1, 2, 4, 6, 8, 10, 11, 13].map(inlayKind)).toEqual(Array(8).fill('none'));
  });

  it('spaces frets by equal temperament, not evenly', () => {
    expect(fretDistanceRatio(0)).toBeCloseTo(0, 9);
    // The 12th fret is exactly halfway along the scale length.
    expect(fretDistanceRatio(12)).toBeCloseTo(0.5, 9);
    expect(fretDistanceRatio(24)).toBeCloseTo(0.75, 9);
    // Frets get closer together as they go up.
    const w1 = fretDistanceRatio(1) - fretDistanceRatio(0);
    const w12 = fretDistanceRatio(12) - fretDistanceRatio(11);
    expect(w12).toBeLessThan(w1);
  });
});

describe('custom tuning validation', () => {
  it('accepts a correct custom tuning', () => {
    const v = validateTuning(['D2', 'A2', 'D3', 'G3', 'A3', 'D4'], 6);
    expect(v.ok).toBe(true);
    expect(v.errors.every((e) => e === null)).toBe(true);
  });

  it('reports the offending string rather than throwing', () => {
    const v = validateTuning(['E2', 'H2', 'D3', 'G3', 'B3', 'E4'], 6);
    expect(v.ok).toBe(false);
    expect(v.errors[1]).toMatch(/note name/);
    expect(v.errors[0]).toBe(null);
  });

  it('rejects a missing octave and the wrong number of strings', () => {
    expect(validateTuning(['E', 'A', 'D', 'G', 'B', 'E'], 6).ok).toBe(false);
    const wrong = validateTuning(['E2', 'A2', 'D3'], 6);
    expect(wrong.ok).toBe(false);
    expect(wrong.message).toMatch(/6 strings/);
  });
});
