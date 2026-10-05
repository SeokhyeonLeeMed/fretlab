import { describe, expect, it } from 'vitest';
import {
  SCALES,
  degreeLabel,
  getScale,
  scaleDegreeLabels,
  scalePitchClasses,
} from '../core/theory/scales';
import { noteNameToPc } from '../core/theory/pitch';

const pcs = (root: string, id: string): number[] =>
  [...scalePitchClasses(root, getScale(id))].sort((a, b) => a - b);

describe('scale pitch-class sets', () => {
  it('C major is the white keys', () => {
    expect(pcs('C', 'major')).toEqual([0, 2, 4, 5, 7, 9, 11]);
  });

  it('A natural minor is also the white keys, built on A', () => {
    expect(pcs('A', 'natural-minor')).toEqual([0, 2, 4, 5, 7, 9, 11]);
    expect(pcs('A', 'natural-minor')).toEqual(pcs('C', 'major'));
  });

  it('relative modes share one pitch-class set', () => {
    const cMajor = pcs('C', 'major');
    expect(pcs('D', 'dorian')).toEqual(cMajor);
    expect(pcs('E', 'phrygian')).toEqual(cMajor);
    expect(pcs('F', 'lydian')).toEqual(cMajor);
    expect(pcs('G', 'mixolydian')).toEqual(cMajor);
    expect(pcs('A', 'aeolian')).toEqual(cMajor);
    expect(pcs('B', 'locrian')).toEqual(cMajor);
    expect(pcs('C', 'ionian')).toEqual(cMajor);
  });

  it('harmonic and melodic minor raise the degrees they are supposed to', () => {
    // A harmonic minor: A B C D E F G#
    expect(pcs('A', 'harmonic-minor')).toEqual([0, 2, 4, 5, 8, 9, 11]);
    // A melodic minor: A B C D E F# G#
    expect(pcs('A', 'melodic-minor')).toEqual([0, 2, 4, 6, 8, 9, 11]);
    // The only difference between them is the 6th degree.
    const h = new Set(pcs('A', 'harmonic-minor'));
    const m = new Set(pcs('A', 'melodic-minor'));
    const diff = [...m].filter((x) => !h.has(x));
    expect(diff).toEqual([noteNameToPc('F#')]);
  });

  it('E minor pentatonic is exactly E G A B D', () => {
    expect(pcs('E', 'minor-pentatonic')).toEqual(['E', 'G', 'A', 'B', 'D'].map(noteNameToPc).sort((a, b) => a - b));
    expect(pcs('E', 'minor-pentatonic')).toHaveLength(5);
  });

  it('C major pentatonic is C D E G A', () => {
    expect(pcs('C', 'major-pentatonic')).toEqual([0, 2, 4, 7, 9]);
  });

  it('a minor pentatonic equals the major pentatonic a minor 3rd up', () => {
    expect(pcs('A', 'minor-pentatonic')).toEqual(pcs('C', 'major-pentatonic'));
  });

  it('the blues scale is the minor pentatonic plus one note', () => {
    const pent = new Set(pcs('A', 'minor-pentatonic'));
    const blues = pcs('A', 'blues');
    expect(blues).toHaveLength(6);
    const added = blues.filter((pc) => !pent.has(pc));
    expect(added).toEqual([noteNameToPc('Eb')]);
  });

  it('symmetric scales repeat under transposition', () => {
    // Whole tone has only two distinct transpositions.
    expect(pcs('C', 'whole-tone')).toEqual(pcs('D', 'whole-tone'));
    expect(pcs('C', 'whole-tone')).not.toEqual(pcs('C#', 'whole-tone'));
    // The diminished scale repeats every minor 3rd.
    expect(pcs('C', 'dim-whole-half')).toEqual(pcs('Eb', 'dim-whole-half'));
    expect(pcs('C', 'chromatic')).toHaveLength(12);
  });

  it('transposition shifts the whole set', () => {
    const c = pcs('C', 'major');
    const d = pcs('D', 'major');
    expect(d).toEqual(c.map((pc) => (pc + 2) % 12).sort((a, b) => a - b));
  });

  it('every catalogued scale is well formed', () => {
    for (const s of SCALES) {
      expect(s.intervals[0]).toBe(0);
      expect(s.intervals.length).toBe(s.degrees.length);
      expect(s.intervals.every((i) => i >= 0 && i < 12)).toBe(true);
      // Strictly ascending, so there are no duplicate or out-of-order notes.
      for (let i = 1; i < s.intervals.length; i++) {
        expect(s.intervals[i]).toBeGreaterThan(s.intervals[i - 1]);
      }
      expect(new Set(s.intervals).size).toBe(s.intervals.length);
      expect(s.about.length).toBeGreaterThan(5);
    }
  });

  it('rejects an unknown scale id', () => {
    expect(() => getScale('nope')).toThrow(/Unknown scale/);
  });
});

describe('degree labelling', () => {
  it('labels intervals the way players read them', () => {
    expect(degreeLabel(1, 0)).toBe('1');
    expect(degreeLabel(3, 4)).toBe('3');
    expect(degreeLabel(3, 3)).toBe('♭3');
    expect(degreeLabel(5, 7)).toBe('5');
    expect(degreeLabel(5, 6)).toBe('♭5');
    expect(degreeLabel(4, 6)).toBe('♯4');
    expect(degreeLabel(7, 10)).toBe('♭7');
    expect(degreeLabel(7, 11)).toBe('7');
  });

  it('maps fretboard pitch classes to degrees for the current root', () => {
    const labels = scaleDegreeLabels('E', getScale('minor-pentatonic'));
    expect(labels.get(noteNameToPc('E'))).toBe('1');
    expect(labels.get(noteNameToPc('G'))).toBe('♭3');
    expect(labels.get(noteNameToPc('A'))).toBe('4');
    expect(labels.get(noteNameToPc('B'))).toBe('5');
    expect(labels.get(noteNameToPc('D'))).toBe('♭7');
    expect(labels.get(noteNameToPc('C'))).toBeUndefined();
  });

  it('keeps both the flat 5 and the natural 5 in the blues scale', () => {
    const labels = scaleDegreeLabels('A', getScale('blues'));
    expect(labels.get(noteNameToPc('Eb'))).toBe('♭5');
    expect(labels.get(noteNameToPc('E'))).toBe('5');
  });
});
