/**
 * InstrumentSVG.tsx — the instrument itself.
 *
 * One SVG draws headstock, nut, fretboard, body and strings in a single
 * coordinate system, so scrolling and zooming move the whole instrument as
 * one object. The strings are drawn as one continuous run from each tuning
 * peg, over the nut, down to the bridge, which is what visually ties the
 * fretboard to the graphic around it.
 */

import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { CENTRE_Y as CENTRE_LINE, smoothPath, type Geometry } from './geometry';
import { inlayKind } from '../../core/theory/fretboard';
import { spellMidi, type SpellingMap } from '../../core/theory/spelling';
import { mod } from '../../core/theory/pitch';
import type { Voicing } from '../../core/theory/voicing';
import type { LabelStyle, Mode, SelectedPosition } from '../../state/store';

export interface NoteRoleInfo {
  role: 'root' | 'scale' | 'chord-root' | 'chord-tone' | 'voicing' | 'plain';
  label: string | null;
  /** 0..1; 0 means draw nothing but keep the position clickable. */
  emphasis: number;
}

export interface InstrumentSVGProps {
  geo: Geometry;
  openMidis: number[];
  spelling: SpellingMap;
  mode: Mode;
  labelStyle: LabelStyle;
  showLabels: boolean;
  showNonScaleNotes: boolean;
  scalePcs: Set<number>;
  scaleDegrees: Map<number, string>;
  scaleRootPc: number;
  chordPcs: Set<number>;
  chordDegrees: Map<number, string>;
  chordRootPc: number;
  scaleOverlayInChordMode: boolean;
  voicing: Voicing | null;
  selected: SelectedPosition | null;
  /** Tuner mode: per-string tuning state for the peg indicators. */
  tunerTargets?: { stringIndex: number; state: 'idle' | 'active' | 'in-tune' }[];
  onPick: (stringIndex: number, fret: number) => void;
}

const ROLE_FILL: Record<NoteRoleInfo['role'], string> = {
  root: 'var(--role-root)',
  scale: 'var(--role-scale)',
  'chord-root': 'var(--role-root)',
  'chord-tone': 'var(--role-chord)',
  voicing: 'var(--role-chord)',
  plain: 'var(--text-faint)',
};

const ROLE_INK: Record<NoteRoleInfo['role'], string> = {
  root: 'var(--role-root-ink)',
  scale: 'var(--role-scale-ink)',
  'chord-root': 'var(--role-root-ink)',
  'chord-tone': 'var(--role-chord-ink)',
  voicing: 'var(--role-chord-ink)',
  plain: 'var(--bg)',
};

export function InstrumentSVG(props: InstrumentSVGProps) {
  const { geo, openMidis, mode, selected, onPick } = props;
  const [focusCell, setFocusCell] = useState<SelectedPosition>({ stringIndex: 0, fret: 0 });
  // The focus ring only appears once the grid really has keyboard focus, so
  // it is never a stray blue box on a freshly loaded page.
  const [gridFocused, setGridFocused] = useState(false);
  const gridRef = useRef<SVGGElement>(null);

  const d = geo.instrument.display;
  const frets = useMemo(
    () => Array.from({ length: geo.fretCount + 1 }, (_, i) => i),
    [geo.fretCount],
  );
  const strings = useMemo(
    () => Array.from({ length: geo.stringCount }, (_, i) => i),
    [geo.stringCount],
  );

  /** Role, label and emphasis for one position — the single place that decides
   *  how a note looks, so colour and shape can never disagree. */
  const roleFor = useCallback(
    (stringIndex: number, fret: number): NoteRoleInfo => {
      const midi = openMidis[stringIndex] + fret;
      const pc = mod(midi, 12);
      const name = props.showLabels ? spellMidi(midi, props.spelling).name : null;

      const inVoicing = props.voicing?.frets[stringIndex] === fret && props.voicing !== null;
      if (mode === 'chord' && inVoicing) {
        return {
          role: pc === props.chordRootPc ? 'chord-root' : 'voicing',
          label: props.showLabels
            ? props.labelStyle === 'degree'
              ? props.chordDegrees.get(pc) ?? name
              : name
            : null,
          emphasis: 1,
        };
      }
      if (mode === 'chord') {
        const inChord = props.chordPcs.has(pc);
        if (inChord) {
          return {
            role: pc === props.chordRootPc ? 'root' : 'chord-tone',
            label: props.showLabels
              ? props.labelStyle === 'degree'
                ? props.chordDegrees.get(pc) ?? name
                : name
              : null,
            emphasis: 0.42,
          };
        }
        if (props.scaleOverlayInChordMode && props.scalePcs.has(pc)) {
          return { role: 'scale', label: null, emphasis: 0.2 };
        }
        return { role: 'plain', label: null, emphasis: props.showNonScaleNotes ? 0.1 : 0 };
      }

      if (mode === 'scale') {
        if (props.scalePcs.has(pc)) {
          const isRoot = pc === props.scaleRootPc;
          return {
            role: isRoot ? 'root' : 'scale',
            label: props.showLabels
              ? props.labelStyle === 'degree'
                ? props.scaleDegrees.get(pc) ?? name
                : name
              : null,
            emphasis: 1,
          };
        }
        return { role: 'plain', label: null, emphasis: props.showNonScaleNotes ? 0.1 : 0 };
      }

      // Normal mode: every position is available, nothing is pre-highlighted.
      return { role: 'plain', label: null, emphasis: 0.14 };
    },
    [mode, openMidis, props],
  );

  const handleKey = useCallback(
    (e: React.KeyboardEvent<SVGGElement>) => {
      const { stringIndex, fret } = focusCell;
      let next: SelectedPosition | null = null;
      switch (e.key) {
        case 'ArrowRight':
          next = { stringIndex, fret: Math.min(geo.fretCount, fret + 1) };
          break;
        case 'ArrowLeft':
          next = { stringIndex, fret: Math.max(0, fret - 1) };
          break;
        case 'ArrowDown':
          next = { stringIndex: Math.min(geo.stringCount - 1, stringIndex + 1), fret };
          break;
        case 'ArrowUp':
          next = { stringIndex: Math.max(0, stringIndex - 1), fret };
          break;
        case 'Home':
          next = { stringIndex, fret: 0 };
          break;
        case 'End':
          next = { stringIndex, fret: geo.fretCount };
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          onPick(stringIndex, fret);
          return;
        default:
          return;
      }
      e.preventDefault();
      setFocusCell(next);
    },
    [focusCell, geo.fretCount, geo.stringCount, onPick],
  );

  const focusedMidi = openMidis[focusCell.stringIndex] + focusCell.fret;
  const focusedName = spellMidi(focusedMidi, props.spelling).full;

  return (
    <svg
      viewBox={`0 0 ${geo.width} ${geo.height}`}
      width={geo.width}
      height={geo.height}
      role="group"
      aria-label={`${geo.instrument.name} fretboard`}
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id="fl-board" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={lighten(d.fretboardColor, 0.22)} />
          <stop offset="0.45" stopColor={d.fretboardColor} />
          <stop offset="1" stopColor={darken(d.fretboardColor, 0.3)} />
        </linearGradient>
        <linearGradient id="fl-body" x1="0.1" y1="0" x2="0.6" y2="1">
          <stop offset="0" stopColor={lighten(d.bodyColor, 0.3)} />
          <stop offset="0.5" stopColor={d.bodyColor} />
          <stop offset="1" stopColor={darken(d.bodyColor, 0.25)} />
        </linearGradient>
        <linearGradient id="fl-head" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={lighten(d.fretboardColor, 0.14)} />
          <stop offset="1" stopColor={darken(d.fretboardColor, 0.24)} />
        </linearGradient>

      </defs>

      {/* ---- body ------------------------------------------------------- */}
      <g aria-hidden="true">
        <path d={geo.bodyPath} fill="url(#fl-body)" stroke={d.bodyEdgeColor} strokeWidth={3} />
        <BodyHardware geo={geo} />
      </g>

      {/* ---- neck and fretboard ----------------------------------------- */}
      <g aria-hidden="true">
        <path
          d={neckPath(geo)}
          fill="url(#fl-board)"
          stroke={darken(d.fretboardColor, 0.45)}
          strokeWidth={2}
        />
        {/* Nut */}
        <path
          d={`M ${geo.nutX} ${CENTRE(geo, geo.nutX, -1) - 4} L ${geo.nutX} ${CENTRE(geo, geo.nutX, 1) + 4}`}
          stroke="#efe7d6"
          strokeWidth={9}
          strokeLinecap="round"
        />
        {/* Fret wires. Drawn as a dark seat with a bright crown on top:
            solid colours, because a gradient in objectBoundingBox units
            cannot paint a shape with zero bounding-box width. */}
        {frets.slice(1).map((f) => {
          const fx = geo.fretX(f);
          const w = f < 6 ? 4.4 : f < 13 ? 3.8 : 3.2;
          return (
            <g key={f}>
              <line
                x1={fx}
                y1={CENTRE(geo, fx, -1) - 1}
                x2={fx}
                y2={CENTRE(geo, fx, 1) + 1}
                stroke="#5e636b"
                strokeWidth={w}
                strokeLinecap="round"
              />
              <line
                x1={fx - w * 0.22}
                y1={CENTRE(geo, fx, -1) - 1}
                x2={fx - w * 0.22}
                y2={CENTRE(geo, fx, 1) + 1}
                stroke="#e8ecf2"
                strokeWidth={w * 0.42}
                strokeLinecap="round"
              />
            </g>
          );
        })}
        {/* Fret ends, so the wire reads as metal set into the wood. */}
        {frets.slice(1).map((f) => (
          <g key={`end${f}`}>
            <circle cx={geo.fretX(f)} cy={CENTRE(geo, geo.fretX(f), -1)} r={1.9} fill="#d7dce3" />
            <circle cx={geo.fretX(f)} cy={CENTRE(geo, geo.fretX(f), 1)} r={1.9} fill="#d7dce3" />
          </g>
        ))}
        {/* Position inlays */}
        {frets.map((f) => {
          const kind = inlayKind(f);
          if (kind === 'none') return null;
          const x = geo.noteX(f);
          const half = geo.neckHalf(x);
          const rad = geo.instrument.family === 'bass' ? 8 : 7;
          return kind === 'double' ? (
            <g key={`inlay${f}`}>
              <circle cx={x} cy={CENTRE_LINE - half * 0.52} r={rad} fill="#e8e2d4" opacity={0.78} />
              <circle cx={x} cy={CENTRE_LINE + half * 0.52} r={rad} fill="#e8e2d4" opacity={0.78} />
            </g>
          ) : (
            <circle key={`inlay${f}`} cx={x} cy={CENTRE_LINE} r={rad} fill="#e8e2d4" opacity={0.68} />
          );
        })}
      </g>

      {/* ---- headstock and tuners --------------------------------------- */}
      <g aria-hidden="true">
        <path d={geo.headPath} fill="url(#fl-head)" stroke={darken(d.fretboardColor, 0.5)} strokeWidth={2.5} />
        {geo.pegs.map((peg) => {
          const target = props.tunerTargets?.find((t) => t.stringIndex === peg.stringIndex);
          const state = target?.state ?? 'idle';
          return (
            <g key={peg.stringIndex}>
              {/* Post stem, from the string's own height down to the button. */}
              <line
                x1={peg.postX}
                y1={peg.postY}
                x2={peg.x}
                y2={peg.y}
                stroke="#8f98a4"
                strokeWidth={4}
                strokeLinecap="round"
              />
              <circle cx={peg.postX} cy={peg.postY} r={5.5} fill="#b9c1cc" stroke="#767f8b" strokeWidth={1.2} />
              <circle cx={peg.postX} cy={peg.postY} r={2} fill="#6f7884" />
              {state !== 'idle' && (
                <circle
                  cx={peg.x}
                  cy={peg.y}
                  r={18}
                  fill="none"
                  stroke={state === 'in-tune' ? 'var(--ok)' : 'var(--accent)'}
                  strokeWidth={3}
                  opacity={0.9}
                />
              )}
              {/* Tuner button. */}
              <ellipse
                cx={peg.x}
                cy={peg.y}
                rx={13}
                ry={7.5}
                fill={state === 'in-tune' ? 'var(--ok)' : '#ccd3dd'}
                stroke="#6f7884"
                strokeWidth={1.5}
                transform={`rotate(18 ${peg.x} ${peg.y})`}
              />
              <ellipse cx={peg.x} cy={peg.y} rx={5} ry={3} fill="#9aa3af" opacity={0.6} transform={`rotate(18 ${peg.x} ${peg.y})`} />
            </g>
          );
        })}
      </g>

      {/* ---- strings ----------------------------------------------------- */}
      <g aria-hidden="true">
        {strings.map((i) => {
          const peg = geo.pegs[i];
          const mutedInChord = mode === 'chord' && props.voicing?.frets[i] === null;
          return (
            <g key={i} opacity={mutedInChord ? 0.3 : 1}>
              <polyline
                points={`${peg.postX},${peg.postY} ${geo.nutX},${geo.stringY(i, geo.nutX)} ${geo.bridgeX},${geo.stringY(i, geo.bridgeX)}`}
                fill="none"
                stroke="#6d737c"
                strokeWidth={geo.stringWidth(i)}
                strokeLinecap="round"
              />
              <polyline
                points={`${peg.postX},${peg.postY} ${geo.nutX},${geo.stringY(i, geo.nutX)} ${geo.bridgeX},${geo.stringY(i, geo.bridgeX)}`}
                fill="none"
                stroke="#e9edf3"
                strokeWidth={geo.stringWidth(i) * 0.45}
                strokeLinecap="round"
              />
              {mutedInChord && (
                <MutedMark x={geo.nutX - 30} y={geo.stringY(i, geo.nutX)} r={geo.noteRadius} />
              )}
            </g>
          );
        })}
      </g>

      {/* ---- fret numbers ------------------------------------------------ */}
      <g aria-hidden="true" fontFamily="var(--font-mono)" fontSize={13} fill="var(--text-muted)">
        {frets.map((f) => {
          if (f === 0) return null;
          // Odd frets plus the octave markers: enough to navigate by without
          // crowding the high frets.
          const show = f === 12 || f === 24 || f % 2 === 1;
          if (!show) return null;
          const x = geo.noteX(f);
          return (
            <text
              key={f}
              x={x}
              y={CENTRE_LINE + geo.neckHalf(x) + 22}
              textAnchor="middle"
              fontWeight={f === 12 || f === 24 ? 700 : 400}
            >
              {f}
            </text>
          );
        })}
        <text x={geo.nutX - 30} y={CENTRE_LINE + geo.neckHalf(geo.nutX) + 22} textAnchor="middle">
          0
        </text>
      </g>

      {/* ---- interactive note grid --------------------------------------- */}
      <g
        ref={gridRef}
        role="grid"
        aria-label={`Fretboard. Arrow keys move between positions, Enter plays. Current position: ${focusedName}.`}
        tabIndex={0}
        onKeyDown={handleKey}
        onFocus={() => setGridFocused(true)}
        onBlur={() => setGridFocused(false)}
        style={{ outline: 'none' }}
      >
        <title>{`Fretboard, currently on ${focusedName}`}</title>
        {strings.map((s) =>
          frets.map((f) => (
            <NoteCell
              key={`${s}-${f}`}
              geo={geo}
              stringIndex={s}
              fret={f}
              info={roleFor(s, f)}
              selected={selected?.stringIndex === s && selected?.fret === f}
              focused={gridFocused && focusCell.stringIndex === s && focusCell.fret === f}
              fingerLabel={
                mode === 'chord' && props.voicing?.frets[s] === f && f > 0 ? String(f) : null
              }
              onPick={onPick}
              onFocusCell={setFocusCell}
              name={spellMidi(openMidis[s] + f, props.spelling).full}
            />
          )),
        )}
      </g>
    </svg>
  );
}


const CENTRE = (geo: Geometry, x: number, sign: -1 | 1): number => CENTRE_LINE + sign * geo.neckHalf(x);

/** The tapered fretboard, from the nut to where it meets the body. */
function neckPath(geo: Geometry): string {
  const x0 = geo.nutX;
  const x1 = geo.neckJoinX;
  return [
    `M ${x0} ${CENTRE(geo, x0, -1)}`,
    `L ${x1} ${CENTRE(geo, x1, -1)}`,
    `L ${x1} ${CENTRE(geo, x1, 1)}`,
    `L ${x0} ${CENTRE(geo, x0, 1)}`,
    'Z',
  ].join(' ');
}

/**
 * Pickguard, pickups, bridge and controls.
 *
 * Everything is placed in the body's own normalised 1000 x 700 box, the same
 * coordinates the silhouette is traced in, so the hardware moves with the
 * shape instead of being pinned to magic world coordinates. The bridge is the
 * exception: it is aligned to the real bridge position, because that is where
 * the strings actually terminate.
 */
function BodyHardware({ geo }: { geo: Geometry }) {
  const d = geo.instrument.display;
  const isBass = geo.instrument.family === 'bass';
  const strings = geo.stringCount;
  const P = (nx: number, ny: number): [number, number] => geo.bodyPoint(nx, ny);

  // Pickups sit between the end of the neck and the bridge.
  const bridgeBoxX = geo.bodyBoxX(geo.bridgeX);
  const neckBoxX = geo.bodyBoxX(geo.neckJoinX);
  const lerp = (t: number): number => neckBoxX + (bridgeBoxX - neckBoxX) * t;
  const pickups = isBass
    ? [
        { nx: lerp(0.4), slant: 0, w: 30 },
        { nx: lerp(0.72), slant: 0, w: 30 },
      ]
    : [
        { nx: lerp(0.16), slant: 0, w: 18 },
        { nx: lerp(0.46), slant: 0, w: 18 },
        { nx: lerp(0.78), slant: 8, w: 18 },
      ];

  /** Half-height of the string field at a world x. */
  const fieldHalf = (x: number): number =>
    Math.abs(geo.stringY(0, x) - geo.stringY(strings - 1, x)) / 2;

  // A pickguard hugging the treble side, from the neck pocket to past the
  // bridge pickup.
  const guardNx0 = neckBoxX - 40;
  const guardNx1 = Math.min(bridgeBoxX + 10, 880);
  const gx = (t: number): number => guardNx0 + (guardNx1 - guardNx0) * t;
  const guard: [number, number][] = [
    [gx(0.0), 288],
    [gx(0.04), 212],
    [gx(0.16), 158],
    [gx(0.34), 126],
    [gx(0.54), 120],
    [gx(0.74), 140],
    [gx(0.9), 182],
    [gx(1.0), 244],
    [gx(1.02), 320],
    [gx(0.96), 396],
    [gx(0.84), 452],
    [gx(0.66), 486],
    [gx(0.46), 492],
    [gx(0.26), 474],
    [gx(0.1), 426],
    [gx(0.0), 360],
  ];

  return (
    <g>
      <path
        d={smoothPath(guard.map(([nx, ny]) => P(nx, ny)), true)}
        fill={d.pickguardColor}
        opacity={0.5}
        stroke="rgba(0,0,0,0.32)"
        strokeWidth={1.6}
      />

      {pickups.map((p, i) => {
        const [x] = P(p.nx, 0);
        const fh = fieldHalf(x) + (isBass ? 15 : 12);
        return (
          <g key={i} transform={`rotate(${p.slant} ${x} ${CENTRE_LINE})`}>
            <rect
              x={x - p.w / 2}
              y={CENTRE_LINE - fh}
              width={p.w}
              height={fh * 2}
              rx={p.w / 2.8}
              fill="#1d2127"
              stroke="#555d68"
              strokeWidth={1.4}
            />
            {Array.from({ length: strings }, (_, sIdx) => (
              <circle
                key={sIdx}
                cx={x}
                cy={geo.stringY(sIdx, x)}
                r={isBass ? 3 : 2.4}
                fill="#cfd6e0"
              />
            ))}
          </g>
        );
      })}

      {/* Bridge, aligned to where the strings actually end. */}
      {(() => {
        const bx = P(bridgeBoxX, 0)[0];
        const fh = fieldHalf(bx);
        return (
          <g>
            <rect
              x={bx - 18}
              y={CENTRE_LINE - fh - 14}
              width={isBass ? 46 : 40}
              height={fh * 2 + 28}
              rx={4}
              fill="#2a2f37"
              stroke="#636c79"
              strokeWidth={1.6}
            />
            {Array.from({ length: strings }, (_, sIdx) => (
              <g key={sIdx}>
                <rect
                  x={bx - 12}
                  y={geo.stringY(sIdx, bx) - 3.5}
                  width={22}
                  height={7}
                  rx={2}
                  fill="#8d96a3"
                />
                <circle cx={bx + 8} cy={geo.stringY(sIdx, bx)} r={2.2} fill="#e3e8ef" />
              </g>
            ))}
          </g>
        );
      })()}

      {/* Controls, inside the body on the bass side of the pickguard. */}
      {[0, 1, 2].map((i) => {
        const [cx, cy] = P(620 + i * 54, 492 + i * 30);
        return (
          <circle key={i} cx={cx} cy={cy} r={12} fill="#e9ecf1" stroke="#8e96a3" strokeWidth={2} />
        );
      })}

      {/* Output jack and strap buttons. */}
      {(() => {
        const [jx, jy] = P(812, 500);
        const [s1x, s1y] = P(30, 576);
        const [s2x, s2y] = P(944, 350);
        return (
          <g>
            <circle cx={jx} cy={jy} r={10} fill="#30363f" stroke="#8e96a3" strokeWidth={2.4} />
            <circle cx={s1x} cy={s1y} r={6} fill="#aab2bd" />
            <circle cx={s2x} cy={s2y} r={6} fill="#aab2bd" />
          </g>
        );
      })()}
    </g>
  );
}

/** An X over the nut end of a string: the universal "do not play" mark. */
function MutedMark({ x, y, r }: { x: number; y: number; r: number }) {
  const k = r * 0.95;
  return (
    <g stroke="var(--role-muted)" strokeWidth={2.6} strokeLinecap="round">
      <line x1={x - k} y1={y - k} x2={x + k} y2={y + k} />
      <line x1={x - k} y1={y + k} x2={x + k} y2={y - k} />
    </g>
  );
}

interface NoteCellProps {
  geo: Geometry;
  stringIndex: number;
  fret: number;
  info: NoteRoleInfo;
  selected: boolean;
  focused: boolean;
  fingerLabel: string | null;
  name: string;
  onPick: (stringIndex: number, fret: number) => void;
  onFocusCell: (p: SelectedPosition) => void;
}

/**
 * One clickable position.
 *
 * The hit area covers the whole fret space, not just the dot, so the
 * fretboard behaves like an instrument rather than a row of tiny targets —
 * which also keeps it usable with a fingertip on a phone.
 */
const NoteCell = memo(function NoteCell({
  geo,
  stringIndex,
  fret,
  info,
  selected,
  focused,
  fingerLabel,
  name,
  onPick,
  onFocusCell,
}: NoteCellProps) {
  const x = geo.noteX(fret);
  const y = geo.stringY(stringIndex, x);
  const left = fret === 0 ? geo.nutX - 52 : geo.fretX(fret - 1);
  const right = fret === 0 ? geo.nutX - 8 : geo.fretX(fret);
  const scale = geo.neckHalf(x) / geo.nutHalf;
  const cellH = geo.spacing * scale;
  const r = geo.noteRadius * (info.emphasis >= 1 || selected ? 1.3 : 0.95);
  const isRootShape = info.role === 'root' || info.role === 'chord-root';
  const fill = selected ? 'var(--role-selected)' : ROLE_FILL[info.role];
  const ink = selected ? 'var(--role-selected-ink)' : ROLE_INK[info.role];
  const visible = info.emphasis > 0 || selected;

  return (
    <g
      className="fret-note"
      data-focused={focused}
      role="gridcell"
      aria-label={`${name}, string ${geo.stringCount - stringIndex}, ${fret === 0 ? 'open' : `fret ${fret}`}`}
      onPointerDown={(e) => {
        e.preventDefault();
        onFocusCell({ stringIndex, fret });
        onPick(stringIndex, fret);
      }}
    >
      {/* Invisible, generous hit target. */}
      <rect
        x={left}
        y={y - cellH / 2}
        width={Math.max(10, right - left)}
        height={Math.max(18, cellH)}
        fill="transparent"
      />
      {focused && (
        <rect
          className="fret-note-ring"
          x={left + 1}
          y={y - cellH / 2 + 1}
          width={Math.max(8, right - left - 2)}
          height={Math.max(16, cellH - 2)}
          rx={4}
        />
      )}
      {/* A halo marks the notes of the chord shape currently displayed. */}
      {info.role === 'voicing' || (info.role === 'chord-root' && info.emphasis >= 1) ? (
        <circle cx={x} cy={y} r={r + 3.2} fill="none" stroke="var(--text)" strokeWidth={2} opacity={0.85} />
      ) : null}
      {visible &&
        (isRootShape ? (
          // Roots are squares, scale notes circles: the distinction survives
          // greyscale and colour-blindness.
          <rect
            x={x - r}
            y={y - r}
            width={r * 2}
            height={r * 2}
            rx={2}
            fill={fill}
            fillOpacity={selected ? 1 : info.emphasis}
            stroke={selected ? 'var(--text)' : 'rgba(0,0,0,0.35)'}
            strokeWidth={selected ? 2.5 : 1}
          />
        ) : (
          <circle
            cx={x}
            cy={y}
            r={r}
            fill={fill}
            fillOpacity={selected ? 1 : info.emphasis}
            stroke={selected ? 'var(--text)' : 'rgba(0,0,0,0.3)'}
            strokeWidth={selected ? 2.5 : info.role === 'voicing' ? 1.6 : 0.8}
          />
        ))}
      {(info.label || fingerLabel) && (info.emphasis >= 0.4 || selected) && (
        <text
          x={x}
          y={y + 4.2}
          textAnchor="middle"
          fontFamily="var(--font-sans)"
          fontSize={r * 1.15}
          fontWeight={700}
          fill={ink}
          pointerEvents="none"
        >
          {info.label ?? fingerLabel}
        </text>
      )}
    </g>
  );
});

// ---- tiny colour helpers (no dependency needed for two operations) -------

function clampByte(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function toHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((v) => clampByte(v).toString(16).padStart(2, '0')).join('')}`;
}

export function lighten(hex: string, amount: number): string {
  const [r, g, b] = parseHex(hex);
  return toHex([r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount]);
}

export function darken(hex: string, amount: number): string {
  const [r, g, b] = parseHex(hex);
  return toHex([r * (1 - amount), g * (1 - amount), b * (1 - amount)]);
}
