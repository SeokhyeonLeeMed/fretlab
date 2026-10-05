/**
 * AudioEngine.ts — Web Audio playback for notes, chords and strums.
 *
 * Responsibilities:
 *  - lazily create the AudioContext, and only resume it from a real user
 *    gesture, so autoplay policy is respected rather than fought;
 *  - cache one rendered pluck per (pitch, tone family, sample rate);
 *  - schedule chords and strums on the audio clock, never with setTimeout,
 *    so strum timing is exact;
 *  - degrade to a clear error state when Web Audio is unavailable.
 */

import { midiToFreq } from '../theory/pitch';
import { renderPluck, type ToneFamily } from './pluck';

export type StrumMode = 'normal' | 'down' | 'up';

export interface PlayNoteOptions {
  family?: ToneFamily;
  /** 0..1. Thinner strings are rendered brighter. */
  brightness?: number;
  velocity?: number;
  /** Seconds from now. */
  delay?: number;
  /**
   * Absolute time on the audio clock. The strummer uses this so every string
   * of one strum is scheduled against a single reading of the clock —
   * reading `currentTime` once per note lets real elapsed time creep in and
   * makes the sweep uneven.
   */
  at?: number;
}

export interface EngineStatus {
  supported: boolean;
  running: boolean;
  error: string | null;
}

type Listener = (s: EngineStatus) => void;

const MAX_CACHE = 220;

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private chains = new Map<ToneFamily, AudioNode>();
  private buffers = new Map<string, AudioBuffer>();
  private active = new Set<AudioBufferSourceNode>();
  private volume = 0.75;
  private error: string | null = null;
  private listeners = new Set<Listener>();

  /** False on browsers with no Web Audio at all. */
  get supported(): boolean {
    return typeof window !== 'undefined' && !!(window.AudioContext ?? (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext);
  }

  get status(): EngineStatus {
    return { supported: this.supported, running: this.ctx?.state === 'running', error: this.error };
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(): void {
    const s = this.status;
    this.listeners.forEach((fn) => fn(s));
  }

  /**
   * Create and/or resume the context. Must be called from a user gesture
   * handler the first time; calling it again later is cheap and safe.
   */
  async ensureStarted(): Promise<boolean> {
    if (!this.supported) {
      this.error = 'This browser does not support the Web Audio API, so playback is unavailable.';
      this.emit();
      return false;
    }
    try {
      if (!this.ctx) {
        const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new Ctor({ latencyHint: 'interactive' });
        this.buildGraph();
      }
      if (this.ctx.state === 'suspended') await this.ctx.resume();
      this.error = null;
      this.emit();
      return this.ctx.state === 'running';
    } catch (e) {
      this.error = `Audio could not be initialised: ${(e as Error).message}`;
      this.emit();
      return false;
    }
  }

  /** The live context, for the tuner to share. Null until started. */
  get context(): AudioContext | null {
    return this.ctx;
  }

  private buildGraph(): void {
    const ctx = this.ctx!;
    const master = ctx.createGain();
    master.gain.value = this.volume;

    // One gentle limiter on the bus: a six-string strum is six notes at once
    // and would otherwise clip.
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -12;
    comp.knee.value = 24;
    comp.ratio.value = 3;
    comp.attack.value = 0.004;
    comp.release.value = 0.22;

    master.connect(comp).connect(ctx.destination);
    this.master = master;

    this.chains.set('guitar', this.buildBodyChain('guitar', master));
    this.chains.set('bass', this.buildBodyChain('bass', master));
  }

  /**
   * A short EQ chain standing in for the instrument body: it is what makes
   * the raw string model sound like a guitar or a bass rather than a wire.
   */
  private buildBodyChain(family: ToneFamily, dest: AudioNode): AudioNode {
    const ctx = this.ctx!;
    const input = ctx.createGain();
    const hp = ctx.createBiquadFilter();
    const lowBody = ctx.createBiquadFilter();
    const midBody = ctx.createBiquadFilter();
    const lp = ctx.createBiquadFilter();

    hp.type = 'highpass';
    lowBody.type = 'peaking';
    midBody.type = 'peaking';
    lp.type = 'lowpass';

    if (family === 'bass') {
      hp.frequency.value = 28;
      lowBody.frequency.value = 90;
      lowBody.Q.value = 0.9;
      lowBody.gain.value = 5;
      midBody.frequency.value = 700;
      midBody.Q.value = 0.8;
      midBody.gain.value = 2;
      lp.frequency.value = 3800;
      lp.Q.value = 0.5;
    } else {
      hp.frequency.value = 80;
      lowBody.frequency.value = 240;
      lowBody.Q.value = 1;
      lowBody.gain.value = 4;
      midBody.frequency.value = 2200;
      midBody.Q.value = 0.9;
      midBody.gain.value = 3;
      lp.frequency.value = 7000;
      lp.Q.value = 0.5;
    }
    input.connect(hp).connect(lowBody).connect(midBody).connect(lp).connect(dest);
    return input;
  }

  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.02);
    }
  }

  getVolume(): number {
    return this.volume;
  }

  private bufferFor(midi: number, family: ToneFamily, brightness: number): AudioBuffer {
    const ctx = this.ctx!;
    const bKey = Math.round(brightness * 4) / 4; // quantise so the cache hits
    const key = `${family}:${midi}:${bKey}:${ctx.sampleRate}`;
    const hit = this.buffers.get(key);
    if (hit) return hit;

    const samples = renderPluck({
      sampleRate: ctx.sampleRate,
      freq: midiToFreq(midi),
      family,
      brightness: bKey,
      seed: midi * 2654435761,
    });
    const buf = ctx.createBuffer(1, samples.length, ctx.sampleRate);
    buf.copyToChannel(samples, 0);

    if (this.buffers.size >= MAX_CACHE) {
      // Simple FIFO eviction: the cache only exists to avoid re-rendering the
      // notes a player is currently working on.
      const oldest = this.buffers.keys().next().value as string | undefined;
      if (oldest) this.buffers.delete(oldest);
    }
    this.buffers.set(key, buf);
    return buf;
  }

  /** Play one note. Returns false when audio is not available. */
  playMidi(midi: number, opts: PlayNoteOptions = {}): boolean {
    if (!this.ctx || !this.master || this.ctx.state !== 'running') return false;
    if (midi < 0 || midi > 127) return false;
    const family = opts.family ?? 'guitar';
    try {
      const ctx = this.ctx;
      const buf = this.bufferFor(midi, family, opts.brightness ?? (family === 'bass' ? 0.3 : 0.55));
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const g = ctx.createGain();
      const vel = Math.max(0.05, Math.min(1.4, opts.velocity ?? 1));
      g.gain.value = vel * 0.55;
      src.connect(g).connect(this.chains.get(family) ?? this.master);
      const when = opts.at ?? ctx.currentTime + Math.max(0, opts.delay ?? 0);
      src.start(when);
      this.active.add(src);
      src.onended = () => {
        this.active.delete(src);
        try {
          src.disconnect();
          g.disconnect();
        } catch {
          /* already torn down */
        }
      };
      return true;
    } catch (e) {
      this.error = `Playback failed: ${(e as Error).message}`;
      this.emit();
      return false;
    }
  }

  /**
   * Play a voicing as a chord or a strum.
   *
   * `midis` is indexed by string, lowest-pitched string first, with `null`
   * for a muted string — muted strings are skipped entirely, so they make no
   * sound, as on a real instrument.
   */
  playVoicing(
    midis: (number | null)[],
    opts: {
      mode?: StrumMode;
      /** Milliseconds between adjacent strings. */
      strumMs?: number;
      family?: ToneFamily;
      gauges?: number[];
      velocity?: number;
    } = {},
  ): boolean {
    if (!this.ctx || this.ctx.state !== 'running') return false;
    const mode = opts.mode ?? 'normal';
    const strumMs = Math.max(0, opts.strumMs ?? 28);
    const family = opts.family ?? 'guitar';

    const order: number[] = [];
    midis.forEach((m, i) => {
      if (m !== null) order.push(i);
    });
    if (order.length === 0) return false;

    // Down strum travels from the lowest-pitched string upward; up strum is
    // the reverse. "Normal" keeps a few milliseconds of spread so it sounds
    // played rather than quantised, but no directional sweep.
    const sequence = mode === 'up' ? [...order].reverse() : order;
    const step = mode === 'normal' ? Math.min(6, strumMs * 0.2) : strumMs;

    const gauges = opts.gauges;
    // One reading of the clock for the whole strum.
    const base = this.ctx.currentTime + 0.015;
    sequence.forEach((stringIndex, n) => {
      const midi = midis[stringIndex]!;
      const gauge = gauges?.[stringIndex];
      // Thin strings are plucked brighter; this is also why an up strum, which
      // starts on the thin strings, reads differently from a down strum.
      const brightness = gauge === undefined ? (family === 'bass' ? 0.3 : 0.55) : clamp(1.15 - gauge, 0.2, 0.9);
      const accent = mode === 'down' ? 1 - n * 0.02 : mode === 'up' ? 0.9 + n * 0.015 : 1;
      this.playMidi(midi, {
        family,
        brightness,
        at: base + (n * step) / 1000,
        velocity: (opts.velocity ?? 1) * accent,
      });
    });
    return true;
  }

  /** Stop everything currently sounding. */
  stopAll(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.active.forEach((src) => {
      try {
        src.stop(now + 0.05);
      } catch {
        /* already stopped */
      }
    });
  }

  async close(): Promise<void> {
    this.stopAll();
    this.buffers.clear();
    if (this.ctx) {
      try {
        await this.ctx.close();
      } catch {
        /* ignore */
      }
      this.ctx = null;
      this.master = null;
      this.chains.clear();
    }
    this.emit();
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/** One engine for the whole app. */
export const audioEngine = new AudioEngine();

/** Strum speed presets, in milliseconds between adjacent strings. */
export const STRUM_PRESETS = { slow: 70, normal: 32, fast: 12 } as const;
export type StrumPreset = keyof typeof STRUM_PRESETS | 'custom';
