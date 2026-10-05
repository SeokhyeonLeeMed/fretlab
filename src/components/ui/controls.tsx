/**
 * controls.tsx — small, reusable, accessible form primitives.
 *
 * Each one is a real labelled control: native <select>, native range input,
 * and buttons with `aria-pressed` for the toggles, so keyboard and screen
 * reader behaviour comes from the platform rather than being re-implemented.
 */

import { type ReactNode, useId } from 'react';

export function Card({
  title,
  action,
  children,
  id,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section className="card" id={id} aria-labelledby={title ? `${id ?? title}-h` : undefined}>
      {title && (
        <h2 className="card-title" id={`${id ?? title}-h`}>
          <span>{title}</span>
          {action}
        </h2>
      )}
      {children}
    </section>
  );
}

export function Help({ text }: { text: string }) {
  return (
    <span className="help" tabIndex={0} role="note" title={text} aria-label={`Help: ${text}`}>
      ?
    </span>
  );
}

export function Field({
  label,
  hint,
  error,
  help,
  children,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  help?: string;
  children: (props: {
    id: string;
    describedBy: string | undefined;
    labelledBy: string;
  }) => ReactNode;
}) {
  const id = useId();
  const hintId = hint || error ? `${id}-d` : undefined;
  const labelId = `${id}-l`;
  return (
    <div className="field">
      <label className="field-label" id={labelId} htmlFor={id}>
        {label} {help && <Help text={help} />}
      </label>
      {children({ id, describedBy: hintId, labelledBy: labelId })}
      {error ? (
        <span className="field-error" id={hintId} role="alert">
          {error}
        </span>
      ) : (
        hint && (
          <span className="field-hint" id={hintId}>
            {hint}
          </span>
        )
      )}
    </div>
  );
}

export interface Option {
  value: string;
  label: string;
  group?: string;
}

export function Select({
  value,
  options,
  onChange,
  id,
  describedBy,
  labelledBy,
  ariaLabel,
}: {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  id?: string;
  describedBy?: string;
  /** id of the visible <label>. Paired with htmlFor, never instead of it. */
  labelledBy?: string;
  ariaLabel?: string;
}) {
  const groups = options.reduce<Record<string, Option[]>>((acc, o) => {
    const key = o.group ?? '';
    (acc[key] ??= []).push(o);
    return acc;
  }, {});
  const keys = Object.keys(groups);
  const grouped = keys.length > 1 || (keys.length === 1 && keys[0] !== '');

  return (
    <select
      className="select"
      id={id}
      value={value}
      aria-label={ariaLabel}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      onChange={(e) => onChange(e.target.value)}
    >
      {grouped
        ? keys.map((g) => (
            <optgroup key={g} label={g || 'Other'}>
              {groups[g].map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </optgroup>
          ))
        : options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
    </select>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string; title?: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          title={o.title}
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  help,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  help?: string;
}) {
  // The id has to be generated: deriving it from the label text produces ids
  // containing spaces, which never resolve, leaving the switch unnamed.
  const id = useId();
  return (
    <div className="switch-row">
      <span id={id}>
        {label} {help && <Help text={help} />}
      </span>
      <button
        type="button"
        className="switch"
        role="switch"
        aria-checked={checked}
        aria-labelledby={id}
        onClick={() => onChange(!checked)}
      />
    </div>
  );
}

export function Slider({
  value,
  min,
  max,
  step,
  onChange,
  label,
  format,
  help,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  label: string;
  format: (v: number) => string;
  help?: string;
}) {
  const id = useId();
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {label} {help && <Help text={help} />}
      </label>
      <div className="slider-row">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-valuetext={format(value)}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <output className="slider-value" htmlFor={id}>
          {format(value)}
        </output>
      </div>
    </div>
  );
}

export function Notice({
  kind = 'info',
  title,
  children,
  action,
}: {
  kind?: 'info' | 'error';
  title?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className={`notice notice-${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      <div style={{ flex: '1 1 auto' }}>
        {title && <strong>{title}</strong>}
        {children}
      </div>
      {action}
    </div>
  );
}
