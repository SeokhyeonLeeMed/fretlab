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
import {
  categoryText,
  chordText,
  reasonText,
  scaleText,
  tuningText,
  useLocale,
  useT,
} from '../../i18n';
import type { TFunction } from '../../i18n';
import { useNarrowLayout } from '../../hooks/useNarrowLayout';

/** The instrument's own name, which lives in the message catalogue. */
function instrumentName(t: TFunction, id: string): string {
  return id === 'bass4' ? t('instrument.bass4') : t('instrument.guitar6');
}

export function ControlPanel() {
  const mode = useStore((s) => s.mode);
  // The scale and chord choosers only appear once they are what you are
  // looking at, so the Notes and Tuner views stay uncluttered.
  return (
    <>
      <InstrumentCard />
      <TuningCard />
      {mode === 'scale' && <ScaleCard />}
      {mode === 'chord' && <ChordCard />}
    </>
  );
}

/**
 * Guitar or bass. Its own component because it is shown in one of two places:
 * in the instrument card on a wide screen, and at the very top of the page on
 * a narrow one, where the card has dropped below the instrument.
 */
export function FamilySwitch() {
  const t = useT();
  const setFamily = useStore((s) => s.setFamily);
  const family = useMusicContext().instrument.family;

  return (
    <div className="field">
      <span className="field-label" id="family-label">
        {t('instrument.type')}
      </span>
      <div className="segmented" role="group" aria-labelledby="family-label">
        {FAMILIES.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={f.id === family}
            onClick={() => setFamily(f.id)}
          >
            {t(f.id === 'guitar' ? 'family.guitar' : 'family.bass')}
          </button>
        ))}
      </div>
    </div>
  );
}

function InstrumentCard() {
  const t = useT();
  const instrumentId = useStore((s) => s.instrumentId);
  const setInstrument = useStore((s) => s.setInstrument);
  const ctx = useMusicContext();
  const family = ctx.instrument.family;
  const siblings = instrumentsOfFamily(family);
  const narrow = useNarrowLayout();

  return (
    <Card title={t('instrument.title')} id="instrument">
      {!narrow && <FamilySwitch />}

      {siblings.length > 1 && (
      <div className="field">
        <span className="field-label" id="strings-label">
          {t('instrument.strings')}
        </span>
        <div className="segmented" role="group" aria-labelledby="strings-label">
          {siblings.map((i) => (
            <button
              key={i.id}
              type="button"
              aria-pressed={i.id === instrumentId}
              onClick={() => setInstrument(i.id)}
              title={t('instrument.option.help', {
                name: instrumentName(t, i.id),
                frets: i.fretCount,
              })}
            >
              {t('instrument.stringCount', { n: i.stringCount })}
            </button>
          ))}
        </div>
      </div>
      )}

      <p className="field-hint">
        {t('instrument.summary', {
          name: instrumentName(t, ctx.instrument.id),
          strings: ctx.instrument.stringCount,
          frets: ctx.instrument.fretCount,
          scale: ctx.instrument.scaleLengthIn,
        })}
      </p>
    </Card>
  );
}

/** Open strings without their octave numbers, as a tuning is usually written. */
const letters = (notes: readonly string[]): string =>
  notes.map((n) => n.replace(/-?\d+$/, '')).join(' ');

function TuningCard() {
  const t = useT();
  const locale = useLocale();
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
    ...instrument.tunings.map((x) => ({
      value: x.id,
      // The name is translated; the open-string letters come from the tuning.
      label: `${tuningText(locale, x.id)} — ${letters(x.notes)}`,
      group: t('tuning.preset'),
    })),
    { value: 'custom', label: t('tuning.custom'), group: t('tuning.preset') },
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
    <Card title={t('tuning.title')} id="tuning">
      <Field
        label={t('tuning.preset')}
        help={t('tuning.preset.help')}
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
        {t('tuning.openStrings')} <strong>{ctx.tuning.notes.join('  ')}</strong>
      </p>

      <details style={{ marginTop: 12 }}>
        <summary
          style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}
        >
          {t('tuning.editor')}
        </summary>
        <div style={{ marginTop: 12 }}>
          <p className="field-hint" style={{ marginBottom: 8 }}>
            {t('tuning.editor.hint')}
          </p>
          {draft.map((note, i) => (
            <div key={i} className="field" style={{ marginBottom: 8 }}>
              <label className="field-label" htmlFor={`cust-${i}`}>
                {i === 0
                  ? t('tuning.string.lowest', { n: instrument.stringCount - i })
                  : i === instrument.stringCount - 1
                    ? t('tuning.string.highest', { n: instrument.stringCount - i })
                    : t('tuning.string', { n: instrument.stringCount - i })}
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
              {t('tuning.apply')}
            </button>
            <button type="button" className="btn btn-sm" onClick={() => shift(-1)} title={t('tuning.down.help')}>
              {t('tuning.down')}
            </button>
            <button type="button" className="btn btn-sm" onClick={() => shift(1)} title={t('tuning.up.help')}>
              {t('tuning.up')}
            </button>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setDraft(customTuningSeed(useStore.getState()))}
            >
              {t('tuning.reset')}
            </button>
          </div>
        </div>
      </details>
    </Card>
  );
}

function ScaleCard() {
  const t = useT();
  const locale = useLocale();
  const scaleRoot = useStore((s) => s.scaleRoot);
  const scaleId = useStore((s) => s.scaleId);
  const setScaleRoot = useStore((s) => s.setScaleRoot);
  const setScaleId = useStore((s) => s.setScaleId);
  const scale = getScale(scaleId);

  const scaleOptions: Option[] = SCALE_CATEGORIES.flatMap((cat) =>
    SCALES.filter((s) => s.category === cat).map((s) => ({
      value: s.id,
      label: scaleText(locale, s.id)[0],
      group: categoryText(locale, cat),
    })),
  );

  return (
    <Card
      title={t('scale.title')}
      id="scale"
    >
      <Field label={t('scale.root')} help={t('scale.root.help')}>
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
      <Field label={t('scale.which')} hint={scaleText(locale, scale.id)[1]}>
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
  const t = useT();
  const locale = useLocale();
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
      label: `${chordText(locale, c.id)[0]} — ${chordRoot}${c.symbol}`,
      group: categoryText(locale, cat),
    })),
  );

  return (
    <Card
      title={t('chord.title')}
      id="chord"
      action={
        mode !== 'chord' ? (
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => setMode('chord')}>
            {t('chord.showShapes')}
          </button>
        ) : undefined
      }
    >
      <Field label={t('chord.root')}>
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
      <Field label={t('chord.type')} hint={chordText(locale, chord.id)[1]}>
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
          {t('chord.fitting', { chord: ctx.chordName })} <Help text={t('chord.fitting.help')} />
        </div>
        {ctx.suggestions.length === 0 ? (
          <p className="field-hint">{t('chord.fitting.none')}</p>
        ) : (
          <div className="chip-row">
            {ctx.suggestions.slice(0, 5).map((s) => {
              return (
                <button
                  key={s.scaleId}
                  type="button"
                  className="chip chip-accent"
                  title={`${chordRoot} ${scaleText(locale, s.scaleId)[0]} — ${reasonText(locale, s.scaleId)}`}
                  onClick={() => {
                    setScale(chordRoot, s.scaleId);
                    setMode('scale');
                  }}
                >
                  {chordRoot} {scaleText(locale, s.scaleId)[0]}
                </button>
              );
            })}
          </div>
        )}
        <p className="field-hint" style={{ marginTop: 8 }}>
          {t('chord.fitting.hint', { root: chordRoot })}
        </p>
      </div>

      <div style={{ marginTop: 12 }}>
        <Switch
          label={t('chord.overlay')}
          checked={scaleOverlay}
          onChange={setScaleOverlay}
          help={t('chord.overlay.help')}
        />
      </div>
    </Card>
  );
}
