/**
 * TunerPanel.tsx — the tuner readout, anchored over the headstock.
 *
 * It is rendered inside the instrument stage while the camera is parked on
 * the headstock, so the tuner reads as part of the instrument rather than as
 * a floating dialog.
 */

import { Help, Notice } from '../ui/controls';
import { needlePosition } from '../../core/tuner/analysis';
import { useMusicContext } from '../../state/selectors';
import { useStore } from '../../state/store';
import { useTunerReadings } from '../../hooks/useTuner';
import { tunerEngine } from '../../core/tuner/TunerEngine';
import { audioEngine } from '../../core/audio/AudioEngine';
import { usePlayback } from '../../hooks/usePlayback';
import { useT, type TFunction } from '../../i18n';

/**
 * The engine reports failures in English, because it has no view layer. The
 * cause is what matters, so the message is chosen from the state here and the
 * engine's own text is kept only for the cases that quote a browser error.
 */
function localisedTunerError(t: TFunction, state: string, error: string | null): string {
  switch (state) {
    case 'denied':
      return t('tuner.msg.denied');
    case 'no-device':
      return t('tuner.msg.noDevice');
    case 'insecure':
      return t('tuner.msg.insecure');
    case 'unsupported':
      return t('tuner.msg.unsupported');
    default:
      return error ?? t('tuner.error.unknown');
  }
}

export function TunerPanel({ visible }: { visible: boolean }) {
  const t = useT();
  const ctx = useMusicContext();
  const pinned = useStore((s) => s.tunerStringIndex);
  const setPinned = useStore((s) => s.setTunerStringIndex);
  const setMode = useStore((s) => s.setMode);
  const { snapshot, chromatic, string } = useTunerReadings();
  const { playNote } = usePlayback();

  // On Auto the meter follows whatever note is played, measured against the
  // nearest note of the chromatic scale — so it is just as useful on a
  // fretted note as on an open string. Pinned to a string, it measures
  // against that string's target instead.
  const reading = pinned === null ? chromatic : string;
  const cents = reading?.cents ?? 0;
  const verdict = reading?.verdict ?? 'in-tune';
  const needle = needlePosition(cents);
  // When a string is pinned and something else is being played, the needle
  // would simply sit pegged at one end, which reads as a broken meter. Say
  // what is happening instead.
  const wrongString = pinned !== null && string !== null && Math.abs(string.cents) > 150;

  return (
    <div className={`tuner-overlay${visible ? ' is-visible' : ''}`} aria-hidden={!visible}>
      <div className="tuner-card" role="region" aria-label={t('tuner.title')}>
        {snapshot.state !== 'running' ? (
          <TunerStatus state={snapshot.state} error={snapshot.error} />
        ) : (
          <>
            <div className="tuner-readout">
              <div className="tuner-note" aria-live="polite">
                {chromatic ? (
                  <>
                    {chromatic.noteName}
                    <small>{chromatic.fullName.slice(chromatic.noteName.length)}</small>
                  </>
                ) : (
                  <span style={{ fontSize: 24, color: 'var(--text-muted)' }}>{t('tuner.listening')}</span>
                )}
              </div>
              <div>
                <div className="tuner-facts">
                  <span>
                    {t('tuner.detected')} <b>{snapshot.pitch ? `${snapshot.pitch.freq.toFixed(2)} Hz` : '—'}</b>
                  </span>
                  <span>
                    {t('tuner.target')}{' '}
                    <b>
                      {reading
                        ? `${pinned === null ? chromatic?.fullName : string?.targetName} ${reading.targetFreq.toFixed(2)} Hz`
                        : '—'}
                    </b>
                  </span>
                  <span>
                    {t('tuner.deviation')}{' '}
                    <b>
                      {reading
                        ? t('tuner.cents', {
                            cents: `${cents >= 0 ? '+' : ''}${cents.toFixed(1)}`,
                          })
                        : '—'}
                    </b>
                  </span>
                </div>
                <div className="tuner-facts" style={{ marginTop: 4 }}>
                  <span>
                    {t('tuner.tuningTo')} <b>{ctx.tuning.notes.join(' ')}</b>
                  </span>
                </div>
              </div>
            </div>

            {pinned !== null && (
              <p className="field-hint" style={{ margin: '0 0 8px' }}>
                {t('tuner.pinned', { note: ctx.tuning.notes[pinned] })}{' '}
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  style={{ minHeight: 26, padding: '0 8px' }}
                  onClick={() => setPinned(null)}
                >
                  {t('tuner.followAny')}
                </button>
              </p>
            )}

            <div
              className="tuner-meter"
              role="meter"
              aria-valuemin={-50}
              aria-valuemax={50}
              aria-valuenow={Math.round(cents)}
              aria-valuetext={
                reading
                  ? t('tuner.meter.reading', {
                      cents: Math.abs(cents).toFixed(0),
                      verdict:
                        verdict === 'in-tune'
                          ? t('tuner.inTune')
                          : verdict === 'flat'
                            ? t('tuner.flat', { cents: Math.abs(Math.round(cents)) })
                            : t('tuner.sharp', { cents: Math.abs(Math.round(cents)) }),
                    })
                  : t('tuner.meter.noSignal')
              }
            >
              <div className="tuner-meter-zone" />
              <div className="tuner-meter-centre" />
              {reading && !wrongString && (
                <div
                  className="tuner-needle"
                  data-verdict={verdict}
                  style={{ left: `${50 + needle * 50}%` }}
                />
              )}
              <div className="tuner-scale-marks">
                <span>-50</span>
                <span>-25</span>
                <span>0</span>
                <span>+25</span>
                <span>+50</span>
              </div>
            </div>

            {/* Never colour alone: the verdict is always spelled out. */}
            <div className="tuner-verdict" data-verdict={verdict} aria-live="polite">
              {!reading ? (
                <span style={{ color: 'var(--text-muted)' }}>{t('tuner.playOne')}</span>
              ) : wrongString ? (
                <span style={{ color: 'var(--text-muted)' }}>
                  {t('tuner.wrongString', {
                    played: chromatic?.fullName ?? '',
                    target: string?.targetName ?? '',
                  })}
                </span>
              ) : verdict === 'in-tune' ? (
                <>
                  ✓ {t('tuner.inTune')}
                  {pinned === null
                    ? chromatic
                      ? ` — ${chromatic.fullName}`
                      : ''
                    : string
                      ? ` — ${string.targetName}`
                      : ''}
                </>
              ) : verdict === 'flat' ? (
                t('tuner.flat', { cents: Math.abs(Math.round(cents)) })
              ) : (
                t('tuner.sharp', { cents: Math.abs(Math.round(cents)) })
              )}
            </div>

            <div className="tuner-level" aria-hidden="true">
              <div style={{ width: `${Math.round(snapshot.level * 100)}%` }} />
            </div>

            <div className="tuner-strings" role="group" aria-label={t('tuner.targetString')}>
              <button
                type="button"
                className="btn btn-sm"
                aria-pressed={pinned === null}
                onClick={() => setPinned(null)}
                title={t('tuner.auto.help')}
              >
                {t('tuner.auto')}
              </button>
              {ctx.tuning.notes.map((note, i) => (
                <button
                  key={i}
                  type="button"
                  className="btn btn-sm"
                  aria-pressed={pinned === i}
                  data-state={string?.stringIndex === i ? string.verdict : undefined}
                  onClick={() => {
                    setPinned(pinned === i ? null : i);
                    playNote(ctx.openMidis[i], i);
                  }}
                  title={t('tuner.string.help', { n: ctx.instrument.stringCount - i, note })}
                >
                  {note}
                </button>
              ))}
            </div>

            <p className="field-hint" style={{ marginTop: 10 }}>
              {t('tuner.pinHint')} <Help text={t('tuner.pinHint.help')} />
            </p>
          </>
        )}

        <div className="strum-row" style={{ marginTop: 14, justifyContent: 'flex-end' }}>
          <button type="button" className="btn" onClick={() => setMode('scale')}>
            {t('tuner.close')}
          </button>
        </div>
      </div>
    </div>
  );
}

function TunerStatus({ state, error }: { state: string; error: string | null }) {
  const t = useT();
  const retry = (): void => {
    void tunerEngine.start(audioEngine.context);
  };

  if (state === 'requesting') {
    return <Notice title={t('tuner.waiting.title')}>{t('tuner.waiting.body')}</Notice>;
  }

  if (state === 'idle') {
    return (
      <Notice title={t('tuner.ready.title')}>
        <p style={{ margin: '0 0 10px' }}>{t('tuner.ready.body')}</p>
        <button type="button" className="btn btn-primary" onClick={retry}>
          {t('tuner.start')}
        </button>
      </Notice>
    );
  }

  return (
    <Notice
      kind="error"
      title={
        state === 'denied'
          ? t('tuner.error.denied')
          : state === 'no-device'
            ? t('tuner.error.noDevice')
            : state === 'insecure'
              ? t('tuner.error.insecure')
              : state === 'unsupported'
                ? t('tuner.error.unsupported')
                : t('tuner.error.other')
      }
      action={
        state === 'unsupported' ? undefined : (
          <button type="button" className="btn btn-sm" onClick={retry}>
            {t('tuner.retry')}
          </button>
        )
      }
    >
      {localisedTunerError(t, state, error)}
    </Notice>
  );
}
