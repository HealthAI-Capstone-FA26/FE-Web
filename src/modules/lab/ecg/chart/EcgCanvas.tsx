import React, { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import type { EcgAnomalyEvent, EcgScorePoint, EcgSignal } from '../../../../types/ecg';
import type { PlaybackClock } from '../../../../hooks/useEcgPlayback';
import { PlaybackDataSource } from './data/PlaybackDataSource';
import {
  detectSignalYDomain,
  EcgCanvasRenderer,
  type CaliperMeasurement,
  type EcgRenderStyle,
  type HoverReadout,
} from './renderer/EcgCanvasRenderer';
import type { EcgGridMode } from './renderer/gridLayer';
import { hitTestAnomalyBand } from './renderer/bandLayer';
import {
  CONFUSION_META,
  formatTimeMs,
  getAnomalyLabel,
  getEventConfusionKind,
  SEVERITY_LABEL_VI,
  VERDICT_LABEL_VI,
} from '../ecgMeta';

export interface EcgCanvasHandle {
  exportPng: (meta: { patientName: string; encounterCode: string; title: string }) => string;
}

export interface EcgCanvasProps {
  signal: EcgSignal | null;
  styleMode: EcgRenderStyle;
  gridMode?: EcgGridMode;
  gainMmPerMv?: 5 | 10 | 20;
  leadNames: string[];
  showCalibrationPulse?: boolean;
  showZeroBaseline?: boolean;
  maxSampleLimit?: number | null;
  viewStartMs: number;
  viewEndMs: number;
  durationMs: number;
  onViewChange?: (startMs: number, endMs: number) => void;
  anomalies: EcgAnomalyEvent[];
  secondaryAnomalies?: EcgAnomalyEvent[];
  selectedEventId?: string | null;
  onSelectEvent?: (event: EcgAnomalyEvent) => void;
  colorBySeverity?: boolean;
  scoreSeries?: EcgScorePoint[];
  threshold?: number | null;
  rPeaksMs?: number[];
  saliency?: { tMs: number; w: number }[];
  clock?: PlaybackClock;
  heightPx?: number;
  showYAxis?: boolean;
  showRightScoreAxis?: boolean;
  showXAxis?: boolean;
  xAxisMode?: 'time' | 'sample';
  onToggleXAxisMode?: () => void;
  onPointsChange?: (pts: number) => void;
  ariaLabel: string;
  revealProgress?: number;
}

export const EcgCanvas = React.forwardRef<EcgCanvasHandle, EcgCanvasProps>((props, ref) => {
  const {
    signal,
    styleMode,
    gridMode = 'standard',
    gainMmPerMv = 10,
    leadNames,
    showCalibrationPulse = true,
    showZeroBaseline = false,
    maxSampleLimit = null,
    viewStartMs,
    viewEndMs,
    durationMs,
    onViewChange,
    anomalies,
    secondaryAnomalies,
    selectedEventId,
    onSelectEvent,
    colorBySeverity = false,
    scoreSeries,
    threshold,
    rPeaksMs,
    saliency,
    clock,
    heightPx = 200,
    showYAxis = true,
    showRightScoreAxis = false,
    showXAxis = true,
    xAxisMode = 'time',
    onToggleXAxisMode,
    onPointsChange,
    ariaLabel,
    revealProgress = 1,
  } = props;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const gridCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const waveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<EcgCanvasRenderer | null>(null);
  const dataSourceRef = useRef<PlaybackDataSource | null>(null);

  const [hoverInfo, setHoverInfo] = useState<HoverReadout | null>(null);
  const [caliperInfo, setCaliperInfo] = useState<CaliperMeasurement | null>(null);
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);

  // Giữ giá trị mới nhất trong ref để gesture handler không cần re-bind liên tục
  const viewRef = useRef({ viewStartMs, viewEndMs, durationMs });
  viewRef.current = { viewStartMs, viewEndMs, durationMs };

  const reducedMotion = useMemo(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const leadIndices = useMemo(() => {
    if (!signal) return [0];
    const indices = leadNames.map((name) => {
      const idx = signal.leadNames.indexOf(name);
      return idx >= 0 ? idx : 0;
    });
    return indices.length > 0 ? indices : [0];
  }, [signal, leadNames]);

  useImperativeHandle(
    ref,
    () => ({
      exportPng: (meta) => rendererRef.current?.exportPng(meta) ?? '',
    }),
    [],
  );

  // Khởi tạo renderer 1 lần
  useEffect(() => {
    const g = gridCanvasRef.current;
    const w = waveCanvasRef.current;
    const o = overlayCanvasRef.current;
    if (!g || !w || !o) return;
    const renderer = new EcgCanvasRenderer(
      g,
      w,
      o,
      {
        style: styleMode,
        gridMode,
        gainMmPerMv,
        leadIndices,
        leadLabels: leadNames,
        showCalibrationPulse,
        showZeroBaseline,
        maxSampleLimit,
        viewStartMs,
        viewEndMs,
        anomalies,
        secondaryAnomalies,
        selectedEventId,
        hoveredEventId: null,
        colorBySeverity,
        scoreSeries,
        threshold,
        rPeaksMs,
        saliency,
        reducedMotion,
        revealProgress,
      },
      onPointsChange,
    );
    rendererRef.current = renderer;
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) renderer.resize(rect.width, heightPx);
    return () => {
      rendererRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cập nhật signal & PlaybackDataSource
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    renderer.setSignal(signal);
    dataSourceRef.current?.dispose();
    if (signal) {
      const ds = new PlaybackDataSource(signal, 35);
      dataSourceRef.current = ds;
      renderer.setDataSource(ds);
      if (clock && styleMode !== 'static') {
        const windowSamples = Math.round(((viewRef.current.viewEndMs - viewRef.current.viewStartMs) / 1000) * signal.sampleRateHz);
        const curSample = Math.round((clock.positionMs / 1000) * signal.sampleRateHz);
        ds.seek(curSample, windowSamples * 2);
        renderer.renderLiveFrame(clock.positionMs);
      }
    } else {
      dataSourceRef.current = null;
      renderer.setDataSource(null);
    }
    return () => {
      dataSourceRef.current?.dispose();
      dataSourceRef.current = null;
    };
  }, [signal, clock, styleMode]);

  // Đồng bộ options vào renderer
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    renderer.updateOptions({
      style: styleMode,
      gridMode,
      gainMmPerMv,
      leadIndices,
      leadLabels: leadNames,
      showCalibrationPulse,
      showZeroBaseline,
      maxSampleLimit,
      viewStartMs,
      viewEndMs,
      anomalies,
      secondaryAnomalies,
      selectedEventId,
      hoveredEventId,
      colorBySeverity,
      scoreSeries,
      threshold,
      rPeaksMs,
      saliency,
      reducedMotion,
      revealProgress,
    });
    if (styleMode !== 'static' && clock) {
      renderer.renderLiveFrame(clock.positionMs);
    }
  }, [
    styleMode,
    gridMode,
    gainMmPerMv,
    leadIndices,
    leadNames,
    showCalibrationPulse,
    showZeroBaseline,
    maxSampleLimit,
    viewStartMs,
    viewEndMs,
    anomalies,
    secondaryAnomalies,
    selectedEventId,
    hoveredEventId,
    colorBySeverity,
    scoreSeries,
    threshold,
    rPeaksMs,
    saliency,
    reducedMotion,
    revealProgress,
    clock,
  ]);

  // ResizeObserver có debounce 100ms theo đặc tả mục 4.1
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const applySize = () => {
      const rect = el.getBoundingClientRect();
      rendererRef.current?.resize(rect.width, heightPx);
      if (styleMode !== 'static' && clock) {
        rendererRef.current?.renderLiveFrame(clock.positionMs);
      }
    };
    applySize();
    const ro = new ResizeObserver(() => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(applySize, 100);
    });
    ro.observe(el);
    return () => {
      if (timer) clearTimeout(timer);
      ro.disconnect();
    };
  }, [heightPx, styleMode, clock]);

  // Đăng ký lắng nghe frame từ PlaybackClock (không qua React state)
  useEffect(() => {
    if (!clock || styleMode === 'static') return;
    const offFrame = clock.onFrame((posMs) => {
      rendererRef.current?.renderLiveFrame(posMs);
    });
    const offSeek = clock.onSeek((posMs) => {
      const ds = dataSourceRef.current;
      if (ds && signal) {
        const winSamples = Math.round(((viewRef.current.viewEndMs - viewRef.current.viewStartMs) / 1000) * signal.sampleRateHz);
        ds.seek(Math.round((posMs / 1000) * signal.sampleRateHz), winSamples * 2);
      }
      rendererRef.current?.renderLiveFrame(posMs);
    });
    rendererRef.current?.renderLiveFrame(clock.positionMs);
    return () => {
      offFrame();
      offSeek();
    };
  }, [clock, styleMode, signal]);

  // Wheel = zoom quanh con trỏ chuột; Shift + wheel = pan
  useEffect(() => {
    const el = overlayCanvasRef.current;
    if (!el || !onViewChange) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const { viewStartMs: s, viewEndMs: end, durationMs: total } = viewRef.current;
      const span = Math.max(500, end - s);
      const rect = el.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / Math.max(1, rect.width)));

      if (e.shiftKey) {
        const delta = (e.deltaY > 0 ? 0.12 : -0.12) * span;
        const nextStart = Math.max(0, Math.min(total - span, s + delta));
        onViewChange(nextStart, nextStart + span);
        return;
      }

      const factor = e.deltaY < 0 ? 0.8 : 1.25;
      const nextSpan = Math.max(500, Math.min(total, span * factor));
      const anchorMs = s + ratio * span;
      let nextStart = anchorMs - ratio * nextSpan;
      nextStart = Math.max(0, Math.min(total - nextSpan, nextStart));
      onViewChange(nextStart, nextStart + nextSpan);
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [onViewChange]);

  // Pointer gestures: kéo = pan, Ctrl + kéo = chọn vùng zoom (rubber-band), Alt + kéo = thước đo Caliper
  const dragRef = useRef<
    | { kind: 'pan'; startX: number; initialStart: number; initialEnd: number; moved: boolean }
    | { kind: 'rubber'; startX: number; curX: number }
    | { kind: 'caliper'; startMs: number }
    | null
  >(null);

  const xToMs = useCallback((clientX: number, el: HTMLElement): number => {
    const rect = el.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / Math.max(1, rect.width)));
    const { viewStartMs: s, viewEndMs: end } = viewRef.current;
    return s + ratio * (end - s);
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const localX = e.clientX - rect.left;

    if (e.altKey) {
      const startMs = xToMs(e.clientX, el);
      dragRef.current = { kind: 'caliper', startMs };
      const m = rendererRef.current?.setCaliper({ startMs, endMs: startMs }) ?? null;
      setCaliperInfo(m);
      return;
    }

    if (e.ctrlKey && onViewChange) {
      dragRef.current = { kind: 'rubber', startX: localX, curX: localX };
      rendererRef.current?.setRubberBand({ x1: localX, x2: localX });
      return;
    }

    if (onViewChange && styleMode === 'static') {
      dragRef.current = {
        kind: 'pan',
        startX: e.clientX,
        initialStart: viewStartMs,
        initialEnd: viewEndMs,
        moved: false,
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;

    const drag = dragRef.current;
    if (drag) {
      if (drag.kind === 'pan' && onViewChange) {
        const dx = e.clientX - drag.startX;
        if (Math.abs(dx) > 3) drag.moved = true;
        const span = drag.initialEnd - drag.initialStart;
        const dt = -(dx / Math.max(1, rect.width)) * span;
        const nextStart = Math.max(0, Math.min(durationMs - span, drag.initialStart + dt));
        onViewChange(nextStart, nextStart + span);
        return;
      }
      if (drag.kind === 'rubber') {
        drag.curX = localX;
        rendererRef.current?.setRubberBand({ x1: drag.startX, x2: localX });
        return;
      }
      if (drag.kind === 'caliper') {
        const endMs = xToMs(e.clientX, el);
        const m = rendererRef.current?.setCaliper({ startMs: drag.startMs, endMs }) ?? null;
        setCaliperInfo(m);
        return;
      }
    }

    const readout = rendererRef.current?.setHover(localX, localY) ?? null;
    setHoverInfo(readout);
    const hit = hitTestAnomalyBand(localX, rect.width, viewStartMs, viewEndMs, anomalies);
    setHoveredEventId(hit?.id ?? null);
  };

  const finishDrag = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const drag = dragRef.current;
    dragRef.current = null;

    if (drag?.kind === 'rubber' && onViewChange) {
      rendererRef.current?.setRubberBand(null);
      const x1 = Math.min(drag.startX, localX);
      const x2 = Math.max(drag.startX, localX);
      if (x2 - x1 > 10) {
        const span = viewEndMs - viewStartMs;
        const nextStart = viewStartMs + (x1 / Math.max(1, rect.width)) * span;
        const nextEnd = viewStartMs + (x2 / Math.max(1, rect.width)) * span;
        if (nextEnd - nextStart >= 500) {
          onViewChange(nextStart, nextEnd);
        }
      }
      return;
    }

    // Click vào dải màu bất thường → chọn sự kiện đó
    if ((!drag || (drag.kind === 'pan' && !drag.moved)) && onSelectEvent) {
      const hit = hitTestAnomalyBand(localX, rect.width, viewStartMs, viewEndMs, anomalies);
      if (hit) onSelectEvent(hit);
    }
  };

  const handleMouseLeave = () => {
    dragRef.current = null;
    rendererRef.current?.setRubberBand(null);
    rendererRef.current?.setHover(null, null);
    setHoverInfo(null);
    setHoveredEventId(null);
  };

  // Pinch-zoom trên cảm ứng
  const pinchRef = useRef<{ dist: number; start: number; end: number } | null>(null);
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current = { dist: Math.hypot(dx, dy), start: viewStartMs, end: viewEndMs };
    }
  };
  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 2 && pinchRef.current && onViewChange) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.max(10, Math.hypot(dx, dy));
      const scale = pinchRef.current.dist / dist;
      const initialSpan = pinchRef.current.end - pinchRef.current.start;
      const mid = (pinchRef.current.start + pinchRef.current.end) / 2;
      const nextSpan = Math.max(500, Math.min(durationMs, initialSpan * scale));
      const nextStart = Math.max(0, Math.min(durationMs - nextSpan, mid - nextSpan / 2));
      onViewChange(nextStart, nextStart + nextSpan);
    }
  };

  const fs = signal?.sampleRateHz ?? 500;
  const xTicks = useMemo(() => {
    const span = Math.max(1, viewEndMs - viewStartMs);
    const count = 6;
    return Array.from({ length: count }, (_, i) => {
      const tMs = viewStartMs + (span * i) / (count - 1);
      const label =
        xAxisMode === 'sample'
          ? `#${Math.round((tMs / 1000) * fs)}`
          : formatTimeMs(tMs, span < 12000);
      return { pct: (i / (count - 1)) * 100, label };
    });
  }, [viewStartMs, viewEndMs, xAxisMode, fs]);

  const yDomain = useMemo(() => detectSignalYDomain(signal), [signal]);
  const yScale = 10 / gainMmPerMv;
  const yMinLabel = Number((yDomain[0] * yScale).toFixed(1));
  const yMaxLabel = Number((yDomain[1] * yScale).toFixed(1));

  return (
    <div className="select-none">
      <div className="flex items-stretch">
        {/* Trục Y bên trái (mV / biên độ chuẩn hoá) */}
        {showYAxis && (
          <div
            className="w-10 shrink-0 flex flex-col justify-between py-1.5 pr-1.5 text-right text-[10px] font-medium text-slate-500 tabular-nums"
            style={{ height: heightPx }}
          >
            <span>+{yMaxLabel}</span>
            <span>0</span>
            <span>{yMinLabel}</span>
          </div>
        )}

        {/* Khung 3 lớp Canvas chồng nhau */}
        <div
          ref={containerRef}
          className="relative flex-1 rounded-xl overflow-hidden border border-slate-200/80 bg-white"
          style={{ height: heightPx }}
        >
          <canvas ref={gridCanvasRef} className="absolute inset-0 pointer-events-none" />
          <canvas ref={waveCanvasRef} className="absolute inset-0 pointer-events-none" />
          <canvas
            ref={overlayCanvasRef}
            role="img"
            aria-label={ariaLabel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={finishDrag}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            className="absolute inset-0 cursor-crosshair"
          />

          {/* Readout thước đo Caliper (Alt + kéo) */}
          {caliperInfo && caliperInfo.deltaMs > 5 && (
            <div className="absolute top-2 left-3 z-20 flex items-center gap-2 px-2.5 py-1 rounded-lg bg-teal-900/90 text-white text-[11px] font-medium shadow-md tabular-nums">
              <span>Δt: {caliperInfo.deltaMs} ms</span>
              {caliperInfo.bpm !== null && (
                <span className="px-1.5 py-0.5 rounded bg-teal-500/30 text-teal-100 font-semibold">
                  ≈ {caliperInfo.bpm} bpm
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  rendererRef.current?.setCaliper(null);
                  setCaliperInfo(null);
                }}
                className="text-teal-200 hover:text-white ml-1 cursor-pointer"
                title="Xoá thước đo"
              >
                ×
              </button>
            </div>
          )}

          {/* Tooltip Glass khi hover */}
          {hoverInfo && (
            <div
              className="pointer-events-none absolute z-20 px-2.5 py-1.5 rounded-xl bg-slate-900/88 text-white text-[11px] shadow-lg backdrop-blur-md border border-white/15 tabular-nums max-w-[260px]"
              style={{
                left: Math.min(
                  Math.max(8, hoverInfo.xPx + 12),
                  (containerRef.current?.clientWidth ?? 300) - 235,
                ),
                top: Math.max(8, Math.min(heightPx - 86, hoverInfo.yPx - 28)),
              }}
            >
              <div className="flex items-center justify-between gap-3 text-slate-300">
                <span className="font-semibold text-white">{hoverInfo.leadName}</span>
                <span>{formatTimeMs(hoverInfo.tMs)}</span>
                <span>#{hoverInfo.sampleIndex}</span>
              </div>
              <div className="mt-0.5 flex items-center gap-3">
                <span>
                  Biên độ: <strong className="text-emerald-300">{hoverInfo.mv >= 0 ? '+' : ''}{hoverInfo.mv.toFixed(2)} mV</strong>
                </span>
                {hoverInfo.rrMs !== null && (
                  <span>
                    RR: <strong>{hoverInfo.rrMs} ms</strong> ({Math.round(60000 / hoverInfo.rrMs)} bpm)
                  </span>
                )}
              </div>
              {hoverInfo.anomaly && (
                <div className="mt-1 pt-1 border-t border-white/15 text-[11px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-amber-300">
                      {getAnomalyLabel(hoverInfo.anomaly.anomalyType)}
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-white/15 text-[10px] font-mono text-white">
                      {CONFUSION_META[getEventConfusionKind(hoverInfo.anomaly)].label}
                    </span>
                  </div>
                  <div className="text-slate-300 flex flex-wrap gap-x-2">
                    <span>
                      Index: [
                      {Math.round((hoverInfo.anomaly.startOffsetMs / 1000) * fs)}..
                      {Math.round((hoverInfo.anomaly.endOffsetMs / 1000) * fs)}]
                    </span>
                    <span>· Điểm: {hoverInfo.anomaly.score.toFixed(2)}</span>
                    <span>· Mức: {SEVERITY_LABEL_VI[hoverInfo.anomaly.severity]}</span>
                    {hoverInfo.anomaly.heartRateBpm && <span>· HR: {hoverInfo.anomaly.heartRateBpm} bpm</span>}
                  </div>
                  <div className="text-slate-400">
                    Đạo trình: {hoverInfo.anomaly.affectedLeads.join(', ') || 'II'} · {VERDICT_LABEL_VI[hoverInfo.anomaly.reviewVerdict]}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Trục Y phụ bên phải cho điểm Anomaly Score (0..1) */}
        {showRightScoreAxis && (
          <div
            className="w-9 shrink-0 flex flex-col justify-between py-1.5 pl-1.5 text-left text-[10px] font-medium text-teal-700 tabular-nums"
            style={{ height: heightPx }}
          >
            <span>1.0</span>
            <span>0.5</span>
            <span>0.0</span>
          </div>
        )}
      </div>

      {/* Trục X bên dưới */}
      {showXAxis && (
        <div
          className={`mt-1 flex items-center justify-between text-[10px] text-slate-500 tabular-nums ${
            showYAxis ? 'pl-10' : ''
          } ${showRightScoreAxis ? 'pr-9' : ''}`}
        >
          <div className="relative flex-1 h-4">
            {xTicks.map((t, i) => (
              <span
                key={i}
                className="absolute -translate-x-1/2 first:translate-x-0 last:-translate-x-full"
                style={{ left: `${t.pct}%` }}
              >
                {t.label}
              </span>
            ))}
          </div>
          {onToggleXAxisMode && (
            <button
              type="button"
              onClick={onToggleXAxisMode}
              className="ml-3 px-2 py-0.5 rounded text-[10px] font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
              title="Đổi đơn vị trục ngang (Thời gian / Chỉ số mẫu)"
            >
              {xAxisMode === 'time' ? 'Thời gian (s)' : 'Mẫu (#)'}
            </button>
          )}
        </div>
      )}
    </div>
  );
});

EcgCanvas.displayName = 'EcgCanvas';

