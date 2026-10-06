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

export function TunerPanel({ visible }: { visible: boolean }) {
  const ctx = useMusicContext();
  const pinned = useStore((s) => s.tunerStringIndex);
  const setPinned = useStore((s) => s.setTunerStringIndex);
  const setMode = useStore((s) => s.setMode);
  const { snapshot, chromatic, string } = useTunerReadings();
  const { playNote } = usePlayback();

  const reading = string ?? chromatic;
  const cents = reading?.cents ?? 0;
  const verdict = reading?.verdict ?? 'in-tune';
  const needle = needlePosition(cents);
  // When a string is pinned and something else is being played, the needle
  // would simply sit pegged at one end, which reads as a broken meter. Say
  // what is happening instead.
  const wrongString = pinned !== null && string !== null && Math.abs(string.cents) > 150;

  return (
    <div className={`tuner-overlay${visible ? ' is-visible' : ''}`} aria-hidden={!visible}>
      <div className="tuner-card" role="region" aria-label="Chromatic tuner">
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
                  <span style={{ fontSize: 24, color: 'var(--text-muted)' }}>Listening…</span>
                )}
              </div>
              <div>
                <div className="tuner-facts">
                  <span>
                    Detected <b>{snapshot.pitch ? `${snapshot.pitch.freq.toFixed(2)} Hz` : '—'}</b>
                  </span>
                  <span>
                    Target{' '}
                    <b>
                      {string ? `${string.targetName} ${string.targetFreq.toFixed(2)} Hz` : '—'}
                    </b>
                  </span>
                  <span>
                    Deviation <b>{reading ? `${cents >= 0 ? '+' : ''}${cents.toFixed(1)} cents` : '—'}</b>
                  </span>
                </div>
                <div className="tuner-facts" style={{ marginTop: 4 }}>
                  <span>
                    Tuning to <b>{ctx.tuning.notes.join(' ')}</b>
                  </span>
                </div>
              </div>
            </div>

            {pinned !== null && (
              <p className="field-hint" style={{ margin: '0 0 8px' }}>
                Listening for the <strong>{ctx.tuning.notes[pinned]}</strong> string only.{' '}
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  style={{ minHeight: 26, padding: '0 8px' }}
                  onClick={() => setPinned(null)}
                >
                  Follow any string
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
                  ? `${Math.abs(cents).toFixed(0)} cents ${verdict === 'in-tune' ? 'in tune' : verdict}`
                  : 'no signal'
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
                <span style={{ color: 'var(--text-muted)' }}>Play a single open string</span>
              ) : wrongString ? (
                <span style={{ color: 'var(--text-muted)' }}>
                  That is {chromatic?.fullName}, not the {string?.targetName} string
                </span>
              ) : verdict === 'in-tune' ? (
                <>✓ In tune{string ? ` — ${string.targetName}` : ''}</>
              ) : verdict === 'flat' ? (
                <>▲ Flat by {Math.abs(cents).toFixed(0)} cents — tighten the string</>
              ) : (
                <>▼ Sharp by {Math.abs(cents).toFixed(0)} cents — loosen the string</>
              )}
            </div>

            <div className="tuner-level" aria-hidden="true">
              <div style={{ width: `${Math.round(snapshot.level * 100)}%` }} />
            </div>

            <div className="tuner-strings" role="group" aria-label="Target string">
              <button
                type="button"
                className="btn btn-sm"
                aria-pressed={pinned === null}
                onClick={() => setPinned(null)}
                title="Compare against whichever string is closest"
              >
                Auto
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
                  title={`String ${ctx.instrument.stringCount - i}: ${note}. Plays the reference pitch, and pins the tuner to this string; click again to follow any string.`}
                >
                  {note}
                </button>
              ))}
            </div>

            <p className="field-hint" style={{ marginTop: 10 }}>
              Pick a string to pin it as the target and hear its reference pitch, or leave it on
              Auto. <Help text="The targets come from the tuning selected in the sidebar, so the tuner works for Drop D, Eb standard, a custom tuning and everything else." />
            </p>
          </>
        )}

        <div className="strum-row" style={{ marginTop: 14, justifyContent: 'flex-end' }}>
          <button type="button" className="btn" onClick={() => setMode('scale')}>
            Close tuner
          </button>
        </div>
      </div>
    </div>
  );
}

function TunerStatus({ state, error }: { state: string; error: string | null }) {
  const retry = (): void => {
    void tunerEngine.start(audioEngine.context);
  };

  if (state === 'requesting') {
    return (
      <Notice title="Waiting for microphone permission">
        Your browser is asking whether FretLab may use the microphone. Choose <strong>Allow</strong>{' '}
        to start tuning. Nothing is recorded, uploaded or stored: the audio is analysed in the page
        and discarded.
      </Notice>
    );
  }

  if (state === 'idle') {
    return (
      <Notice title="Tuner ready">
        <p style={{ margin: '0 0 10px' }}>
          The tuner listens through your microphone. Permission is requested only now, when you
          actually open the tuner.
        </p>
        <button type="button" className="btn btn-primary" onClick={retry}>
          Start listening
        </button>
      </Notice>
    );
  }

  return (
    <Notice
      kind="error"
      title={
        state === 'denied'
          ? 'Microphone permission denied'
          : state === 'no-device'
            ? 'No microphone found'
            : state === 'insecure'
              ? 'A secure connection is required'
              : state === 'unsupported'
                ? 'This browser cannot capture audio'
                : 'The tuner could not start'
      }
      action={
        state === 'unsupported' ? undefined : (
          <button type="button" className="btn btn-sm" onClick={retry}>
            Try again
          </button>
        )
      }
    >
      {error ?? 'An unknown problem stopped the tuner.'}
    </Notice>
  );
}
