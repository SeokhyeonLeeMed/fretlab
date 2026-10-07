/**
 * NeckMap.tsx — a small map of the neck, with a box marking the part the
 * stage is showing.
 *
 * It is the stage's horizontal control. The wheel and a swipe are left to the
 * page, so they only ever scroll it up and down; moving along the neck is
 * done here, by dragging the box, pressing the map, or with the arrow keys.
 *
 * Only the neck is drawn — the nut, every fret and the position dots — since
 * that is where the notes are and it is what a player navigates by. The box is
 * the visible part of the instrument clipped to the neck; pushing it against
 * either end of the map carries the view on to the headstock or the body, so
 * nothing is out of reach.
 *
 * The drawing is a schematic, not the instrument artwork, but it is to scale:
 * it uses the stage's own coordinates in both directions, so the neck keeps
 * its real proportions and its real taper, and a fret here is the same fret
 * below.
 */

import { useCallback, useRef } from 'react';
import type { Geometry } from './geometry';
import { inlayKind } from '../../core/theory/fretboard';

/**
 * The string field is inset from the fretboard's edges by this fraction on
 * each side (see geometry.ts), so dividing by what is left recovers the board.
 */
const STRING_FIELD = 1 - 2 * 0.085;

/** The stretch of the instrument the map covers, in stage units. */
export function neckMapRange(geo: Geometry): { x0: number; x1: number } {
  // A little past each end, so the nut and the last fret are not on the edge.
  const pad = (geo.boardEndX - geo.nutX) * 0.03;
  return { x0: geo.nutX - pad, x1: geo.boardEndX + pad };
}

export interface NeckMapProps {
  geo: Geometry;
  /** Left and right edges of the visible part of the instrument, in stage units. */
  viewX0: number;
  viewX1: number;
  /** Called with the wanted left edge of the view, in stage units. */
  onMove: (viewX0: number) => void;
  /** How far along its whole travel the view is, 0..100, for assistive tech. */
  percent: number;
  disabled?: boolean;
  label: string;
  help: string;
}

export function NeckMap(props: NeckMapProps) {
  const { geo, viewX0, viewX1, onMove, percent, disabled, label, help } = props;
  const trackRef = useRef<HTMLDivElement>(null);
  /** Where inside the view the drag took hold, in stage units. */
  const grip = useRef<number | null>(null);

  const { x0, x1 } = neckMapRange(geo);
  const length = x1 - x0;
  const viewWidth = viewX1 - viewX0;
  /**
   * The view's left edge as the map sees it. Where the view runs off an end of
   * the map the box is clipped there, and movement is measured from the
   * clipped box, so the first pixel of a drag moves it: measured from the true
   * edge, a drag away from the headstock would do nothing until it had
   * covered the headstock's whole width.
   */
  const anchor =
    viewX1 > x1 && viewX0 > x0 ? x1 - viewWidth : Math.max(viewX0, x0);

  const xAt = useCallback(
    (clientX: number): number => {
      const el = trackRef.current;
      if (!el) return x0;
      const box = el.getBoundingClientRect();
      return box.width > 0 ? x0 + ((clientX - box.left) / box.width) * length : x0;
    },
    [x0, length],
  );

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>): void => {
    if (disabled) return;
    const at = xAt(e.clientX);
    // Taking hold of the box keeps the point under the pointer; pressing the
    // map anywhere else brings the box to it, centred, and drags from there.
    const inside = at >= Math.max(viewX0, x0) && at <= Math.min(viewX1, x1);
    grip.current = inside ? at - anchor : viewWidth / 2;
    if (!inside) onMove(at - viewWidth / 2);
    e.currentTarget.setPointerCapture?.(e.pointerId);
    e.preventDefault();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>): void => {
    if (grip.current === null) return;
    onMove(xAt(e.clientX) - grip.current);
  };

  const release = (): void => {
    grip.current = null;
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    if (disabled) return;
    const step = Math.max(length * 0.02, viewWidth / 4);
    let next: number | null = null;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = anchor - step;
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = anchor + step;
    else if (e.key === 'PageUp') next = anchor - viewWidth;
    else if (e.key === 'PageDown') next = anchor + viewWidth;
    else if (e.key === 'Home') next = -Infinity;
    else if (e.key === 'End') next = Infinity;
    if (next === null) return;
    e.preventDefault();
    onMove(next);
  };

  // The visible part, clipped to the neck. A view wholly over the headstock or
  // the body still leaves a sliver at that end, so the box never vanishes.
  const clip = (x: number): number => Math.min(1, Math.max(0, (x - x0) / length));
  const MIN = 0.02;
  let left = clip(viewX0);
  let right = clip(viewX1);
  if (right - left < MIN) {
    if (left > 1 - MIN) left = 1 - MIN;
    right = left + MIN;
  }

  const frets = Array.from({ length: geo.fretCount }, (_, i) => i + 1);

  // The fretboard's real outline: its centre line and half-width at any x.
  const half = (x: number): number => geo.neckHalf(x) / STRING_FIELD;
  const top = (x: number): number => geo.boardMid(x) - half(x);
  const bottom = (x: number): number => geo.boardMid(x) + half(x);
  const xs = [geo.nutX, ...frets.map((f) => geo.fretX(f)), geo.boardEndX];
  const margin = half(geo.boardEndX) * 0.18;
  const y0 = Math.min(...xs.map(top)) - margin;
  const y1 = Math.max(...xs.map(bottom)) + margin;
  const height = y1 - y0;
  const outline = [
    ...xs.map((x) => `${x},${top(x)}`),
    ...[...xs].reverse().map((x) => `${x},${bottom(x)}`),
  ].join(' ');
  const dot = half(geo.nutX) * 0.16;

  return (
    <div
      className={`neck-map${disabled ? ' is-disabled' : ''}`}
      ref={trackRef}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      aria-orientation="horizontal"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(percent)}
      aria-disabled={disabled || undefined}
      title={help}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={release}
      onPointerCancel={release}
      onKeyDown={onKeyDown}
      // Sized from the neck itself, so it is never stretched or squashed.
      style={{ aspectRatio: `${length} / ${height}` }}
    >
      <svg
        viewBox={`${x0} ${y0} ${length} ${height}`}
        width="100%"
        height="100%"
        aria-hidden="true"
        focusable="false"
      >
        <polygon className="neck-map-board" points={outline} />
        {frets.map((f) => {
          const x = geo.fretX(f);
          return (
            <line
              key={f}
              className="neck-map-fret"
              data-fret={f}
              x1={x}
              x2={x}
              y1={top(x)}
              y2={bottom(x)}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
        <line
          className="neck-map-nut"
          x1={geo.nutX}
          x2={geo.nutX}
          y1={top(geo.nutX)}
          y2={bottom(geo.nutX)}
          vectorEffect="non-scaling-stroke"
        />
        {/* the dotted frets, which is how a player finds their place */}
        {frets.map((f) => {
          const kind = inlayKind(f);
          if (kind === 'none') return null;
          const x = geo.noteX(f);
          const mid = geo.boardMid(x);
          const off = half(x) * 0.5;
          return kind === 'double' ? (
            <g key={f}>
              <circle className="neck-map-dot" cx={x} cy={mid - off} r={dot} />
              <circle className="neck-map-dot" cx={x} cy={mid + off} r={dot} />
            </g>
          ) : (
            <circle key={f} className="neck-map-dot" cx={x} cy={mid} r={dot} />
          );
        })}
      </svg>
      <div
        className="neck-map-view"
        style={{ left: `${left * 100}%`, width: `${(right - left) * 100}%` }}
      />
    </div>
  );
}
