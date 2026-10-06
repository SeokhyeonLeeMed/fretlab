/**
 * App.tsx — composition only.
 *
 * All the musical work happens in core/ and state/; this file wires panels to
 * the stage and owns the two cross-cutting effects (theme attribute and the
 * tuner's microphone lifetime).
 */

import { useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { ControlPanel } from './components/panels/ControlPanel';
import { InfoPanel } from './components/panels/InfoPanel';
import { ChordPanel } from './components/panels/ChordPanel';
import { AudioControls } from './components/panels/AudioControls';
import { TunerPanel } from './components/panels/TunerPanel';
import { InstrumentStage } from './components/fretboard/InstrumentStage';
import { InstrumentSVG } from './components/fretboard/InstrumentSVG';
import { buildGeometry } from './components/fretboard/geometry';
import { useMusicContext, useVoicings } from './state/selectors';
import { ZOOM_MAX, ZOOM_MIN, useStore } from './state/store';
import { usePlayback } from './hooks/usePlayback';
import { useTunerLifecycle, useTunerReadings } from './hooks/useTuner';
import { Notice } from './components/ui/controls';
import { audioEngine } from './core/audio/AudioEngine';

export function App() {
  const ctx = useMusicContext();
  const mode = useStore((s) => s.mode);
  const theme = useStore((s) => s.theme);
  const zoom = useStore((s) => s.zoom);
  const setZoom = useStore((s) => s.setZoom);
  const showLabels = useStore((s) => s.showLabels);
  const labelStyle = useStore((s) => s.labelStyle);
  const showNonScaleNotes = useStore((s) => s.showNonScaleNotes);
  const scaleOverlayInChordMode = useStore((s) => s.scaleOverlayInChordMode);
  const selected = useStore((s) => s.selected);

  const { active: activeVoicing } = useVoicings();
  const { pick, audioReady } = usePlayback();
  useTunerLifecycle();
  const { targets } = useTunerReadings();

  // The theme is an attribute on <html> so the CSS custom properties cascade.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Release the audio hardware when the page goes away.
  useEffect(() => () => void audioEngine.close(), []);

  const geo = useMemo(() => buildGeometry(ctx.instrument), [ctx.instrument]);

  return (
    <div className="app">
      <a className="skip-link" href="#stage">
        Skip to the fretboard
      </a>
      <Header />

      <main className="app-main">
        <div className="sidebar" aria-label="Controls">
          <ControlPanel />
          <AudioControls />
        </div>

        <div className="stage-column">
          <section id="stage" aria-label="Instrument view">
            <InstrumentStage
              geo={geo}
              overlay={<TunerPanel visible={mode === 'tuner'} />}
              toolbar={
                <>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => setZoom(zoom - 0.15)}
                    disabled={mode === 'tuner' || zoom <= ZOOM_MIN}
                    aria-label="Zoom out"
                  >
                    −
                  </button>
                  <span className="stage-hint" style={{ minWidth: 48, textAlign: 'center' }}>
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => setZoom(zoom + 0.15)}
                    disabled={mode === 'tuner' || zoom >= ZOOM_MAX}
                    aria-label="Zoom in"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => setZoom(1)}
                    disabled={mode === 'tuner'}
                    title="Back to 100%"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => {
                      // Zoom out far enough that the whole instrument, body
                      // included, fits the width of the stage.
                      const el = document.querySelector('.stage-scroll');
                      const w = (el as HTMLElement | null)?.clientWidth ?? 900;
                      const base = Math.max(320, Math.min(450, w * 0.36));
                      setZoom((w / geo.width) * (geo.height / base));
                      requestAnimationFrame(() => {
                        if (el) (el as HTMLElement).scrollLeft = 0;
                      });
                    }}
                    disabled={mode === 'tuner'}
                    title="Zoom out to show the whole instrument"
                  >
                    Whole instrument
                  </button>
                  <div className="spacer" />
                  <span className="stage-hint">
                    {mode === 'tuner'
                      ? 'Tuner mode: the view is parked on the headstock. Closing it restores your previous position and zoom.'
                      : 'Scroll sideways to move along the neck · pinch or Ctrl+scroll to zoom · click a position to hear it'}
                  </span>
                </>
              }
            >
              <InstrumentSVG
                geo={geo}
                openMidis={ctx.openMidis}
                spelling={ctx.spelling}
                mode={mode}
                labelStyle={labelStyle}
                showLabels={showLabels}
                showNonScaleNotes={showNonScaleNotes}
                scalePcs={ctx.scalePcs}
                scaleDegrees={ctx.scaleDegrees}
                scaleRootPc={ctx.scaleRootPc}
                chordPcs={ctx.chordPcs}
                chordDegrees={ctx.chordDegrees}
                chordRootPc={ctx.chordRootPc}
                scaleOverlayInChordMode={scaleOverlayInChordMode}
                voicing={mode === 'chord' ? activeVoicing : null}
                selected={selected}
                tunerTargets={mode === 'tuner' ? targets : undefined}
                onPick={pick}
              />
            </InstrumentStage>
          </section>

          {!audioReady && (
            <Notice title="Sound starts on your first click">
              Browsers only allow audio after a real interaction, so the first position you click
              also starts the audio engine. Everything is synthesised in the page — there are no
              audio files to download.
            </Notice>
          )}

          <InfoPanel />
          <ChordPanel />
        </div>
      </main>

      <footer className="app-footer">
        <span>
          FretLab — all note names, scales, chord shapes and tuner targets are calculated from the
          selected tuning.
        </span>
        <span>
          {ctx.instrument.name} · {ctx.tuning.notes.join(' ')} · {ctx.scaleName}
        </span>
      </footer>
    </div>
  );
}
