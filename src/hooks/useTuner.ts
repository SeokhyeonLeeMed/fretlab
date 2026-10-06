/**
 * useTuner.ts — React bindings for the tuner engine.
 *
 * The engine is a singleton outside React, so several components can read the
 * same live snapshot while exactly one effect owns starting and stopping the
 * microphone. That is what guarantees the microphone is released the moment
 * tuner mode is left.
 */

import { useEffect, useMemo, useState } from 'react';
import { tunerEngine, type TunerSnapshot } from '../core/tuner/TunerEngine';
import { audioEngine } from '../core/audio/AudioEngine';
import { useStore } from '../state/store';
import { useMusicContext } from '../state/selectors';
import {
  chromaticReading,
  nearestStringReading,
  readingForString,
  type ChromaticReading,
  type StringReading,
} from '../core/tuner/analysis';
import { midiToFreq } from '../core/theory/pitch';

/** Live engine snapshot. Safe to call from any number of components. */
export function useTunerSnapshot(): TunerSnapshot {
  const [snap, setSnap] = useState<TunerSnapshot>(() => tunerEngine.snapshot);
  useEffect(() => tunerEngine.subscribe(setSnap), []);
  return snap;
}

/**
 * Owns the microphone for the lifetime of tuner mode.
 * Call this exactly once, from the application root.
 */
export function useTunerLifecycle(): void {
  const mode = useStore((s) => s.mode);
  const ctx = useMusicContext();

  useEffect(() => {
    if (mode !== 'tuner') {
      tunerEngine.stop();
      return;
    }
    // Search only the range the instrument can actually produce, which keeps
    // the detector away from room rumble and from harmonics up high.
    const a4 = useStore.getState().a4;
    const lowest = midiToFreq(Math.min(...ctx.openMidis), a4);
    const highest = midiToFreq(Math.max(...ctx.openMidis) + ctx.fretCount, a4);
    tunerEngine.setRange(Math.max(20, lowest * 0.6), Math.min(2000, highest * 1.2));
    void tunerEngine.start(audioEngine.context);
    return () => tunerEngine.stop();
  }, [mode, ctx.openMidis, ctx.fretCount]);
}

export interface TunerReadings {
  snapshot: TunerSnapshot;
  chromatic: ChromaticReading | null;
  /** Reading against the pinned string, or the nearest one when unpinned. */
  string: StringReading | null;
  /** Peg states for the instrument graphic. */
  targets: { stringIndex: number; state: 'idle' | 'active' | 'in-tune' }[];
}

export function useTunerReadings(): TunerReadings {
  const snapshot = useTunerSnapshot();
  const ctx = useMusicContext();
  const pinned = useStore((s) => s.tunerStringIndex);
  const a4 = useStore((s) => s.a4);

  return useMemo(() => {
    const freq = snapshot.pitch?.freq ?? null;
    if (freq === null) {
      return {
        snapshot,
        chromatic: null,
        string: null,
        targets: ctx.openMidis.map((_, stringIndex) => ({
          stringIndex,
          state: pinned === stringIndex ? ('active' as const) : ('idle' as const),
        })),
      };
    }
    const chromatic = chromaticReading(freq, ctx.spelling, a4);
    const string =
      pinned === null
        ? nearestStringReading(freq, ctx.openMidis, ctx.spelling, { names: ctx.tuning.notes, a4 })
        : readingForString(freq, ctx.openMidis, pinned, ctx.spelling, { names: ctx.tuning.notes, a4 });

    return {
      snapshot,
      chromatic,
      string,
      targets: ctx.openMidis.map((_, stringIndex) => ({
        stringIndex,
        state:
          // Only mark a string when the note really is that string's, within
          // a semitone; otherwise a fretted note elsewhere would light a peg.
          string && string.stringIndex === stringIndex && Math.abs(string.cents) < 100
            ? string.verdict === 'in-tune'
              ? ('in-tune' as const)
              : ('active' as const)
            : ('idle' as const),
      })),
    };
  }, [snapshot, ctx.openMidis, ctx.spelling, ctx.tuning.notes, pinned, a4]);
}
