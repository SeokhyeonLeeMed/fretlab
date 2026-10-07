# FretLab

An interactive fretboard for guitar and bass. Pick an instrument, put it in any
tuning you like, and the whole neck re-derives itself: note names, scale
highlighting, chord shapes, playback and the tuner's targets. Everything runs
in the browser — no server, no accounts, no audio files, no paid domain.

- **Two instruments**: a 6-string guitar and a 4-string bass.
- **20 tuning presets plus a custom tuning editor**, per instrument.
- **27 scales and modes**, **21 chord types**.
- **Chord shapes that are searched for, not stored**, so alternate tunings are
  correct by construction rather than by a lookup table — including a movable
  barre shape whenever the tuning admits one.
- **Plucked-string synthesis** with the Web Audio API, including down and up
  strumming at adjustable speed.
- **A chromatic tuner** that listens through the microphone, with a camera
  move that travels to the headstock and back.
- **Six languages**: English, 한국어, 日本語, 简体中文, 繁體中文, Español — the
  interface and the scale, chord and tuning catalogues alike.

---

## 1. Install

You need [Node.js](https://nodejs.org/) 18 or newer (20 LTS recommended).

```bash
git clone <your-repository-url> fretlab
cd fretlab
npm install
```

## 2. Run locally

```bash
npm run dev
```

Open the address Vite prints, normally <http://localhost:5173>. The dev server
is served over `http://localhost`, which browsers treat as a secure context, so
the microphone tuner works in development without any certificate setup.

## 3. Build

```bash
npm run build      # type-checks, then writes dist/
npm run preview    # serves dist/ at http://localhost:4173 to check the build
```

Other scripts:

| Command | What it does |
| --- | --- |
| `npm test` | Runs the full test suite once |
| `npm run test:watch` | Runs the tests in watch mode |
| `npm run typecheck` | Type-checks without emitting |

## 4. Deploy free

The production build uses `base: './'`, so the same `dist/` folder works from a
site root *or* from a subdirectory. Nothing needs to be reconfigured per host,
and **no custom domain is required**.

### GitHub Pages (recommended — included and ready)

`.github/workflows/deploy.yml` is already in the repository. It installs,
runs the tests, builds, and publishes on every push to `main`.

1. Push the project to a GitHub repository.
2. In the repository: **Settings → Pages → Build and deployment → Source** and
   choose **GitHub Actions**.
3. Push to `main`.

The site appears at `https://<username>.github.io/<repository>/`. Pages serves
over HTTPS, which the microphone tuner requires.

### Cloudflare Pages

Connect the repository and set: build command `npm run build`, output directory
`dist`. Served at `https://<project>.pages.dev`.

### Netlify

`netlify.toml` is included, so connecting the repository is enough. You can also
drag the `dist/` folder onto <https://app.netlify.com/drop> with no build step.
Served at `https://<site>.netlify.app`.

### Vercel

`vercel.json` is included; import the repository and accept the defaults.
Served at `https://<project>.vercel.app`.

### Anywhere else

`dist/` is plain static files. Any static host works, as does opening
`dist/index.html` straight off disk — though the tuner will not run from a
`file://` URL, because microphone access needs a secure context.

## 5. Microphone permission (for the tuner)

- Permission is requested **only** when you switch to **Tuner** mode. Loading
  the page never prompts.
- The browser needs a secure context: **HTTPS** in production, or
  **`http://localhost`** during development. All four hosts above serve HTTPS.
- Audio is analysed inside the page and discarded frame by frame. Nothing is
  recorded, stored or sent anywhere.
- Leaving tuner mode stops the media tracks, so the browser's recording
  indicator goes out.
- If permission is denied, the tuner explains how to re-enable it and offers a
  retry button. Everything else in the application keeps working.

**Re-enabling a denied microphone:** Chrome and Edge — click the icon at the
left of the address bar → Site settings → Microphone → Allow. Firefox — click
the microphone icon in the address bar and clear the block. Safari — Safari →
Settings for This Website → Microphone.

## 6. Browser support

| Browser | Fretboard, scales, chords | Note & chord playback | Microphone tuner |
| --- | --- | --- | --- |
| Chrome / Edge 90+ | Yes | Yes | Yes |
| Firefox 90+ | Yes | Yes | Yes |
| Safari 15+ (macOS, iOS) | Yes | Yes | Yes |
| Older or unusual browsers | Degrades to a working fretboard | Shows a clear message if Web Audio is missing | Shows a clear message if `getUserMedia` is missing |

Notes:

- Audio starts on your first click, because browsers only allow sound after a
  real interaction. The application says so rather than failing silently.
- On iOS, the ringer switch must be off silent for Web Audio to be audible.
- `localStorage` may be unavailable in private windows; settings then simply
  do not persist, and the application says so.

---

## 7. Architecture

The rule the project is organised around: **the music-theory engine knows
nothing about React, and the UI never does arithmetic on note names.**

```
src/
  core/                       no React, no DOM, fully unit-tested
    theory/
      pitch.ts                note names <-> MIDI <-> frequency <-> cents
      spelling.ts             systematic enharmonic spelling
      scales.ts               scale catalogue + pitch-class sets
      chords.ts               chord catalogue + chord-to-scale relations
      fretboard.ts            string + fret + tuning -> pitch
      voicing.ts              tuning + chord -> playable fret shapes
    instruments/
      definitions.ts          instruments and tunings as data
    audio/
      pluck.ts                offline Karplus-Strong string synthesis
      AudioEngine.ts          Web Audio graph, caching, strum scheduling
    tuner/
      pitchDetect.ts          NSDF pitch detection
      analysis.ts             frequency -> note, cents, target string
      TunerEngine.ts          microphone capture and the analysis loop

  state/
    store.ts                  settings only (zustand), persisted
    persist.ts                localStorage that cannot throw
    selectors.ts              settings -> derived musical context

  components/
    fretboard/geometry.ts     drawing geometry: traced body and headstock
                              outlines, fret spacing, string positions (pure)
    fretboard/InstrumentSVG.tsx    headstock + neck + body + notes
    fretboard/InstrumentStage.tsx  scroll, zoom, and the tuner camera
    panels/                   control, info, chord and tuner panels
    ui/controls.tsx           accessible form primitives

  i18n/
    en.ts                     English interface strings; `Messages` is derived
                              from this file, so it is the source of truth
    music-en.ts               English scale, chord and tuning catalogues
    ko.ts ja.ts es.ts         one file per language, each typed as `Messages`
    zh-Hans.ts zh-Hant.ts     and `MusicMessages`
    index.ts                  lookup, the `useT` hook, language detection

  hooks/                      the React bindings for the engines
  tests/                      277 tests
```

**State versus derived data.** The store holds only choices — `"guitar6"`,
`"drop-d"`, `"E"`, `"minor-pentatonic"`. Note names, highlighted positions and
chord shapes are *derived* in `selectors.ts` and memoised. There is no second
copy of the truth that could drift out of step with the tuning, which is why
changing one tuning preset updates labels, highlighting, voicings, playback and
the tuner together.

**Rendering.** The instrument is one SVG in one coordinate system. Markers are
memoised components, so playing a note re-renders one marker rather than the
neck. Scrolling and zooming are CSS transforms and native scrolling, not React
state churn.

**Adding a language** means copying `i18n/en.ts` and `i18n/music-en.ts`,
translating the values and listing the new locale in `i18n/index.ts`. Both files
are typed, so anything missed is a compile error rather than a blank label. See
section 12.5.

**Adding an instrument** means adding one object to `INSTRUMENTS` in
`core/instruments/definitions.ts` — string count, fret count, tunings, gauges
and a body style. Nothing else branches on instrument identity, so an 8-string
guitar, a 6-string bass or a ukulele needs no new rendering or engine code.

---

## 8. How the music-theory engine works

**Pitch is an integer.** Everything internal is a MIDI note number: C4 = 60,
A4 = 69. Note *names* exist only at the edge, for display, and are always
derived. No part of the application manipulates note names as strings.

The functions that matter:

| Function | File | Meaning |
| --- | --- | --- |
| `noteNameToMidi("E2")` → `40` | `pitch.ts` | name → pitch |
| `midiToNote(40)` → `E2` | `pitch.ts` | pitch → name |
| `midiToFreq(40)` → `82.41 Hz` | `pitch.ts` | pitch → frequency |
| `freqToNearestNote(438)` → `A4, −7.9 cents` | `pitch.ts` | frequency → pitch + deviation |
| `midiAt(openMidis, string, fret)` | `fretboard.ts` | string + fret + tuning → pitch |
| `scalePitchClasses(root, scale)` | `scales.ts` | scale + root → pitch-class set |
| `chordPitchClasses(root, chord)` | `chords.ts` | chord + root → pitch-class set |
| `findVoicings(openMidis, root, chord)` | `voicing.ts` | tuning + chord → playable shapes |

**The fretboard.** A fret position is nothing more than
`openStringMidi + fretNumber`. There is no table of fret positions anywhere, so
there is nothing that could be right for standard tuning and wrong for anything
else. Fret *spacing* on screen uses the real equal-tempered rule
(`1 − 2^(−fret/12)`), which is why the 12th fret falls exactly halfway to the
bridge.

**Scale highlighting is by pitch class.** A note is highlighted when its pitch
class is in the scale's set — never by copying a standard-tuning pattern. In
Drop D the lowest string's highlighted frets shift to `0 2 5 7 9 12` for E minor
pentatonic, because the open string is now D, and the engine simply computes
that.

**Enharmonic spelling is systematic, not a table of exceptions.** Each scale and
chord carries two parallel arrays: chromatic `intervals` (semitones) and generic
`degrees` (which letter the note is written on). The degree fixes the letter and
the semitone count then fixes the accidental — exactly how notation works. From
that one rule, with no special cases:

- B♭ major spells `Bb C D Eb F G A`, never `A# C D D# F G A`.
- F♯ major spells `F# G# A# B C# D# E#`, including the E♯.
- The A blues scale spells `A C D Eb E G`, with the ♭5 and the ♮5 on the same
  letter, as it is actually written.
- C°7 spells `C Eb Gb Bbb`, with the double flat.

Notes outside the current key fall back to the key's own accidental side, so a
fretboard in E♭ minor never shows a stray `A#` beside a `Bb`. Picking a root of
`Bb` rather than `A#` is how you choose the key's spelling.

**Chords versus scales.** The interface keeps them visibly separate: a chord is
the few notes you fret together, a scale is the note pool you solo with. The
chord panel lists scales that fit the selected chord, and each suggestion is
verified to contain *every* chord tone before it is offered — so a dominant 7th
is never paired with a plain major scale.

---

## 9. How alternate tunings are handled

This is the part worth being precise about, because it is where fretboard tools
usually go wrong.

**There are no stored chord shapes in this project.** `findVoicings()` searches
the fretboard: for each hand position along the neck it enumerates, per string,
the frets whose *actual sounding pitch class* belongs to the chord, plus the
open string and "muted". It prunes anything needing more than four fingers or a
stretch wider than four frets, then scores what survives for playability — root
in the bass, fewer fingers, lower on the neck, fuller voicing.

Consequences, all of them tested:

- In standard tuning the search rediscovers the shapes players know — the open
  C (`x32010`), E minor (`022000`), A minor (`x02210`), D (`xx0232`),
  E7 (`020100`), Cmaj7 (`x32000`). Nobody typed them in.
- In D standard it **does not** offer `022000` as E minor, because in that
  tuning those frets sound a D minor chord. It offers that shape under D minor
  instead, where it belongs. A familiar shape is never mislabelled.
- Power chords are located by pitch, not by a fret offset. In standard tuning
  the fifth lands two frets up on the next string; at the guitar's B string,
  where the interval between strings is a major third rather than a fourth, the
  same search produces a three-fret offset instead; and in Drop D it finds the
  one-finger shape with all three strings at the same fret. One piece of code,
  no special cases.
- If a chord genuinely cannot be fingered in the current tuning, the panel says
  so plainly instead of showing something that sounds like a different chord.

Every shape is reported with the notes it actually sounds, computed from the
live tuning, together with any chord tone it had to omit.

The same principle runs through the rest: playback uses the voicing's computed
MIDI numbers, the tuner compares against the current tuning's open strings, and
the fretboard labels come from `openStringMidi + fret`.

---

## 10. How the audio works

Notes are **synthesised, not sampled** — there are no audio files to download
and no licensing questions.

The model is Karplus–Strong: a short burst of filtered noise circulates in a
delay line one period long, losing a little energy and a little treble on each
lap, which is what a plucked string does. Each note is rendered *offline* into a
sample buffer rather than wired as a live Web Audio feedback loop, because a
`DelayNode` inside a cycle is quantised to a 128-sample block — that would cap
usable pitch at about 344 Hz and detune everything above it. Rendering the delay
line in JavaScript gives sample-accurate fractional delay, and the tests confirm
every note from a 31 Hz B0 — below anything the shipped instruments reach, kept
as the synthesiser's lower bound — to the 21st fret of a guitar's top E is in
tune **within 5 cents**, at 44.1, 48 and 96 kHz.

Each rendered note then passes a short EQ chain standing in for the instrument
body — different for guitar and bass — and a limiter, so a six-string strum does
not clip. Buffers are cached per pitch, so repeated notes cost nothing.

Strumming is scheduled on the audio clock against a single reading of
`currentTime`, so the sweep is exactly even. A down strum runs from the
lowest-pitched string upward, an up strum the other way, and muted strings are
skipped entirely, so they make no sound. Thin strings are rendered brighter than
thick ones, which is part of why a down strum and an up strum sound different
rather than merely reversed.

---

## 11. How the tuner works

1. **Capture.** `TunerEngine` calls `getUserMedia` — only on entering tuner mode
   — with echo cancellation, noise suppression and automatic gain control
   explicitly **off**, because all three distort a sustained musical tone enough
   to move its detected pitch. Frames of 8192 samples (≈170 ms at 48 kHz) are
   read from an `AnalyserNode`, which is long enough to hold several periods of
   a 31 Hz low B.

2. **Conditioning.** The frame's mean is subtracted and anything below half
   the lowest note being searched for is rolled off. A microphone with a DC
   bias adds a constant that the level gate counts as signal and that then
   dominates the correlation — before this was added, a 2% offset produced a
   confident reading three octaves out. At the bass's lowest open string the
   roll-off costs under a decibel.

3. **Gating.** A frame is analysed only if it is louder than the room. The gate
   follows the room rather than sitting at a fixed level: about 10 dB above the
   **quietest** of the last four seconds, floored at −72 dBFS and capped at
   −48 dBFS. The quietest frame rather than the average, because an average is
   dragged up by the note being played and the gate then cuts the note off
   during its own decay. A four-second warm-up at the floor, so someone who
   opens the tuner and plays immediately is not gated by their own first note.
   A ceiling, so a sustained note never becomes its own background. The gate is
   not what rejects noise — the clarity threshold is, and pink and white noise
   are rejected at every level tested.

4. **Detection.** `detectPitch()` uses the McLeod normalised square difference
   function, the normalised cousin of autocorrelation. It takes the *first*
   strong peak rather than the tallest: a periodic signal correlates just as
   well at twice its period, and "tallest wins" is exactly what makes cheap
   tuners read an octave low on a bass string. The work is done in two stages —
   a decimated pass (with a four-pole anti-aliasing filter) to find the period
   cheaply, then a refinement at the full sample rate with parabolic
   interpolation, which brings the estimate to about a cent. A median filter
   over the last five frames keeps the needle from twitching.

5. **Interpretation.** `analysis.ts` turns the frequency into a reading: the
   nearest chromatic note, and the deviation in cents from the nearest string of
   **the tuning currently selected** — so Drop C, E♭ standard or a fully custom
   tuning works with no special case. You can pin a specific string instead of
   letting it choose, and clicking a string also plays its reference pitch.

6. **Display.** Note name, exact frequency, target frequency, signed cents, a
   needle, and the verdict written out in words ("Flat by 9 cents — tighten the
   string"), so nothing depends on colour alone. ±5 cents counts as in tune.

**Sensitivity.** A string played softly used to register as silence: the level
gate discarded signals the detector still read perfectly. It now detects a pluck
at **1/500th of full strength** (−70 dBFS), 50 times quieter than before, with
the pitch still accurate to a cent. Nothing about the detector changed — it was
never being given the signal.

Verified end to end in a real browser by feeding the application a synthesised
guitar note as its microphone input. Seventeen cases — every open string of the
guitar and the bass, a G string 18 cents flat, a B string 25 cents sharp, and
Drop D's low string reading against D2 rather than E2, the same tone at a
forty-fifth and a hundred-and-twentieth of the usual level, and a microphone
with a 2% DC offset — were each identified correctly, and the detected frequency
equalled the input to the two decimals the readout shows.

### The tuner camera

Entering tuner mode does not open a popup. The current zoom level and
horizontal scroll position are **stored**, then a single CSS transform
translates and scales the entire instrument so the headstock ends up enlarged
and framed, with the tuner readout beside it and the tuning pegs lighting up as
each string comes into tune. The stage grows to make room. Leaving tuner mode
animates back along the same path and then restores the stored zoom and scroll
position — not a default.

---

## 12. What is supported

### Instruments

| Instrument | Strings | Frets | Default tuning | Tuning presets |
| --- | --- | --- | --- | --- |
| 6-string guitar | 6 | 21 | E2 A2 D3 G3 B3 E4 | 13 + custom |
| 4-string bass | 4 | 21 | E1 A1 D2 G2 | 7 + custom |

### Tuning presets

**6-string guitar**

| Preset | Open strings (lowest first) |
| --- | --- |
| Standard | E2 A2 D3 G3 B3 E4 |
| Half step down | Eb2 Ab2 Db3 Gb3 Bb3 Eb4 |
| D standard (whole step down) | D2 G2 C3 F3 A3 D4 |
| C# standard | C#2 F#2 B2 E3 G#3 C#4 |
| Drop D | D2 A2 D3 G3 B3 E4 |
| Drop C# | C#2 G#2 C#3 F#3 A#3 C#4 |
| Drop C | C2 G2 C3 F3 A3 D4 |
| Drop B | B1 F#2 B2 E3 G#3 C#4 |
| Drop A | A1 E2 A2 D3 F#3 B3 |
| Open G | D2 G2 D3 G3 B3 D4 |
| Open D | D2 A2 D3 F#3 A3 D4 |
| Open E | E2 B2 E3 G#3 B3 E4 |
| DADGAD | D2 A2 D3 G3 A3 D4 |
| Custom | any note you enter, per string |

**4-string bass**

| Preset | Open strings (lowest first) |
| --- | --- |
| Standard | E1 A1 D2 G2 |
| Half step down | Eb1 Ab1 Db2 Gb2 |
| D standard (whole step down) | D1 G1 C2 F2 |
| Drop D | D1 A1 D2 G2 |
| Drop C | C1 G1 C2 F2 |
| BEAD (low B) | B0 E1 A1 D2 |
| Tenor | A1 D2 G2 C3 |
| Custom | any note you enter, per string |

### Scales and modes

**Major / minor**

| Scale | Intervals (semitones from the root) | Notes on C |
| --- | --- | --- |
| Major (Ionian) | 0 2 4 5 7 9 11 | C D E F G A B |
| Natural minor (Aeolian) | 0 2 3 5 7 8 10 | C D Eb F G Ab Bb |
| Harmonic minor | 0 2 3 5 7 8 11 | C D Eb F G Ab B |
| Melodic minor (ascending) | 0 2 3 5 7 9 11 | C D Eb F G A B |
| Harmonic major | 0 2 4 5 7 8 11 | C D E F G Ab B |

**Modes**

| Scale | Intervals (semitones from the root) | Notes on C |
| --- | --- | --- |
| Ionian | 0 2 4 5 7 9 11 | C D E F G A B |
| Dorian | 0 2 3 5 7 9 10 | C D Eb F G A Bb |
| Phrygian | 0 1 3 5 7 8 10 | C Db Eb F G Ab Bb |
| Lydian | 0 2 4 6 7 9 11 | C D E F# G A B |
| Mixolydian | 0 2 4 5 7 9 10 | C D E F G A Bb |
| Aeolian | 0 2 3 5 7 8 10 | C D Eb F G Ab Bb |
| Locrian | 0 1 3 5 6 8 10 | C Db Eb F Gb Ab Bb |
| Lydian dominant | 0 2 4 6 7 9 10 | C D E F# G A Bb |
| Phrygian dominant | 0 1 4 5 7 8 10 | C Db E F G Ab Bb |
| Altered (super-Locrian) | 0 1 3 4 6 8 10 | C Db Eb Fb Gb Ab Bb |

**Pentatonic**

| Scale | Intervals (semitones from the root) | Notes on C |
| --- | --- | --- |
| Major pentatonic | 0 2 4 7 9 | C D E G A |
| Minor pentatonic | 0 3 5 7 10 | C Eb F G Bb |
| Hirajoshi | 0 2 3 7 8 | C D Eb G Ab |

**Blues**

| Scale | Intervals (semitones from the root) | Notes on C |
| --- | --- | --- |
| Blues (minor) | 0 3 5 6 7 10 | C Eb F Gb G Bb |
| Blues (major) | 0 2 3 4 7 9 | C D Eb E G A |

**Symmetric**

| Scale | Intervals (semitones from the root) | Notes on C |
| --- | --- | --- |
| Whole tone | 0 2 4 6 8 10 | C D E F# G# A# |
| Diminished (half-whole) | 0 1 3 4 6 7 9 10 | C Db Eb E Gb G A Bb |
| Diminished (whole-half) | 0 2 3 5 6 8 9 11 | C D Eb F Gb Ab A B |
| Chromatic | 0 1 2 3 4 5 6 7 8 9 10 11 | C Db D Eb E F Gb G Ab A Bb B |

**Exotic**

| Scale | Intervals (semitones from the root) | Notes on C |
| --- | --- | --- |
| Hungarian minor | 0 2 3 6 7 8 11 | C D Eb F# G Ab B |
| Double harmonic (Byzantine) | 0 1 4 5 7 8 11 | C Db E F G Ab B |
| Bebop dominant | 0 2 4 5 7 9 10 11 | C D E F G A Bb B |

### Chords

**Triads**

| Chord | Symbol on C | Intervals | Notes on C |
| --- | --- | --- | --- |
| Major | C | 0 4 7 | C E G |
| Minor | Cm | 0 3 7 | C Eb G |
| Diminished | Cdim | 0 3 6 | C Eb Gb |
| Augmented | Caug | 0 4 8 | C E G# |
| Major 6th | C6 | 0 4 7 9 | C E G A |
| Minor 6th | Cm6 | 0 3 7 9 | C Eb G A |

**Sevenths**

| Chord | Symbol on C | Intervals | Notes on C |
| --- | --- | --- | --- |
| Dominant 7th | C7 | 0 4 7 10 | C E G Bb |
| Major 7th | Cmaj7 | 0 4 7 11 | C E G B |
| Minor 7th | Cm7 | 0 3 7 10 | C Eb G Bb |
| Minor 7th flat 5 (half-diminished) | Cm7b5 | 0 3 6 10 | C Eb Gb Bb |
| Diminished 7th | Cdim7 | 0 3 6 9 | C Eb Gb Bbb |
| Minor major 7th | CmMaj7 | 0 3 7 11 | C Eb G B |
| Dominant 7th suspended 4th | C7sus4 | 0 5 7 10 | C F G Bb |

**Suspended**

| Chord | Symbol on C | Intervals | Notes on C |
| --- | --- | --- | --- |
| Suspended 2nd | Csus2 | 0 2 7 | C D G |
| Suspended 4th | Csus4 | 0 5 7 | C F G |

**Power**

| Chord | Symbol on C | Intervals | Notes on C |
| --- | --- | --- | --- |
| Power chord (root + 5th) | C5 | 0 7 | C G |
| Power chord (root + 5th + octave) | C5 | 0 7 12 | C G C |

**Extended**

| Chord | Symbol on C | Intervals | Notes on C |
| --- | --- | --- | --- |
| Added 9th | Cadd9 | 0 4 7 14 | C E G D |
| Dominant 9th | C9 | 0 4 7 10 14 | C E G Bb D |
| Minor 9th | Cm9 | 0 3 7 10 14 | C Eb G Bb D |
| Major 9th | Cmaj9 | 0 4 7 11 14 | C E G B D |

---

### Languages

| Language | Shown in the picker as | `<html lang>` |
| --- | --- | --- |
| English | English | `en` |
| Korean | 한국어 | `ko` |
| Japanese | 日本語 | `ja` |
| Simplified Chinese | 简体中文 | `zh-Hans` |
| Traditional Chinese | 繁體中文 | `zh-Hant` |
| Spanish | Español | `es` |

Pick a language from the header. On a first visit the browser's own language
preference is used, and the choice is then remembered with every other setting.

Each language covers the complete interface — including the accessible name of
every fretboard position, the tuner's readings, the help bubbles and the crash
screen — and the complete catalogues: all 27 scales, all 21 chord types, their
one-line descriptions, the group headings and the tuning preset names. Note
letters (A–G, ♯, ♭) are left alone, because they are written the same way in all
six languages.

Only the script a language needs is downloaded: choosing Korean, Japanese or
Chinese injects one Google Fonts link for that script and sets `<html lang>`,
which is what tells the browser which Han glyph variants to draw. That is why
Simplified and Traditional Chinese are separate languages here rather than one
"Chinese" with text converted between them.

Messages that embed a value are written as functions rather than templates with
holes, so each language can put the number, the note name and the string number
where its own grammar wants them:

```ts
// en.ts
'fretboard.cell': ({ note, string, where }) => `${note}, string ${string}, ${where}`,
// ja.ts
'fretboard.cell': ({ note, string, where }) => `${note}、${string}弦、${where}`,
```

## 13. Accessibility

- The fretboard is a keyboard-navigable grid: arrow keys move between positions,
  Home and End jump to the nut and the last fret, Enter or Space plays. The
  current position is announced.
- Every control has a real accessible name; the tuner meter exposes its reading
  through `role="meter"` and live regions.
- Nothing depends on colour alone: root notes are **squares**, scale notes are
  **circles**, muted strings carry an **✕**, and the tuner's verdict is written
  out in words.
- Visible focus rings throughout, a skip link to the fretboard, and help text on
  the controls a beginner would not recognise.
- Honours `prefers-reduced-motion`, including for the tuner camera.
- Light and dark themes, both with text contrast meeting WCAG AA.
- The neck is drawn the way a chord chart reads: **the lowest-pitched string at
  the bottom**, with the body and headstock oriented to match.
- The accessible names are translated along with everything else, so a screen
  reader in Korean or Japanese reads the fretboard in that language rather than
  announcing English inside a Korean page.

## 14. Settings that are remembered

Stored in `localStorage` under `fretlab.settings.v1`, with no account and no
backend: instrument, tuning (including custom tunings per instrument), scale and
root, chord and root, volume, zoom, note-label preference and style, theme,
strum direction and speed, language. Tuner mode is deliberately *not* remembered, so
reloading never reopens the microphone. If storage is blocked, the application
runs on defaults and says so.

## 15. Testing

```bash
npm test
```

**277 tests, all passing.** They cover the music-theory engine directly and the
application through its user interface.

| Area | Tests | Examples of what is checked |
| --- | --- | --- |
| Pitch (`pitch.test.ts`) | 14 | name ↔ MIDI round trip across the whole range; `midiToFreq` against published values; cents; nearest-note boundaries; malformed names rejected |
| Spelling (`spelling.test.ts`) | 10 | B♭ major, F♯ major with its E♯, modal spellings, the blues ♭5/♮5 on one letter, C°7's double flat, key-aware fretboard maps |
| Fretboard (`fretboard.test.ts`) | 22 | every tuning preset of both instruments; Drop D changes only one string; D standard shifts all six; custom tunings; scale highlighting moving with the tuning; tuning validation |
| Scales (`scales.test.ts`) | 15 | relative modes sharing one pitch-class set; harmonic vs melodic minor; pentatonics; blues; symmetric scales; degree labels |
| Chords (`chords.test.ts`) | 34 | every chord type's pitch classes; the voicing search finding real open shapes; **every returned shape verified to sound only the chord it claims**; shapes recalculated per tuning; power chords across 7 instrument/tuning combinations |
| Audio (`audio.test.ts`) | 13 | rendered notes in tune within 5 cents across both instruments' full ranges and three sample rates; harmonic content (not a sine); decay; determinism |
| Tuner (`tuner.test.ts`) | 34 | a string played softly, down to 1/500th of full strength and still accurate to a cent; a microphone with a DC offset; room noise and white noise still rejected at every level; the gate following the room, its warm-up, that a note cannot raise it, and its ceiling; the decibel signal meter; detection of every open string of every standard tuning; a 31 Hz low B; no octave errors; silence and noise rejected; cents deviation; targets following the current tuning |
| Translations (`i18n.test.ts`) | 75 | every language covering every interface key, scale, chord, category and tuning id; nothing blank; every message English parameterises still parameterised elsewhere, and still substituting its arguments; no English prose left in the four CJK catalogues; browser-language detection, including `zh-TW`/`zh-HK`/`zh-MO` as Traditional and `zh-CN`/`zh-SG`/`zh` as Simplified |
| Application (`app.test.tsx`) | 60 | the neck map drawing all 21 frets and moving the view by drag, press and keyboard; the wheel not zooming; the zoom slider; the guitar / bass switch moving to the top on a narrow screen; both instruments; tuning changes recalculating the rendered neck; the custom-tuning editor; chord shapes recalculated per tuning; the Drop D one-finger power chord; down vs up strum ordering; muted strings silent; strum speed; microphone requested only in tuner mode and released on exit; view saved and restored; persistence; keyboard navigation |

### Checks run in a real browser

`tools/` holds three optional scripts that drive the built application in
Chrome through Playwright. They are not part of `npm test` (they need a browser)
but were used to verify the application beyond what jsdom can show. Start
`npm run preview` first, then:

```bash
node tools/screenshots.mjs .shots   # renders every mode, theme and viewport
node tools/audio-check.mjs          # observes the real Web Audio graph
node tools/tuner-check.mjs          # feeds the tuner a synthesised note
node tools/catalogue.mjs            # regenerates the tables in section 12
```

## 15.1 All the text in one file

```bash
npm run texts
```

writes [docs/texts.md](docs/texts.md): every piece of text the application shows
or speaks, organised by the part of the page it belongs to, with all six
languages side by side and each placeholder named. It is the file to hand to a
translator or a reviewer. It is generated — the catalogues in `src/i18n/` stay
the source of truth — so edit the language file and run the command again.

## 15.2 Getting around the instrument

- **Move** along the neck with the small map of the neck above the instrument:
  drag the box, press anywhere on the map, or focus it and use the arrow keys,
  Home and End. Pushing the box against an end of the map carries on to the
  headstock or the body.
- **Zoom** with − and +, the slider under them, or a pinch on a touch screen.
- **The mouse wheel** scrolls the page, and only up and down. It never zooms or
  moves the instrument.
- **On a narrow screen** the guitar / bass switch sits at the top of the page.

## 15.3 The project report

`docs/` holds a written report on the build, in Markdown, Word and PDF form.
Regenerating it needs [pandoc](https://pandoc.org/) and Chrome:

```bash
npm run report
```


What they confirmed: no console errors in any mode; Noto Sans actually loading;
a real 3.3-second buffer with peak amplitude 0.92 produced per note; down and up
strums scheduling six sources in exactly opposite order at an even 32 ms apart;
the tuner camera transform applying on entry and clearing on exit; and the tuner
readings listed in section 11.

## 16. Licence and assets

The instrument graphics are built from the layered SVG drawings in
`reference/`, one folder per instrument, supplied with the project. They are
assembled into `src/components/fretboard/artwork.ts` by
`node tools/extract-artwork.mjs`; `reference/README.md` explains how, including
how the drawing's own fret lines are used to align it with FretLab's computed
fretboard.

Everything else is generated: the strings, note markers and fret numbers are
computed from the tuning, and all sound is synthesised at runtime, so there are
no samples. The interface typeface is [Noto Sans](https://fonts.google.com/noto/specimen/Noto+Sans), served by Google
Fonts under the SIL Open Font License, with a system-font fallback stack for
when it cannot be fetched.
