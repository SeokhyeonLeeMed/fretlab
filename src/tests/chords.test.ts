import { describe, expect, it } from 'vitest';
import {
  CHORDS,
  chordDegreeLabels,
  chordDisplayName,
  chordPitchClasses,
  getChord,
  suggestScalesForChord,
} from '../core/theory/chords';
import { findPowerChords, findVoicings, voicingMatchesChord } from '../core/theory/voicing';
import { getInstrument, getTuning } from '../core/instruments/definitions';
import { tuningMidis } from '../core/theory/fretboard';
import { midiToNote, mod, noteNameToMidi, noteNameToPc } from '../core/theory/pitch';
import { SCALE_BY_ID, scalePitchClasses } from '../core/theory/scales';

const pcs = (root: string, id: string): number[] =>
  [...chordPitchClasses(root, getChord(id))].sort((a, b) => a - b);

const open = (instrumentId: string, tuningId: string): number[] =>
  tuningMidis(getTuning(getInstrument(instrumentId), tuningId));

/** Sounding pitch classes of a voicing. */
const soundingPcs = (frets: (number | null)[], openMidis: number[]): Set<number> =>
  new Set(
    frets
      .map((f, s) => (f === null ? null : mod(openMidis[s] + f, 12)))
      .filter((x): x is number => x !== null),
  );

describe('chord pitch-class sets', () => {
  it('builds the triads', () => {
    expect(pcs('C', 'maj')).toEqual([0, 4, 7]);
    expect(pcs('C', 'min')).toEqual([0, 3, 7]);
    expect(pcs('C', 'dim')).toEqual([0, 3, 6]);
    expect(pcs('C', 'aug')).toEqual([0, 4, 8]);
  });

  it('builds the sevenths', () => {
    expect(pcs('C', '7')).toEqual([0, 4, 7, 10]);
    expect(pcs('C', 'maj7')).toEqual([0, 4, 7, 11]);
    expect(pcs('C', 'm7')).toEqual([0, 3, 7, 10]);
    expect(pcs('C', 'm7b5')).toEqual([0, 3, 6, 10]);
    expect(pcs('C', 'dim7')).toEqual([0, 3, 6, 9]);
  });

  it('builds the suspended chords and power chords', () => {
    expect(pcs('C', 'sus2')).toEqual([0, 2, 7]);
    expect(pcs('C', 'sus4')).toEqual([0, 5, 7]);
    expect(pcs('C', '5')).toEqual([0, 7]);
    expect(pcs('E', '5')).toEqual([noteNameToPc('B'), noteNameToPc('E')].sort((a, b) => a - b));
  });

  it('transposes correctly', () => {
    expect(pcs('E', 'min')).toEqual([noteNameToPc('E'), noteNameToPc('G'), noteNameToPc('B')].sort((a, b) => a - b));
    expect(pcs('Bb', '7')).toEqual([10, 2, 5, 8].sort((a, b) => a - b));
    expect(pcs('F#', 'maj7')).toEqual([6, 10, 1, 5].sort((a, b) => a - b));
  });

  it('a diminished 7th is its own inversion every minor 3rd', () => {
    expect(pcs('C', 'dim7')).toEqual(pcs('Eb', 'dim7'));
    expect(pcs('C', 'dim7')).toEqual(pcs('A', 'dim7'));
  });

  it('labels chord tones', () => {
    const labels = chordDegreeLabels('C', getChord('m7'));
    expect(labels.get(0)).toBe('1');
    expect(labels.get(3)).toBe('♭3');
    expect(labels.get(7)).toBe('5');
    expect(labels.get(10)).toBe('♭7');
    expect(chordDegreeLabels('C', getChord('9')).get(2)).toBe('9');
  });

  it('names chords for display', () => {
    expect(chordDisplayName('C', getChord('maj'))).toBe('C');
    expect(chordDisplayName('C', getChord('min'))).toBe('Cm');
    expect(chordDisplayName('C', getChord('7'))).toBe('C7');
    expect(chordDisplayName('C', getChord('maj7'))).toBe('Cmaj7');
    expect(chordDisplayName('C', getChord('m7'))).toBe('Cm7');
    expect(chordDisplayName('C', getChord('sus4'))).toBe('Csus4');
    expect(chordDisplayName('C', getChord('aug'))).toBe('Caug');
    expect(chordDisplayName('C', getChord('dim'))).toBe('Cdim');
    expect(chordDisplayName('C', getChord('5'))).toBe('C5');
  });

  it('every catalogued chord is well formed', () => {
    for (const c of CHORDS) {
      expect(c.intervals[0]).toBe(0);
      expect(c.intervals.length).toBe(c.degrees.length);
      expect(c.relatedScales.length).toBeGreaterThan(0);
      expect(c.optional.every((o) => c.intervals.includes(o))).toBe(true);
    }
  });

  it('rejects an unknown chord id', () => {
    expect(() => getChord('nope')).toThrow(/Unknown chord/);
  });
});

describe('chord -> scale suggestions', () => {
  const covers = (root: string, scaleId: string, want: Set<number>): boolean => {
    const scale = SCALE_BY_ID[scaleId];
    if (!scale) return false;
    const have = scalePitchClasses(root, scale);
    for (const pc of want) if (!have.has(pc)) return false;
    return true;
  };

  it('only suggests scales that contain every chord tone', () => {
    for (const chord of CHORDS) {
      for (const root of ['C', 'E', 'Bb', 'F#']) {
        const want = chordPitchClasses(root, chord);
        const out = suggestScalesForChord(root, chord, (id, p) => covers(root, id, p));
        for (const s of out) expect(covers(root, s.scaleId, want)).toBe(true);
        expect(out.length).toBeGreaterThan(0);
      }
    }
  });

  it('suggests the expected scales for the obvious cases', () => {
    const minor = suggestScalesForChord('E', getChord('min'), (id, p) => covers('E', id, p)).map(
      (s) => s.scaleId,
    );
    expect(minor).toContain('natural-minor');
    expect(minor).toContain('minor-pentatonic');

    const dom = suggestScalesForChord('A', getChord('7'), (id, p) => covers('A', id, p)).map(
      (s) => s.scaleId,
    );
    expect(dom).toContain('mixolydian');
    // A major scale does not contain the chord's flat 7th, so it must not be
    // offered for a dominant 7th.
    expect(dom).not.toContain('major');

    const halfDim = suggestScalesForChord('B', getChord('m7b5'), (id, p) => covers('B', id, p)).map(
      (s) => s.scaleId,
    );
    expect(halfDim).toContain('locrian');
  });

  it('explains each suggestion in words', () => {
    const out = suggestScalesForChord('C', getChord('maj7'), (id, p) => covers('C', id, p));
    expect(out.every((s) => s.reason.length > 4)).toBe(true);
  });
});

describe('voicing search in standard tuning', () => {
  const std = open('guitar6', 'standard');

  it('finds the open C major chord', () => {
    const vs = findVoicings(std, 'C', getChord('maj'));
    expect(vs.length).toBeGreaterThan(0);
    // x32010 is the standard open C; it must be among the results.
    const ids = vs.map((v) => v.id);
    expect(ids).toContain('x-3-2-0-1-0');
  });

  it('finds the open E minor and A minor chords', () => {
    expect(findVoicings(std, 'E', getChord('min')).map((v) => v.id)).toContain('0-2-2-0-0-0');
    expect(findVoicings(std, 'A', getChord('min')).map((v) => v.id)).toContain('x-0-2-2-1-0');
  });

  it('finds the open G major and D major chords', () => {
    expect(findVoicings(std, 'D', getChord('maj')).map((v) => v.id)).toContain('x-x-0-2-3-2');
    const g = findVoicings(std, 'G', getChord('maj')).map((v) => v.id);
    expect(g.some((id) => id === '3-2-0-0-0-3' || id === '3-2-0-0-3-3')).toBe(true);
  });

  it('finds common seventh chords', () => {
    expect(findVoicings(std, 'E', getChord('7')).map((v) => v.id)).toContain('0-2-0-1-0-0');
    expect(findVoicings(std, 'A', getChord('7')).map((v) => v.id)).toContain('x-0-2-0-2-0');
    expect(findVoicings(std, 'C', getChord('maj7')).map((v) => v.id)).toContain('x-3-2-0-0-0');
    expect(findVoicings(std, 'A', getChord('m7')).map((v) => v.id)).toContain('x-0-2-0-1-0');
  });

  it('every returned shape really sounds the chord it was asked for', () => {
    for (const chordId of ['maj', 'min', '7', 'maj7', 'm7', 'm7b5', 'dim', 'aug', 'sus2', 'sus4', '5']) {
      const chord = getChord(chordId);
      for (const root of ['C', 'E', 'A', 'G', 'Bb', 'F#']) {
        const vs = findVoicings(std, root, chord, { maxResults: 6 });
        for (const v of vs) {
          const sounding = soundingPcs(v.frets, std);
          const want = chordPitchClasses(root, chord);
          // No note outside the chord, and the root must be present.
          for (const pc of sounding) expect(want.has(pc)).toBe(true);
          expect(sounding.has(noteNameToPc(root))).toBe(true);
          expect(voicingMatchesChord(v, root, chord)).toBe(true);
          // And the shape must be physically playable.
          expect(v.fingers).toBeLessThanOrEqual(4);
          expect(v.span).toBeLessThanOrEqual(4);
        }
      }
    }
  });

  it('prefers shapes with the root in the bass', () => {
    const vs = findVoicings(std, 'C', getChord('maj'));
    expect(vs[0].inversion).toBe(0);
    expect(mod(vs[0].midis.filter((m): m is number => m !== null)[0], 12)).toBe(noteNameToPc('C'));
  });

  it('reports which chord tones a shape omits', () => {
    const vs = findVoicings(std, 'C', getChord('9'));
    // A 5-note chord on 6 strings usually drops the 5th; whatever it drops
    // must be reported rather than silently missing.
    for (const v of vs) {
      const sounding = soundingPcs(v.frets, std);
      const want = chordPitchClasses('C', getChord('9'));
      const missingCount = [...want].filter((pc) => !sounding.has(pc)).length;
      expect(v.missing).toHaveLength(missingCount);
    }
  });
});

describe('voicing search is tuning-aware', () => {
  it('produces different shapes for the same chord in a different tuning', () => {
    const std = open('guitar6', 'standard');
    const dStd = open('guitar6', 'd-standard');

    const stdE = findVoicings(std, 'E', getChord('min')).map((v) => v.id);
    const dE = findVoicings(dStd, 'E', getChord('min')).map((v) => v.id);
    // The open Em shape cannot be an Em in D standard, and must not be offered.
    expect(stdE).toContain('0-2-2-0-0-0');
    expect(dE).not.toContain('0-2-2-0-0-0');
  });

  it('the familiar shape, played in D standard, is correctly named as a different chord', () => {
    const dStd = open('guitar6', 'd-standard');
    // 022000 in D standard sounds D, A, E, A, C#, F# - that is a D-rooted sound,
    // not E minor. The search must find that shape under D, not under E.
    const asDm = findVoicings(dStd, 'D', getChord('min')).map((v) => v.id);
    expect(asDm).toContain('0-2-2-0-0-0');
    const sounding = soundingPcs([0, 2, 2, 0, 0, 0], dStd);
    expect([...sounding].sort((a, b) => a - b)).toEqual(
      [...chordPitchClasses('D', getChord('min'))].sort((a, b) => a - b),
    );
  });

  it('finds chords in Drop D, Drop C, open G and DADGAD', () => {
    for (const tuningId of ['drop-d', 'drop-c', 'open-g', 'dadgad']) {
      const o = open('guitar6', tuningId);
      for (const [root, chordId] of [
        ['D', 'maj'],
        ['G', 'maj'],
        ['A', 'min'],
        ['E', 'm7'],
      ] as const) {
        const vs = findVoicings(o, root, getChord(chordId), { maxResults: 4 });
        expect(vs.length).toBeGreaterThan(0);
        for (const v of vs) {
          const sounding = soundingPcs(v.frets, o);
          const want = chordPitchClasses(root, getChord(chordId));
          for (const pc of sounding) expect(want.has(pc)).toBe(true);
        }
      }
    }
  });

  it('finds chords on the bass as well as the guitar', () => {
    for (const [instrument, root, chordId] of [
      ['bass4', 'E', '5'],
      ['bass4', 'G', 'maj'],
      ['bass4', 'A', 'min'],
      ['guitar6', 'B', 'min'],
    ] as const) {
      const o = open(instrument, 'standard');
      const vs = findVoicings(o, root, getChord(chordId), { maxResults: 4 });
      expect(vs.length).toBeGreaterThan(0);
      expect(vs[0].frets).toHaveLength(o.length);
      for (const pc of soundingPcs(vs[0].frets, o)) {
        expect(chordPitchClasses(root, getChord(chordId)).has(pc)).toBe(true);
      }
    }
  });
});

describe('power chords', () => {
  it('standard tuning puts the 5th two frets up on the next string', () => {
    const std = open('guitar6', 'standard');
    const g5 = findPowerChords(std, 'G');
    const atThird = g5.find((v) => v.frets[0] === 3);
    expect(atThird).toBeDefined();
    expect(atThird!.frets[1]).toBe(5);
  });

  it('Drop D gives the one-finger, flat power-chord shape', () => {
    const drop = open('guitar6', 'drop-d');
    const d5 = findPowerChords(drop, 'D', { withOctave: true });
    const flat = d5.find((v) => v.frets[0] === 0);
    expect(flat).toBeDefined();
    // D A D across the three lowest strings, all at the same fret.
    expect(flat!.frets[1]).toBe(0);
    expect(flat!.frets[2]).toBe(0);
    expect(flat!.fingers).toBe(0);

    const f5 = findPowerChords(drop, 'F', { withOctave: true }).find((v) => v.frets[0] === 3);
    expect(f5).toBeDefined();
    expect(f5!.frets.slice(0, 3)).toEqual([3, 3, 3]);
    expect(f5!.fingers).toBe(1); // one finger barring three strings
  });

  it('standard tuning needs two fingers for the same chord', () => {
    const std = open('guitar6', 'standard');
    const f5 = findPowerChords(std, 'F', { withOctave: true }).find((v) => v.frets[0] === 1);
    expect(f5).toBeDefined();
    expect(f5!.frets.slice(0, 3)).toEqual([1, 3, 3]);
    expect(f5!.fingers).toBe(2);
  });

  it('handles the guitar’s 4-semitone gap at the B string', () => {
    const std = open('guitar6', 'standard');
    // A power chord rooted on the G string uses the B string for its 5th,
    // where the usual two-fret offset becomes three.
    const rooted = findPowerChords(std, 'C').find((v) => v.frets[3] === 5);
    expect(rooted).toBeDefined();
    expect(rooted!.frets[4]).toBe(8);
  });

  it('always sounds exactly a root and a 5th (and an octave when asked)', () => {
    for (const [instrument, tuningId] of [
      ['guitar6', 'standard'],
      ['guitar6', 'drop-d'],
      ['guitar6', 'drop-b'],
      ['guitar6', 'dadgad'],
      ['bass4', 'standard'],
      ['bass4', 'bead'],
    ] as const) {
      const o = open(instrument, tuningId);
      for (const root of ['E', 'G', 'A', 'C', 'F#']) {
        for (const withOctave of [false, true]) {
          const vs = findPowerChords(o, root, { withOctave });
          expect(vs.length).toBeGreaterThan(0);
          for (const v of vs) {
            const sounding = [...soundingPcs(v.frets, o)].sort((a, b) => a - b);
            const want = [noteNameToPc(root), mod(noteNameToPc(root) + 7, 12)].sort((a, b) => a - b);
            expect(sounding).toEqual(want);
            const midis = v.midis.filter((m): m is number => m !== null);
            expect(mod(midis[0], 12)).toBe(noteNameToPc(root));
            if (withOctave) {
              expect(midis).toHaveLength(3);
              expect(midis[2] - midis[0]).toBe(12);
            } else {
              expect(midis).toHaveLength(2);
              expect(midis[1] - midis[0]).toBe(7);
            }
          }
        }
      }
    }
  });

  it('positions power chords all along the neck', () => {
    const std = open('guitar6', 'standard');
    const a5 = findPowerChords(std, 'A', { fretCount: 15 });
    const roots = a5.map((v) => v.frets.findIndex((f) => f !== null));
    expect(new Set(roots).size).toBeGreaterThan(2); // several strings
    expect(a5.length).toBeGreaterThan(4);
    expect(midiToNote(a5[0].midis.filter((m): m is number => m !== null)[0]).name).toBe('A');
  });

  it('does not invent a power chord that runs off the end of the neck', () => {
    const std = open('guitar6', 'standard');
    const vs = findPowerChords(std, 'E', { fretCount: 3, withOctave: true });
    for (const v of vs) {
      for (const f of v.frets) if (f !== null) expect(f).toBeLessThanOrEqual(3);
    }
  });
});

describe('note playback input', () => {
  it('a voicing hands the audio engine real MIDI numbers, muted strings as null', () => {
    const std = open('guitar6', 'standard');
    const c = findVoicings(std, 'C', getChord('maj')).find((v) => v.id === 'x-3-2-0-1-0')!;
    expect(c.midis[0]).toBe(null);
    expect(c.midis[1]).toBe(noteNameToMidi('C3'));
    expect(c.midis[2]).toBe(noteNameToMidi('E3'));
    expect(c.midis[3]).toBe(noteNameToMidi('G3'));
    expect(c.midis[4]).toBe(noteNameToMidi('C4'));
    expect(c.midis[5]).toBe(noteNameToMidi('E4'));
  });
});
