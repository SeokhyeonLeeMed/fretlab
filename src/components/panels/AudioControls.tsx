/**
 * AudioControls.tsx — volume, labels, zoom and display preferences.
 */

import { Card, Notice, Segmented, Slider, Switch } from '../ui/controls';
import { ZOOM_MAX, ZOOM_MIN, useStore } from '../../state/store';
import { usePlayback } from '../../hooks/usePlayback';
import { storageAvailable } from '../../state/persist';
import { useMemo } from 'react';
import type { LabelStyle } from '../../state/store';
import { useT } from '../../i18n';

export function AudioControls() {
  const volume = useStore((s) => s.volume);
  const setVolume = useStore((s) => s.setVolume);
  const showLabels = useStore((s) => s.showLabels);
  const toggleLabels = useStore((s) => s.toggleLabels);
  const labelStyle = useStore((s) => s.labelStyle);
  const setLabelStyle = useStore((s) => s.setLabelStyle);
  const showNonScaleNotes = useStore((s) => s.showNonScaleNotes);
  const setShowNonScaleNotes = useStore((s) => s.setShowNonScaleNotes);
  const zoom = useStore((s) => s.zoom);
  const setZoom = useStore((s) => s.setZoom);
  const reset = useStore((s) => s.reset);
  const a4 = useStore((s) => s.a4);
  const setA4 = useStore((s) => s.setA4);

  const { audioError, stop } = usePlayback();
  const t = useT();
  const canPersist = useMemo(storageAvailable, []);

  return (
    <Card title={t('audio.title')} id="audio">
      {audioError && (
        <div style={{ marginBottom: 12 }}>
          <Notice kind="error" title={t('audio.problem')}>
            {audioError}
          </Notice>
        </div>
      )}

      <Slider
        label={t('audio.volume')}
        min={0}
        max={1}
        step={0.01}
        value={volume}
        onChange={setVolume}
        format={(v) => `${Math.round(v * 100)}%`}
      />

      <Slider
        label={t('audio.a4')}
        min={392}
        max={466}
        step={1}
        value={a4}
        onChange={setA4}
        format={(v) => t('audio.a4.value', { hz: v })}
        help={t('audio.a4.help')}
      />
      <div className="chip-row" style={{ marginTop: -4, marginBottom: 12 }}>
        {[415, 432, 440, 442].map((hz) => (
          <button
            key={hz}
            type="button"
            className="chip"
            aria-pressed={a4 === hz}
            style={a4 === hz ? { borderColor: 'var(--accent)', color: 'var(--text)' } : undefined}
            onClick={() => setA4(hz)}
          >
            {hz} Hz
          </button>
        ))}
      </div>

      <Slider
        label={t('audio.zoom')}
        min={ZOOM_MIN}
        max={ZOOM_MAX}
        step={0.05}
        value={zoom}
        onChange={setZoom}
        format={(v) => `${Math.round(v * 100)}%`}
        help={t('audio.zoom.help')}
      />

      <Switch
        label={t('audio.labels')}
        checked={showLabels}
        onChange={toggleLabels}
        help={t('audio.labels.help')}
      />

      <div className="field" style={{ marginTop: 8 }}>
        <span className="field-label">{t('audio.labelStyle')}</span>
        <Segmented<LabelStyle>
          label={t('audio.labelStyle')}
          value={labelStyle}
          onChange={setLabelStyle}
          options={[
            { value: 'note', label: t('audio.labelStyle.note'), title: t('audio.labelStyle.note.help') },
            { value: 'degree', label: t('audio.labelStyle.degree'), title: t('audio.labelStyle.degree.help') },
          ]}
        />
      </div>

      <Switch
        label={t('audio.showOutside')}
        checked={showNonScaleNotes}
        onChange={setShowNonScaleNotes}
        help={t('audio.showOutside.help')}
      />

      <div className="strum-row" style={{ marginTop: 14 }}>
        <button type="button" className="btn btn-sm" onClick={stop}>
          {t('audio.stop')}
        </button>
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => {
            if (confirm(t('audio.reset.confirm'))) reset();
          }}
        >
          {t('audio.reset')}
        </button>
      </div>

      <p className="field-hint" style={{ marginTop: 10 }}>
        {canPersist ? t('audio.persist.yes') : t('audio.persist.no')}
      </p>
    </Card>
  );
}
