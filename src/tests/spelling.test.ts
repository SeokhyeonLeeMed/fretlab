import { describe, expect, it } from 'vitest';
import {
  buildSpellingMap,
  preferredAccidentalForRoot,
  spellCollection,
  spellDegree,
  spellMidi,
} from '../core/theory/spelling';
import { getScale } from '../core/theory/scales';
import { getChord } from '../core/theory/chords';
import { noteNameToMidi } from '../core/theory/pitch';

const scaleNames = (root: string, id: string): string[] => {
  const s = getScale(id);
  return spellCollection(root, s.intervals, s.degrees);
};

describe('systematic spelling', () => {
  it('spells major scales with the correct key signature', () => {
    expect(scaleNames('C', 'major')).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B']);
    expect(scaleNames('G', 'major')).toEqual(['G', 'A', 'B', 'C', 'D', 'E', 'F#']);
    expect(scaleNames('F', 'major')).toEqual(['F', 'G', 'A', 'Bb', 'C', 'D', 'E']);
    expect(scaleNames('Bb', 'major')).toEqual(['Bb', 'C', 'D', 'Eb', 'F', 'G', 'A']);
    expect(scaleNames('Eb', 'major')).toEqual(['Eb', 'F', 'G', 'Ab', 'Bb', 'C', 'D']);
    expect(scaleNames('F#', 'major')).toEqual(['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'E#']);
    expect(scaleNames('Db', 'major')).toEqual(['Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb', 'C']);
  });

  it('uses one letter per degree in minor and modal scales', () => {
    expect(scaleNames('E', 'natural-minor')).toEqual(['E', 'F#', 'G', 'A', 'B', 'C', 'D']);
    expect(scaleNames('A', 'harmonic-minor')).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G#']);
    expect(scaleNames('D', 'dorian')).toEqual(['D', 'E', 'F', 'G', 'A', 'B', 'C']);
    expect(scaleNames('E', 'phrygian')).toEqual(['E', 'F', 'G', 'A', 'B', 'C', 'D']);
    expect(scaleNames('F', 'lydian')).toEqual(['F', 'G', 'A', 'B', 'C', 'D', 'E']);
    expect(scaleNames('G', 'mixolydian')).toEqual(['G', 'A', 'B', 'C', 'D', 'E', 'F']);
    expect(scaleNames('B', 'locrian')).toEqual(['B', 'C', 'D', 'E', 'F', 'G', 'A']);
  });

  it('spells pentatonics on their own degrees, skipping letters', () => {
    expect(scaleNames('E', 'minor-pentatonic')).toEqual(['E', 'G', 'A', 'B', 'D']);
    expect(scaleNames('A', 'minor-pentatonic')).toEqual(['A', 'C', 'D', 'E', 'G']);
    expect(scaleNames('C', 'major-pentatonic')).toEqual(['C', 'D', 'E', 'G', 'A']);
  });

  it('writes the blues scale with a flat 5 and a natural 5 on one letter', () => {
    // A blues: A C D Eb E G — the Eb and E share the letter E, which is how
    // the scale is actually notated.
    expect(scaleNames('A', 'blues')).toEqual(['A', 'C', 'D', 'Eb', 'E', 'G']);
    expect(scaleNames('E', 'blues')).toEqual(['E', 'G', 'A', 'Bb', 'B', 'D']);
  });

  it('spells chords from their chord-tone degrees', () => {
    const chordNames = (root: string, id: string): string[] => {
      const c = getChord(id);
      return spellCollection(root, c.intervals, c.degrees);
    };
    expect(chordNames('C', 'maj')).toEqual(['C', 'E', 'G']);
    expect(chordNames('C', 'min')).toEqual(['C', 'Eb', 'G']);
    expect(chordNames('C', '7')).toEqual(['C', 'E', 'G', 'Bb']);
    expect(chordNames('C', 'maj7')).toEqual(['C', 'E', 'G', 'B']);
    expect(chordNames('C', 'm7b5')).toEqual(['C', 'Eb', 'Gb', 'Bb']);
    expect(chordNames('C', 'dim7')).toEqual(['C', 'Eb', 'Gb', 'Bbb']);
    expect(chordNames('C', 'aug')).toEqual(['C', 'E', 'G#']);
    expect(chordNames('C', 'sus2')).toEqual(['C', 'D', 'G']);
    expect(chordNames('C', 'sus4')).toEqual(['C', 'F', 'G']);
    expect(chordNames('C', '5')).toEqual(['C', 'G']);
  });

  it('picks the written accidental from the key, not from taste', () => {
    expect(preferredAccidentalForRoot('Bb')).toBe('flat');
    expect(preferredAccidentalForRoot('F')).toBe('flat');
    expect(preferredAccidentalForRoot('F#')).toBe('sharp');
    expect(preferredAccidentalForRoot('G')).toBe('sharp');
    expect(preferredAccidentalForRoot('C')).toBe('sharp');
  });

  it('spells one interval at a time', () => {
    expect(spellDegree('C', 3, 4)).toBe('E');
    expect(spellDegree('C', 3, 3)).toBe('Eb');
    expect(spellDegree('A', 7, 11)).toBe('G#');
    expect(spellDegree('B', 5, 6)).toBe('F');
  });
});

describe('spelling maps for the fretboard', () => {
  it('names non-scale notes on the key’s accidental side', () => {
    const s = getScale('major');
    const bbMajor = buildSpellingMap('Bb', s.intervals, s.degrees);
    // Bb major itself
    expect(bbMajor[10]).toBe('Bb');
    expect(bbMajor[3]).toBe('Eb');
    // chromatic notes outside the key still get flat names, never A#
    expect(bbMajor[1]).toBe('Db');
    expect(bbMajor[6]).toBe('Gb');

    const eMinor = buildSpellingMap('E', getScale('natural-minor').intervals, getScale('natural-minor').degrees);
    expect(eMinor[6]).toBe('F#');
    expect(eMinor[1]).toBe('C#');
  });

  it('falls back to sharps with no key context', () => {
    const map = buildSpellingMap(null);
    expect(map[1]).toBe('C#');
    expect(map[10]).toBe('A#');
  });

  it('keeps the octave with the letter, not the pitch class', () => {
    const map = buildSpellingMap('C', [0], [1]);
    const plain = spellMidi(noteNameToMidi('C4'), map);
    expect(plain.full).toBe('C4');

    // Cb4 sounds as B3 but is written in octave 4.
    const cbMap = { ...buildSpellingMap(null), 11: 'Cb' };
    expect(spellMidi(noteNameToMidi('B3'), cbMap).full).toBe('Cb4');
    // B#3 sounds as C4 but is written in octave 3.
    const bsMap = { ...buildSpellingMap(null), 0: 'B#' };
    expect(spellMidi(noteNameToMidi('C4'), bsMap).full).toBe('B#3');
  });
});
