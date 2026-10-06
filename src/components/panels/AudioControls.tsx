/**
 * AudioControls.tsx — volume, labels, zoom and display preferences.
 */

import { Card, Notice, Segmented, Slider, Switch } from '../ui/controls';
import { ZOOM_MAX, ZOOM_MIN, useStore } from '../../state/store';
import { usePlayback } from '../../hooks/usePlayback';
import { storageAvailable } from '../../state/persist';
import { useMemo } from 'react';
import type { LabelStyle } from '../../state/store';

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
  const canPersist = useMemo(storageAvailable, []);

  return (
    <Card title="Sound &amp; display" id="audio">
      {audioError && (
        <div style={{ marginBottom: 12 }}>
          <Notice kind="error" title="Audio problem">
            {audioError}
          </Notice>
        </div>
      )}

      <Slider
        label="Volume"
        min={0}
        max={1}
        step={0.01}
        value={volume}
        onChange={setVolume}
        format={(v) => `${Math.round(v * 100)}%`}
      />

      <Slider
        label="Reference pitch"
        min={392}
        max={466}
        step={1}
        value={a4}
        onChange={setA4}
        format={(v) => `A4 = ${v} Hz`}
        help="Concert pitch. Everything follows it: the notes you play, the tuner's targets and the frequencies shown. 440 Hz is standard; 432 and 415 Hz are also used."
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
        label="Fretboard zoom"
        min={ZOOM_MIN}
        max={ZOOM_MAX}
        step={0.05}
        value={zoom}
        onChange={setZoom}
        format={(v) => `${Math.round(v * 100)}%`}
        help="You can also pinch on a touch screen, or hold Ctrl and scroll."
      />

      <Switch
        label="Show note labels"
        checked={showLabels}
        onChange={toggleLabels}
        help="Turns the text inside each marker on or off. Marker shape and colour stay."
      />

      <div className="field" style={{ marginTop: 8 }}>
        <span className="field-label">Label style</span>
        <Segmented<LabelStyle>
          label="Label style"
          value={labelStyle}
          onChange={setLabelStyle}
          options={[
            { value: 'note', label: 'Note names', title: 'E, F#, G…' },
            { value: 'degree', label: 'Degrees', title: '1, ♭3, 5…' },
          ]}
        />
      </div>

      <Switch
        label="Show notes outside the scale"
        checked={showNonScaleNotes}
        onChange={setShowNonScaleNotes}
        help="Keeps the remaining positions faintly visible so you can still click them."
      />

      <div className="strum-row" style={{ marginTop: 14 }}>
        <button type="button" className="btn btn-sm" onClick={stop}>
          Stop all sound
        </button>
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => {
            if (confirm('Reset every FretLab setting to its default?')) reset();
          }}
        >
          Reset settings
        </button>
      </div>

      <p className="field-hint" style={{ marginTop: 10 }}>
        {canPersist
          ? 'Your instrument, tuning, scale, theme and audio settings are remembered in this browser. No account, no server.'
          : 'This browser is blocking local storage, so settings will reset when you reload.'}
      </p>
    </Card>
  );
}
