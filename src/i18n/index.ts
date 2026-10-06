/**
 * i18n/index.ts — translation lookup.
 *
 * Messages are plain objects keyed by a dotted string. A value is either a
 * string or a function taking named arguments, which lets each language put
 * the numbers and names where its own grammar wants them instead of following
 * English word order.
 *
 * Every locale is typed as `Messages`, so a missing or misspelled key is a
 * compile error rather than a blank label. `t()` still falls back to English
 * at runtime, because a locale file loaded from elsewhere one day should
 * degrade rather than crash.
 */

import { useCallback } from 'react';
import { en, type Messages } from './en';
import { musicEn, type MusicMessages } from './music-en';
import { ko, musicKo } from './ko';
import { ja, musicJa } from './ja';
import { zhHans, musicZhHans } from './zh-Hans';
import { zhHant, musicZhHant } from './zh-Hant';
import { es, musicEs } from './es';
import { useStore } from '../state/store';

export type Locale = 'en' | 'ko' | 'ja' | 'zh-Hans' | 'zh-Hant' | 'es';

interface Bundle {
  messages: Messages;
  music: MusicMessages;
  /** The `lang` attribute to put on <html>. */
  htmlLang: string;
  /** Google Fonts family needed for this script, if any. */
  font?: string;
}

const BUNDLES: Record<Locale, Bundle> = {
  en: { messages: en as unknown as Messages, music: musicEn as unknown as MusicMessages, htmlLang: 'en' },
  ko: { messages: ko, music: musicKo, htmlLang: 'ko', font: 'Noto+Sans+KR' },
  ja: { messages: ja, music: musicJa, htmlLang: 'ja', font: 'Noto+Sans+JP' },
  'zh-Hans': { messages: zhHans, music: musicZhHans, htmlLang: 'zh-Hans', font: 'Noto+Sans+SC' },
  'zh-Hant': { messages: zhHant, music: musicZhHant, htmlLang: 'zh-Hant', font: 'Noto+Sans+TC' },
  es: { messages: es, music: musicEs, htmlLang: 'es' },
};

/** The locales offered, in the order they appear in the picker. */
export const LOCALES: Locale[] = ['en', 'ko', 'ja', 'zh-Hans', 'zh-Hant', 'es'];

/** The language's own name, for the picker. */
export const localeName = (locale: Locale): string =>
  BUNDLES[locale].messages['lang.name'] as string;

export const htmlLangOf = (locale: Locale): string => BUNDLES[locale].htmlLang;

/**
 * Pick a locale from the browser's languages.
 *
 * Chinese needs care: `zh-TW`, `zh-HK` and `zh-MO` are traditional, `zh-CN`
 * and `zh-SG` simplified, and a bare `zh` is conventionally simplified. The
 * script subtag wins when it is given.
 */
export function detectLocale(languages: readonly string[]): Locale {
  for (const raw of languages) {
    const tag = raw.toLowerCase();
    if (tag.startsWith('zh')) {
      if (tag.includes('hant') || /\b(tw|hk|mo)\b/.test(tag.replace(/-/g, ' '))) return 'zh-Hant';
      return 'zh-Hans';
    }
    if (tag.startsWith('ko')) return 'ko';
    if (tag.startsWith('ja')) return 'ja';
    if (tag.startsWith('es')) return 'es';
    if (tag.startsWith('en')) return 'en';
  }
  return 'en';
}

type Args = Record<string, string | number>;

/** Look up one message. */
export function translate(locale: Locale, key: keyof Messages, args?: Args): string {
  const value = BUNDLES[locale].messages[key] ?? (en as unknown as Messages)[key];
  if (typeof value === 'function') {
    return (value as (a: Args) => string)(args ?? {});
  }
  return value as string;
}

export type TFunction = (key: keyof Messages, args?: Args) => string;

/** Translation function for the current locale. */
export function useT(): TFunction {
  const locale = useStore((s) => s.locale);
  return useCallback((key, args) => translate(locale, key, args), [locale]);
}

export function useLocale(): Locale {
  return useStore((s) => s.locale);
}

/** Music catalogue text for the current locale. */
export function musicOf(locale: Locale): MusicMessages {
  return BUNDLES[locale].music;
}

type ScaleId = keyof MusicMessages['scales'];
type ChordId = keyof MusicMessages['chords'];
type CategoryId = keyof MusicMessages['categories'];
type ReasonId = keyof MusicMessages['reasons'];
type TuningId = keyof MusicMessages['tunings'];

const fallbackMusic = musicEn as unknown as MusicMessages;

export const scaleText = (locale: Locale, id: string): readonly [string, string] =>
  musicOf(locale).scales[id as ScaleId] ?? fallbackMusic.scales[id as ScaleId] ?? [id, ''];

export const chordText = (locale: Locale, id: string): readonly [string, string] =>
  musicOf(locale).chords[id as ChordId] ?? fallbackMusic.chords[id as ChordId] ?? [id, ''];

export const categoryText = (locale: Locale, id: string): string =>
  musicOf(locale).categories[id as CategoryId] ?? id;

/**
 * A tuning preset's name, without its note letters. The letters come from the
 * tuning itself, so they are never translated and never go stale.
 */
export const tuningText = (locale: Locale, id: string): string =>
  musicOf(locale).tunings[id as TuningId] ?? fallbackMusic.tunings[id as TuningId] ?? '';

export const reasonText = (locale: Locale, id: string): string =>
  musicOf(locale).reasons[id as ReasonId] ?? fallbackMusic.reasons[id as ReasonId] ?? '';

/**
 * Apply a locale to the document: set `lang`, and fetch the matching Noto
 * script only when it is actually needed. Latin locales need nothing extra,
 * so the page stays light for them.
 */
export function applyLocaleToDocument(locale: Locale): void {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = htmlLangOf(locale);

  const font = BUNDLES[locale].font;
  if (!font) return;
  const id = `fretlab-font-${font}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${font}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

export type { Messages };
