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

export function InfoPanel() {
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
    <Card title="Current selection" id="info">
      <dl className="info-grid" style={{ margin: 0 }}>
        <div className="info-tile">
          <dt>Selected note</dt>
          <dd>{selectedNote ? selectedNote.full : '—'}</dd>
          <div className="sub">
            {selected && selectedMidi !== null ? (
              <>
                String {ctx.instrument.stringCount - selected.stringIndex} ·{' '}
                {selected.fret === 0 ? 'open' : `fret ${selected.fret}`} ·{' '}
                {midiToFreq(selectedMidi, a4).toFixed(2)} Hz · MIDI {selectedMidi}
              </>
            ) : (
              'Click or tap anywhere on the fretboard to hear a note.'
            )}
          </div>
        </div>

        <div className="info-tile">
          <dt>Selected scale</dt>
          <dd>{ctx.scaleName}</dd>
          <div className="note-list" aria-label="Notes of the scale">
            {scaleNotes.map((n, i) => (
              <span key={`${n}-${i}`} className="note-pill" data-root={i === 0}>
                {n}
              </span>
            ))}
          </div>
          <div className="sub">
            {ctx.scale.intervals.length} notes · a pool to play over the chord
            {mode === 'scale' ? ' · shown on the fretboard' : ''}
          </div>
        </div>

        <div className="info-tile">
          <dt>Selected chord</dt>
          <dd>{ctx.chordName}</dd>
          <div className="note-list" aria-label="Notes of the chord">
            {chordNotes.map((n, i) => (
              <span key={`${n}-${i}`} className="note-pill" data-root={i === 0}>
                {n}
              </span>
            ))}
          </div>
          <div className="sub">
            {ctx.chord.name} · {ctx.chord.intervals.length} notes played together
            {mode === 'chord' ? ' · shapes shown on the fretboard' : ''}
          </div>
        </div>

        <div className="info-tile">
          <dt>Tuning</dt>
          <dd style={{ fontSize: 17 }}>{ctx.tuning.notes.join(' ')}</dd>
          <div className="sub">
            {ctx.tuning.name.includes('—') ? ctx.tuning.name.split('—')[0].trim() : ctx.tuning.name} ·{' '}
            {ctx.instrument.name}
          </div>
        </div>
      </dl>

      <div className="legend" style={{ marginTop: 16 }} aria-label="Marker legend">
        <span className="legend-item">
          <span className="legend-swatch" data-shape="root" /> Root note (square)
        </span>
        <span className="legend-item">
          <span className="legend-swatch" data-shape="scale" /> Scale note (circle)
        </span>
        <span className="legend-item">
          <span className="legend-swatch" data-shape="chord" /> Chord tone
        </span>
        <span className="legend-item">
          <span className="legend-swatch" data-shape="selected" /> Last played
        </span>
        <span className="legend-item">
          <span className="legend-swatch" data-shape="open" /> Faint: outside the scale
        </span>
        <span className="legend-item">
          <span className="legend-swatch" data-shape="muted" /> ✕ at the nut: muted string
        </span>
      </div>
    </Card>
  );
}
