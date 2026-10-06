/**
 * InstrumentStage.tsx — the viewport: scrolling, zooming and the tuner camera.
 *
 * Normal mode is a plain horizontally scrollable area holding one wide SVG,
 * so native scrolling (and native momentum on a phone) just works.
 *
 * Tuner mode does not open a popup somewhere on the page. It applies a single
 * CSS transform to the whole instrument that translates and scales it so the
 * headstock ends up centred and enlarged, which reads as a camera moving in.
 * The scroll offset and zoom level in force beforehand are stored and put
 * back when the tuner closes, rather than resetting to a default.
 */

import { type ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Geometry } from './geometry';
import { useStore } from '../../state/store';

/** Height of the instrument at zoom 1, as a fraction of the stage width. */
/**
 * Height of the instrument at zoom 1, as a fraction of the stage width.
 * Tuned so a desktop stage shows roughly the first twelve frets at 100%,
 * which is the span most playing actually happens in.
 */
const HEIGHT_RATIO = 0.36;
/** Tall enough that the strings stay far enough apart to tap on a phone. */
const MIN_HEIGHT = 320;
const MAX_HEIGHT = 450;
/** Must match --camera-transition in global.css. */
const CAMERA_MS = 820;

export interface InstrumentStageProps {
  geo: Geometry;
  children?: ReactNode;
  /** Rendered inside the scroll area, above the instrument. */
  overlay?: ReactNode;
  toolbar?: ReactNode;
}

export function InstrumentStage({ geo, children, overlay, toolbar }: InstrumentStageProps) {
  const zoom = useStore((s) => s.zoom);
  const setZoom = useStore((s) => s.setZoom);
  const mode = useStore((s) => s.mode);
  const saveViewBeforeTuner = useStore((s) => s.saveViewBeforeTuner);
  const clearViewBeforeTuner = useStore((s) => s.clearViewBeforeTuner);

  const scrollRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<HTMLDivElement>(null);
  const [stageWidth, setStageWidth] = useState(960);
  const [transform, setTransform] = useState<string | undefined>(undefined);
  const restoreTimer = useRef<number | null>(null);
  const wasTuner = useRef(false);

  // --- responsive sizing -------------------------------------------------
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const measure = (): void => setStageWidth(el.clientWidth || 960);
    measure();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const baseHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, stageWidth * HEIGHT_RATIO));
  const pxScale = (baseHeight * zoom) / geo.height;
  const renderWidth = geo.width * pxScale;
  const contentHeight = geo.height * pxScale;
  // The stage grows while the tuner is open so the camera has somewhere to
  // move to and the readout has somewhere to sit.
  const renderHeight = mode === 'tuner' ? Math.max(contentHeight, 400) : contentHeight;

  // --- the tuner camera --------------------------------------------------
  useEffect(() => {
    const sc = scrollRef.current;
    if (!sc) return;

    if (mode === 'tuner') {
      if (!wasTuner.current) {
        // Capture the view exactly as it is before the camera moves.
        saveViewBeforeTuner({ zoom, scrollLeft: sc.scrollLeft });
        wasTuner.current = true;
      }
      if (restoreTimer.current !== null) {
        clearTimeout(restoreTimer.current);
        restoreTimer.current = null;
      }
      const containerW = sc.clientWidth;
      const containerH = sc.clientHeight || renderHeight;
      // Scale so the headstock fills a good share of the view, but never so
      // much that it is cropped: the limit is whichever of width or height
      // runs out first.
      const headWidthPx = geo.nutX * pxScale;
      const headHeightPx = geo.nutHalf * 3.3 * pxScale;
      const scale = clamp(
        Math.min(
          (containerW * 0.46) / Math.max(1, headWidthPx),
          (containerH * 0.66) / Math.max(1, headHeightPx),
        ),
        1.25,
        3.2,
      );
      const hx = geo.headCentre.x * pxScale;
      const hy = geo.headCentre.y * pxScale;
      // On a wide stage the headstock sits left of centre, leaving the right
      // of the view for the tuner readout; on a narrow one it is centred and
      // the readout sits underneath.
      const wide = containerW >= 760;
      // The scroll offset is still in effect under the transform, so it has to
      // be added back for the headstock to land where it is wanted.
      const tx = containerW * (wide ? 0.31 : 0.5) - scale * hx + sc.scrollLeft;
      const ty = containerH * (wide ? 0.5 : 0.36) - scale * hy;
      setTransform(`translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) scale(${scale.toFixed(3)})`);
      return;
    }

    if (wasTuner.current) {
      // Zoom back out along the same path, then put the view back.
      wasTuner.current = false;
      setTransform(undefined);
      const saved = useStore.getState().viewBeforeTuner;
      restoreTimer.current = window.setTimeout(() => {
        restoreTimer.current = null;
        if (saved) {
          setZoom(saved.zoom);
          if (scrollRef.current) scrollRef.current.scrollLeft = saved.scrollLeft;
        }
        clearViewBeforeTuner();
      }, CAMERA_MS);
    }
  }, [
    mode,
    zoom,
    pxScale,
    geo.headCentre.x,
    geo.headCentre.y,
    geo.nutX,
    renderHeight,
    contentHeight,
    saveViewBeforeTuner,
    clearViewBeforeTuner,
    setZoom,
  ]);

  useEffect(
    () => () => {
      if (restoreTimer.current !== null) clearTimeout(restoreTimer.current);
    },
    [],
  );

  // --- pinch and ctrl+wheel zoom ----------------------------------------
  const pinch = useRef<{ distance: number; zoom: number } | null>(null);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (mode === 'tuner' || e.touches.length !== 2) return;
      pinch.current = { distance: touchDistance(e.touches), zoom };
    },
    [mode, zoom],
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!pinch.current || e.touches.length !== 2) return;
      // Two fingers means zoom, so stop the browser from panning as well.
      e.preventDefault();
      const ratio = touchDistance(e.touches) / Math.max(1, pinch.current.distance);
      setZoom(pinch.current.zoom * ratio);
    },
    [setZoom],
  );

  const onTouchEnd = useCallback(() => {
    pinch.current = null;
  }, []);

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      // Only with a modifier, so ordinary scrolling still scrolls.
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      setZoom(zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08));
    },
    [setZoom, zoom],
  );

  return (
    <div className="stage">
      <div className="stage-viewport">
      <div
        className={`stage-scroll${mode === 'tuner' ? ' is-locked' : ''}`}
        ref={scrollRef}
        style={{ height: renderHeight, touchAction: mode === 'tuner' ? 'none' : 'pan-x pan-y' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onWheel={onWheel}
      >
        <div
          className="stage-camera"
          ref={cameraRef}
          style={{ width: renderWidth, height: contentHeight, transform }}
        >
          <div style={{ width: geo.width, height: geo.height, transform: `scale(${pxScale})`, transformOrigin: '0 0' }}>
            {children}
          </div>
        </div>
      </div>
        {overlay}
      </div>
      {toolbar && <div className="stage-toolbar">{toolbar}</div>}
    </div>
  );
}

function touchDistance(touches: React.TouchList): number {
  const [a, b] = [touches[0], touches[1]];
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}
