/**
 * ChordPanel.tsx — calculated voicings, strumming and power chords.
 *
 * Nothing here is a stored chord diagram. Each shape comes from the voicing
 * search run against the current tuning, and each one is reported with the
 * notes it actually sounds, so a shape can never be mislabelled.
 */

import { Card, Help, Notice, Segmented, Slider } from '../ui/controls';
import { useMusicContext, useVoicings } from '../../state/selectors';
import { useStore } from '../../state/store';
import { usePlayback } from '../../hooks/usePlayback';
import { describeVoicing, type Voicing } from '../../core/theory/voicing';
import { STRUM_PRESETS, type StrumMode, type StrumPreset } from '../../core/audio/AudioEngine';
import { useT, type TFunction } from '../../i18n';

/**
 * A voicing's position, translated. The solver returns a stable description;
 * turning it into words is the interface's job, not the engine's.
 */
function positionLabel(t: TFunction, v: Voicing): string {
  if (v.barre !== null) return t('voicing.barre', { fret: v.barre });
  if (v.position === 'All open') return t('voicing.allOpen');
  if (v.position === 'Open position') return t('voicing.openPosition');
  const power = /^String (\d+), fret (\d+)$/.exec(v.position);
  if (power) return t('voicing.power', { string: +power[1], fret: +power[2] });
  const at = /^Position (\d+)$/.exec(v.position);
  if (at) return t('voicing.position', { fret: +at[1] });
  return v.position;
}

export function ChordPanel() {
  const t = useT();
  const ctx = useMusicContext();
  const { voicings, active, empty } = useVoicings();
  const voicingIndex = useStore((s) => s.voicingIndex);
  const setVoicingIndex = useStore((s) => s.setVoicingIndex);
  const setMode = useStore((s) => s.setMode);
  const mode = useStore((s) => s.mode);
  const { strum } = usePlayback();

  return (
    <Card
      title={t('chords.title', { chord: ctx.chordName })}
      id="chords"
      action={
        mode !== 'chord' ? (
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => setMode('chord')}>
            {t('chord.showOnFretboard')}
          </button>
        ) : undefined
      }
    >
      {empty ? (
        <Notice kind="error" title={t('chords.none.title')}>
          {t('chords.none.body', {
            chord: ctx.chordName,
            instrument: t(ctx.instrument.id === 'bass4' ? 'instrument.bass4' : 'instrument.guitar6'),
            tuning: ctx.tuning.notes.join(' '),
          })}
        </Notice>
      ) : (
        <>
          <p className="field-hint" style={{ marginBottom: 10 }}>
            {t('chords.found', {
              n: voicings.length,
              chord: ctx.chordName,
              tuning: ctx.tuning.notes.join(' '),
            })}
          </p>

          <div className="voicing-list" role="group" aria-label={t('chords.shapes')}>
            {voicings.map((v, i) => (
              <button
                key={v.id}
                type="button"
                className="voicing-card"
                aria-pressed={i === voicingIndex}
                onClick={() => {
                  setVoicingIndex(i);
                  setMode('chord');
                  strum(v);
                }}
                title={`${v.position} — ${describeVoicing(v, ctx.spelling).names.join(' ')}`}
              >
                <ChordDiagram voicing={v} />
                <span className="name">{positionLabel(t, v)}</span>
                <span className="frets">
                  {v.frets.map((f) => (f === null ? '✕' : f)).join(' ')}
                </span>
                {v.barre !== null && (
                  <span className="chip" style={{ padding: '1px 6px', fontSize: 10 }}>
                    {t('chords.barre', { fret: v.barre })}
                  </span>
                )}
              </button>
            ))}
          </div>

          {!voicings.some((v) => v.barre !== null) && (
            <p className="field-hint" style={{ marginTop: 10 }}>
              {t('chords.noBarre', { chord: ctx.chordName })}
            </p>
          )}

          {active && <ActiveVoicingFacts voicing={active} />}
        </>
      )}

      <StrumControls disabled={!active} onStrum={(m) => active && strum(active, m)} />
    </Card>
  );
}

function ActiveVoicingFacts({ voicing }: { voicing: Voicing }) {
  const t = useT();
  const ctx = useMusicContext();
  const sounds = describeVoicing(voicing, ctx.spelling);
  return (
    <div style={{ marginTop: 14 }}>
      <div className="field-label" style={{ marginBottom: 4 }}>
        {t('chords.sounds')} <Help text={t('chords.sounds.help')} />
      </div>
      <div className="note-list">
        {sounds.names.map((n, i) => (
          <span key={`${n}-${i}`} className="note-pill" data-root={i === 0 && voicing.inversion === 0}>
            {n}
          </span>
        ))}
      </div>
      <p className="field-hint" style={{ marginTop: 8 }}>
        {t('chords.tones', { tones: voicing.tones.join(', ') })}
        {voicing.missing.length > 0 && ` · ${t('chords.omits', { tones: voicing.missing.join(', ') })}`}
        {voicing.inversion > 0 && ` · ${t('chords.inverted')}`}
        {` · ${t('chords.fingers', { n: voicing.fingers })}`}
      </p>
    </div>
  );
}

function StrumControls({
  disabled,
  onStrum,
}: {
  disabled: boolean;
  onStrum: (mode: StrumMode) => void;
}) {
  const strumMode = useStore((s) => s.strumMode);
  const setStrumMode = useStore((s) => s.setStrumMode);
  const strumPreset = useStore((s) => s.strumPreset);
  const setStrumPreset = useStore((s) => s.setStrumPreset);
  const strumMs = useStore((s) => s.strumMs);
  const setStrumMs = useStore((s) => s.setStrumMs);
  const t = useT();

  return (
    <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
      <div className="field-label" style={{ marginBottom: 6 }}>
        {t('strum.play')} <Help text={t('strum.play.help')} />
      </div>
      <div className="strum-row">
        <button type="button" className="btn" disabled={disabled} onClick={() => onStrum('normal')}>
          {t('strum.together')}
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={disabled}
          onClick={() => onStrum('down')}
        >
          {t('strum.down')}
        </button>
        <button type="button" className="btn" disabled={disabled} onClick={() => onStrum('up')}>
          {t('strum.up')}
        </button>
      </div>

      <div style={{ marginTop: 14 }}>
        <div className="field-label" style={{ marginBottom: 6 }}>
          {t('strum.direction')}
        </div>
        <Segmented<StrumMode>
          label={t('strum.direction')}
          value={strumMode}
          onChange={setStrumMode}
          options={[
            { value: 'normal', label: t('strum.mode.normal') },
            { value: 'down', label: t('strum.mode.down') },
            { value: 'up', label: t('strum.mode.up') },
          ]}
        />
      </div>

      <div style={{ marginTop: 14 }}>
        <div className="field-label" style={{ marginBottom: 6 }}>
          {t('strum.speed')}
        </div>
        <Segmented<StrumPreset>
          label={t('strum.speed.preset')}
          value={strumPreset}
          onChange={setStrumPreset}
          options={[
            { value: 'slow', label: t('strum.slow') },
            { value: 'normal', label: t('strum.normal') },
            { value: 'fast', label: t('strum.fast') },
            { value: 'custom', label: t('strum.custom') },
          ]}
        />
        <div style={{ marginTop: 8 }}>
          <Slider
            label={t('strum.gap')}
            min={0}
            max={160}
            step={1}
            value={strumMs}
            onChange={setStrumMs}
            format={(v) => t('strum.ms', { ms: v })}
            help={t('strum.gap.help', {
              slow: STRUM_PRESETS.slow,
              normal: STRUM_PRESETS.normal,
              fast: STRUM_PRESETS.fast,
            })}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * A small diagram of one shape. Drawn from the voicing's own fret numbers, so
 * it always matches what will be played.
 */
function ChordDiagram({ voicing }: { voicing: Voicing }) {
  const strings = voicing.frets.length;
  const fretted = voicing.frets.filter((f): f is number => f !== null && f > 0);
  const start = fretted.length ? Math.max(1, Math.min(...fretted) - (Math.min(...fretted) > 1 ? 0 : 0)) : 1;
  const SPAN = 4;
  const W = 8 + (strings - 1) * 11;
  const H = 62;
  const left = 4;
  const top = 14;
  const stepX = strings > 1 ? (W - 8) / (strings - 1) : 0;
  const stepY = (H - top - 6) / SPAN;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      {/* Nut, drawn thick when the shape sits at the top of the neck. */}
      <line
        x1={left}
        y1={top}
        x2={left + (strings - 1) * stepX}
        y2={top}
        stroke="var(--text-muted)"
        strokeWidth={start <= 1 ? 3 : 1}
      />
      {Array.from({ length: SPAN }, (_, i) => (
        <line
          key={i}
          x1={left}
          y1={top + (i + 1) * stepY}
          x2={left + (strings - 1) * stepX}
          y2={top + (i + 1) * stepY}
          stroke="var(--border-strong)"
          strokeWidth={1}
        />
      ))}
      {Array.from({ length: strings }, (_, s) => (
        <line
          key={s}
          x1={left + s * stepX}
          y1={top}
          x2={left + s * stepX}
          y2={top + SPAN * stepY}
          stroke="var(--border-strong)"
          strokeWidth={1}
        />
      ))}
      {start > 1 && (
        <text x={0} y={top + stepY * 0.9} fontSize={8} fill="var(--text-faint)">
          {start}
        </text>
      )}
      {voicing.frets.map((f, s) => {
        const x = left + s * stepX;
        if (f === null) {
          return (
            <g key={s} stroke="var(--role-muted)" strokeWidth={1.4}>
              <line x1={x - 3} y1={top - 10} x2={x + 3} y2={top - 4} />
              <line x1={x - 3} y1={top - 4} x2={x + 3} y2={top - 10} />
            </g>
          );
        }
        if (f === 0) {
          return (
            <circle
              key={s}
              cx={x}
              cy={top - 7}
              r={3}
              fill="none"
              stroke="var(--text-muted)"
              strokeWidth={1.4}
            />
          );
        }
        const row = f - start + 1;
        if (row < 1 || row > SPAN) return null;
        return (
          <circle
            key={s}
            cx={x}
            cy={top + (row - 0.5) * stepY}
            r={4}
            fill="var(--role-chord)"
          />
        );
      })}
    </svg>
  );
}
