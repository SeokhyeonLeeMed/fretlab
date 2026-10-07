/**
 * TunerEngine.ts — microphone capture and the analysis loop.
 *
 * Permission is requested on `start()` and nowhere else, so simply loading
 * the page never prompts for the microphone. `stop()` releases the tracks, so
 * the browser's recording indicator goes away when the player leaves tuner
 * mode.
 */

import { detectPitch, NoiseGate, PitchSmoother, rmsOf, type PitchResult } from './pitchDetect';

export type TunerState =
  | 'idle'
  | 'requesting'
  | 'running'
  | 'denied'
  | 'no-device'
  | 'insecure'
  | 'unsupported'
  | 'error';

export interface TunerSnapshot {
  state: TunerState;
  error: string | null;
  /** Latest accepted reading, or null while nothing is being played. */
  pitch: PitchResult | null;
  /** Input level 0..1, for the signal meter. Decibels, not amplitude. */
  level: number;
}

/**
 * Frame level as a 0..1 meter reading.
 *
 * Amplitude is the wrong scale for this: a string played softly sits around
 * a hundredth of full scale, so a linear meter leaves it pinned at nothing
 * while the tuner is in fact hearing it perfectly well. Decibels put the
 * quiet end of the range where it can be seen.
 */
export function meterLevel(rms: number): number {
  if (!(rms > 0)) return 0;
  const db = 20 * Math.log10(rms); // -inf..0
  return Math.min(1, Math.max(0, (db + 72) / 72));
}

type Listener = (s: TunerSnapshot) => void;

const FRAME_SIZE = 8192; // ~170 ms at 48 kHz: enough periods for a 31 Hz B0
const UPDATE_HZ = 24;
/** How long a reading stays on screen after the string falls below the gate. */
const HOLD_FRAMES = UPDATE_HZ; // one second

export class TunerEngine {
  private state: TunerState = 'idle';
  private error: string | null = null;
  private pitch: PitchResult | null = null;
  private level = 0;

  private ctx: AudioContext | null = null;
  private ownsContext = false;
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private frame: Float32Array<ArrayBuffer> | null = null;
  private timer: number | null = null;
  private smoother = new PitchSmoother(5);
  private gate = new NoiseGate();
  private quietFrames = 0;
  private listeners = new Set<Listener>();

  /** Lowest frequency the tuner will consider; lowered for bass. */
  minFreq = 25;
  maxFreq = 1400;

  get snapshot(): TunerSnapshot {
    return { state: this.state, error: this.error, pitch: this.pitch, level: this.level };
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    fn(this.snapshot);
    return () => this.listeners.delete(fn);
  }

  private emit(): void {
    const s = this.snapshot;
    this.listeners.forEach((fn) => fn(s));
  }

  private fail(state: TunerState, error: string): void {
    this.state = state;
    this.error = error;
    this.pitch = null;
    this.emit();
  }

  /**
   * Begin listening.
   * @param existingContext reuse the playback AudioContext when there is one,
   *        so the browser is not asked for two hardware contexts.
   */
  async start(existingContext?: AudioContext | null): Promise<boolean> {
    if (this.state === 'running' || this.state === 'requesting') return this.state === 'running';

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      this.fail(
        'unsupported',
        'This browser does not expose microphone input (navigator.mediaDevices is missing), so the tuner cannot listen. Note playback still works.',
      );
      return false;
    }
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      this.fail(
        'insecure',
        'Microphone access needs a secure context. Open the site over HTTPS, or on http://localhost during development.',
      );
      return false;
    }

    this.state = 'requesting';
    this.error = null;
    this.emit();

    try {
      // These processing flags must be off: echo cancellation and automatic
      // gain control both distort a sustained musical tone badly enough to
      // move the detected pitch.
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 1,
        },
        video: false,
      });
    } catch (e) {
      const err = e as DOMException;
      if (err.name === 'NotAllowedError' || err.name === 'SecurityError') {
        this.fail(
          'denied',
          'Microphone permission was denied. Allow microphone access for this site in your browser settings, then start the tuner again.',
        );
      } else if (err.name === 'NotFoundError' || err.name === 'OverconstrainedError') {
        this.fail('no-device', 'No microphone was found. Connect an input device and try again.');
      } else {
        this.fail('error', `The microphone could not be opened: ${err.message || err.name}`);
      }
      return false;
    }

    try {
      if (existingContext && existingContext.state !== 'closed') {
        this.ctx = existingContext;
        this.ownsContext = false;
      } else {
        const Ctor =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new Ctor();
        this.ownsContext = true;
      }
      if (this.ctx.state === 'suspended') await this.ctx.resume();

      this.source = this.ctx.createMediaStreamSource(this.stream);
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = FRAME_SIZE;
      this.analyser.smoothingTimeConstant = 0;
      this.source.connect(this.analyser);
      // Deliberately not connected to the destination: monitoring the mic
      // through the speakers would feed back.
      this.frame = new Float32Array(this.analyser.fftSize);

      this.smoother.reset();
      this.gate.reset();
      this.state = 'running';
      this.error = null;
      this.emit();
      this.loop();
      return true;
    } catch (e) {
      this.fail('error', `Audio input could not be initialised: ${(e as Error).message}`);
      this.releaseMedia();
      return false;
    }
  }

  private loop = (): void => {
    if (this.state !== 'running' || !this.analyser || !this.frame || !this.ctx) return;
    this.analyser.getFloatTimeDomainData(this.frame);
    const rms = rmsOf(this.frame);
    this.level = meterLevel(rms);
    // The gate is set from the room before this frame is judged against it.
    this.gate.update(rms);

    const result = detectPitch(this.frame, this.ctx.sampleRate, {
      minFreq: this.minFreq,
      maxFreq: this.maxFreq,
      rmsThreshold: this.gate.threshold,
    });

    if (result) {
      this.quietFrames = 0;
      const smoothed = this.smoother.push(result.freq);
      this.pitch = { ...result, freq: smoothed };
    } else {
      this.quietFrames++;
      // Hold the last reading so a decaying string does not make the display
      // flicker between a note and "listening". A second, because a string
      // played softly is only above the floor for a fraction of that, and a
      // reading that vanishes before it can be read is no use for tuning.
      if (this.quietFrames > HOLD_FRAMES) {
        this.pitch = null;
        this.smoother.reset();
      }
    }
    this.emit();
    this.timer = window.setTimeout(this.loop, 1000 / UPDATE_HZ);
  };

  private releaseMedia(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    try {
      this.source?.disconnect();
      this.analyser?.disconnect();
    } catch {
      /* already torn down */
    }
    this.source = null;
    this.analyser = null;
    this.frame = null;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    if (this.ownsContext && this.ctx) {
      void this.ctx.close().catch(() => undefined);
    }
    this.ctx = null;
    this.ownsContext = false;
  }

  /** Stop listening and release the microphone. */
  stop(): void {
    this.releaseMedia();
    this.smoother.reset();
    this.gate.reset();
    this.pitch = null;
    this.level = 0;
    this.quietFrames = 0;
    if (this.state === 'running' || this.state === 'requesting') this.state = 'idle';
    this.emit();
  }

  /** Narrow the search range to the instrument actually selected. */
  setRange(minFreq: number, maxFreq: number): void {
    this.minFreq = minFreq;
    this.maxFreq = maxFreq;
  }
}

export const tunerEngine = new TunerEngine();
