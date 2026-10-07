/**
 * App.tsx — composition only.
 *
 * All the musical work happens in core/ and state/; this file wires panels to
 * the stage and owns the two cross-cutting effects (theme attribute and the
 * tuner's microphone lifetime).
 */

import { useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { ControlPanel, FamilySwitch } from './components/panels/ControlPanel';
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
import { applyLocaleToDocument, useT } from './i18n';
import { useNarrowLayout } from './hooks/useNarrowLayout';
export function App() {
  const t = useT();
  const locale = useStore((s) => s.locale);
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
  const narrow = useNarrowLayout();

  // The theme is an attribute on <html> so the CSS custom properties cascade.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // The language sets <html lang> and pulls in a Noto script when the locale
  // needs one, so Latin locales download no extra font.
  useEffect(() => {
    applyLocaleToDocument(locale);
  }, [locale]);

  // Release the audio hardware when the page goes away.
  useEffect(() => () => void audioEngine.close(), []);

  const geo = useMemo(() => buildGeometry(ctx.instrument), [ctx.instrument]);

  return (
    <div className="app">
      <a className="skip-link" href="#stage">
        {t('app.skipToFretboard')}
      </a>
      <Header />
      {/* On a narrow screen the sidebar sits below the instrument, so the
          switch between guitar and bass is lifted to the top of the page. */}
      {narrow && (
        <div className="family-bar">
          <FamilySwitch />
        </div>
      )}

      <main className="app-main">
        <div className="sidebar" aria-label={t('stage.controls')}>
          <ControlPanel />
          <AudioControls />
        </div>

        <div className="stage-column">
          <section id="stage" aria-label={t('stage.label')}>
            <InstrumentStage
              geo={geo}
              overlay={<TunerPanel visible={mode === 'tuner'} />}
              toolbar={
                <>
                  <div className="zoom-control">
                    <div className="zoom-buttons">
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => setZoom(zoom - 0.15)}
                        disabled={mode === 'tuner' || zoom <= ZOOM_MIN}
                        aria-label={t('stage.zoomOut')}
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
                        aria-label={t('stage.zoomIn')}
                      >
                        +
                      </button>
                    </div>
                    <input
                      type="range"
                      className="zoom-slider"
                      min={ZOOM_MIN}
                      max={ZOOM_MAX}
                      step={0.01}
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                      disabled={mode === 'tuner'}
                      aria-label={t('stage.zoom')}
                      aria-valuetext={`${Math.round(zoom * 100)}%`}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => setZoom(1)}
                    disabled={mode === 'tuner'}
                    title={t('stage.reset.help')}
                  >
                    {t('stage.reset')}
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
                    title={t('stage.whole.help')}
                  >
                    {t('stage.whole')}
                  </button>
                  <div className="spacer" />
                  <span className="stage-hint">
                    {mode === 'tuner' ? t('stage.hint.tuner') : t('stage.hint')}
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
            <Notice title={t('audio.firstClick.title')}>{t('audio.firstClick.body')}</Notice>
          )}

          <InfoPanel />
          <ChordPanel />
        </div>
      </main>

      <footer className="app-footer">
        <span>{t('footer.note')}</span>
        <span>
          {t(ctx.instrument.id === 'bass4' ? 'instrument.bass4' : 'instrument.guitar6')} ·{' '}
          {ctx.tuning.notes.join(' ')} · {ctx.scaleName}
        </span>
      </footer>
    </div>
  );
}
