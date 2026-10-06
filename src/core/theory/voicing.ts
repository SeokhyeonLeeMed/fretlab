/**
 * voicing.ts — tuning + chord -> playable fret shapes.
 *
 * This is the module that makes alternate tunings correct. There is no table
 * of chord shapes anywhere in FretLab. Shapes are *searched for* against the
 * live open-string pitches, so in Drop D the solver finds the one-finger
 * power chord by itself, and in any tuning a shape is only ever offered if
 * its actual sounding pitches really do spell the requested chord.
 */

import { mod, noteNameToPc } from './pitch';
import { chordDegreeLabels, type ChordDef } from './chords';
import { spellMidi, type SpellingMap } from './spelling';

export interface Voicing {
  /** Stable key, also the shape signature: "x-0-2-2-2-0". */
  id: string;
  /** Fret per string, lowest-pitched string first. null = muted. */
  frets: (number | null)[];
  /** Sounding MIDI number per string. null = muted. */
  midis: (number | null)[];
  lowestFret: number;
  highestFret: number;
  /** Fretted span in frets (open strings excluded). */
  span: number;
  /** Distinct fretted positions needed, treating one fret as one barre. */
  fingers: number;
  /** Chord tones present, as degree labels. */
  tones: string[];
  /** Chord tones the shape leaves out, as degree labels. */
  missing: string[];
  /** 0 when the root is the lowest sounding note. */
  inversion: number;
  bassPc: number;
  /** Position name for the UI: "Open", "Position 3", ... */
  position: string;
  /**
   * The fret held down by a barring finger, or null. A barre is the lowest
   * fretted fret stopping two or more strings, with no open string, which is
   * what lets a shape be moved anywhere up the neck.
   */
  barre: number | null;
  score: number;
}

export interface VoicingOptions {
  fretCount?: number;
  /** Maximum fretted stretch. 4 is a comfortable hand span. */
  maxSpan?: number;
  maxResults?: number;
  /** Allow shapes whose lowest sounding note is not the root. */
  allowInversions?: boolean;
}

interface Candidate {
  frets: (number | null)[];
  midis: (number | null)[];
}

const MAX_FINGERS = 4;

/**
 * Search the fretboard for voicings of `chord` rooted on `rootName`.
 * Results are ordered best-first by playability.
 */
export function findVoicings(
  openMidis: number[],
  rootName: string,
  chord: ChordDef,
  options: VoicingOptions = {},
): Voicing[] {
  const fretCount = options.fretCount ?? 15;
  const maxSpan = options.maxSpan ?? 4;
  const maxResults = options.maxResults ?? 8;
  const allowInversions = options.allowInversions ?? true;

  const rootPc = noteNameToPc(rootName);
  const chordPcs = chord.intervals.map((i) => mod(rootPc + i, 12));
  const pcSet = new Set(chordPcs);
  const optionalPcs = new Set(chord.optional.map((i) => mod(rootPc + i, 12)));
  // A pitch class is only truly optional if it is not also a required tone.
  const requiredPcs = new Set(chordPcs.filter((pc) => !optionalPcs.has(pc)));

  const strings = openMidis.length;
  const found = new Map<string, Voicing>();

  // One search window per hand position. The window starting at 0 is the
  // open position, where open strings and low frets mix freely.
  for (let windowStart = 0; windowStart <= Math.max(0, fretCount - 1); windowStart++) {
    const windowEnd = Math.min(fretCount, windowStart + maxSpan);

    // Per-string option lists, cheapest-first: mute, open, then fretted.
    const optionsPerString: (number | null)[][] = [];
    for (let s = 0; s < strings; s++) {
      const opts: (number | null)[] = [null];
      const openPc = mod(openMidis[s], 12);
      if (pcSet.has(openPc)) opts.push(0);
      const lo = Math.max(1, windowStart);
      for (let f = lo; f <= windowEnd; f++) {
        if (pcSet.has(mod(openMidis[s] + f, 12))) opts.push(f);
      }
      optionsPerString.push(opts);
    }

    // Depth-first over strings. Pruning keeps this cheap: a partial shape
    // that already needs five fingers cannot be completed into a playable one.
    const frets: (number | null)[] = new Array(strings).fill(null);
    const walk = (s: number): void => {
      if (found.size > 4000) return; // hard safety stop on pathological input
      if (s === strings) {
        const cand = toCandidate(frets, openMidis);
        const v = evaluate(cand, {
          rootPc,
          requiredPcs,
          pcSet,
          chord,
          rootName,
          allowInversions,
          maxSpan,
        });
        if (v && !found.has(v.id)) found.set(v.id, v);
        return;
      }
      for (const opt of optionsPerString[s]) {
        frets[s] = opt;
        if (fingersNeeded(frets) <= MAX_FINGERS && spanOf(frets) <= maxSpan) walk(s + 1);
      }
      frets[s] = null;
    };
    walk(0);
  }

  const ranked = [...found.values()].sort((a, b) => a.score - b.score);
  const shortlist = ranked.slice(0, maxResults);
  // A barre shape is how a chord is played anywhere but the open position, so
  // always offer one when the tuning allows it. Scoring favours open shapes --
  // they need fewer fingers and sit lower -- so without this a barre can be
  // crowded out of the list entirely.
  if (!shortlist.some((v) => v.barre !== null)) {
    const barre = ranked.find((v) => v.barre !== null);
    if (barre) shortlist.splice(Math.max(0, shortlist.length - 1), 1, barre);
  }
  return shortlist;
}

function toCandidate(frets: (number | null)[], openMidis: number[]): Candidate {
  return {
    frets: frets.slice(),
    midis: frets.map((f, s) => (f === null ? null : openMidis[s] + f)),
  };
}

/** Distinct fretted positions, where several notes on one fret count as a barre. */
function fingersNeeded(frets: (number | null)[]): number {
  const used = new Set<number>();
  for (const f of frets) if (f !== null && f > 0) used.add(f);
  return used.size;
}

function spanOf(frets: (number | null)[]): number {
  let lo = Infinity;
  let hi = -Infinity;
  for (const f of frets) {
    if (f === null || f === 0) continue;
    lo = Math.min(lo, f);
    hi = Math.max(hi, f);
  }
  return hi === -Infinity ? 0 : hi - lo + 1;
}

interface EvalCtx {
  rootPc: number;
  requiredPcs: Set<number>;
  pcSet: Set<number>;
  chord: ChordDef;
  rootName: string;
  allowInversions: boolean;
  maxSpan: number;
}

function evaluate(cand: Candidate, ctx: EvalCtx): Voicing | null {
  const sounding: { s: number; midi: number }[] = [];
  cand.midis.forEach((m, s) => {
    if (m !== null) sounding.push({ s, midi: m });
  });
  if (sounding.length < Math.min(2, ctx.pcSet.size)) return null;
  if (sounding.length < 2) return null;

  const pcsPresent = new Set(sounding.map((x) => mod(x.midi, 12)));
  // Every required tone must actually sound. This is the guarantee that a
  // shape is never labelled with a chord it does not produce.
  for (const pc of ctx.requiredPcs) if (!pcsPresent.has(pc)) return null;
  if (!pcsPresent.has(ctx.rootPc)) return null;

  const bass = sounding[0];
  const bassPc = mod(bass.midi, 12);
  const rootInBass = bassPc === ctx.rootPc;
  if (!rootInBass && !ctx.allowInversions) return null;

  // Interior mutes (a dead string between two sounding ones) are playable but
  // awkward, so they are allowed and penalised rather than forbidden.
  let interiorMutes = 0;
  for (let s = sounding[0].s; s <= sounding[sounding.length - 1].s; s++) {
    if (cand.midis[s] === null) interiorMutes++;
  }

  const labels = chordDegreeLabels(ctx.rootName, ctx.chord);
  const tones = [...pcsPresent].map((pc) => labels.get(pc) ?? '?');
  const missing = [...ctx.pcSet].filter((pc) => !pcsPresent.has(pc)).map((pc) => labels.get(pc) ?? '?');

  const fretted = cand.frets.filter((f): f is number => f !== null && f > 0);
  const lowestFret = fretted.length ? Math.min(...fretted) : 0;
  const atLowest = cand.frets.filter((f) => f !== null && f === lowestFret).length;
  const hasOpen = cand.frets.some((f) => f === 0);
  const barre =
    fretted.length > 0 && atLowest >= 2 && !hasOpen && sounding.length >= 3 ? lowestFret : null;
  const highestFret = fretted.length ? Math.max(...fretted) : 0;
  const span = spanOf(cand.frets);
  const fingers = fingersNeeded(cand.frets);

  const inversion = rootInBass
    ? 0
    : Math.max(1, ctx.chord.intervals.findIndex((i) => mod(ctx.rootPc + i, 12) === bassPc));

  let score = 0;
  score += span * 2.2;
  score += fingers * 1.1;
  score += lowestFret * 0.4;
  score -= sounding.length * 1.8;
  score += interiorMutes * 4.5;
  score += missing.length * 2.0;
  if (!rootInBass) score += 6;
  // A shape that uses most of the neck's strings and sits near the nut is the
  // one a learner expects to see first.
  if (lowestFret === 0 && fretted.length === 0) score += 1; // all-open is suspicious
  score -= pcsPresent.size * 0.8;

  const id = cand.frets.map((f) => (f === null ? 'x' : String(f))).join('-');
  return {
    id,
    frets: cand.frets,
    midis: cand.midis,
    lowestFret,
    highestFret,
    span,
    fingers,
    tones,
    missing,
    inversion,
    bassPc,
    // A shape that uses open strings is an open-position shape, whatever the
    // lowest fretted note happens to be.
    position:
      fretted.length === 0
        ? 'All open'
        : barre !== null
          ? `Barre ${barre}`
          : cand.frets.includes(0) && lowestFret <= 4
            ? 'Open position'
            : `Position ${lowestFret}`,
    barre,
    score,
  };
}

/**
 * Power chords, generated from the live tuning rather than from a shape.
 *
 * The 5th and the octave are located by *pitch*, so the solver automatically
 * produces the familiar two-fret offset in standard tuning and the
 * one-finger, flat shape in Drop D — including the 4-semitone gap at the
 * guitar's B string, where the usual offset does not apply.
 */
export function findPowerChords(
  openMidis: number[],
  rootName: string,
  options: { fretCount?: number; withOctave?: boolean } = {},
): Voicing[] {
  const fretCount = options.fretCount ?? 15;
  const withOctave = options.withOctave ?? false;
  const rootPc = noteNameToPc(rootName);
  const out: Voicing[] = [];
  const strings = openMidis.length;

  for (let s = 0; s + 1 < strings; s++) {
    for (let f = 0; f <= fretCount; f++) {
      const rootMidi = openMidis[s] + f;
      if (mod(rootMidi, 12) !== rootPc) continue;

      const fifthFret = rootMidi + 7 - openMidis[s + 1];
      if (fifthFret < 0 || fifthFret > fretCount) continue;

      const frets: (number | null)[] = new Array(strings).fill(null);
      frets[s] = f;
      frets[s + 1] = fifthFret;

      if (withOctave) {
        if (s + 2 >= strings) continue;
        const octFret = rootMidi + 12 - openMidis[s + 2];
        if (octFret < 0 || octFret > fretCount) continue;
        frets[s + 2] = octFret;
      }

      const fretted = frets.filter((x): x is number => x !== null && x > 0);
      const span = spanOf(frets);
      const fingers = fingersNeeded(frets);
      if (span > 4 || fingers > MAX_FINGERS) continue;

      const midis = frets.map((x, i) => (x === null ? null : openMidis[i] + x));
      out.push({
        id: frets.map((x) => (x === null ? 'x' : String(x))).join('-'),
        frets,
        midis,
        lowestFret: fretted.length ? Math.min(...fretted) : 0,
        highestFret: fretted.length ? Math.max(...fretted) : 0,
        span,
        fingers,
        tones: withOctave ? ['1', '5', '8'] : ['1', '5'],
        missing: [],
        inversion: 0,
        bassPc: rootPc,
        position: `String ${strings - s}, fret ${f}`,
        barre: fingers === 1 && fretted.length >= 2 ? fretted[0] : null,
        score: f + span * 0.5 + (strings - s) * 0.1,
      });
    }
  }
  return out.sort((a, b) => a.score - b.score);
}

/**
 * What a shape *actually* sounds, independent of what it was asked for.
 * The chord panel shows this so a shape can never be silently mislabelled in
 * an unfamiliar tuning.
 */
export function describeVoicing(v: Voicing, map: SpellingMap): { names: string[]; pcs: number[] } {
  const names: string[] = [];
  const pcs: number[] = [];
  v.midis.forEach((m) => {
    if (m === null) return;
    names.push(spellMidi(m, map).full);
    pcs.push(mod(m, 12));
  });
  return { names, pcs };
}

/** True when the shape's sounding pitch classes are exactly the chord's. */
export function voicingMatchesChord(v: Voicing, rootName: string, chord: ChordDef): boolean {
  const rootPc = noteNameToPc(rootName);
  const want = new Set(chord.intervals.map((i) => mod(rootPc + i, 12)));
  const got = new Set(v.midis.filter((m): m is number => m !== null).map((m) => mod(m, 12)));
  for (const pc of got) if (!want.has(pc)) return false;
  return got.has(rootPc);
}
