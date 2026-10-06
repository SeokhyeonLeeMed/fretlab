/**
 * Header.tsx — identity, the four interaction modes, the language picker and
 * the theme switch.
 */

import { useStore, type Mode, type Theme } from '../state/store';
import { Segmented } from './ui/controls';
import { LOCALES, localeName, useT, type Locale } from '../i18n';

export function Header() {
  const mode = useStore((s) => s.mode);
  const setMode = useStore((s) => s.setMode);
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const locale = useStore((s) => s.locale);
  const setLocale = useStore((s) => s.setLocale);
  const t = useT();

  const modes: { value: Mode; label: string; title: string }[] = [
    { value: 'normal', label: t('mode.normal'), title: t('mode.normal.help') },
    { value: 'scale', label: t('mode.scale'), title: t('mode.scale.help') },
    { value: 'chord', label: t('mode.chord'), title: t('mode.chord.help') },
    { value: 'tuner', label: t('mode.tuner'), title: t('mode.tuner.help') },
  ];

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
            {t('app.tagline')}
          </span>
        </span>
      </div>

      <nav aria-label={t('mode.label')} style={{ minWidth: 280, flex: '1 1 300px', maxWidth: 460 }}>
        <Segmented<Mode> label={t('mode.label')} value={mode} onChange={setMode} options={modes} />
      </nav>

      <div className="header-spacer" />

      <div className="header-tools">
        <label className="visually-hidden" htmlFor="locale-select">
          {t('lang.label')}
        </label>
        <select
          id="locale-select"
          className="select"
          style={{ width: 'auto', minWidth: 132 }}
          value={locale}
          onChange={(e) => setLocale(e.target.value as Locale)}
          aria-label={t('lang.label')}
        >
          {LOCALES.map((l) => (
            <option key={l} value={l}>
              {localeName(l)}
            </option>
          ))}
        </select>
        <Segmented<Theme>
          label={t('theme.label')}
          value={theme}
          onChange={setTheme}
          options={[
            { value: 'dark', label: t('theme.dark') },
            { value: 'light', label: t('theme.light') },
          ]}
        />
      </div>
    </header>
  );
}
