/**
 * en.ts — the English message catalogue.
 *
 * This file is the source of truth for the message keys: every other locale
 * is typed as `Messages`, so a missing or misspelled key is a compile error
 * rather than a blank label at runtime.
 *
 * Values may be plain strings or functions taking named arguments, which
 * keeps word order free for each language instead of forcing it to match
 * English.
 */

export const en = {
  // ---- language ----------------------------------------------------------
  'lang.name': 'English',
  'lang.label': 'Language',

  // ---- header ------------------------------------------------------------
  'app.tagline': 'guitar & bass fretboard',
  'app.skipToFretboard': 'Skip to the fretboard',
  'mode.label': 'Interaction mode',
  'mode.normal': 'Notes',
  'mode.scale': 'Scale',
  'mode.chord': 'Chords',
  'mode.tuner': 'Tuner',
  'mode.normal.help': 'Click any position to hear the note it produces',
  'mode.scale.help': 'Highlight a scale or mode across the whole neck',
  'mode.chord.help': 'Show calculated chord shapes and strum them',
  'mode.tuner.help': 'Move the view to the headstock and tune by microphone',
  'theme.label': 'Colour theme',
  'theme.dark': 'Dark',
  'theme.light': 'Light',

  // ---- instrument --------------------------------------------------------
  'instrument.title': 'Instrument',
  'instrument.type': 'Type',
  'instrument.strings': 'Strings',
  'instrument.stringCount': ({ n }: { n: number }) => `${n}-string`,
  'instrument.option.help': ({ name, frets }: { name: string; frets: number }) =>
    `${name}, ${frets} frets`,
  'instrument.summary': ({
    name,
    strings,
    frets,
    scale,
  }: {
    name: string;
    strings: number;
    frets: number;
    scale: number;
  }) => `${name} · ${strings} strings · ${frets} frets · ${scale}" scale`,
  'family.guitar': 'Guitar',
  'family.bass': 'Bass',
  'instrument.guitar6': '6-string guitar',
  'instrument.bass4': '4-string bass',

  // ---- tuning ------------------------------------------------------------
  'tuning.title': 'Tuning',
  'tuning.preset': 'Preset',
  'tuning.preset.help':
    'Every note name, highlight, chord shape and tuner target is recalculated from the tuning you pick here.',
  'tuning.custom': 'Custom tuning…',
  'tuning.openStrings': 'Open strings, lowest first:',
  'tuning.editor': 'Custom tuning editor',
  'tuning.editor.hint':
    'Give each string a note name with an octave, such as D2 or Bb1. String 1 is the lowest-pitched string.',
  'tuning.string': ({ n }: { n: number }) => `String ${n}`,
  'tuning.string.lowest': ({ n }: { n: number }) => `String ${n} (lowest)`,
  'tuning.string.highest': ({ n }: { n: number }) => `String ${n} (highest)`,
  'tuning.apply': 'Apply custom tuning',
  'tuning.down': 'All −1',
  'tuning.up': 'All +1',
  'tuning.down.help': 'Lower every string a semitone',
  'tuning.up.help': 'Raise every string a semitone',
  'tuning.reset': 'Reset',
  'tuning.invalidNote': 'Use a note name with an octave, such as E2 or Bb1.',
  'tuning.wrongCount': ({ expected, got }: { expected: number; got: number }) =>
    `This instrument has ${expected} strings but ${got} were given.`,
  'tuning.someInvalid': 'One or more strings are not valid note names.',
  'tuning.name.custom': ({ notes }: { notes: string }) => `Custom — ${notes}`,

  // ---- scale -------------------------------------------------------------
  'scale.title': 'Scale / mode',
  'scale.root': 'Root note',
  'scale.root.help':
    'The root also decides the spelling: pick Bb for flat keys, F# for sharp keys.',
  'scale.which': 'Scale or mode',

  // ---- chord -------------------------------------------------------------
  'chord.title': 'Chord',
  'chord.root': 'Root note',
  'chord.type': 'Chord type',
  'chord.fitting': ({ chord }: { chord: string }) => `Scales that fit ${chord}`,
  'chord.fitting.help':
    'A chord is the few notes you fret together. A scale is the larger pool of notes you can solo with over it. These scales contain every note of the chord.',
  'chord.fitting.none':
    'No catalogued scale contains every note of this chord. Use chord mode to see its tones on the fretboard instead.',
  'chord.fitting.hint': ({ root }: { root: string }) =>
    `Picking one switches the fretboard to that scale, rooted on ${root}.`,
  'chord.overlay': 'Dim the scale behind chord shapes',
  'chord.overlay.help':
    'Shows the selected scale faintly underneath the chord shape so you can see how they relate.',
  'chord.showOnFretboard': 'Show on fretboard',
  'chord.showShapes': 'Show shapes',

  // ---- chord panel -------------------------------------------------------
  'chords.title': ({ chord }: { chord: string }) => `Chord — ${chord}`,
  'chords.none.title': 'No playable shape in this tuning',
  'chords.none.body': ({
    chord,
    instrument,
    tuning,
  }: {
    chord: string;
    instrument: string;
    tuning: string;
  }) =>
    `${chord} cannot be fingered on ${instrument} tuned ${tuning} within a four-fret stretch. Try a different chord type, a different root, or another tuning — rather than showing you a shape that would sound like something else.`,
  'chords.found': ({ n, chord, tuning }: { n: number; chord: string; tuning: string }) =>
    `${n} shape${n === 1 ? '' : 's'} found for ${chord} in ${tuning}. Numbers are fret numbers; ✕ means do not play that string.`,
  'chords.shapes': 'Chord shapes',
  'chords.barre': ({ fret }: { fret: number }) => `barre ${fret}`,
  'chords.noBarre': ({ chord }: { chord: string }) =>
    `No barre shape exists for ${chord} in this tuning: a barre needs two chord tones at the same fret on different strings, and this chord's intervals never line up that way here.`,
  'chords.sounds': 'This shape actually sounds',
  'chords.sounds.help':
    'Computed from the current tuning, not assumed from a standard-tuning shape.',
  'chords.tones': ({ tones }: { tones: string }) => `Chord tones: ${tones}`,
  'chords.omits': ({ tones }: { tones: string }) =>
    `omits ${tones} (there is no room for every tone in this shape)`,
  'chords.inverted': 'not in root position: the bass note is not the root',
  'chords.fingers': ({ n }: { n: number }) =>
    n === 0 ? 'no fingers needed' : `${n} finger${n === 1 ? '' : 's'}`,
  'voicing.allOpen': 'All open',
  'voicing.openPosition': 'Open position',
  'voicing.position': ({ fret }: { fret: number }) => `Position ${fret}`,
  'voicing.barre': ({ fret }: { fret: number }) => `Barre ${fret}`,
  'voicing.power': ({ string, fret }: { string: number; fret: number }) =>
    `String ${string}, fret ${fret}`,

  // ---- strumming ---------------------------------------------------------
  'strum.play': 'Play the chord',
  'strum.play.help':
    'Down starts from the lowest string and sweeps up; up starts from the highest string and sweeps down. Muted strings stay silent.',
  'strum.together': '▶ Together',
  'strum.down': '↓ Down strum',
  'strum.up': '↑ Up strum',
  'strum.direction': 'Default strum direction',
  'strum.mode.normal': 'Together',
  'strum.mode.down': 'Down',
  'strum.mode.up': 'Up',
  'strum.speed': 'Strum speed',
  'strum.speed.preset': 'Strum speed preset',
  'strum.slow': 'Slow',
  'strum.normal': 'Normal',
  'strum.fast': 'Fast',
  'strum.custom': 'Custom',
  'strum.gap': 'Gap between strings',
  'strum.gap.help': ({ slow, normal, fast }: { slow: number; normal: number; fast: number }) =>
    `Slow is ${slow} ms, normal ${normal} ms, fast ${fast} ms between adjacent strings.`,
  'strum.ms': ({ ms }: { ms: number }) => `${ms} ms`,

  // ---- information panel -------------------------------------------------
  'info.title': 'Current selection',
  'info.note': 'Selected note',
  'info.note.hint': 'Click or tap anywhere on the fretboard to hear a note.',
  'info.note.detail': ({
    string,
    fret,
    freq,
    midi,
  }: {
    string: number;
    fret: string;
    freq: string;
    midi: number;
  }) => `String ${string} · ${fret} · ${freq} Hz · MIDI ${midi}`,
  'info.open': 'open',
  'info.fret': ({ n }: { n: number }) => `fret ${n}`,
  'info.scale': 'Selected scale',
  'info.scale.notes': 'Notes of the scale',
  'info.scale.detail': ({ n }: { n: number }) =>
    `${n} notes · a pool to play over the chord`,
  'info.scale.shown': 'shown on the fretboard',
  'info.chord': 'Selected chord',
  'info.chord.notes': 'Notes of the chord',
  'info.chord.detail': ({ name, n }: { name: string; n: number }) =>
    `${name} · ${n} notes played together`,
  'info.chord.shown': 'shapes shown on the fretboard',
  'info.tuning': 'Tuning',
  'legend.label': 'Marker legend',
  'legend.root': 'Root note (square)',
  'legend.scale': 'Scale note (circle)',
  'legend.chord': 'Chord tone',
  'legend.selected': 'Last played',
  'legend.faint': 'Faint: outside the scale',
  'legend.muted': '✕ at the nut: muted string',

  // ---- sound & display ---------------------------------------------------
  'audio.title': 'Sound & display',
  'audio.problem': 'Audio problem',
  'audio.volume': 'Volume',
  'audio.a4': 'Reference pitch',
  'audio.a4.value': ({ hz }: { hz: number }) => `A4 = ${hz} Hz`,
  'audio.a4.help':
    "Concert pitch. Everything follows it: the notes you play, the tuner's targets and the frequencies shown. 440 Hz is standard; 432 and 415 Hz are also used.",
  'audio.zoom': 'Fretboard zoom',
  'audio.zoom.help': 'You can also pinch on a touch screen, or hold Ctrl and scroll.',
  'audio.labels': 'Show note labels',
  'audio.labels.help':
    'Turns the text inside each marker on or off. Marker shape and colour stay.',
  'audio.labelStyle': 'Label style',
  'audio.labelStyle.note': 'Note names',
  'audio.labelStyle.degree': 'Degrees',
  'audio.labelStyle.note.help': 'E, F#, G…',
  'audio.labelStyle.degree.help': '1, ♭3, 5…',
  'audio.showOutside': 'Show notes outside the scale',
  'audio.showOutside.help':
    'Keeps the remaining positions faintly visible so you can still click them.',
  'audio.stop': 'Stop all sound',
  'audio.reset': 'Reset settings',
  'audio.reset.confirm': 'Reset every FretLab setting to its default?',
  'audio.persist.yes':
    'Your instrument, tuning, scale, theme and audio settings are remembered in this browser. No account, no server.',
  'audio.persist.no':
    'This browser is blocking local storage, so settings will reset when you reload.',
  'audio.firstClick.title': 'Sound starts on your first click',
  'audio.firstClick.body':
    'Browsers only allow audio after a real interaction, so the first position you click also starts the audio engine. Everything is synthesised in the page — there are no audio files to download.',

  // ---- stage -------------------------------------------------------------
  'stage.label': 'Instrument view',
  'stage.controls': 'Controls',
  'stage.zoomOut': 'Zoom out',
  'stage.zoomIn': 'Zoom in',
  'stage.zoom': 'Zoom',
  'stage.map': 'Where you are on the instrument',
  'stage.map.help': 'Drag the box, or use the arrow keys, to move along the instrument',
  'stage.reset': 'Reset',
  'stage.reset.help': 'Back to 100%',
  'stage.whole': 'Whole instrument',
  'stage.whole.help': 'Zoom out to show the whole instrument',
  'stage.hint':
    'Drag the box on the small neck to move along the instrument · use the slider to zoom · click a position to hear it',
  'stage.hint.tuner':
    'Tuner mode: the view is parked on the headstock. Closing it restores your previous position and zoom.',
  'fretboard.label': ({ instrument }: { instrument: string }) => `${instrument} fretboard`,
  'fretboard.grid': ({ note }: { note: string }) =>
    `Fretboard. Arrow keys move between positions, Enter plays. Current position: ${note}.`,
  'fretboard.current': ({ note }: { note: string }) => `Fretboard, currently on ${note}`,
  'fretboard.cell': ({ note, string, where }: { note: string; string: number; where: string }) =>
    `${note}, string ${string}, ${where}`,

  // ---- tuner -------------------------------------------------------------
  'tuner.title': 'Chromatic tuner',
  'tuner.listening': 'Listening…',
  'tuner.detected': 'Detected',
  'tuner.target': 'Target',
  'tuner.deviation': 'Deviation',
  'tuner.cents': ({ cents }: { cents: string }) => `${cents} cents`,
  'tuner.tuningTo': 'Tuning to',
  'tuner.pinned': ({ note }: { note: string }) => `Listening for the ${note} string only.`,
  'tuner.followAny': 'Follow any string',
  'tuner.playOne': 'Play a single open string',
  'tuner.inTune': 'In tune',
  'tuner.flat': ({ cents }: { cents: number }) => `▲ Flat by ${cents} cents — tighten the string`,
  'tuner.sharp': ({ cents }: { cents: number }) => `▼ Sharp by ${cents} cents — loosen the string`,
  'tuner.wrongString': ({ played, target }: { played: string; target: string }) =>
    `That is ${played}, not the ${target} string`,
  'tuner.targetString': 'Target string',
  'tuner.auto': 'Auto',
  'tuner.auto.help': 'Compare against whichever string is closest',
  'tuner.string.help': ({ n, note }: { n: number; note: string }) =>
    `String ${n}: ${note}. Plays the reference pitch, and pins the tuner to this string; click again to follow any string.`,
  'tuner.pinHint': 'Pick a string to pin it as the target and hear its reference pitch, or leave it on Auto.',
  'tuner.pinHint.help':
    'The targets come from the tuning selected in the sidebar, so the tuner works for Drop D, Eb standard, a custom tuning and everything else.',
  'tuner.close': 'Close tuner',
  'tuner.meter.noSignal': 'no signal',
  'tuner.meter.reading': ({ cents, verdict }: { cents: string; verdict: string }) =>
    `${cents} cents ${verdict}`,
  'tuner.waiting.title': 'Waiting for microphone permission',
  'tuner.waiting.body':
    'Your browser is asking whether FretLab may use the microphone. Choose Allow to start tuning. Nothing is recorded, uploaded or stored: the audio is analysed in the page and discarded.',
  'tuner.ready.title': 'Tuner ready',
  'tuner.ready.body':
    'The tuner listens through your microphone. Permission is requested only now, when you actually open the tuner.',
  'tuner.start': 'Start listening',
  'tuner.retry': 'Try again',
  'tuner.error.denied': 'Microphone permission denied',
  'tuner.error.noDevice': 'No microphone found',
  'tuner.error.insecure': 'A secure connection is required',
  'tuner.error.unsupported': 'This browser cannot capture audio',
  'tuner.error.other': 'The tuner could not start',
  'tuner.error.unknown': 'An unknown problem stopped the tuner.',
  'tuner.msg.denied':
    'Microphone permission was denied. Allow microphone access for this site in your browser settings, then start the tuner again.',
  'tuner.msg.noDevice': 'No microphone was found. Connect an input device and try again.',
  'tuner.msg.insecure':
    'Microphone access needs a secure context. Open the site over HTTPS, or on http://localhost during development.',
  'tuner.msg.unsupported':
    'This browser does not expose microphone input, so the tuner cannot listen. Note playback still works.',
  'tuner.msg.failed': ({ reason }: { reason: string }) =>
    `The microphone could not be opened: ${reason}`,
  'tuner.msg.audioInit': ({ reason }: { reason: string }) =>
    `Audio input could not be initialised: ${reason}`,

  // ---- audio engine errors ----------------------------------------------
  'audio.err.unsupported':
    'This browser does not support the Web Audio API, so playback is unavailable.',
  'audio.err.init': ({ reason }: { reason: string }) =>
    `Audio could not be initialised: ${reason}`,
  'audio.err.playback': ({ reason }: { reason: string }) => `Playback failed: ${reason}`,

  // ---- crash screen ------------------------------------------------------
  'crash.title': 'FretLab ran into a problem',
  'crash.body':
    'Something in the interface failed to render. The details are in your browser console.',
  'crash.reload': 'Reload the page',
  'crash.clear': 'Clear saved settings and reload',

  // ---- footer ------------------------------------------------------------
  'footer.note':
    'FretLab — all note names, scales, chord shapes and tuner targets are calculated from the selected tuning.',

  // ---- help marker -------------------------------------------------------
  'help.prefix': ({ text }: { text: string }) => `Help: ${text}`,
} as const;

/**
 * The message contract. Plain entries widen to `string` so a translation need
 * not repeat the English wording, while entries that take arguments keep their
 * exact parameter type — so a locale cannot quietly drop a value out of a
 * sentence.
 */
export type Messages = {
  [K in keyof typeof en]: (typeof en)[K] extends (args: infer A) => string
    ? (args: A) => string
    : string;
};
