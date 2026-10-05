import { describe, expect, it } from 'vitest';
import { decayTimeFor, measureFundamental, renderLengthFor, renderPluck } from '../core/audio/pluck';
import { STRUM_PRESETS } from '../core/audio/AudioEngine';
import { midiToFreq, noteNameToMidi } from '../core/theory/pitch';

const SR = 48000;

const centsOff = (measured: number, target: number): number =>
  Math.abs(1200 * Math.log2(measured / target));

describe('plucked-string synthesis', () => {
  it('renders audio, not silence', () => {
    const buf = renderPluck({ sampleRate: SR, freq: 110, family: 'guitar' });
    expect(buf.length).toBeGreaterThan(SR); // at least a second of sound
    const peak = Math.max(...Array.from(buf.subarray(0, 4800), Math.abs));
    expect(peak).toBeGreaterThan(0.2);
  });

  it('is in tune across the whole guitar range', () => {
    // Open low E up to the 24th fret of the high E string.
    for (const name of ['E2', 'A2', 'D3', 'G3', 'B3', 'E4', 'A4', 'E5', 'A5', 'E6']) {
      const target = midiToFreq(noteNameToMidi(name));
      const buf = renderPluck({ sampleRate: SR, freq: target, family: 'guitar' });
      const measured = measureFundamental(buf, SR, 20, 2000);
      expect(measured).not.toBeNull();
      // Within 5 cents is well under what any ear hears as out of tune, and
      // proves the fractional delay line is doing its job: an integer-only
      // delay would be tens of cents sharp up here.
      expect(centsOff(measured!, target)).toBeLessThan(5);
    }
  });

  it('is in tune across the whole bass range, including a low B0', () => {
    for (const name of ['B0', 'E1', 'A1', 'D2', 'G2', 'C3', 'G3']) {
      const target = midiToFreq(noteNameToMidi(name));
      const buf = renderPluck({ sampleRate: SR, freq: target, family: 'bass' });
      const measured = measureFundamental(buf, SR, 20, 1000);
      expect(measured).not.toBeNull();
      expect(centsOff(measured!, target)).toBeLessThan(5);
    }
  });

  it('stays in tune at other sample rates', () => {
    for (const sr of [44100, 48000, 96000]) {
      const target = midiToFreq(noteNameToMidi('A4'));
      const measured = measureFundamental(
        renderPluck({ sampleRate: sr, freq: target, family: 'guitar' }),
        sr,
        20,
        2000,
      );
      expect(centsOff(measured!, target)).toBeLessThan(5);
    }
  });

  it('plays octaves at double the frequency', () => {
    const low = midiToFreq(noteNameToMidi('E2'));
    const high = midiToFreq(noteNameToMidi('E3'));
    const mLow = measureFundamental(renderPluck({ sampleRate: SR, freq: low, family: 'guitar' }), SR)!;
    const mHigh = measureFundamental(renderPluck({ sampleRate: SR, freq: high, family: 'guitar' }), SR)!;
    expect(mHigh / mLow).toBeCloseTo(2, 1);
  });

  it('decays rather than sustaining forever', () => {
    const buf = renderPluck({ sampleRate: SR, freq: 110, family: 'guitar' });
    const early = rms(buf.subarray(Math.round(SR * 0.05), Math.round(SR * 0.15)));
    const late = rms(buf.subarray(Math.round(SR * 1.5), Math.round(SR * 1.6)));
    expect(late).toBeLessThan(early * 0.5);
    // And it ends silent, so cutting the buffer off cannot click.
    expect(Math.abs(buf[buf.length - 1])).toBeLessThan(1e-4);
  });

  it('is harmonically rich, not a sine wave', () => {
    // A sine's samples relate to a single frequency; a plucked string has
    // energy in its overtones, which shows up as a non-trivial second
    // harmonic. Compare energy at f and 2f by simple correlation.
    const freq = 110;
    const buf = renderPluck({ sampleRate: SR, freq, family: 'guitar' });
    const seg = buf.subarray(Math.round(SR * 0.05), Math.round(SR * 0.35));
    const h1 = goertzel(seg, freq, SR);
    const h2 = goertzel(seg, freq * 2, SR);
    const h3 = goertzel(seg, freq * 3, SR);
    expect(h1).toBeGreaterThan(0);
    expect(h2 / h1).toBeGreaterThan(0.02);
    expect(h3).toBeGreaterThan(0);
  });

  it('bass notes ring longer than treble notes', () => {
    expect(decayTimeFor(41, 'bass')).toBeGreaterThan(decayTimeFor(330, 'guitar'));
    expect(decayTimeFor(82, 'guitar')).toBeGreaterThan(decayTimeFor(660, 'guitar'));
    expect(renderLengthFor(82, 'guitar')).toBeGreaterThan(decayTimeFor(82, 'guitar'));
  });

  it('brightness changes the tone without changing the pitch', () => {
    const target = midiToFreq(noteNameToMidi('A2'));
    const dull = renderPluck({ sampleRate: SR, freq: target, family: 'guitar', brightness: 0.2 });
    const bright = renderPluck({ sampleRate: SR, freq: target, family: 'guitar', brightness: 0.9 });
    expect(centsOff(measureFundamental(dull, SR)!, target)).toBeLessThan(5);
    expect(centsOff(measureFundamental(bright, SR)!, target)).toBeLessThan(5);
    expect(highFreqEnergy(bright, SR)).toBeGreaterThan(highFreqEnergy(dull, SR));
  });

  it('is deterministic for a given note', () => {
    const a = renderPluck({ sampleRate: SR, freq: 220, family: 'guitar', seed: 7 });
    const b = renderPluck({ sampleRate: SR, freq: 220, family: 'guitar', seed: 7 });
    expect(Array.from(a.subarray(0, 500))).toEqual(Array.from(b.subarray(0, 500)));
  });

  it('refuses nonsensical parameters instead of producing NaN', () => {
    expect(() => renderPluck({ sampleRate: 0, freq: 110, family: 'guitar' })).toThrow();
    expect(() => renderPluck({ sampleRate: SR, freq: 0, family: 'guitar' })).toThrow();
    const buf = renderPluck({ sampleRate: SR, freq: 110, family: 'guitar' });
    expect(buf.every((v) => Number.isFinite(v))).toBe(true);
  });
});

describe('strum timing presets', () => {
  it('orders slow, normal and fast correctly', () => {
    expect(STRUM_PRESETS.slow).toBeGreaterThan(STRUM_PRESETS.normal);
    expect(STRUM_PRESETS.normal).toBeGreaterThan(STRUM_PRESETS.fast);
    expect(STRUM_PRESETS.fast).toBeGreaterThan(0);
  });

  it('a six-string strum at the slow preset spans a musically sensible time', () => {
    // Five gaps between six strings: audible as a strum, not as an arpeggio.
    const span = STRUM_PRESETS.slow * 5;
    expect(span).toBeGreaterThan(200);
    expect(span).toBeLessThan(600);
  });
});

function rms(buf: Float32Array): number {
  let s = 0;
  for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i];
  return Math.sqrt(s / Math.max(1, buf.length));
}

/** Energy at one frequency, via the Goertzel algorithm. */
function goertzel(buf: Float32Array, freq: number, sampleRate: number): number {
  const w = (2 * Math.PI * freq) / sampleRate;
  const coeff = 2 * Math.cos(w);
  let s1 = 0;
  let s2 = 0;
  for (let i = 0; i < buf.length; i++) {
    const s0 = buf[i] + coeff * s1 - s2;
    s2 = s1;
    s1 = s0;
  }
  return Math.sqrt(Math.max(0, s1 * s1 + s2 * s2 - coeff * s1 * s2)) / buf.length;
}

/** Crude high-frequency energy measure: mean absolute first difference. */
function highFreqEnergy(buf: Float32Array, sampleRate: number): number {
  const start = Math.round(sampleRate * 0.01);
  const end = Math.min(buf.length, Math.round(sampleRate * 0.2));
  let s = 0;
  for (let i = start + 1; i < end; i++) s += Math.abs(buf[i] - buf[i - 1]);
  return s / Math.max(1, end - start);
}
