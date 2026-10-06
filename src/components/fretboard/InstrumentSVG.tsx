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
import { useT } from '../../i18n';
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
  const t = useT();
  const [focusCell, setFocusCell] = useState<SelectedPosition>({ stringIndex: 0, fret: 0 });
  // The focus ring only appears once the grid really has keyboard focus, so
  // it is never a stray blue box on a freshly loaded page.
  const [gridFocused, setGridFocused] = useState(false);
  const gridRef = useRef<SVGGElement>(null);

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
      aria-label={t('fretboard.label', {
        instrument: t(geo.instrument.id === 'bass4' ? 'instrument.bass4' : 'instrument.guitar6'),
      })}
      style={{ display: 'block' }}
    >
      {/* ---- the instrument, drawn from the artwork ---------------------- */}
      <g aria-hidden="true" transform={geo.artTransform}>
        {geo.art.parts
          .filter((part) => !part.over)
          .map((part, i) => (
            <Art key={i} part={part} />
          ))}
      </g>

      {/* ---- tuners: the per-string indicator for tuner mode -------------- */}
      {props.tunerTargets && (
        <g aria-hidden="true">
          {geo.pegs.map((peg) => {
            const state =
              props.tunerTargets?.find((t) => t.stringIndex === peg.stringIndex)?.state ?? 'idle';
            if (state === 'idle') return null;
            return (
              <circle
                key={peg.stringIndex}
                cx={peg.x}
                cy={peg.y}
                r={peg.r}
                fill="none"
                stroke={state === 'in-tune' ? 'var(--ok)' : 'var(--out-of-tune)'}
                strokeWidth={4}
              />
            );
          })}
        </g>
      )}

      {/* ---- strings ----------------------------------------------------- */}
      <g aria-hidden="true">
        {strings.map((i) => {
          const peg = geo.pegs[i] ?? { x: geo.nutX - 40, y: geo.stringY(i, geo.nutX) };
          const mutedInChord = mode === 'chord' && props.voicing?.frets[i] === null;
          const pts = `${peg.x},${peg.y} ${geo.nutX},${geo.stringY(i, geo.nutX)} ${geo.stringEndX},${geo.stringY(i, geo.stringEndX)}`;
          return (
            <g key={i} opacity={mutedInChord ? 0.3 : 1}>
              <polyline points={pts} fill="none" stroke="#6d737c" strokeWidth={geo.stringWidth(i)} strokeLinecap="round" />
              <polyline points={pts} fill="none" stroke="#eef1f6" strokeWidth={geo.stringWidth(i) * 0.4} strokeLinecap="round" />
              {mutedInChord && <MutedMark x={geo.noteX(0)} y={geo.stringY(i, geo.nutX)} r={geo.noteRadius} />}
            </g>
          );
        })}
      </g>

      {/* ---- parts that sit over the strings ----------------------------- */}
      <g aria-hidden="true" transform={geo.artTransform}>
        {geo.art.parts
          .filter((part) => part.over)
          .map((part, i) => (
            <Art key={i} part={part} />
          ))}
      </g>

      {/* ---- fret numbers ------------------------------------------------ */}
      <g aria-hidden="true" fontFamily="var(--font-sans)" fontSize={16} fill="var(--text-muted)">
        {frets.map((f) => {
          // Only the frets that carry a position marker are numbered: those
          // are the ones players navigate by.
          if (inlayKind(f) === 'none') return null;
          const x = geo.noteX(f);
          return (
            <text
              key={f}
              x={x}
              y={geo.boardMid(x) + geo.neckHalf(x) + 34}
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
        aria-label={t('fretboard.grid', { note: focusedName })}
        tabIndex={0}
        onKeyDown={handleKey}
        onFocus={() => setGridFocused(true)}
        onBlur={() => setGridFocused(false)}
        style={{ outline: 'none' }}
      >
        <title>{t('fretboard.current', { note: focusedName })}</title>
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
              label={t('fretboard.cell', {
                note: spellMidi(openMidis[s] + f, props.spelling).full,
                string: geo.stringCount - s,
                where: f === 0 ? t('info.open') : t('info.fret', { n: f }),
              })}
            />
          )),
        )}
      </g>
    </svg>
  );
}


/** One part of the instrument artwork. */
function Art({ part }: { part: ArtPart }) {
  return (
    <path
      d={part.d}
      fill={part.fill}
      stroke={part.stroke}
      strokeWidth={part.sw}
      strokeLinejoin="round"
      strokeLinecap="round"
      opacity={part.opacity}
    />
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
  /** Pre-translated accessible name for the position. */
  label: string;
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
  label,
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
      aria-label={label}
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






