/**
 * export-texts.ts — write every piece of text in the application to one
 * Markdown file, organised by where it appears, with all six languages side
 * by side.
 *
 *   npm run texts        ->  docs/texts.md
 *
 * The file is for reading and reviewing translations: a translator can see
 * the English, every other language and the placeholders in one place,
 * without opening six TypeScript files. It is generated, so the catalogues
 * in src/i18n/ remain the source of truth; rerun this after changing them.
 */

import { writeFileSync } from 'node:fs';
import { en } from '../src/i18n/en';
import { musicEn } from '../src/i18n/music-en';
import { ko, musicKo } from '../src/i18n/ko';
import { ja, musicJa } from '../src/i18n/ja';
import { zhHans, musicZhHans } from '../src/i18n/zh-Hans';
import { zhHant, musicZhHant } from '../src/i18n/zh-Hant';
import { es, musicEs } from '../src/i18n/es';

type Entry = string | ((args: Record<string, unknown>) => string);
type Catalogue = Record<string, Entry>;
type Music = {
  scales: Record<string, readonly [string, string]>;
  chords: Record<string, readonly [string, string]>;
  categories: Record<string, string>;
  tunings: Record<string, string>;
  reasons: Record<string, string>;
};

const LANGS: { code: string; name: string; file: string; ui: Catalogue; music: Music }[] = [
  { code: 'en', name: 'English', file: 'en.ts + music-en.ts', ui: en as unknown as Catalogue, music: musicEn as unknown as Music },
  { code: 'ko', name: '한국어', file: 'ko.ts', ui: ko as unknown as Catalogue, music: musicKo as unknown as Music },
  { code: 'ja', name: '日本語', file: 'ja.ts', ui: ja as unknown as Catalogue, music: musicJa as unknown as Music },
  { code: 'zh-Hans', name: '简体中文', file: 'zh-Hans.ts', ui: zhHans as unknown as Catalogue, music: musicZhHans as unknown as Music },
  { code: 'zh-Hant', name: '繁體中文', file: 'zh-Hant.ts', ui: zhHant as unknown as Catalogue, music: musicZhHant as unknown as Music },
  { code: 'es', name: 'Español', file: 'es.ts', ui: es as unknown as Catalogue, music: musicEs as unknown as Music },
];

/** Section headings, by the first part of the key. Order is the file's order. */
const SECTIONS: [prefix: string, title: string, where: string][] = [
  ['lang', 'Language picker', 'The language menu in the header.'],
  ['app', 'Application', 'The tagline under the logo and the skip link.'],
  ['mode', 'Modes', 'The four mode buttons in the header and their tooltips.'],
  ['theme', 'Theme', 'The dark / light switch in the header.'],
  ['instrument', 'Instrument', 'The instrument card.'],
  ['family', 'Instrument', 'The instrument card.'],
  ['tuning', 'Tuning', 'The tuning card and the custom tuning editor.'],
  ['scale', 'Scale chooser', 'The scale / mode card, shown in Scale mode.'],
  ['chord', 'Chord chooser', 'The chord card, shown in Chord mode.'],
  ['audio', 'Sound and display', 'The sound and display card, and audio messages.'],
  ['display', 'Sound and display', 'The sound and display card, and audio messages.'],
  ['info', 'Current selection', 'The information panel under the instrument.'],
  ['legend', 'Current selection', 'The information panel under the instrument.'],
  ['chords', 'Chord shapes', 'The chord shapes panel, shown in Chord mode.'],
  ['voicing', 'Chord shapes', 'The chord shapes panel, shown in Chord mode.'],
  ['strum', 'Strumming', 'The strumming controls in the chord shapes panel.'],
  ['tuner', 'Tuner', 'The tuner card over the headstock, and its messages.'],
  ['stage', 'Instrument view', 'The toolbar, the small map and the hints around the instrument.'],
  ['fretboard', 'Fretboard (screen readers)', 'Spoken names of the fretboard and of each position on it.'],
  ['footer', 'Footer', 'The line at the bottom of the page.'],
  ['crash', 'Error screen', 'Shown only if the page fails to render.'],
  ['help', 'Help bubbles', 'The prefix a screen reader speaks before a help text.'],
];

const cell = (s: string): string => s.replace(/\|/g, '\\|').replace(/\n/g, ' ');

/** Render a message with its placeholders left visible, e.g. `{n} frets`. */
function shown(entry: Entry): { text: string; placeholders: string[]; one?: string } {
  if (typeof entry !== 'function') return { text: entry, placeholders: [] };
  const used = new Set<string>();
  const named = new Proxy({}, { get: (_, k) => (used.add(String(k)), `{${String(k)}}`) });
  const text = entry(named as Record<string, unknown>);
  // Some messages change their wording for exactly one (shape / shapes). Try
  // each placeholder as the number 1, leaving the others as placeholders.
  let one: string | undefined;
  for (const key of used) {
    const withValue = (v: number): string =>
      entry(
        new Proxy({}, { get: (_, k) => (String(k) === key ? v : `{${String(k)}}`) }) as Record<string, unknown>,
      );
    const a = withValue(1);
    const b = withValue(2);
    if (a.replace('1', '#') !== b.replace('2', '#')) one = a;
  }
  return { text, placeholders: [...used], one };
}

const out: string[] = [];
const p = (...lines: string[]): void => void out.push(...lines);

p(
  '# FretLab — all interface text',
  '',
  '> **Generated file.** Do not edit by hand: run `npm run texts` to rebuild it from the catalogues in',
  '> `src/i18n/`. To change a translation, edit the language file named in the table below, then regenerate.',
  '',
  '## How to read this file',
  '',
  '- Every piece of text the application shows or speaks is listed once, under the part of the page it belongs to.',
  '- Each entry gives its **key** (the name the code uses) and the text in all six languages.',
  '- `{name}` is a **placeholder**: the application puts a value there (a number, a note name, a chord name).',
  '  Keep every placeholder in a translation, spelled exactly the same; move it wherever the grammar wants it.',
  '- *When 1* shows the wording used when the number is exactly one, for messages where that differs.',
  '- Note letters (A–G), `#` and `b`, and chord symbols such as `m7` are never translated.',
  '',
  '## Languages',
  '',
  '| Code | Language | File in `src/i18n/` |',
  '| --- | --- | --- |',
  ...LANGS.map((l) => `| \`${l.code}\` | ${l.name} | \`${l.file}\` |`),
  '',
  '## Contents',
  '',
);

const sectionTitles = [...new Set(SECTIONS.map((s) => s[1]))];
const musicTitles = ['Scales and modes', 'Chord types', 'Group headings', 'Tuning presets', 'Why a scale fits a chord'];
const anchor = (t: string): string =>
  t.toLowerCase().replace(/[^a-z0-9 -]/g, '').trim().replace(/\s+/g, '-');
p('**Part 1 — Interface**', '');
sectionTitles.forEach((t) => p(`- [${t}](#${anchor(t)})`));
p('', '**Part 2 — Music catalogues**', '');
musicTitles.forEach((t) => p(`- [${t}](#${anchor(t)})`));
p('', '---', '', '# Part 1 — Interface', '');

const keys = Object.keys(en);
const sectionOf = (key: string): string => {
  const prefix = key.split('.')[0];
  return SECTIONS.find((s) => s[0] === prefix)?.[1] ?? 'Other';
};
const titles = [...sectionTitles, ...(keys.some((k) => sectionOf(k) === 'Other') ? ['Other'] : [])];

let total = 0;
for (const title of titles) {
  const mine = keys.filter((k) => sectionOf(k) === title);
  if (mine.length === 0) continue;
  const where = SECTIONS.find((s) => s[1] === title)?.[2] ?? '';
  p(`## ${title}`, '', where ? `*${where}*` : '', '');
  for (const key of mine) {
    total++;
    const source = shown((en as unknown as Catalogue)[key]);
    p(`### \`${key}\``, '');
    if (source.placeholders.length > 0) {
      p(`Placeholders: ${source.placeholders.map((x) => `\`{${x}}\``).join(', ')}`, '');
    }
    p('| | Text |', '| --- | --- |');
    for (const lang of LANGS) {
      const r = shown(lang.ui[key]);
      p(`| **${lang.code}** | ${cell(r.text)} |`);
      if (r.one !== undefined) p(`| ${lang.code}, *when 1* | ${cell(r.one)} |`);
    }
    p('');
  }
}

p('---', '', '# Part 2 — Music catalogues', '');

const pairTable = (title: string, where: string, pick: (m: Music) => Record<string, readonly [string, string]>): void => {
  p(`## ${title}`, '', `*${where}*`, '');
  for (const id of Object.keys(pick(LANGS[0].music))) {
    total += 2;
    p(`### \`${id}\``, '', '| | Name | Description |', '| --- | --- | --- |');
    for (const lang of LANGS) {
      const [name, about] = pick(lang.music)[id] ?? ['', ''];
      p(`| **${lang.code}** | ${cell(name)} | ${cell(about)} |`);
    }
    p('');
  }
};

const wideTable = (title: string, where: string, pick: (m: Music) => Record<string, string>): void => {
  p(`## ${title}`, '', `*${where}*`, '', `| Key | ${LANGS.map((l) => l.code).join(' | ')} |`, `| --- | ${LANGS.map(() => '---').join(' | ')} |`);
  for (const id of Object.keys(pick(LANGS[0].music))) {
    total++;
    p(`| \`${id}\` | ${LANGS.map((l) => cell(pick(l.music)[id] ?? '')).join(' | ')} |`);
  }
  p('');
};

pairTable('Scales and modes', 'The scale chooser: the name in the menu and the one-line description under it.', (m) => m.scales);
pairTable('Chord types', 'The chord chooser: the name in the menu and the one-line description under it.', (m) => m.chords);
wideTable('Group headings', 'Headings that group the scale and chord menus.', (m) => m.categories);
wideTable('Tuning presets', 'Names in the tuning menu. The open-string letters are added by the application.', (m) => m.tunings);
wideTable('Why a scale fits a chord', 'Tooltip on each suggested scale in Chord mode. Keyed by scale.', (m) => m.reasons);

p('---', '', `*${total} texts × ${LANGS.length} languages.*`, '');

writeFileSync('docs/texts.md', out.join('\n'), 'utf8');
console.log(`docs/texts.md: ${total} texts x ${LANGS.length} languages, ${out.length} lines`);
