/**
 * i18n.test.ts — the translations themselves.
 *
 * TypeScript already guarantees that every locale covers every key, because
 * each one is typed as `Messages` and `MusicMessages`. What it cannot check is
 * that the values are *usable*: that nothing is blank, that a key English
 * renders through a function has not been flattened into a fixed string in
 * another language, that the scale and chord catalogues are covered id by id,
 * and that the browser-language detection maps the Chinese variants the way
 * readers expect. Those are what this file tests.
 */

import { describe, expect, it } from 'vitest';
import { en } from '../i18n/en';
import { musicEn } from '../i18n/music-en';
import { ko, musicKo } from '../i18n/ko';
import { ja, musicJa } from '../i18n/ja';
import { zhHans, musicZhHans } from '../i18n/zh-Hans';
import { zhHant, musicZhHant } from '../i18n/zh-Hant';
import { es, musicEs } from '../i18n/es';
import {
  LOCALES,
  categoryText,
  chordText,
  detectLocale,
  htmlLangOf,
  localeName,
  musicOf,
  reasonText,
  scaleText,
  translate,
  tuningText,
  type Locale,
} from '../i18n';
import { SCALES, SCALE_CATEGORIES } from '../core/theory/scales';
import { CHORDS } from '../core/theory/chords';
import { INSTRUMENTS } from '../core/instruments/definitions';

type AnyMessages = Record<string, string | ((args: Record<string, unknown>) => string)>;

/**
 * A catalogue seen as a plain map. Each `Messages` value declares exactly the
 * arguments its own sentence needs, which is the point of the type; iterating
 * over all of them at once needs that specificity erased.
 */
const asCatalogue = (messages: unknown): AnyMessages => messages as AnyMessages;

const CATALOGUES: Record<Locale, AnyMessages> = {
  en: asCatalogue(en),
  ko: asCatalogue(ko),
  ja: asCatalogue(ja),
  'zh-Hans': asCatalogue(zhHans),
  'zh-Hant': asCatalogue(zhHant),
  es: asCatalogue(es),
};

const MUSIC = {
  en: musicEn,
  ko: musicKo,
  ja: musicJa,
  'zh-Hans': musicZhHans,
  'zh-Hant': musicZhHant,
  es: musicEs,
} as unknown as Record<Locale, typeof musicEn>;

/**
 * Any argument object. No catalogue entry calls methods on its arguments —
 * they only interpolate and compare — so one value answers every name.
 */
const anyArgs = (value: unknown): Record<string, unknown> =>
  new Proxy({}, { get: () => value }) as Record<string, unknown>;

/** Render a message whether it is a string or a function. */
const render = (messages: AnyMessages, key: string, value: unknown = 2): string => {
  const entry = messages[key];
  return typeof entry === 'function' ? entry(anyArgs(value)) : entry;
};

describe('every locale covers the interface', () => {
  const keys = Object.keys(en);

  it('offers the six languages, each naming itself', () => {
    expect(LOCALES).toEqual(['en', 'ko', 'ja', 'zh-Hans', 'zh-Hant', 'es']);
    const names = LOCALES.map(localeName);
    expect(names).toEqual(['English', '한국어', '日本語', '简体中文', '繁體中文', 'Español']);
    // The picker is useless if two entries read the same.
    expect(new Set(names).size).toBe(LOCALES.length);
  });

  it.each(LOCALES)('%s has exactly the English keys, and none of them blank', (locale) => {
    const messages = CATALOGUES[locale];
    expect(Object.keys(messages).sort()).toEqual([...keys].sort());
    for (const key of keys) {
      const text = render(messages, key);
      expect(typeof text, `${locale} ${key}`).toBe('string');
      expect(text.trim(), `${locale} ${key}`).not.toBe('');
    }
  });

  it.each(LOCALES)('%s keeps every parameterised message parameterised', (locale) => {
    const messages = CATALOGUES[locale];
    for (const key of keys) {
      // A function in English means the sentence embeds a value. Were a
      // translation to replace it with a fixed string, the value would simply
      // vanish from the interface, silently.
      expect(typeof messages[key], `${locale} ${key}`).toBe(typeof (asCatalogue(en))[key]);
    }
  });

  it.each(LOCALES)('%s actually substitutes its arguments', (locale) => {
    const messages = CATALOGUES[locale];
    const parameterised = keys.filter((k) => typeof messages[k] === 'function');
    expect(parameterised.length).toBeGreaterThan(20);
    for (const key of parameterised) {
      // A distinctive value, so finding it proves it was interpolated rather
      // than coincidentally present in the surrounding words.
      expect(render(messages, key, 'Zq7'), `${locale} ${key}`).toContain('Zq7');
    }
  });

  it.each(['ko', 'ja', 'zh-Hans', 'zh-Hant'] as Locale[])(
    '%s is written in its own script, not left in English',
    (locale) => {
      const messages = CATALOGUES[locale];
      // Short values can legitimately be symbols or note letters; prose cannot
      // be pure ASCII in these scripts, so an ASCII sentence is a leftover.
      const prose = keys.filter((k) => render(asCatalogue(en), k).length > 20);
      expect(prose.length).toBeGreaterThan(50);
      for (const key of prose) {
        expect(render(messages, key), `${locale} ${key}`).toMatch(/[^\u0000-\u007f]/);
      }
    },
  );

  it('maps each locale to a document language', () => {
    expect(LOCALES.map(htmlLangOf)).toEqual(['en', 'ko', 'ja', 'zh-Hans', 'zh-Hant', 'es']);
  });

  it('falls back to English when a locale lacks a key at runtime', () => {
    expect(translate('ko', 'mode.scale')).toBe(ko['mode.scale']);

    // A catalogue loaded from elsewhere one day could predate a new key. The
    // label must then read in English rather than come out blank, so the gap
    // is temporarily made real here.
    const catalogue = asCatalogue(ko);
    const saved = catalogue['mode.scale'];
    delete catalogue['mode.scale'];
    try {
      expect(translate('ko', 'mode.scale')).toBe('Scale');
      expect(translate('en', 'mode.scale')).toBe('Scale');
    } finally {
      catalogue['mode.scale'] = saved;
    }
    expect(translate('ko', 'mode.scale')).toBe(saved);
  });
});

describe('every locale covers the music catalogues', () => {
  it.each(LOCALES)('%s names and describes every scale', (locale) => {
    const music = MUSIC[locale];
    expect(Object.keys(music.scales).sort()).toEqual(SCALES.map((s) => s.id).sort());
    for (const scale of SCALES) {
      const [name, about] = scaleText(locale, scale.id);
      expect(name.trim(), `${locale} ${scale.id}`).not.toBe('');
      expect(about.trim(), `${locale} ${scale.id}`).not.toBe('');
    }
  });

  it.each(LOCALES)('%s names and describes every chord', (locale) => {
    const music = MUSIC[locale];
    expect(Object.keys(music.chords).sort()).toEqual(CHORDS.map((c) => c.id).sort());
    for (const chord of CHORDS) {
      const [name, about] = chordText(locale, chord.id);
      expect(name.trim(), `${locale} ${chord.id}`).not.toBe('');
      expect(about.trim(), `${locale} ${chord.id}`).not.toBe('');
    }
  });

  it.each(LOCALES)('%s names every group heading used by a chooser', (locale) => {
    const used = new Set<string>([
      ...SCALE_CATEGORIES,
      ...CHORDS.map((c) => c.category),
      ...SCALES.map((s) => s.category),
    ]);
    for (const cat of used) {
      const text = categoryText(locale, cat);
      expect(text.trim(), `${locale} ${cat}`).not.toBe('');
    }
  });

  it.each(LOCALES)('%s explains why each scale fits a chord', (locale) => {
    // The reasons are keyed by scale id, and chord mode shows one per suggestion.
    for (const scale of SCALES) {
      expect(typeof reasonText(locale, scale.id), `${locale} ${scale.id}`).toBe('string');
    }
    expect(Object.keys(musicOf(locale).reasons).length).toBeGreaterThan(0);
  });

  it.each(LOCALES)('%s names every tuning preset of every instrument', (locale) => {
    const ids = new Set(INSTRUMENTS.flatMap((i) => i.tunings.map((x) => x.id)));
    expect(ids.size).toBeGreaterThan(10);
    for (const id of ids) {
      expect(tuningText(locale, id).trim(), `${locale} ${id}`).not.toBe('');
    }
    // A custom tuning is named in the information panel like any preset.
    expect(tuningText(locale, 'custom').trim()).not.toBe('');
  });

  it('gives different languages different words for the same scale', () => {
    const dorian = LOCALES.map((l) => scaleText(l, 'dorian')[1]);
    expect(new Set(dorian).size).toBe(LOCALES.length);
  });

  it('falls back to English for an id no catalogue knows', () => {
    expect(scaleText('ko', 'not-a-scale')).toEqual(['not-a-scale', '']);
    expect(categoryText('ko', 'Not a group')).toBe('Not a group');
  });
});

describe('detecting the reader’s language', () => {
  it.each([
    [['ko-KR', 'en-US'], 'ko'],
    [['ja'], 'ja'],
    [['es-MX'], 'es'],
    [['es'], 'es'],
    [['en-GB'], 'en'],
    [['fr-FR', 'ko'], 'ko'],
    [['fr-FR'], 'en'],
    [[], 'en'],
  ] as [string[], Locale][])('reads %j as %s', (languages, expected) => {
    expect(detectLocale(languages)).toBe(expected);
  });

  it.each([
    ['zh-TW', 'zh-Hant'],
    ['zh-HK', 'zh-Hant'],
    ['zh-MO', 'zh-Hant'],
    ['zh-Hant', 'zh-Hant'],
    ['zh-Hant-HK', 'zh-Hant'],
    ['zh-CN', 'zh-Hans'],
    ['zh-SG', 'zh-Hans'],
    ['zh-Hans-CN', 'zh-Hans'],
    ['zh', 'zh-Hans'],
  ] as [string, Locale][])('reads %s as %s', (tag, expected) => {
    expect(detectLocale([tag])).toBe(expected);
    // Case in a language tag is conventional, not meaningful.
    expect(detectLocale([tag.toUpperCase()])).toBe(expected);
  });

  it('prefers the first language it can offer, not the first listed', () => {
    expect(detectLocale(['de', 'nl', 'zh-TW', 'en'])).toBe('zh-Hant');
  });
});
