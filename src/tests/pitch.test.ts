import { describe, expect, it } from 'vitest';
import {
  centsBetween,
  freqToMidiFloat,
  freqToNearestNote,
  isValidPitchName,
  midiToFreq,
  midiToNote,
  noteNameToMidi,
  noteNameToPc,
  octaveOf,
  parseNoteName,
  pitchClass,
} from '../core/theory/pitch';

describe('note name <-> MIDI', () => {
  it('maps the reference pitches', () => {
    expect(noteNameToMidi('C4')).toBe(60);
    expect(noteNameToMidi('A4')).toBe(69);
    expect(noteNameToMidi('C-1')).toBe(0);
    expect(noteNameToMidi('G9')).toBe(127);
  });

  it('maps every open string of standard guitar and bass tuning', () => {
    expect(['E2', 'A2', 'D3', 'G3', 'B3', 'E4'].map(noteNameToMidi)).toEqual([40, 45, 50, 55, 59, 64]);
    expect(['E1', 'A1', 'D2', 'G2'].map(noteNameToMidi)).toEqual([28, 33, 38, 43]);
    expect(noteNameToMidi('B0')).toBe(23);
    expect(noteNameToMidi('B1')).toBe(35);
  });

  it('accepts sharps, flats, double sharps and lower case', () => {
    expect(noteNameToMidi('F#3')).toBe(54);
    expect(noteNameToMidi('Gb3')).toBe(54);
    expect(noteNameToMidi('eb2')).toBe(39);
    expect(noteNameToMidi('Fx3')).toBe(55);
    expect(noteNameToMidi('B♭1')).toBe(34);
  });

  it('round-trips MIDI -> name -> MIDI', () => {
    for (let midi = 12; midi <= 108; midi++) {
      expect(noteNameToMidi(midiToNote(midi).full)).toBe(midi);
      expect(noteNameToMidi(midiToNote(midi, 'flat').full)).toBe(midi);
    }
  });

  it('rejects malformed names instead of guessing', () => {
    for (const bad of ['H4', '', 'C#b#b4', 'Cb-99', '4C', 'C##### 4']) {
      expect(isValidPitchName(bad)).toBe(false);
    }
    expect(() => noteNameToMidi('E')).toThrow(/octave/);
    expect(() => parseNoteName('Q')).toThrow(/Invalid note/);
  });

  it('derives pitch class and octave', () => {
    expect(pitchClass(60)).toBe(0);
    expect(pitchClass(40)).toBe(4);
    expect(octaveOf(60)).toBe(4);
    expect(octaveOf(23)).toBe(0);
    expect(noteNameToPc('Bb')).toBe(10);
    expect(noteNameToPc('A#')).toBe(10);
  });
});

describe('frequencies', () => {
  it('matches the standard equal-tempered values', () => {
    expect(midiToFreq(69)).toBeCloseTo(440, 6);
    expect(midiToFreq(60)).toBeCloseTo(261.6256, 3);
    expect(midiToFreq(40)).toBeCloseTo(82.4069, 3); // low E, 6-string guitar
    expect(midiToFreq(28)).toBeCloseTo(41.2034, 3); // low E, 4-string bass
    expect(midiToFreq(23)).toBeCloseTo(30.8677, 3); // low B, 5-string bass
    expect(midiToFreq(35)).toBeCloseTo(61.7354, 3); // low B, 7-string guitar
    expect(midiToFreq(64)).toBeCloseTo(329.6276, 3); // high E
  });

  it('honours a shifted concert pitch', () => {
    expect(midiToFreq(69, 432)).toBeCloseTo(432, 6);
    expect(midiToFreq(81, 432)).toBeCloseTo(864, 6);
  });

  it('octaves double the frequency', () => {
    for (let midi = 24; midi <= 96; midi++) {
      expect(midiToFreq(midi + 12)).toBeCloseTo(midiToFreq(midi) * 2, 6);
    }
  });

  it('inverts cleanly', () => {
    for (let midi = 20; midi <= 100; midi++) {
      expect(freqToMidiFloat(midiToFreq(midi))).toBeCloseTo(midi, 9);
    }
  });
});

describe('cents and nearest note', () => {
  it('measures a semitone as 100 cents and an octave as 1200', () => {
    expect(centsBetween(midiToFreq(61), midiToFreq(60))).toBeCloseTo(100, 6);
    expect(centsBetween(midiToFreq(72), midiToFreq(60))).toBeCloseTo(1200, 6);
    expect(centsBetween(440, 440)).toBe(0);
  });

  it('finds the nearest note with a signed deviation', () => {
    expect(freqToNearestNote(440).midi).toBe(69);
    expect(freqToNearestNote(440).cents).toBeCloseTo(0, 6);

    const flat = freqToNearestNote(438);
    expect(flat.midi).toBe(69);
    expect(flat.cents).toBeLessThan(0);
    expect(flat.cents).toBeCloseTo(-7.885, 2);

    const sharp = freqToNearestNote(444);
    expect(sharp.midi).toBe(69);
    expect(sharp.cents).toBeCloseTo(15.667, 2);
  });

  it('switches to the next note past the halfway point', () => {
    const justUnder = freqToNearestNote(midiToFreq(69) * Math.pow(2, 49 / 1200));
    expect(justUnder.midi).toBe(69);
    const justOver = freqToNearestNote(midiToFreq(69) * Math.pow(2, 51 / 1200));
    expect(justOver.midi).toBe(70);
  });

  it('refuses nonsensical input', () => {
    expect(() => freqToMidiFloat(0)).toThrow();
    expect(() => centsBetween(-1, 440)).toThrow();
  });
});
