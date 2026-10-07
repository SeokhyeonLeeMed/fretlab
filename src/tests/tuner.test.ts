import { describe, expect, it } from 'vitest';
import {
  NoiseGate,
  PitchSmoother,
  decimate,
  detectPitch,
  parabolicShift,
  removeRumble,
  rmsOf,
} from '../core/tuner/pitchDetect';
import { meterLevel } from '../core/tuner/TunerEngine';
import {
  IN_TUNE_CENTS,
  chromaticReading,
  nearestStringReading,
  needlePosition,
  readingForString,
  verdictFor,
} from '../core/tuner/analysis';
import { buildSpellingMap } from '../core/theory/spelling';
import { midiToFreq, noteNameToMidi } from '../core/theory/pitch';
import { renderPluck } from '../core/audio/pluck';
import { INSTRUMENTS, getInstrument, getTuning } from '../core/instruments/definitions';
import { tuningMidis } from '../core/theory/fretboard';

const SR = 48000;
const MAP = buildSpellingMap(null);

/** A synthetic instrument-like tone: fundamental plus decaying overtones. */
function tone(freq: number, seconds = 0.2, sampleRate = SR, harmonics = 6): Float32Array {
  const n = Math.round(seconds * sampleRate);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let v = 0;
    for (let h = 1; h <= harmonics; h++) {
      v += (1 / h) * Math.sin((2 * Math.PI * freq * h * i) / sampleRate + h);
    }
    out[i] = v * 0.2;
  }
  return out;
}

const centsOff = (measured: number, target: number): number =>
  1200 * Math.log2(measured / target);

const openOf = (id: string, tuningId = 'standard'): number[] =>
  tuningMidis(getTuning(getInstrument(id), tuningId));

describe('frequency -> note detection', () => {
  it('detects a plain A440', () => {
    const r = detectPitch(tone(440, 0.2), SR);
    expect(r).not.toBeNull();
    expect(Math.abs(centsOff(r!.freq, 440))).toBeLessThan(3);
    expect(r!.clarity).toBeGreaterThan(0.5);
  });

  it('detects every open string of every standard tuning', () => {
    const cases: [string, string][] = [
      ['guitar6', 'standard'],
      ['bass4', 'standard'],
    ];
    for (const [id, tuningId] of cases) {
      for (const midi of openOf(id, tuningId)) {
        const freq = midiToFreq(midi);
        const r = detectPitch(tone(freq, 0.25), SR, { minFreq: 25, maxFreq: 1400 });
        expect(r, `${id} ${midi}`).not.toBeNull();
        // Within 5 cents is more than good enough to tune by.
        expect(Math.abs(centsOff(r!.freq, freq)), `${id} ${midi}`).toBeLessThan(5);
      }
    }
  });

  it('detects the lowest notes in use: B0 on a 5-string bass, B1 on a 7-string', () => {
    for (const name of ['B0', 'C1', 'E1', 'B1']) {
      const freq = midiToFreq(noteNameToMidi(name));
      const r = detectPitch(tone(freq, 0.3), SR, { minFreq: 25, maxFreq: 400 });
      expect(r, name).not.toBeNull();
      expect(Math.abs(centsOff(r!.freq, freq)), name).toBeLessThan(5);
    }
  });

  it('does not report an octave too low, which is the classic bass tuner bug', () => {
    for (const name of ['E1', 'A1', 'E2', 'A2']) {
      const freq = midiToFreq(noteNameToMidi(name));
      const r = detectPitch(tone(freq, 0.3, SR, 10), SR, { minFreq: 25, maxFreq: 1400 })!;
      expect(Math.abs(centsOff(r.freq, freq)), name).toBeLessThan(10);
    }
  });

  it('detects the pitch of the actual synthesised instrument sound', () => {
    for (const name of ['E2', 'A2', 'D3', 'G3', 'B3', 'E4']) {
      const freq = midiToFreq(noteNameToMidi(name));
      const pluck = renderPluck({ sampleRate: SR, freq, family: 'guitar' });
      // Analyse a window shortly after the attack, like a live tuner would.
      const frame = pluck.subarray(Math.round(SR * 0.08), Math.round(SR * 0.08) + 8192);
      const r = detectPitch(frame, SR);
      expect(r, name).not.toBeNull();
      expect(Math.abs(centsOff(r!.freq, freq)), name).toBeLessThan(10);
    }
  });

  it('tracks a detuned string accurately', () => {
    for (const cents of [-40, -20, -7, 0, 7, 20, 40]) {
      const target = midiToFreq(noteNameToMidi('E2'));
      const actual = target * Math.pow(2, cents / 1200);
      const r = detectPitch(tone(actual, 0.3), SR)!;
      expect(Math.abs(centsOff(r.freq, actual))).toBeLessThan(5);
      // And the reading against the target reproduces the detuning.
      const reading = readingForString(r.freq, [noteNameToMidi('E2')], 0, MAP)!;
      expect(reading.cents).toBeCloseTo(cents, 0);
    }
  });

  it('detects every open string of every tuning preset, as a real pluck', () => {
    // The broadest guard in the suite: each open string of every preset of
    // every instrument, synthesised by the same model the app plays through,
    // and analysed over the range that instrument asks the tuner for. Octave
    // errors are what this catches -- they are the characteristic failure of
    // pitch detection, and they do not show up on a handful of sine waves.
    let worst = 0;
    let checked = 0;
    for (const inst of INSTRUMENTS) {
      for (const tuning of inst.tunings) {
        const open = tuningMidis(tuning);
        const maxFreq = Math.min(2000, midiToFreq(Math.max(...open) + inst.fretCount) * 1.2);
        for (const midi of open) {
          const freq = midiToFreq(midi);
          const pluck = renderPluck({ sampleRate: SR, freq, family: inst.family });
          const start = Math.round(SR * 0.09);
          const r = detectPitch(pluck.subarray(start, start + 8192), SR, { minFreq: 25, maxFreq });
          const where = `${inst.shortName} ${tuning.id} ${midi}`;
          expect(r, where).not.toBeNull();
          const off = Math.abs(centsOff(r!.freq, freq));
          expect(off, where).toBeLessThan(15);
          worst = Math.max(worst, off);
          checked++;
        }
      }
    }
    expect(checked).toBeGreaterThan(100);
    expect(worst).toBeLessThan(15);
  });

  it('stays silent on silence and on noise', () => {
    expect(detectPitch(new Float32Array(8192), SR)).toBeNull();
    const quiet = tone(440, 0.2);
    for (let i = 0; i < quiet.length; i++) quiet[i] *= 0.0005;
    expect(detectPitch(quiet, SR)).toBeNull();

    const noise = new Float32Array(8192);
    let seed = 1;
    for (let i = 0; i < noise.length; i++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      noise[i] = (seed / 0x7fffffff) * 2 - 1;
    }
    const r = detectPitch(noise, SR);
    // White noise is not periodic; either rejected outright or reported with
    // low confidence, never as a confident note.
    if (r) expect(r.clarity).toBeLessThan(0.95);
  });

  it('ignores frequencies outside the instrument range', () => {
    expect(detectPitch(tone(8, 0.3), SR, { minFreq: 25 })).toBeNull();
    expect(detectPitch(tone(4000, 0.1), SR, { maxFreq: 1400 })).toBeNull();
  });

  it('works at 44.1 kHz as well as 48 kHz', () => {
    for (const sr of [44100, 48000]) {
      const r = detectPitch(tone(196, 0.3, sr), sr)!;
      expect(Math.abs(centsOff(r.freq, 196))).toBeLessThan(5);
    }
  });
});

describe('detection internals', () => {
  it('measures level', () => {
    expect(rmsOf(new Float32Array([1, -1, 1, -1]))).toBeCloseTo(1, 9);
    expect(rmsOf(new Float32Array(16))).toBe(0);
  });

  it('decimates without destroying the pitch', () => {
    const d = decimate(tone(220, 0.2), 4);
    expect(d.length).toBeCloseTo((0.2 * SR) / 4, -1);
    expect(decimate(d, 1)).toBe(d);
  });

  it('interpolates a parabola vertex', () => {
    expect(parabolicShift(0, 1, 0)).toBeCloseTo(0, 9);
    // The shift is added to the peak index, so a taller left neighbour pulls
    // the true vertex to the left and the shift is negative.
    expect(parabolicShift(0.5, 1, 0)).toBeLessThan(0);
    expect(parabolicShift(0, 1, 0.5)).toBeGreaterThan(0);
    expect(parabolicShift(1, 1, 1)).toBe(0); // flat: no shift
  });

  it('medians out a jittery reading', () => {
    const s = new PitchSmoother(5);
    [110, 110.2, 109.8, 300, 110.1].forEach((f) => s.push(f));
    // The 300 Hz outlier must not move the result.
    expect(s.push(110)).toBeCloseTo(110.05, 1);
    s.reset();
    expect(s.filled).toBe(false);
  });
});

describe('cents deviation and verdicts', () => {
  it('calls a note in tune only within tolerance', () => {
    expect(verdictFor(0)).toBe('in-tune');
    expect(verdictFor(IN_TUNE_CENTS)).toBe('in-tune');
    expect(verdictFor(-IN_TUNE_CENTS)).toBe('in-tune');
    expect(verdictFor(IN_TUNE_CENTS + 0.1)).toBe('sharp');
    expect(verdictFor(-IN_TUNE_CENTS - 0.1)).toBe('flat');
    expect(verdictFor(30, 40)).toBe('in-tune');
  });

  it('reports flat below and sharp above the target', () => {
    const target = midiToFreq(noteNameToMidi('E2'));
    expect(chromaticReading(target * 0.98, MAP).verdict).toBe('flat');
    expect(chromaticReading(target * 1.02, MAP).verdict).toBe('sharp');
    expect(chromaticReading(target, MAP).verdict).toBe('in-tune');
  });

  it('names the detected note and its octave', () => {
    const r = chromaticReading(midiToFreq(noteNameToMidi('A2')), MAP);
    expect(r.noteName).toBe('A');
    expect(r.fullName).toBe('A2');
    expect(r.midi).toBe(noteNameToMidi('A2'));
    expect(r.cents).toBeCloseTo(0, 6);
    expect(r.targetFreq).toBeCloseTo(110, 4);

    const sharpish = chromaticReading(midiToFreq(noteNameToMidi('G3')) * Math.pow(2, 20 / 1200), MAP);
    expect(sharpish.fullName).toBe('G3');
    expect(sharpish.cents).toBeCloseTo(20, 4);
  });

  it('positions the needle, clamped at the halfway point', () => {
    expect(needlePosition(0)).toBe(0);
    expect(needlePosition(25)).toBeCloseTo(0.5, 6);
    expect(needlePosition(-50)).toBe(-1);
    expect(needlePosition(999)).toBe(1);
  });
});

describe('target-tuning comparison', () => {
  it('picks the nearest string of the current tuning', () => {
    const std = openOf('guitar6');
    const r = nearestStringReading(midiToFreq(noteNameToMidi('D3')) * 1.005, std, MAP)!;
    expect(r.stringIndex).toBe(2);
    expect(r.targetName).toBe('D3');
    expect(r.verdict).toBe('sharp');
  });

  it('is not restricted to standard tuning', () => {
    // In Drop D the lowest string must be compared against D2, not E2.
    const drop = openOf('guitar6', 'drop-d');
    const r = nearestStringReading(midiToFreq(noteNameToMidi('D2')), drop, MAP)!;
    expect(r.stringIndex).toBe(0);
    expect(r.targetName).toBe('D2');
    expect(r.cents).toBeCloseTo(0, 6);

    // Playing an open low E against a Drop D target reads as two semitones sharp.
    const eOnDrop = readingForString(midiToFreq(noteNameToMidi('E2')), drop, 0, MAP)!;
    expect(eOnDrop.cents).toBeCloseTo(200, 4);
    expect(eOnDrop.semitonesOff).toBe(2);
    expect(eOnDrop.verdict).toBe('sharp');
  });

  it('works for half-step down, D standard, Drop C and a custom tuning', () => {
    const cases: [string, string, string][] = [
      ['guitar6', 'half-down', 'Eb2'],
      ['guitar6', 'd-standard', 'D2'],
      ['guitar6', 'drop-c', 'C2'],
      ['bass4', 'standard', 'E1'],
      ['bass4', 'bead', 'B0'],
    ];
    for (const [id, tuningId, lowest] of cases) {
      const tuning = getTuning(getInstrument(id), tuningId);
      const open = openOf(id, tuningId);
      const r = readingForString(midiToFreq(noteNameToMidi(lowest)), open, 0, MAP, {
        names: tuning.notes,
      })!;
      expect(r.targetName, `${id}/${tuningId}`).toBe(lowest);
      expect(r.cents).toBeCloseTo(0, 6);
    }

    const custom = ['C2', 'G2', 'C3', 'G3', 'C4', 'E4'].map(noteNameToMidi);
    const r = nearestStringReading(midiToFreq(noteNameToMidi('G3')), custom, MAP)!;
    expect(r.stringIndex).toBe(3);
    expect(r.targetName).toBe('G3');
  });

  it('distinguishes two strings tuned to the same letter in different octaves', () => {
    const dadgad = openOf('guitar6', 'dadgad'); // D2 A2 D3 G3 A3 D4
    const low = nearestStringReading(midiToFreq(noteNameToMidi('D2')), dadgad, MAP)!;
    const high = nearestStringReading(midiToFreq(noteNameToMidi('D4')), dadgad, MAP)!;
    expect(low.stringIndex).toBe(0);
    expect(high.stringIndex).toBe(5);
  });

  it('handles an empty tuning without crashing', () => {
    expect(nearestStringReading(440, [], MAP)).toBeNull();
    expect(readingForString(440, openOf('guitar6'), 99, MAP)).toBeNull();
  });

  it('end to end: a synthesised, slightly flat low E reads as flat on string 1', () => {
    const target = midiToFreq(noteNameToMidi('E2'));
    const actual = target * Math.pow(2, -12 / 1200);
    const detected = detectPitch(tone(actual, 0.3), SR)!;
    const reading = nearestStringReading(detected.freq, openOf('guitar6'), MAP)!;
    expect(reading.stringIndex).toBe(0);
    expect(reading.targetName).toBe('E2');
    expect(reading.verdict).toBe('flat');
    expect(reading.cents).toBeCloseTo(-12, 0);
    expect(needlePosition(reading.cents)).toBeLessThan(0);
  });
});

/**
 * Hearing a string played softly.
 *
 * The tuner used to go deaf well before the detector did: a fixed gate at
 * 0.006 RMS threw away signals the NSDF still read perfectly. These fix the
 * sensitivity in place, and — just as important — fix the noise rejection in
 * place too, because the two move in opposite directions and a change that
 * improves one by breaking the other is not an improvement.
 */
describe('quiet signals', () => {
  /** A pluck at a chosen level over a mic noise floor, as a frame would arrive. */
  const micFrame = (
    note: string,
    family: 'guitar' | 'bass',
    gain: number,
    floor = 0.0002,
    dc = 0,
  ): { frame: Float32Array; freq: number } => {
    const freq = midiToFreq(noteNameToMidi(note));
    const pluck = renderPluck({ sampleRate: SR, freq, family });
    const start = Math.round(SR * 0.09);
    const out = new Float32Array(8192);
    let seed = 7;
    for (let i = 0; i < out.length; i++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      out[i] = pluck[start + i] * gain + ((seed / 0x7fffffff) * 2 - 1) * floor + dc;
    }
    return { frame: out, freq };
  };

  it('detects a string played softly, 50x quieter than it once needed', () => {
    // 0.002 of a full-strength pluck: about -70 dBFS, which is a string
    // touched gently with a laptop microphone a arm's length away. The old
    // gate stopped at 0.1 — a deliberate pluck right at the microphone.
    for (const [note, family] of [
      ['E2', 'guitar'],
      ['E4', 'guitar'],
      ['E1', 'bass'],
      ['G2', 'bass'],
    ] as const) {
      const { frame, freq } = micFrame(note, family, 0.002);
      const r = detectPitch(frame, SR, { minFreq: 25, maxFreq: 1400 });
      expect(r, `${note} ${family}`).not.toBeNull();
      // Quiet does not mean approximate: still within a few cents.
      expect(Math.abs(centsOff(r!.freq, freq)), `${note} ${family}`).toBeLessThan(5);
    }
  });

  it('is not fooled by a microphone with a DC offset', () => {
    // A constant offset is not sound, but it is level: it used to pass the
    // gate and then dominate the correlation, which produced a confident
    // reading over three octaves out.
    const { frame, freq } = micFrame('E2', 'guitar', 0.02, 0.0002, 0.01);
    const r = detectPitch(frame, SR, { minFreq: 25, maxFreq: 1400 });
    expect(r).not.toBeNull();
    expect(Math.abs(centsOff(r!.freq, freq))).toBeLessThan(5);
  });

  it('still says nothing about a quiet room', () => {
    // Pink-ish noise: white noise through three poles, which is much closer
    // to a room than white noise is, and much more likely to show a spurious
    // period. Tested up to -35 dBFS, far above anything the gate stops.
    for (const amp of [0.002, 0.01, 0.05]) {
      for (const seed0 of [3, 11, 29]) {
        const w = new Float32Array(8192);
        let seed = seed0;
        for (let i = 0; i < w.length; i++) {
          seed = (seed * 1103515245 + 12345) & 0x7fffffff;
          w[i] = (seed / 0x7fffffff) * 2 - 1;
        }
        let y1 = 0;
        let y2 = 0;
        let y3 = 0;
        for (let i = 0; i < w.length; i++) {
          y1 += 0.02 * (w[i] - y1);
          y2 += 0.02 * (y1 - y2);
          y3 += 0.02 * (y2 - y3);
          w[i] = y3;
        }
        let peak = 0;
        for (let i = 0; i < w.length; i++) peak = Math.max(peak, Math.abs(w[i]));
        for (let i = 0; i < w.length; i++) w[i] = (w[i] / peak) * amp;
        expect(detectPitch(w, SR, { minFreq: 25, maxFreq: 1400 }), `${amp}/${seed0}`).toBeNull();
      }
    }
  });

  it('removes a DC offset without touching the lowest note', () => {
    const dc = new Float32Array(1024).fill(0.5);
    expect(rmsOf(removeRumble(dc, SR, 20))).toBeLessThan(0.01);

    // A 41 Hz bass low E must survive the high-pass essentially intact. The
    // corner is half the lowest frequency the tuner is looking for, which is
    // 12.5 Hz when a bass asks it to search from 25 Hz.
    const low = new Float32Array(SR);
    for (let i = 0; i < low.length; i++) low[i] = Math.sin((2 * Math.PI * 41.2 * i) / SR);
    const kept = rmsOf(removeRumble(low, SR, 12.5).subarray(4096)) / rmsOf(low.subarray(4096));
    expect(kept).toBeGreaterThan(0.9);
  });
});

describe('the gate follows the room', () => {
  const steady = (rms: number, frames: number, gate: NoiseGate): void => {
    for (let i = 0; i < frames; i++) gate.update(rms);
  };

  it('is at its most sensitive in silence', () => {
    const gate = new NoiseGate();
    steady(0.00005, 200, gate);
    expect(gate.threshold).toBe(NoiseGate.MIN_THRESHOLD);
  });

  it('stays sensitive until it has heard enough of the room', () => {
    // Someone who opens the tuner and plays straight away must be heard. If
    // the gate adapted to the first frames it saw, it would take their own
    // note for the room and then shut on it.
    const gate = new NoiseGate();
    steady(0.05, 10, gate);
    expect(gate.ready).toBe(false);
    expect(gate.threshold).toBe(NoiseGate.MIN_THRESHOLD);
  });

  it('rises above a steady hum, and comes back down when it stops', () => {
    const gate = new NoiseGate();
    steady(0.001, 96, gate);
    expect(gate.ready).toBe(true);
    expect(gate.threshold).toBeCloseTo(0.003, 4);

    steady(0.00005, 96, gate);
    expect(gate.threshold).toBe(NoiseGate.MIN_THRESHOLD);
  });

  it('is not raised by a note, however long it rings', () => {
    // The failure this prevents: the gate chasing the note's own level and
    // cutting it off mid-decay. The floor is the quietest of the window, and
    // a note is a loud interval between quiet ones.
    const gate = new NoiseGate();
    steady(0.0001, 96, gate);
    let level = 0.05;
    for (let i = 0; i < 72; i++) {
      gate.update(level);
      expect(gate.threshold, `frame ${i} at ${level}`).toBeLessThan(level);
      level *= 0.96;
    }
  });

  it('never demands more than its ceiling, however loud the room', () => {
    const gate = new NoiseGate();
    steady(0.5, 200, gate);
    expect(gate.threshold).toBe(NoiseGate.MAX_THRESHOLD);
  });
});

describe('the signal meter', () => {
  it('is in decibels, so a quiet string still moves it', () => {
    expect(meterLevel(0)).toBe(0);
    expect(meterLevel(1)).toBe(1);
    // A softly played string: visible, where a linear meter showed nothing.
    expect(meterLevel(0.003)).toBeGreaterThan(0.2);
    expect(meterLevel(0.03)).toBeGreaterThan(0.4);
    // Monotonic.
    let last = -1;
    for (const rms of [1e-5, 1e-4, 1e-3, 1e-2, 1e-1, 1]) {
      const v = meterLevel(rms);
      expect(v).toBeGreaterThanOrEqual(last);
      last = v;
    }
  });
});
