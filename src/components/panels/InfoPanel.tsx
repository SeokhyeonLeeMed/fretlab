/**
 * InfoPanel.tsx — what is currently selected, in words and note names.
 *
 * Keeping the chord and the scale on separate tiles, each with its own note
 * list, is part of the answer to "do not let the user confuse a chord voicing
 * with a scale".
 */

import { Card } from '../ui/controls';
import { useMusicContext } from '../../state/selectors';
import { useStore } from '../../state/store';
import { spellCollection, spellMidi } from '../../core/theory/spelling';
import { midiToFreq } from '../../core/theory/pitch';
import { chordText, tuningText, useLocale, useT } from '../../i18n';

export function InfoPanel() {
  const t = useT();
  const locale = useLocale();
  const ctx = useMusicContext();
  const selected = useStore((s) => s.selected);
  const mode = useStore((s) => s.mode);
  const scaleRoot = useStore((s) => s.scaleRoot);
  const chordRoot = useStore((s) => s.chordRoot);
  const a4 = useStore((s) => s.a4);

  const selectedMidi =
    selected === null ? null : ctx.openMidis[selected.stringIndex] + selected.fret;
  const selectedNote = selectedMidi === null ? null : spellMidi(selectedMidi, ctx.spelling);

  const scaleNotes = spellCollection(scaleRoot, ctx.scale.intervals, ctx.scale.degrees);
  const chordNotes = spellCollection(chordRoot, ctx.chord.intervals, ctx.chord.degrees);

  return (
    <Card title={t('info.title')} id="info">
      <dl className="info-grid" style={{ margin: 0 }}>
        <div className="info-tile">
          <dt>{t('info.note')}</dt>
          <dd>{selectedNote ? selectedNote.full : '—'}</dd>
          <div className="sub">
            {selected && selectedMidi !== null
              ? t('info.note.detail', {
                  string: ctx.instrument.stringCount - selected.stringIndex,
                  fret: selected.fret === 0 ? t('info.open') : t('info.fret', { n: selected.fret }),
                  freq: midiToFreq(selectedMidi, a4).toFixed(2),
                  midi: selectedMidi,
                })
              : t('info.note.hint')}
          </div>
        </div>

        <div className="info-tile">
          <dt>{t('info.scale')}</dt>
          <dd>{ctx.scaleName}</dd>
          <div className="note-list" aria-label={t('info.scale.notes')}>
            {scaleNotes.map((n, i) => (
              <span key={`${n}-${i}`} className="note-pill" data-root={i === 0}>
                {n}
              </span>
            ))}
          </div>
          <div className="sub">
            {t('info.scale.detail', { n: ctx.scale.intervals.length })}
            {mode === 'scale' ? ` · ${t('info.scale.shown')}` : ''}
          </div>
        </div>

        <div className="info-tile">
          <dt>{t('info.chord')}</dt>
          <dd>{ctx.chordName}</dd>
          <div className="note-list" aria-label={t('info.chord.notes')}>
            {chordNotes.map((n, i) => (
              <span key={`${n}-${i}`} className="note-pill" data-root={i === 0}>
                {n}
              </span>
            ))}
          </div>
          <div className="sub">
            {t('info.chord.detail', {
              name: chordText(locale, ctx.chord.id)[0],
              n: ctx.chord.intervals.length,
            })}
            {mode === 'chord' ? ` · ${t('info.chord.shown')}` : ''}
          </div>
        </div>

        <div className="info-tile">
          <dt>{t('info.tuning')}</dt>
          <dd style={{ fontSize: 17 }}>{ctx.tuning.notes.join(' ')}</dd>
          <div className="sub">
            {tuningText(locale, ctx.tuning.id)} ·{' '}
            {t(ctx.instrument.id === 'bass4' ? 'instrument.bass4' : 'instrument.guitar6')}
          </div>
        </div>
      </dl>

      <div className="legend" style={{ marginTop: 16 }} aria-label={t('legend.label')}>
        <span className="legend-item">
          <span className="legend-swatch" data-shape="root" /> {t('legend.root')}
        </span>
        <span className="legend-item">
          <span className="legend-swatch" data-shape="scale" /> {t('legend.scale')}
        </span>
        <span className="legend-item">
          <span className="legend-swatch" data-shape="chord" /> {t('legend.chord')}
        </span>
        <span className="legend-item">
          <span className="legend-swatch" data-shape="selected" /> {t('legend.selected')}
        </span>
        <span className="legend-item">
          <span className="legend-swatch" data-shape="open" /> {t('legend.faint')}
        </span>
        <span className="legend-item">
          <span className="legend-swatch" data-shape="muted" /> {t('legend.muted')}
        </span>
      </div>
    </Card>
  );
}
