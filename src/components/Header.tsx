/**
 * Header.tsx — identity, the four interaction modes, and the theme switch.
 */

import { useStore, type Mode, type Theme } from '../state/store';
import { Segmented } from './ui/controls';

const MODES: { value: Mode; label: string; title: string }[] = [
  { value: 'normal', label: 'Notes', title: 'Click any position to hear the note it produces' },
  { value: 'scale', label: 'Scale', title: 'Highlight a scale or mode across the whole neck' },
  { value: 'chord', label: 'Chords', title: 'Show calculated chord shapes and strum them' },
  { value: 'tuner', label: 'Tuner', title: 'Move the view to the headstock and tune by microphone' },
];

export function Header() {
  const mode = useStore((s) => s.mode);
  const setMode = useStore((s) => s.setMode);
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);

  return (
    <header className="app-header">
      <div className="logo">
        <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
          <rect width="32" height="32" rx="7" fill="var(--bg-sunken)" />
          <g stroke="var(--accent)" strokeWidth="1.6">
            <path d="M5 9h22M5 16h22M5 23h22" />
          </g>
          <g stroke="var(--text-faint)" strokeWidth="2">
            <path d="M11 5v22M20 5v22" />
          </g>
        </svg>
        <span>
          FretLab
          <span className="logo-sub" style={{ display: 'block' }}>
            guitar &amp; bass fretboard
          </span>
        </span>
      </div>

      <nav aria-label="Interaction mode" style={{ minWidth: 280, flex: '1 1 300px', maxWidth: 460 }}>
        <Segmented<Mode> label="Interaction mode" value={mode} onChange={setMode} options={MODES} />
      </nav>

      <div className="header-spacer" />

      <div className="header-tools">
        <Segmented<Theme>
          label="Colour theme"
          value={theme}
          onChange={setTheme}
          options={[
            { value: 'dark', label: 'Dark' },
            { value: 'light', label: 'Light' },
          ]}
        />
      </div>
    </header>
  );
}
