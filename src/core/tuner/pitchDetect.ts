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
  const STAGES = 4;
  // Pull the corner below the new Nyquist to leave room for the roll-off.
  const a = Math.min(1, 0.7 / factor);
  const filtered = new Float32Array(buf);
  for (let stage = 0; stage < STAGES; stage++) {
    let lp = 0;
    for (let i = 0; i < filtered.length; i++) {
      lp += a * (filtered[i] - lp);
      filtered[i] = lp;
    }
  }
  const n = Math.floor(buf.length / factor);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = filtered[i * factor];
  return out;
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
  const factor = Math.max(1, Math.floor(sampleRate / (4 * maxFreq)));
  const low = decimate(buf, factor);
  const lowRate = sampleRate / factor;

  const minLag = Math.max(2, Math.floor(lowRate / maxFreq));
  const maxLag = Math.min(Math.floor(lowRate / minFreq), Math.floor(low.length / 2) - 1);
  if (maxLag <= minLag) return null;

  const curve = nsdf(low, minLag, maxLag);

  // Collect local maxima after the function has first come back up through
  // zero, then take the earliest peak that is nearly as tall as the tallest.
  // Taking the tallest outright is what produces octave-down errors.
  let searchFrom = minLag;
  while (searchFrom < maxLag && curve[searchFrom] > 0) searchFrom++;

  let tallest = -Infinity;
  const peaks: number[] = [];
  for (let lag = Math.max(minLag + 1, searchFrom); lag < maxLag; lag++) {
    if (curve[lag] > curve[lag - 1] && curve[lag] >= curve[lag + 1] && curve[lag] > 0) {
      peaks.push(lag);
      if (curve[lag] > tallest) tallest = curve[lag];
    }
  }
  if (peaks.length === 0 || tallest < clarityThreshold) return null;

  const cutoff = tallest * 0.88;
  const coarseLag = peaks.find((l) => curve[l] >= cutoff) ?? peaks[0];
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
