/**
 * pluck.ts — offline Karplus-Strong string synthesis.
 *
 * A plucked string is a short noise burst circulating in a delay line whose
 * length is one period long, losing a little energy and a little treble on
 * every lap. That is exactly what this renders.
 *
 * It is rendered *offline* into a sample buffer rather than wired as a live
 * Web Audio feedback loop, because a DelayNode inside a cycle is quantised to
 * a 128-sample block, which would cap the usable pitch at roughly 344 Hz and
 * detune everything above it. Rendering the delay line in JavaScript gives
 * sample-accurate fractional delay, so every note is in tune.
 *
 * This module is pure maths: no Web Audio, no DOM. It is unit-testable.
 */

export type ToneFamily = 'guitar' | 'bass';

export interface PluckOptions {
  sampleRate: number;
  freq: number;
  family: ToneFamily;
  /** 0 = bridge, 0.5 = middle of the string. Shapes the comb colouration. */
  pickPosition?: number;
  /** 0..1, brighter at higher values. Thinner strings get more. */
  brightness?: number;
  /** Deterministic noise seed, so the same note sounds consistent. */
  seed?: number;
}

/** Small deterministic PRNG, so rendering is reproducible and testable. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Target -60 dB decay time in seconds. High notes die away faster. */
export function decayTimeFor(freq: number, family: ToneFamily): number {
  if (family === 'bass') {
    return Math.min(4.2, Math.max(0.9, 4.0 - freq / 190));
  }
  return Math.min(3.2, Math.max(0.55, 3.1 - freq / 420));
}

/** Length of the rendered sample, in seconds. */
export function renderLengthFor(freq: number, family: ToneFamily): number {
  return Math.min(4.5, decayTimeFor(freq, family) + 0.4);
}

/**
 * Render one plucked note.
 * @returns mono samples in -1..1, already fade-ended so it cannot click.
 */
export function renderPluck(opts: PluckOptions): Float32Array<ArrayBuffer> {
  const { sampleRate, freq, family } = opts;
  if (!(sampleRate > 0)) throw new Error('sampleRate must be positive');
  if (!(freq > 0)) throw new Error('freq must be positive');

  const brightness = clamp01(opts.brightness ?? (family === 'bass' ? 0.3 : 0.55));
  const pickPosition = clamp01(opts.pickPosition ?? 0.22);
  const rand = mulberry32(opts.seed ?? Math.max(1, Math.floor(freq * 1000)));

  const period = sampleRate / freq;
  // The 2-point averaging loop filter contributes exactly half a sample of
  // delay, so the delay line must be that much shorter to stay in tune.
  let L = Math.floor(period - 0.5);
  let frac = period - 0.5 - L;
  if (L < 2) {
    // Above sampleRate/2-ish the model degenerates; clamp rather than throw.
    L = 2;
    frac = 0;
  }
  const len = L + 2;
  const line = new Float32Array(len);

  // --- excitation -------------------------------------------------------
  // White noise, low-passed (duller for bass and for thick strings), then
  // comb-filtered by the pick position, which is what gives the pluck its
  // characteristic hollow spectrum instead of a uniform hiss.
  const lpCoeff = 0.15 + 0.75 * brightness;
  let lp = 0;
  const raw = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const n = rand() * 2 - 1;
    lp += lpCoeff * (n - lp);
    raw[i] = lp;
  }
  const pickDelay = Math.max(1, Math.round(pickPosition * L));
  for (let i = 0; i < len; i++) {
    line[i] = raw[i] - 0.86 * (i >= pickDelay ? raw[i - pickDelay] : 0);
  }
  // Remove DC so the note cannot push a lasting offset through the output.
  let mean = 0;
  for (let i = 0; i < len; i++) mean += line[i];
  mean /= len;
  for (let i = 0; i < len; i++) line[i] -= mean;

  // --- loop -------------------------------------------------------------
  const decay = decayTimeFor(freq, family);
  // Amplitude must fall to 1/1000 after `decay` seconds, i.e. after
  // decay * freq laps of the delay line.
  const laps = Math.max(1, decay * freq);
  const damp = Math.pow(0.001, 1 / laps);

  const total = Math.max(len + 1, Math.floor(renderLengthFor(freq, family) * sampleRate));
  const out = new Float32Array(total);

  let w = 0;
  let sPrev = 0;
  for (let n = 0; n < total; n++) {
    const ia = (w - L + 2 * len) % len;
    const ib = (w - L - 1 + 2 * len) % len;
    // Fractional delay by linear interpolation between the two taps.
    const s = (1 - frac) * line[ia] + frac * line[ib];
    // Loop filter: the 2-point average both damps treble and supplies the
    // half-sample of delay accounted for above.
    const y = 0.5 * (s + sPrev);
    sPrev = s;
    line[w] = y * damp;
    w = w + 1 === len ? 0 : w + 1;
    out[n] = y;
  }

  // --- shaping ----------------------------------------------------------
  // Short attack ramp kills the initial discontinuity; tail fade prevents a
  // click if the buffer is cut off by the envelope.
  const attack = Math.min(out.length, Math.round(sampleRate * 0.004));
  for (let i = 0; i < attack; i++) out[i] *= i / attack;
  const fade = Math.min(out.length, Math.round(sampleRate * 0.03));
  for (let i = 0; i < fade; i++) {
    out[out.length - 1 - i] *= i / fade;
  }

  // Normalise so loud low notes and quiet high notes balance.
  let peak = 0;
  for (let i = 0; i < out.length; i++) peak = Math.max(peak, Math.abs(out[i]));
  if (peak > 0) {
    const g = 0.92 / peak;
    for (let i = 0; i < out.length; i++) out[i] *= g;
  }
  return out;
}

/**
 * Measure the fundamental of a rendered buffer by autocorrelation.
 * Exported so the test suite can prove the synth is actually in tune.
 *
 * Like the tuner's detector, this takes the *first* strong correlation peak
 * rather than the tallest. A periodic signal correlates just as well at twice
 * or three times its period, so "tallest wins" reports an octave too low.
 */
export function measureFundamental(
  samples: Float32Array,
  sampleRate: number,
  minFreq = 20,
  maxFreq = 2000,
): number | null {
  // Analyse a window after the attack has settled.
  const start = Math.min(samples.length - 1, Math.round(sampleRate * 0.05));
  const size = Math.min(samples.length - start, Math.round(sampleRate * 0.25));
  if (size < 64) return null;
  const buf = samples.subarray(start, start + size);

  const minLag = Math.max(2, Math.floor(sampleRate / maxFreq));
  const maxLag = Math.min(Math.floor(sampleRate / minFreq), Math.floor(size / 2) - 1);
  if (maxLag <= minLag) return null;

  const corr = (lag: number): number => {
    let num = 0;
    let d1 = 0;
    let d2 = 0;
    const limit = size - lag;
    for (let i = 0; i < limit; i++) {
      num += buf[i] * buf[i + lag];
      d1 += buf[i] * buf[i];
      d2 += buf[i + lag] * buf[i + lag];
    }
    const d = Math.sqrt(d1 * d2);
    return d > 0 ? num / d : 0;
  };

  const curve = new Float64Array(maxLag + 2);
  for (let lag = minLag; lag <= maxLag + 1; lag++) curve[lag] = corr(lag);

  let tallest = -Infinity;
  const peaks: number[] = [];
  for (let lag = minLag + 1; lag <= maxLag; lag++) {
    if (curve[lag] > curve[lag - 1] && curve[lag] >= curve[lag + 1] && curve[lag] > 0) {
      peaks.push(lag);
      if (curve[lag] > tallest) tallest = curve[lag];
    }
  }
  if (peaks.length === 0) return null;
  const best = peaks.find((l) => curve[l] >= tallest * 0.9) ?? peaks[0];

  // Parabolic refinement for sub-sample accuracy.
  const y0 = curve[best - 1];
  const y1 = curve[best];
  const y2 = curve[best + 1];
  const denom = y0 - 2 * y1 + y2;
  const shift = denom === 0 ? 0 : (0.5 * (y0 - y2)) / denom;
  return sampleRate / (best + (Math.abs(shift) > 1 ? 0 : shift));
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}
