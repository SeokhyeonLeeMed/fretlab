/**
 * store.ts — application state.
 *
 * Only *settings* live here. Everything musical (note names, highlighted
 * positions, voicings) is derived on demand in selectors.ts, so there is no
 * second copy of the truth that could drift out of step with the tuning.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from './persist';
import { getInstrument, getTuning, INSTRUMENTS } from '../core/instruments/definitions';
import type { Tuning } from '../core/theory/fretboard';
import { STRUM_PRESETS, type StrumMode, type StrumPreset } from '../core/audio/AudioEngine';

export type Mode = 'normal' | 'scale' | 'chord' | 'tuner';
export type LabelStyle = 'note' | 'degree';
export type Theme = 'dark' | 'light';
export type Locale = 'en' | 'ko' | 'ja' | 'zh-Hans' | 'zh-Hant' | 'es';

export interface SelectedPosition {
  stringIndex: number;
  fret: number;
}

/** View state captured when entering tuner mode, restored when leaving it. */
export interface ViewSnapshot {
  zoom: number;
  scrollLeft: number;
}

export interface AppState {
  instrumentId: string;
  /** Tuning preset id, or 'custom'. */
  tuningId: string;
  /** Custom open-string notes per instrument, so each keeps its own. */
  customTunings: Record<string, string[]>;
  /** Last instrument chosen in each family, so switching family restores it. */
  lastByFamily: Record<string, string>;

  mode: Mode;

  scaleRoot: string;
  scaleId: string;
  /** Show scale highlighting in chord mode too. */
  scaleOverlayInChordMode: boolean;

  chordRoot: string;
  chordId: string;
  voicingIndex: number;
  /** Power-chord panel: include the octave on top. */
  powerWithOctave: boolean;

  showLabels: boolean;
  labelStyle: LabelStyle;
  /** Dim notes outside the current scale instead of hiding them. */
  showNonScaleNotes: boolean;

  zoom: number;
  theme: Theme;
  /** Interface language. Detected from the browser on first run. */
  locale: Locale;

  volume: number;
  /** Concert pitch in Hz: what A4 is tuned to. */
  a4: number;
  strumMode: StrumMode;
  strumPreset: StrumPreset;
  strumMs: number;

  selected: SelectedPosition | null;
  /** Pinned target string in tuner mode; null = auto-detect. */
  tunerStringIndex: number | null;
  /** Saved before the tuner camera move. */
  viewBeforeTuner: ViewSnapshot | null;

  // --- actions ---
  setInstrument: (id: string) => void;
  /** Switch family, returning to whichever instrument was last used there. */
  setFamily: (family: string) => void;
  setTuning: (id: string) => void;
  setCustomTuning: (instrumentId: string, notes: string[]) => void;
  setMode: (mode: Mode) => void;
  setScale: (root: string, scaleId: string) => void;
  setScaleRoot: (root: string) => void;
  setScaleId: (id: string) => void;
  setChord: (root: string, chordId: string) => void;
  setChordRoot: (root: string) => void;
  setChordId: (id: string) => void;
  setVoicingIndex: (i: number) => void;
  setPowerWithOctave: (v: boolean) => void;
  toggleLabels: () => void;
  setLabelStyle: (s: LabelStyle) => void;
  setShowNonScaleNotes: (v: boolean) => void;
  setScaleOverlayInChordMode: (v: boolean) => void;
  setZoom: (z: number) => void;
  setTheme: (t: Theme) => void;
  setLocale: (l: Locale) => void;
  setVolume: (v: number) => void;
  setA4: (hz: number) => void;
  setStrumMode: (m: StrumMode) => void;
  setStrumPreset: (p: StrumPreset) => void;
  setStrumMs: (ms: number) => void;
  select: (p: SelectedPosition | null) => void;
  setTunerStringIndex: (i: number | null) => void;
  saveViewBeforeTuner: (v: ViewSnapshot) => void;
  clearViewBeforeTuner: () => void;
  reset: () => void;
}

/**
 * The browser's preferred language, narrowed to one FretLab offers. Kept here
 * rather than imported from i18n so the store has no dependency on it; the
 * i18n module's detectLocale is the same rule and is the one under test.
 */
function detectInitialLocale(): Locale {
  const langs: readonly string[] =
    typeof navigator === 'undefined' ? [] : (navigator.languages ?? [navigator.language ?? 'en']);
  for (const raw of langs) {
    const tag = String(raw).toLowerCase();
    if (tag.startsWith('zh')) {
      return tag.includes('hant') || /-(tw|hk|mo)/.test(tag) ? 'zh-Hant' : 'zh-Hans';
    }
    if (tag.startsWith('ko')) return 'ko';
    if (tag.startsWith('ja')) return 'ja';
    if (tag.startsWith('es')) return 'es';
    if (tag.startsWith('en')) return 'en';
  }
  return 'en';
}

export const ZOOM_MIN = 0.55;
export const ZOOM_MAX = 2.6;

const DEFAULTS = {
  instrumentId: 'guitar6',
  tuningId: 'standard',
  customTunings: {} as Record<string, string[]>,
  lastByFamily: { guitar: 'guitar6', bass: 'bass4' } as Record<string, string>,
  mode: 'scale' as Mode,
  scaleRoot: 'E',
  scaleId: 'minor-pentatonic',
  scaleOverlayInChordMode: true,
  chordRoot: 'E',
  chordId: 'min',
  voicingIndex: 0,
  powerWithOctave: true,
  showLabels: true,
  labelStyle: 'note' as LabelStyle,
  showNonScaleNotes: true,
  zoom: 1,
  theme: 'dark' as Theme,
  locale: detectInitialLocale(),
  volume: 0.75,
  a4: 440,
  strumMode: 'down' as StrumMode,
  strumPreset: 'normal' as StrumPreset,
  strumMs: STRUM_PRESETS.normal,
  selected: null as SelectedPosition | null,
  tunerStringIndex: null as number | null,
  viewBeforeTuner: null as ViewSnapshot | null,
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...DEFAULTS,

      setInstrument: (id) => {
        const inst = getInstrument(id);
        const prev = get();
        // Keep the tuning choice if the new instrument offers a preset with
        // the same id (so "Drop D" stays "Drop D" across guitars), otherwise
        // fall back to that instrument's default.
        const keep =
          prev.tuningId === 'custom'
            ? prev.customTunings[id]?.length === inst.stringCount
              ? 'custom'
              : inst.defaultTuningId
            : inst.tunings.some((t) => t.id === prev.tuningId)
              ? prev.tuningId
              : inst.defaultTuningId;
        set({
          instrumentId: id,
          tuningId: keep,
          selected: null,
          voicingIndex: 0,
          tunerStringIndex: null,
          lastByFamily: { ...prev.lastByFamily, [inst.family]: id },
        });
      },

      setFamily: (family) => {
        const choices = INSTRUMENTS.filter((i) => i.family === family);
        if (choices.length === 0) return;
        const remembered = get().lastByFamily[family];
        const next = choices.find((i) => i.id === remembered) ?? choices[0];
        get().setInstrument(next.id);
      },

      setTuning: (id) => set({ tuningId: id, selected: null, voicingIndex: 0 }),

      setCustomTuning: (instrumentId, notes) =>
        set((s) => ({ customTunings: { ...s.customTunings, [instrumentId]: notes }, voicingIndex: 0 })),

      setMode: (mode) => set({ mode }),

      setScale: (scaleRoot, scaleId) => set({ scaleRoot, scaleId }),
      setScaleRoot: (scaleRoot) => set({ scaleRoot }),
      setScaleId: (scaleId) => set({ scaleId }),

      setChord: (chordRoot, chordId) => set({ chordRoot, chordId, voicingIndex: 0 }),
      setChordRoot: (chordRoot) => set({ chordRoot, voicingIndex: 0 }),
      setChordId: (chordId) => set({ chordId, voicingIndex: 0 }),
      setVoicingIndex: (voicingIndex) => set({ voicingIndex }),
      setPowerWithOctave: (powerWithOctave) => set({ powerWithOctave, voicingIndex: 0 }),

      toggleLabels: () => set((s) => ({ showLabels: !s.showLabels })),
      setLabelStyle: (labelStyle) => set({ labelStyle }),
      setShowNonScaleNotes: (showNonScaleNotes) => set({ showNonScaleNotes }),
      setScaleOverlayInChordMode: (scaleOverlayInChordMode) => set({ scaleOverlayInChordMode }),

      setZoom: (z) => set({ zoom: Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z)) }),
      setTheme: (theme) => set({ theme }),
      setLocale: (locale) => set({ locale }),

      setVolume: (v) => set({ volume: Math.min(1, Math.max(0, v)) }),
      setA4: (hz) => set({ a4: Math.min(466, Math.max(392, hz)) }),
      setStrumMode: (strumMode) => set({ strumMode }),
      setStrumPreset: (p) =>
        set(p === 'custom' ? { strumPreset: p } : { strumPreset: p, strumMs: STRUM_PRESETS[p] }),
      setStrumMs: (ms) => set({ strumMs: Math.min(240, Math.max(0, ms)), strumPreset: 'custom' }),

      select: (selected) => set({ selected }),
      setTunerStringIndex: (tunerStringIndex) => set({ tunerStringIndex }),
      saveViewBeforeTuner: (viewBeforeTuner) => set({ viewBeforeTuner }),
      clearViewBeforeTuner: () => set({ viewBeforeTuner: null }),

      reset: () => set({ ...DEFAULTS }),
    }),
    {
      name: 'fretlab.settings.v1',
      storage: createJSONStorage(),
      /** Transient things (selection, tuner pin, saved camera) are not saved. */
      partialize: (s) => ({
        instrumentId: s.instrumentId,
        tuningId: s.tuningId,
        customTunings: s.customTunings,
        lastByFamily: s.lastByFamily,
        mode: s.mode === 'tuner' ? 'normal' : s.mode,
        scaleRoot: s.scaleRoot,
        scaleId: s.scaleId,
        scaleOverlayInChordMode: s.scaleOverlayInChordMode,
        chordRoot: s.chordRoot,
        chordId: s.chordId,
        powerWithOctave: s.powerWithOctave,
        showLabels: s.showLabels,
        labelStyle: s.labelStyle,
        showNonScaleNotes: s.showNonScaleNotes,
        zoom: s.zoom,
        theme: s.theme,
        locale: s.locale,
        volume: s.volume,
        a4: s.a4,
        strumMode: s.strumMode,
        strumPreset: s.strumPreset,
        strumMs: s.strumMs,
      }),
    },
  ),
);

/**
 * The tuning currently in force, including a validated custom tuning.
 *
 * Every note name, highlight, voicing and tuner target in the application is
 * computed from this one function's result.
 */
export function activeTuning(state: AppState): Tuning {
  const inst = getInstrument(state.instrumentId);
  if (state.tuningId === 'custom') {
    const notes = state.customTunings[state.instrumentId];
    if (notes && notes.length === inst.stringCount) {
      return { id: 'custom', name: `Custom — ${notes.join(' ')}`, notes };
    }
    return getTuning(inst, inst.defaultTuningId);
  }
  return getTuning(inst, state.tuningId);
}

/** Starting point for the custom-tuning editor: the current tuning's notes. */
export function customTuningSeed(state: AppState): string[] {
  const inst = getInstrument(state.instrumentId);
  return state.customTunings[state.instrumentId]?.length === inst.stringCount
    ? state.customTunings[state.instrumentId]
    : activeTuning(state).notes;
}

export { INSTRUMENTS };
