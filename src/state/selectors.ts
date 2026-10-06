/**
 * selectors.ts — everything musical, derived from settings.
 *
 * The store holds only choices ("E", "minor-pentatonic", "drop-d"). This file
 * turns those into note names, highlighted positions and voicings. Because
 * the derivation always starts from `activeTuning`, a tuning change
 * necessarily updates labels, highlighting, voicings, playback and the tuner
 * together — they cannot disagree.
 */

import { useMemo } from 'react';
import { activeTuning, useStore, type AppState } from './store';
import { getInstrument, type InstrumentDef } from '../core/instruments/definitions';
import { tuningMidis, type Tuning } from '../core/theory/fretboard';
import { buildSpellingMap, type SpellingMap } from '../core/theory/spelling';
import {
  SCALE_BY_ID,
  getScale,
  scaleDegreeLabels,
  scalePitchClasses,
  type ScaleDef,
} from '../core/theory/scales';
import {
  chordDegreeLabels,
  chordDisplayName,
  chordPitchClasses,
  getChord,
  suggestScalesForChord,
  type ChordDef,
  type ScaleSuggestion,
} from '../core/theory/chords';
import { findPowerChords, findVoicings, type Voicing } from '../core/theory/voicing';
import { noteNameToPc } from '../core/theory/pitch';
import { scaleText } from '../i18n';

/** Root choices, including both spellings of every black key. */
export const ROOT_OPTIONS = [
  'C',
  'C#',
  'Db',
  'D',
  'D#',
  'Eb',
  'E',
  'F',
  'F#',
  'Gb',
  'G',
  'G#',
  'Ab',
  'A',
  'A#',
  'Bb',
  'B',
];

export interface MusicContext {
  instrument: InstrumentDef;
  tuning: Tuning;
  /** Open-string MIDI numbers, lowest-pitched string first. */
  openMidis: number[];
  fretCount: number;
  /** pitch class -> display name for the current key. */
  spelling: SpellingMap;
  scale: ScaleDef;
  scalePcs: Set<number>;
  scaleDegrees: Map<number, string>;
  scaleRootPc: number;
  scaleName: string;
  chord: ChordDef;
  chordPcs: Set<number>;
  chordDegrees: Map<number, string>;
  chordRootPc: number;
  chordName: string;
  /** Scales that genuinely contain every tone of the selected chord. */
  suggestions: ScaleSuggestion[];
}

/** Does `scaleId`, rooted at `rootName`, contain all of `pcs`? */
function scaleCoversChord(rootName: string, scaleId: string, pcs: Set<number>): boolean {
  const scale = SCALE_BY_ID[scaleId];
  if (!scale) return false;
  const inScale = scalePitchClasses(rootName, scale);
  for (const pc of pcs) if (!inScale.has(pc)) return false;
  return true;
}

export function buildMusicContext(state: AppState): MusicContext {
  const instrument = getInstrument(state.instrumentId);
  const tuning = activeTuning(state);
  const openMidis = tuningMidis(tuning);
  const scale = getScale(state.scaleId);
  const chord = getChord(state.chordId);

  // Which root spells the fretboard depends on what the player is looking at:
  // chord mode spells the chord's key, everything else spells the scale's.
  const keyRoot = state.mode === 'chord' ? state.chordRoot : state.scaleRoot;
  const keyIntervals =
    state.mode === 'chord' ? chord.intervals : scale.spellByKey ? [] : scale.intervals;
  const keyDegrees = state.mode === 'chord' ? chord.degrees : scale.spellByKey ? [] : scale.degrees;
  const spelling = buildSpellingMap(keyRoot, keyIntervals, keyDegrees);

  const chordPcs = chordPitchClasses(state.chordRoot, chord);

  return {
    instrument,
    tuning,
    openMidis,
    fretCount: instrument.fretCount,
    spelling,
    scale,
    scalePcs: scalePitchClasses(state.scaleRoot, scale),
    scaleDegrees: scaleDegreeLabels(state.scaleRoot, scale),
    scaleRootPc: noteNameToPc(state.scaleRoot),
    scaleName: `${state.scaleRoot} ${scaleText(state.locale, scale.id)[0]}`,
    chord,
    chordPcs,
    chordDegrees: chordDegreeLabels(state.chordRoot, chord),
    chordRootPc: noteNameToPc(state.chordRoot),
    chordName: chordDisplayName(state.chordRoot, chord),
    suggestions: suggestScalesForChord(state.chordRoot, chord, (id, pcs) =>
      scaleCoversChord(state.chordRoot, id, pcs),
    ),
  };
}

/** Memoised musical context. Recomputes only when a musical input changes. */
export function useMusicContext(): MusicContext {
  const instrumentId = useStore((s) => s.instrumentId);
  const tuningId = useStore((s) => s.tuningId);
  const customTunings = useStore((s) => s.customTunings);
  const mode = useStore((s) => s.mode);
  const scaleRoot = useStore((s) => s.scaleRoot);
  const scaleId = useStore((s) => s.scaleId);
  const chordRoot = useStore((s) => s.chordRoot);
  const chordId = useStore((s) => s.chordId);
  // The language is a dependency because the scale's display name is translated.
  const locale = useStore((s) => s.locale);

  return useMemo(
    () => buildMusicContext(useStore.getState()),
    [instrumentId, tuningId, customTunings, mode, scaleRoot, scaleId, chordRoot, chordId, locale],
  );
}

export interface VoicingSet {
  voicings: Voicing[];
  active: Voicing | null;
  /** True when the search found nothing playable in this tuning. */
  empty: boolean;
}

/** The voicing search is the one genuinely expensive derivation, so cache it. */
const voicingCache = new Map<string, Voicing[]>();

/**
 * Voicings for the selected chord in the current tuning.
 *
 * The search runs on the live open-string pitches. That is also why an
 * unplayable chord in an exotic tuning honestly returns nothing here instead
 * of a familiar-looking but mislabelled shape.
 */
export function useVoicings(): VoicingSet {
  const ctx = useMusicContext();
  const chordRoot = useStore((s) => s.chordRoot);
  const chordId = useStore((s) => s.chordId);
  const voicingIndex = useStore((s) => s.voicingIndex);

  const voicings = useMemo(() => {
    const cacheKey = `${ctx.openMidis.join(',')}|${chordRoot}|${chordId}|${ctx.fretCount}`;
    const cached = voicingCache.get(cacheKey);
    if (cached) return cached;

    const result =
      ctx.chord.category === 'Power'
        ? findPowerChords(ctx.openMidis, chordRoot, {
            fretCount: ctx.fretCount,
            withOctave: chordId === '5oct',
          }).slice(0, 14)
        : findVoicings(ctx.openMidis, chordRoot, ctx.chord, {
            fretCount: Math.min(ctx.fretCount, 15),
            maxResults: 10,
          });

    if (voicingCache.size > 60) voicingCache.clear();
    voicingCache.set(cacheKey, result);
    return result;
  }, [ctx.openMidis, ctx.chord, ctx.fretCount, chordRoot, chordId]);

  return {
    voicings,
    active: voicings[Math.min(voicingIndex, Math.max(0, voicings.length - 1))] ?? null,
    empty: voicings.length === 0,
  };
}

/** Highlight role for one fretboard position. Drives colour *and* shape. */
export type NoteRole = 'root' | 'scale' | 'chord-root' | 'chord-tone' | 'selected' | 'plain';

export interface FretNoteView {
  stringIndex: number;
  fret: number;
  midi: number;
  pc: number;
  name: string;
  full: string;
  /** Scale-degree or chord-tone label when one applies. */
  degree: string | null;
  role: NoteRole;
  inScale: boolean;
  inChord: boolean;
  /** Part of the chord shape currently displayed. */
  inVoicing: boolean;
  muted: boolean;
}
