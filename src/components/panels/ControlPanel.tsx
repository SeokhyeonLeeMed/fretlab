/**
 * ControlPanel.tsx — instrument, tuning, scale and chord choosers.
 *
 * The scale and chord sections are deliberately presented as two separate
 * things with an explicit relationship between them, because conflating "a
 * chord" with "a scale" is the single most common confusion for a learner.
 */

import { useEffect, useMemo, useState } from 'react';
import { Card, Field, Help, Notice, Select, Switch, type Option } from '../ui/controls';
import { customTuningSeed, useStore } from '../../state/store';
import { ROOT_OPTIONS, useMusicContext } from '../../state/selectors';
import { SCALES, SCALE_CATEGORIES, getScale } from '../../core/theory/scales';
import { CHORDS, CHORD_CATEGORIES, getChord } from '../../core/theory/chords';
import { validateTuning } from '../../core/theory/fretboard';
import { FAMILIES, getInstrument, instrumentsOfFamily } from '../../core/instruments/definitions';
import { midiToNote, noteNameToMidi } from '../../core/theory/pitch';

export function ControlPanel() {
  const mode = useStore((s) => s.mode);
  // The scale and chord choosers only appear once they are what you are
  // looking at, so the Notes and Tuner views stay uncluttered.
  return (
    <>
      <InstrumentCard />
      <TuningCard />
      {(mode === 'scale' || mode === 'chord') && <ScaleCard />}
      {mode === 'chord' && <ChordCard />}
    </>
  );
}

function InstrumentCard() {
  const instrumentId = useStore((s) => s.instrumentId);
  const setInstrument = useStore((s) => s.setInstrument);
  const setFamily = useStore((s) => s.setFamily);
  const ctx = useMusicContext();
  const family = ctx.instrument.family;
  const siblings = instrumentsOfFamily(family);

  return (
    <Card title="Instrument" id="instrument">
      <div className="field">
        <span className="field-label" id="family-label">
          Type
        </span>
        <div className="segmented" role="group" aria-labelledby="family-label">
          {FAMILIES.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={f.id === family}
              onClick={() => setFamily(f.id)}
            >
              {f.name}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <span className="field-label" id="strings-label">
          Strings
        </span>
        <div className="segmented" role="group" aria-labelledby="strings-label">
          {siblings.map((i) => (
            <button
              key={i.id}
              type="button"
              aria-pressed={i.id === instrumentId}
              onClick={() => setInstrument(i.id)}
              title={`${i.name}, ${i.fretCount} frets`}
            >
              {i.stringCount}-string
            </button>
          ))}
        </div>
      </div>

      <p className="field-hint">
        {ctx.instrument.name} &middot; {ctx.instrument.stringCount} strings &middot;{' '}
        {ctx.instrument.fretCount} frets &middot; {ctx.instrument.scaleLengthIn}" scale
      </p>
    </Card>
  );
}

function TuningCard() {
  const instrumentId = useStore((s) => s.instrumentId);
  const tuningId = useStore((s) => s.tuningId);
  const setTuning = useStore((s) => s.setTuning);
  const setCustomTuning = useStore((s) => s.setCustomTuning);
  const ctx = useMusicContext();
  const instrument = getInstrument(instrumentId);

  const [draft, setDraft] = useState<string[]>(() => customTuningSeed(useStore.getState()));
  // Reseed the editor whenever the instrument or the preset changes, so it
  // always starts from what is actually on the fretboard.
  useEffect(() => {
    setDraft(customTuningSeed(useStore.getState()));
  }, [instrumentId, tuningId]);

  const validation = useMemo(() => validateTuning(draft, instrument.stringCount), [draft, instrument.stringCount]);

  const options: Option[] = [
    ...instrument.tunings.map((t) => ({ value: t.id, label: t.name, group: 'Presets' })),
    { value: 'custom', label: 'Custom tuning…', group: 'Presets' },
  ];

  const applyCustom = (): void => {
    if (!validation.ok) return;
    setCustomTuning(instrumentId, draft);
    setTuning('custom');
  };

  const shift = (semitones: number): void => {
    const next = draft.map((n) => {
      try {
        return midiToNote(noteNameToMidi(n) + semitones).full;
      } catch {
        return n;
      }
    });
    setDraft(next);
    if (validateTuning(next, instrument.stringCount).ok) {
      setCustomTuning(instrumentId, next);
      setTuning('custom');
    }
  };

  return (
    <Card title="Tuning" id="tuning">
      <Field
        label="Preset"
        help="Every note name, highlight, chord shape and tuner target is recalculated from the tuning you pick here."
      >
        {({ id, describedBy, labelledBy }) => (
          <Select
            id={id}
            describedBy={describedBy}
            labelledBy={labelledBy}
            value={tuningId}
            options={options}
            onChange={setTuning}
          />
        )}
      </Field>

      <p className="field-hint">
        Open strings, lowest first: <strong>{ctx.tuning.notes.join('  ')}</strong>
      </p>

      <details style={{ marginTop: 12 }}>
        <summary
          style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}
        >
          Custom tuning editor
        </summary>
        <div style={{ marginTop: 12 }}>
          <p className="field-hint" style={{ marginBottom: 8 }}>
            Give each string a note name with an octave, such as <code>D2</code> or{' '}
            <code>Bb1</code>. String 1 is the lowest-pitched string.
          </p>
          {draft.map((note, i) => (
            <div key={i} className="field" style={{ marginBottom: 8 }}>
              <label className="field-label" htmlFor={`cust-${i}`}>
                String {instrument.stringCount - i}
                {i === 0 ? ' (lowest)' : i === instrument.stringCount - 1 ? ' (highest)' : ''}
              </label>
              <input
                id={`cust-${i}`}
                className="text-input"
                value={note}
                spellCheck={false}
                aria-invalid={validation.errors[i] !== null}
                aria-describedby={validation.errors[i] ? `cust-${i}-e` : undefined}
                onChange={(e) => {
                  const next = [...draft];
                  next[i] = e.target.value;
                  setDraft(next);
                }}
              />
              {validation.errors[i] && (
                <span className="field-error" id={`cust-${i}-e`}>
                  {validation.errors[i]}
                </span>
              )}
            </div>
          ))}
          {!validation.ok && validation.message && (
            <Notice kind="error">{validation.message}</Notice>
          )}
          <div className="strum-row" style={{ marginTop: 10 }}>
            <button type="button" className="btn btn-primary" disabled={!validation.ok} onClick={applyCustom}>
              Apply custom tuning
            </button>
            <button type="button" className="btn btn-sm" onClick={() => shift(-1)} title="Lower every string a semitone">
              All &minus;1
            </button>
            <button type="button" className="btn btn-sm" onClick={() => shift(1)} title="Raise every string a semitone">
              All +1
            </button>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setDraft(customTuningSeed(useStore.getState()))}
            >
              Reset
            </button>
          </div>
        </div>
      </details>
    </Card>
  );
}

function ScaleCard() {
  const scaleRoot = useStore((s) => s.scaleRoot);
  const scaleId = useStore((s) => s.scaleId);
  const setScaleRoot = useStore((s) => s.setScaleRoot);
  const setScaleId = useStore((s) => s.setScaleId);
  const scale = getScale(scaleId);

  const scaleOptions: Option[] = SCALE_CATEGORIES.flatMap((cat) =>
    SCALES.filter((s) => s.category === cat).map((s) => ({
      value: s.id,
      label: s.name,
      group: cat,
    })),
  );

  return (
    <Card
      title="Scale / mode"
      id="scale"
    >
      <Field label="Root note" help="The root also decides the spelling: pick Bb for flat keys, F# for sharp keys.">
        {({ id, describedBy, labelledBy }) => (
          <Select
            id={id}
            describedBy={describedBy}
            labelledBy={labelledBy}
            value={scaleRoot}
            options={ROOT_OPTIONS.map((r) => ({ value: r, label: r }))}
            onChange={setScaleRoot}
          />
        )}
      </Field>
      <Field label="Scale or mode" hint={scale.about}>
        {({ id, describedBy, labelledBy }) => (
          <Select
            id={id}
            describedBy={describedBy}
            labelledBy={labelledBy}
            value={scaleId}
            options={scaleOptions}
            onChange={setScaleId}
          />
        )}
      </Field>
    </Card>
  );
}

function ChordCard() {
  const chordRoot = useStore((s) => s.chordRoot);
  const chordId = useStore((s) => s.chordId);
  const setChordRoot = useStore((s) => s.setChordRoot);
  const setChordId = useStore((s) => s.setChordId);
  const setScale = useStore((s) => s.setScale);
  const mode = useStore((s) => s.mode);
  const setMode = useStore((s) => s.setMode);
  const scaleOverlay = useStore((s) => s.scaleOverlayInChordMode);
  const setScaleOverlay = useStore((s) => s.setScaleOverlayInChordMode);
  const ctx = useMusicContext();
  const chord = getChord(chordId);

  const chordOptions: Option[] = CHORD_CATEGORIES.flatMap((cat) =>
    CHORDS.filter((c) => c.category === cat).map((c) => ({
      value: c.id,
      label: `${c.name}${c.symbol ? ` — ${chordRoot}${c.symbol}` : ` — ${chordRoot}`}`,
      group: cat,
    })),
  );

  return (
    <Card
      title="Chord"
      id="chord"
      action={
        mode !== 'chord' ? (
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => setMode('chord')}>
            Show shapes
          </button>
        ) : undefined
      }
    >
      <Field label="Root note">
        {({ id, describedBy, labelledBy }) => (
          <Select
            id={id}
            describedBy={describedBy}
            labelledBy={labelledBy}
            value={chordRoot}
            options={ROOT_OPTIONS.map((r) => ({ value: r, label: r }))}
            onChange={setChordRoot}
          />
        )}
      </Field>
      <Field label="Chord type" hint={chord.about}>
        {({ id, describedBy, labelledBy }) => (
          <Select
            id={id}
            describedBy={describedBy}
            labelledBy={labelledBy}
            value={chordId}
            options={chordOptions}
            onChange={setChordId}
          />
        )}
      </Field>

      {/* The chord/scale relationship, stated rather than implied. */}
      <div style={{ marginTop: 14 }}>
        <div className="field-label" style={{ marginBottom: 6 }}>
          Scales that fit {ctx.chordName} <Help text="A chord is the few notes you fret together. A scale is the larger pool of notes you can solo with over it. These scales contain every note of the chord." />
        </div>
        {ctx.suggestions.length === 0 ? (
          <p className="field-hint">
            No catalogued scale contains every note of this chord. Use chord mode to see its tones
            on the fretboard instead.
          </p>
        ) : (
          <div className="chip-row">
            {ctx.suggestions.slice(0, 5).map((s) => {
              const scale = getScale(s.scaleId);
              return (
                <button
                  key={s.scaleId}
                  type="button"
                  className="chip chip-accent"
                  title={`${chordRoot} ${scale.name} — ${s.reason}`}
                  onClick={() => {
                    setScale(chordRoot, s.scaleId);
                    setMode('scale');
                  }}
                >
                  {chordRoot} {scale.name}
                </button>
              );
            })}
          </div>
        )}
        <p className="field-hint" style={{ marginTop: 8 }}>
          Picking one switches the fretboard to that <em>scale</em>, rooted on {chordRoot}.
        </p>
      </div>

      <div style={{ marginTop: 12 }}>
        <Switch
          label="Dim the scale behind chord shapes"
          checked={scaleOverlay}
          onChange={setScaleOverlay}
          help="Shows the selected scale faintly underneath the chord shape so you can see how they relate."
        />
      </div>
    </Card>
  );
}
