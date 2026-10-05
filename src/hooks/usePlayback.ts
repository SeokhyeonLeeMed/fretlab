/**
 * usePlayback.ts — the bridge between UI gestures and the audio engine.
 *
 * Every entry point starts the AudioContext first. That is deliberate: a
 * browser will only let audio start from a user gesture, so the context is
 * created on the first click rather than on page load.
 */

import { useCallback, useEffect, useState } from 'react';
import { audioEngine, type StrumMode } from '../core/audio/AudioEngine';
import { useStore } from '../state/store';
import { useMusicContext } from '../state/selectors';
import type { Voicing } from '../core/theory/voicing';

export interface PlaybackApi {
  /** Play the note at a fretboard position and remember it as selected. */
  pick: (stringIndex: number, fret: number) => void;
  /** Play one MIDI note. */
  playNote: (midi: number, stringIndex?: number) => void;
  /** Play a chord shape, honouring the current strum mode and speed. */
  strum: (voicing: Voicing, mode?: StrumMode) => void;
  stop: () => void;
  /** Non-null when audio is unavailable or failed to start. */
  audioError: string | null;
  audioReady: boolean;
}

export function usePlayback(): PlaybackApi {
  const ctx = useMusicContext();
  const select = useStore((s) => s.select);
  const volume = useStore((s) => s.volume);
  const strumMode = useStore((s) => s.strumMode);
  const strumMs = useStore((s) => s.strumMs);

  const [status, setStatus] = useState(() => audioEngine.status);
  useEffect(() => audioEngine.subscribe(setStatus), []);
  useEffect(() => audioEngine.setVolume(volume), [volume]);

  const family = ctx.instrument.family;
  const gauges = ctx.instrument.stringGauges;

  const playNote = useCallback(
    (midi: number, stringIndex?: number) => {
      const gauge = stringIndex === undefined ? undefined : gauges[stringIndex];
      void audioEngine.ensureStarted().then((ok) => {
        if (!ok) return;
        audioEngine.setVolume(useStore.getState().volume);
        audioEngine.playMidi(midi, {
          family,
          brightness:
            gauge === undefined ? undefined : Math.max(0.2, Math.min(0.9, 1.15 - gauge)),
        });
      });
    },
    [family, gauges],
  );

  const pick = useCallback(
    (stringIndex: number, fret: number) => {
      const midi = ctx.openMidis[stringIndex] + fret;
      select({ stringIndex, fret });
      playNote(midi, stringIndex);
    },
    [ctx.openMidis, playNote, select],
  );

  const strum = useCallback(
    (voicing: Voicing, mode?: StrumMode) => {
      void audioEngine.ensureStarted().then((ok) => {
        if (!ok) return;
        audioEngine.setVolume(useStore.getState().volume);
        audioEngine.playVoicing(voicing.midis, {
          mode: mode ?? strumMode,
          strumMs,
          family,
          gauges,
        });
      });
    },
    [family, gauges, strumMode, strumMs],
  );

  const stop = useCallback(() => audioEngine.stopAll(), []);

  return {
    pick,
    playNote,
    strum,
    stop,
    audioError: status.error,
    audioReady: status.running,
  };
}
