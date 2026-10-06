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
import type { Geometry } from './geometry';
import type { ArtPart } from './artwork';
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
          <stop offset="0" stopColor={lighten(d.fretboardColor, 0.2)} />
          <stop offset="0.45" stopColor={d.fretboardColor} />
          <stop offset="1" stopColor={darken(d.fretboardColor, 0.3)} />
        </linearGradient>
      </defs>

      {/* ---- body and headstock, traced from a photograph ---------------- */}
      <g aria-hidden="true" transform={geo.artTransform}>
        <Art part={geo.art.head} />
        <Art part={geo.art.body} />
        {geo.art.under.map((part, i) => (
          <Art key={i} part={part} />
        ))}
      </g>

      {/* ---- fretboard, frets and inlays, computed ----------------------- */}
      <g aria-hidden="true">
        <path
          d={neckPath(geo)}
          fill="url(#fl-board)"
          stroke={darken(d.fretboardColor, 0.45)}
          strokeWidth={2}
        />
        {/* Nut */}
        <path
          d={`M ${geo.nutX} ${CENTRE(geo, geo.nutX, -1) - 6} L ${geo.nutX} ${CENTRE(geo, geo.nutX, 1) + 6}`}
          stroke="#efe7d6"
          strokeWidth={9}
          strokeLinecap="round"
        />
        {/* Fret wires: solid metal with a bright crown. A gradient cannot
            paint these, because a vertical line has no bounding-box width. */}
        {frets.slice(1).map((f) => {
          const fx = geo.fretX(f);
          const w = f < 6 ? 4.4 : f < 13 ? 3.8 : 3.2;
          return (
            <g key={f}>
              <line x1={fx} y1={CENTRE(geo, fx, -1) - 2} x2={fx} y2={CENTRE(geo, fx, 1) + 2} stroke="#5e636b" strokeWidth={w} strokeLinecap="round" />
              <line x1={fx - w * 0.22} y1={CENTRE(geo, fx, -1) - 2} x2={fx - w * 0.22} y2={CENTRE(geo, fx, 1) + 2} stroke="#e8ecf2" strokeWidth={w * 0.42} strokeLinecap="round" />
            </g>
          );
        })}
        {/* Position inlays */}
        {frets.map((f) => {
          const kind = inlayKind(f);
          if (kind === 'none') return null;
          const x = geo.noteX(f);
          const half = geo.neckHalf(x);
          const rad = geo.instrument.family === 'bass' ? 7.5 : 6.5;
          return kind === 'double' ? (
            <g key={`inlay${f}`}>
              <circle cx={x} cy={geo.centreY - half * 0.56} r={rad} fill="#e8e2d4" opacity={0.8} />
              <circle cx={x} cy={geo.centreY + half * 0.56} r={rad} fill="#e8e2d4" opacity={0.8} />
            </g>
          ) : (
            <circle key={`inlay${f}`} cx={x} cy={geo.centreY} r={rad} fill="#e8e2d4" opacity={0.7} />
          );
        })}
      </g>

      {/* ---- tuners ------------------------------------------------------ */}
      <g aria-hidden="true">
        {geo.pegs.map((peg) => {
          const target = props.tunerTargets?.find((t) => t.stringIndex === peg.stringIndex);
          const state = target?.state ?? 'idle';
          return (
            <g key={peg.stringIndex}>
              <line x1={peg.postX} y1={peg.postY} x2={peg.x} y2={peg.y} stroke="#8f98a4" strokeWidth={4} strokeLinecap="round" />
              <circle cx={peg.postX} cy={peg.postY} r={geo.postR} fill="#b9c1cc" stroke="#767f8b" strokeWidth={1.2} />
              <circle cx={peg.postX} cy={peg.postY} r={geo.postR * 0.38} fill="#6f7884" />
              {state !== 'idle' && (
                <circle cx={peg.x} cy={peg.y} r={geo.keySize[0] * 0.95} fill="none" stroke={state === 'in-tune' ? 'var(--ok)' : 'var(--accent)'} strokeWidth={3} opacity={0.9} />
              )}
              <ellipse cx={peg.x} cy={peg.y} rx={geo.keySize[0] * 0.5} ry={geo.keySize[1] * 0.5} fill={state === 'in-tune' ? 'var(--ok)' : '#ccd3dd'} stroke="#6f7884" strokeWidth={1.5} transform={`rotate(14 ${peg.x} ${peg.y})`} />
            </g>
          );
        })}
      </g>

      {/* ---- strings ----------------------------------------------------- */}
      <g aria-hidden="true">
        {strings.map((i) => {
          const peg = geo.pegs[i];
          const mutedInChord = mode === 'chord' && props.voicing?.frets[i] === null;
          const pts = `${peg.postX},${peg.postY} ${geo.nutX},${geo.stringY(i, geo.nutX)} ${geo.bridgeX},${geo.stringY(i, geo.bridgeX)}`;
          return (
            <g key={i} opacity={mutedInChord ? 0.3 : 1}>
              <polyline points={pts} fill="none" stroke="#6d737c" strokeWidth={geo.stringWidth(i)} strokeLinecap="round" />
              <polyline points={pts} fill="none" stroke="#e9edf3" strokeWidth={geo.stringWidth(i) * 0.45} strokeLinecap="round" />
              {mutedInChord && <MutedMark x={geo.nutX - 30} y={geo.stringY(i, geo.nutX)} r={geo.noteRadius} />}
            </g>
          );
        })}
      </g>

      {/* ---- parts that sit over the strings ----------------------------- */}
      {geo.art.over.length > 0 && (
        <g aria-hidden="true" transform={geo.artTransform}>
          {geo.art.over.map((part, i) => (
            <Art key={i} part={part} />
          ))}
        </g>
      )}

      {/* ---- fret numbers ------------------------------------------------ */}
      <g
        aria-hidden="true"
        fontFamily="var(--font-sans)"
        fontSize={15}
        fill="var(--text-muted)"
      >
        {frets.map((f) => {
          // Only the frets that carry a position marker are numbered: those
          // are the ones players navigate by.
          if (inlayKind(f) === 'none') return null;
          const x = geo.noteX(f);
          return (
            <text
              key={f}
              x={x}
              y={geo.centreY + geo.neckHalf(x) + 30}
              textAnchor="middle"
              fontWeight={f % 12 === 0 ? 700 : 500}
            >
              {f}
            </text>
          );
        })}
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


const CENTRE = (geo: Geometry, x: number, sign: -1 | 1): number =>
  geo.centreY + sign * geo.neckHalf(x);

/** One traced artwork part. */
function Art({ part }: { part: ArtPart }) {
  return (
    <path
      d={part.d}
      fill={part.fill}
      stroke={part.stroke}
      strokeWidth={part.sw}
      strokeLinejoin="round"
      vectorEffect="non-scaling-stroke"
    />
  );
}

/** The fretboard, from the nut to a little past the last fret. */
function neckPath(geo: Geometry): string {
  const x0 = geo.nutX;
  const x1 = geo.boardEndX;
  return [
    `M ${x0} ${CENTRE(geo, x0, -1) - 4}`,
    `L ${x1} ${CENTRE(geo, x1, -1) - 5}`,
    `L ${x1} ${CENTRE(geo, x1, 1) + 5}`,
    `L ${x0} ${CENTRE(geo, x0, 1) + 4}`,
    'Z',
  ].join(' ');
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
