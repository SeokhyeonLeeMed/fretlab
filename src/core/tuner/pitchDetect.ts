/**
 * pitchDetect.ts — monophonic pitch detection, pure and testable.
 *
 * Method: the McLeod normalised square difference function (NSDF), which is
 * the robust cousin of plain autocorrelation. Plain ACF loves to answer an
 * octave too low on a bass string; the NSDF is normalised to -1..1 and lets
 * us pick the *first* strong peak rather than the tallest, which is what
 * fixes octave errors.
 *
 * Two-stage for speed and accuracy:
 *   1. decimate to ~4x the highest pitch of interest and run the NSDF there
 *      (16x less work than at 48 kHz);
 *   2. refine the winning lag against the full-rate signal with parabolic
 *      interpolation, which brings the estimate back to about a cent.
 */

export interface DetectOptions {
  minFreq?: number;
  maxFreq?: number;
  /** NSDF peak height required to accept a reading. 0..1. */
  clarityThreshold?: number;
  /** RMS gate: below this the input is treated as silence. */
  rmsThreshold?: number;
}

export interface PitchResult {
  freq: number;
  /** 0..1 confidence; how periodic the window is. */
  clarity: number;
  rms: number;
}

/** Root-mean-square level of a frame. */
export function rmsOf(buf: Float32Array): number {
  let s = 0;
  for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i];
  return Math.sqrt(s / Math.max(1, buf.length));
}

/**
 * Low-pass then pick every `factor`-th sample.
 *
 * The filter is a cascade of four one-pole sections rather than one: a single
 * pole rolls off far too gently, and anything surviving above the new Nyquist
 * folds back as a false low frequency that the detector would then report as
 * a note.
 */
export function decimate(buf: Float32Array, factor: number): Float32Array {
  if (factor <= 1) return buf;
  // A windowed-sinc low-pass, evaluated only at the samples that are kept.
  //
  // The corner has to sit just under the new Nyquist. A gentle one-pole
  // cascade cannot do that: placed low enough to stop aliasing it also eats
  // the notes being looked for, which leaves the lowest string detectable and
  // everything above it too weak. A 41-tap Hamming-windowed sinc passes the
  // whole playing range and still puts the stopband about 50 dB down, and
  // because it is only evaluated at the retained samples it costs less than
  // the filter it replaces.
  const taps = decimationTaps(factor);
  const half = (taps.length - 1) / 2;
  const n = Math.floor(buf.length / factor);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const centre = i * factor;
    let acc = 0;
    for (let k = 0; k < taps.length; k++) {
      const j = centre + k - half;
      if (j >= 0 && j < buf.length) acc += buf[j] * taps[k];
    }
    out[i] = acc;
  }
  return out;
}

const tapCache = new Map<number, Float32Array>();

/** Hamming-windowed sinc, cutoff at 0.45 of the decimated sample rate's Nyquist. */
function decimationTaps(factor: number): Float32Array {
  const hit = tapCache.get(factor);
  if (hit) return hit;
  const N = 41;
  const half = (N - 1) / 2;
  const fc = 0.45 / factor; // cycles per input sample
  const h = new Float32Array(N);
  let sum = 0;
  for (let i = 0; i < N; i++) {
    const m = i - half;
    const sinc = m === 0 ? 2 * fc : Math.sin(2 * Math.PI * fc * m) / (Math.PI * m);
    const w = 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (N - 1));
    h[i] = sinc * w;
    sum += h[i];
  }
  for (let i = 0; i < N; i++) h[i] /= sum;
  tapCache.set(factor, h);
  return h;
}

/** NSDF over a lag range. Values run -1..1; 1 means perfectly periodic. */
export function nsdf(buf: Float32Array, minLag: number, maxLag: number): Float32Array {
  const n = buf.length;
  const out = new Float32Array(maxLag + 1);
  for (let lag = minLag; lag <= maxLag; lag++) {
    let acf = 0;
    let energy = 0;
    const limit = n - lag;
    for (let i = 0; i < limit; i++) {
      const a = buf[i];
      const b = buf[i + lag];
      acf += a * b;
      energy += a * a + b * b;
    }
    out[lag] = energy > 0 ? (2 * acf) / energy : 0;
  }
  return out;
}

/** Normalised autocorrelation at one lag, used by the refinement stage. */
function normAcf(buf: Float32Array, lag: number): number {
  const n = buf.length;
  if (lag < 1 || lag >= n) return 0;
  let acf = 0;
  let e1 = 0;
  let e2 = 0;
  const limit = n - lag;
  for (let i = 0; i < limit; i++) {
    const a = buf[i];
    const b = buf[i + lag];
    acf += a * b;
    e1 += a * a;
    e2 += b * b;
  }
  const d = Math.sqrt(e1 * e2);
  return d > 0 ? acf / d : 0;
}

/** Parabolic vertex offset from three equally spaced samples. */
export function parabolicShift(yLeft: number, yPeak: number, yRight: number): number {
  const denom = yLeft - 2 * yPeak + yRight;
  if (denom === 0) return 0;
  const shift = (0.5 * (yLeft - yRight)) / denom;
  return Math.abs(shift) > 1 ? 0 : shift;
}

/**
 * Detect the pitch of one frame.
 * @returns null when the frame is too quiet or not periodic enough — the
 *          tuner shows "listening" rather than inventing a note.
 */
export function detectPitch(
  buf: Float32Array,
  sampleRate: number,
  options: DetectOptions = {},
): PitchResult | null {
  const minFreq = options.minFreq ?? 25; // B0 on a 5-string bass is 30.87 Hz
  const maxFreq = options.maxFreq ?? 1400; // above the 24th fret of a guitar
  const clarityThreshold = options.clarityThreshold ?? 0.55;
  const rmsThreshold = options.rmsThreshold ?? 0.006;

  const rms = rmsOf(buf);
  if (rms < rmsThreshold) return null;

  // Stage 1: decimate so the NSDF is cheap.
  //
  // The decimated rate is also bounded from below. Deriving it from maxFreq
  // alone is wrong for an instrument with a low top note: a bass asking for
  // 373 Hz would decimate to 1500 Hz, at which a low G's period is only
  // fifteen samples and the NSDF can no longer tell the true period from its
  // multiples -- which reads one or two octaves low. Keeping at least
  // MIN_DECIMATED_RATE leaves every period comfortably resolved.
  const MIN_DECIMATED_RATE = 6000;
  const factor = Math.max(
    1,
    Math.min(
      Math.floor(sampleRate / (4 * maxFreq)),
      Math.floor(sampleRate / MIN_DECIMATED_RATE),
    ),
  );
  const low = decimate(buf, factor);
  const lowRate = sampleRate / factor;
  // If almost nothing survived the band-limiting, the signal's periodic
  // content lies outside the range this instrument can produce, and any
  // period found below would be an artefact of it.
  // Measured: a plucked string keeps 83-95% of its energy inside the band,
  // while a tone above it keeps about 6%. A fifth leaves wide margin on both
  // sides, so no real note is thrown away and no out-of-band tone gets in.
  if (rmsOf(low) < Math.max(rmsThreshold * 0.4, rms * 0.2)) return null;

  const minLag = Math.max(2, Math.floor(lowRate / maxFreq));
  const maxLag = Math.min(Math.floor(lowRate / minFreq), Math.floor(low.length / 2) - 1);
  if (maxLag <= minLag) return null;

  const curve = nsdf(low, minLag, maxLag);

  // Collect every local maximum in range, then take the earliest that comes
  // close to the tallest.
  //
  // An earlier version first skipped forward while the curve stayed positive,
  // meaning to step over the peak at lag zero. But a strongly periodic signal
  // -- which is exactly what a plucked string is -- keeps the NSDF positive
  // well past its first period, so the skip stepped over the true period too
  // and the detector locked onto the second or third lap instead, an octave
  // or more low. Starting the search at minLag already excludes lag zero,
  // because minLag is set by the highest frequency of interest.
  let tallest = -Infinity;
  const peaks: number[] = [];
  for (let lag = minLag + 1; lag < maxLag; lag++) {
    if (curve[lag] > curve[lag - 1] && curve[lag] >= curve[lag + 1] && curve[lag] > 0) {
      peaks.push(lag);
      if (curve[lag] > tallest) tallest = curve[lag];
    }
  }
  if (peaks.length === 0 || tallest < clarityThreshold) return null;

  // Accept the earliest peak that comes close to the tallest. The threshold
  // is a balance: too high and a real pluck's second lap of the delay line
  // wins, which reads an octave low; too low and a strong second harmonic
  // wins, which reads an octave high. 0.85 holds both off across the whole
  // range of both instruments.
  let coarseLag = peaks.find((l) => curve[l] >= tallest * 0.85) ?? peaks[0];

  // Octave check. A periodic signal peaks at its period and at every multiple
  // of it, and which of those is tallest depends on the harmonics, so a
  // threshold alone cannot settle it: a low B's true period scores 0.78 where
  // twice that period scores 0.95. So ask directly whether some whole
  // fraction of the chosen period explains the signal nearly as well, and if
  // it does, prefer the shorter one. Repeating this walks all the way down to
  // the true period.
  for (let guard = 0; guard < 4; guard++) {
    let moved = false;
    for (const d of [2, 3, 4, 5]) {
      const target = coarseLag / d;
      if (target < minLag) continue;
      let cand = -1;
      for (const l of peaks) {
        if (Math.abs(l - target) <= Math.max(1, target * 0.04)) {
          if (cand < 0 || curve[l] > curve[cand]) cand = l;
        }
      }
      if (cand > 0 && curve[cand] >= curve[coarseLag] * 0.75) {
        coarseLag = cand;
        moved = true;
        break;
      }
    }
    if (!moved) break;
  }
  const clarity = curve[coarseLag];

  // Stage 2: refine at the original sample rate.
  const centre = coarseLag * factor;
  const radius = factor + 2;
  let bestLag = centre;
  let bestVal = -Infinity;
  const loLag = Math.max(2, centre - radius);
  const hiLag = Math.min(buf.length - 2, centre + radius);
  for (let lag = loLag; lag <= hiLag; lag++) {
    const v = normAcf(buf, lag);
    if (v > bestVal) {
      bestVal = v;
      bestLag = lag;
    }
  }
  const shift = parabolicShift(normAcf(buf, bestLag - 1), bestVal, normAcf(buf, bestLag + 1));
  const lag = bestLag + shift;
  if (!(lag > 0)) return null;

  const freq = sampleRate / lag;
  if (freq < minFreq || freq > maxFreq) return null;
  return { freq, clarity, rms };
}

/**
 * Smooth a stream of readings with a median filter.
 * A tuner needle that twitches on every frame is unusable; the median keeps
 * the display steady without adding the lag of an average.
 */
export class PitchSmoother {
  private history: number[] = [];
  constructor(private size = 5) {}

  push(freq: number): number {
    this.history.push(freq);
    if (this.history.length > this.size) this.history.shift();
    const sorted = [...this.history].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  }

  reset(): void {
    this.history = [];
  }

  get filled(): boolean {
    return this.history.length >= Math.min(3, this.size);
  }
}
