// Prints the instrument / tuning / scale / chord catalogues as Markdown, so
// the README and the project report can never drift from the code.
import { readFileSync } from 'node:fs';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
const { INSTRUMENTS } = await server.ssrLoadModule('/src/core/instruments/definitions.ts');
const { SCALES, SCALE_CATEGORIES } = await server.ssrLoadModule('/src/core/theory/scales.ts');
const { CHORDS, CHORD_CATEGORIES } = await server.ssrLoadModule('/src/core/theory/chords.ts');

const out = [];
out.push('### Instruments\n');
out.push('| Instrument | Strings | Frets | Default tuning | Tuning presets |');
out.push('| --- | --- | --- | --- | --- |');
for (const i of INSTRUMENTS) {
  const def = i.tunings.find((t) => t.id === i.defaultTuningId);
  out.push(`| ${i.name} | ${i.stringCount} | ${i.fretCount} | ${def.notes.join(' ')} | ${i.tunings.length} + custom |`);
}
out.push('\n### Tuning presets\n');
for (const i of INSTRUMENTS) {
  out.push(`**${i.name}**\n`);
  out.push('| Preset | Open strings (lowest first) |');
  out.push('| --- | --- |');
  for (const t of i.tunings) out.push(`| ${t.name.split('—')[0].trim()} | ${t.notes.join(' ')} |`);
  out.push('| Custom | any note you enter, per string |');
  out.push('');
}
out.push('### Scales and modes\n');
for (const cat of SCALE_CATEGORIES) {
  out.push(`**${cat}**\n`);
  out.push('| Scale | Intervals (semitones from the root) | Notes on C |');
  out.push('| --- | --- | --- |');
  const { spellCollection } = await server.ssrLoadModule('/src/core/theory/spelling.ts');
  for (const s of SCALES.filter((s) => s.category === cat)) {
    out.push(`| ${s.name} | ${s.intervals.join(' ')} | ${spellCollection('C', s.intervals, s.degrees).join(' ')} |`);
  }
  out.push('');
}
out.push('### Chords\n');
const { spellCollection } = await server.ssrLoadModule('/src/core/theory/spelling.ts');
for (const cat of CHORD_CATEGORIES) {
  out.push(`**${cat}**\n`);
  out.push('| Chord | Symbol on C | Intervals | Notes on C |');
  out.push('| --- | --- | --- | --- |');
  for (const c of CHORDS.filter((c) => c.category === cat)) {
    out.push(`| ${c.name} | C${c.symbol} | ${c.intervals.join(' ')} | ${spellCollection('C', c.intervals, c.degrees).join(' ')} |`);
  }
  out.push('');
}
console.log(out.join('\n'));
await server.close();
