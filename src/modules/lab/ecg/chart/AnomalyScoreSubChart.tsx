import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { EcgAnomalyEvent, EcgScorePoint } from '../../../../types/ecg';
import {
  formatTimeMs,
  getAnomalyLabel,
  getBandColor,
  readEcgThemeTokens,
  SEVERITY_LABEL_VI,
} from '../ecgMeta';

export interface AnomalyScoreSubChartProps {
  scoreSeries: EcgScorePoint[];
  threshold: number;
  anomalies: EcgAnomalyEvent[];
  selectedEventId?: string | null;
  onSelectEvent?: (event: EcgAnomalyEvent) => void;
  colorBySeverity?: boolean;
  viewStartMs: number;
  viewEndMs: number;
  heightPx?: number;
}

interface ScoreHoverInfo {
  xPx: number;
  tMs: number;
  score: number;
  aboveThreshold: boolean;
  anomaly: EcgAnomalyEvent | null;
}

export const AnomalyScoreSubChart: React.FC<AnomalyScoreSubChartProps> = ({
  scoreSeries,
  threshold,
  anomalies,
  selectedEventId,
  onSelectEvent,
  colorBySeverity = false,
  viewStartMs,
  viewEndMs,
  heightPx = 88,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hover, setHover] = useState<ScoreHoverInfo | null>(null);

  const clampedThreshold = Math.max(0.05, Math.min(0.95, threshold));

  // Nội suy điểm Anomaly Score tại thời điểm tMs bất kỳ
  const scoreAtTime = useMemo(() => {
    return (tMs: number): number => {
      if (!scoreSeries || scoreSeries.length === 0) return 0;
      if (tMs <= scoreSeries[0].tMs) return scoreSeries[0].score;
      const last = scoreSeries[scoreSeries.length - 1];
      if (tMs >= last.tMs) return last.score;
      let lo = 0;
      let hi = scoreSeries.length - 1;
      while (lo + 1 < hi) {
        const mid = (lo + hi) >> 1;
        if (scoreSeries[mid].tMs <= tMs) lo = mid;
        else hi = mid;
      }
      const p0 = scoreSeries[lo];
      const p1 = scoreSeries[hi];
      const span = Math.max(1, p1.tMs - p0.tMs);
      const ratio = (tMs - p0.tMs) / span;
      return p0.score + (p1.score - p0.score) * ratio;
    };
  }, [scoreSeries]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const draw = () => {
      const rect = container.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, heightPx);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const tokens = readEcgThemeTokens();
      const spanMs = Math.max(1, viewEndMs - viewStartMs);
      const padTop = 8;
      const padBottom = 6;
      const plotH = Math.max(10, height - padTop - padBottom);
      const scoreToY = (s: number) => padTop + (1 - Math.max(0, Math.min(1, s))) * plotH;
      const timeToX = (tMs: number) => ((tMs - viewStartMs) / spanMs) * width;

      // 1. Nền & lưới ngang mảnh (0.25, 0.50, 0.75)
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1;
      for (const lv of [0.25, 0.5, 0.75]) {
        const y = Math.round(scoreToY(lv)) + 0.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Vẽ dải vùng sự kiện bất thường đồng bộ với biểu đồ sóng ECG phía trên
      for (const ev of anomalies) {
        if (ev.endOffsetMs < viewStartMs || ev.startOffsetMs > viewEndMs) continue;
        const x1 = Math.max(0, timeToX(ev.startOffsetMs));
        const x2 = Math.min(width, timeToX(ev.endOffsetMs));
        const w = Math.max(2, x2 - x1);
        const color = getBandColor(ev, colorBySeverity, tokens);
        const isSelected = ev.id === selectedEventId;

        ctx.save();
        ctx.globalAlpha = isSelected ? 0.34 : 0.22;
        ctx.fillStyle = color.fill;
        ctx.fillRect(x1, 0, w, height);
        ctx.restore();

        // Đường gióng dọc 2 biên để thấy rõ điểm cắt ngưỡng chiếu lên sóng ECG
        ctx.save();
        ctx.strokeStyle = color.stroke;
        ctx.globalAlpha = isSelected ? 0.85 : 0.45;
        ctx.lineWidth = isSelected ? 1.5 : 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(x1, 0);
        ctx.lineTo(x1, height);
        ctx.moveTo(x2, 0);
        ctx.lineTo(x2, height);
        ctx.stroke();
        ctx.restore();
      }

      const threshY = scoreToY(clampedThreshold);

      // 3. Vẽ đường cong Anomaly Score s(t) và tô màu phần diện tích vượt ngưỡng (s(t) >= threshold)
      if (scoreSeries.length > 1) {
        const pts: { x: number; y: number }[] = [];
        // Thêm điểm nội suy ở biên trái
        pts.push({ x: 0, y: scoreToY(scoreAtTime(viewStartMs)) });
        for (const p of scoreSeries) {
          if (p.tMs < viewStartMs || p.tMs > viewEndMs) continue;
          pts.push({ x: timeToX(p.tMs), y: scoreToY(p.score) });
        }
        // Thêm điểm nội suy ở biên phải
        pts.push({ x: width, y: scoreToY(scoreAtTime(viewEndMs)) });

        // 3a. Tô nền nhẹ toàn bộ đường score
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(pts[0].x, height - padBottom);
        for (const pt of pts) ctx.lineTo(pt.x, pt.y);
        ctx.lineTo(pts[pts.length - 1].x, height - padBottom);
        ctx.closePath();
        ctx.fillStyle = 'rgba(15, 118, 110, 0.08)';
        ctx.fill();
        ctx.restore();

        // 3b. Tô nổi bật phần diện tích VƯỢT NGƯỠNG (phía trên đường threshold)
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, width, threshY);
        ctx.clip();

        ctx.beginPath();
        ctx.moveTo(pts[0].x, threshY);
        for (const pt of pts) ctx.lineTo(pt.x, pt.y);
        ctx.lineTo(pts[pts.length - 1].x, threshY);
        ctx.closePath();
        ctx.fillStyle = 'rgba(16, 185, 129, 0.32)';
        ctx.fill();
        ctx.restore();

        // 3c. Đường Anomaly Score phần dưới ngưỡng
        ctx.save();
        ctx.strokeStyle = '#0F766E';
        ctx.lineWidth = 1.6;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        pts.forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();
        ctx.restore();

        // 3d. Tô đậm đường Anomaly Score ở đoạn vượt ngưỡng
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, width, threshY);
        ctx.clip();
        ctx.strokeStyle = '#059669';
        ctx.lineWidth = 2.2;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        pts.forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();
        ctx.restore();
      }

      // 4. Vẽ đường ngưỡng nét đứt (Threshold τ)
      ctx.save();
      ctx.strokeStyle = '#DC2626';
      ctx.lineWidth = 1.25;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(0, threshY);
      ctx.lineTo(width, threshY);
      ctx.stroke();
      ctx.restore();

      // 5. Crosshair khi di chuột
      if (hover) {
        const yPx = scoreToY(hover.score);
        ctx.save();
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(hover.xPx, 0);
        ctx.lineTo(hover.xPx, height);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.fillStyle = hover.aboveThreshold ? '#059669' : '#0F766E';
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(hover.xPx, yPx, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(container);
    return () => ro.disconnect();
  }, [
    scoreSeries,
    clampedThreshold,
    anomalies,
    selectedEventId,
    colorBySeverity,
    viewStartMs,
    viewEndMs,
    heightPx,
    hover,
    scoreAtTime,
  ]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPx = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const spanMs = Math.max(1, viewEndMs - viewStartMs);
    const tMs = viewStartMs + (xPx / Math.max(1, rect.width)) * spanMs;
    const score = scoreAtTime(tMs);
    const hitEvent =
      anomalies.find((ev) => tMs >= ev.startOffsetMs && tMs <= ev.endOffsetMs) ?? null;
    setHover({
      xPx,
      tMs,
      score,
      aboveThreshold: score >= clampedThreshold,
      anomaly: hitEvent,
    });
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onSelectEvent) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPx = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const spanMs = Math.max(1, viewEndMs - viewStartMs);
    const tMs = viewStartMs + (xPx / Math.max(1, rect.width)) * spanMs;
    const hitEvent = anomalies.find((ev) => tMs >= ev.startOffsetMs && tMs <= ev.endOffsetMs);
    if (hitEvent) onSelectEvent(hitEvent);
  };

  return (
    <div className="select-none">
      <div className="flex items-stretch">
        {/* Trục Y bên trái (0.0 -> 1.0) căn thẳng hàng với trục mV w-10 của EcgCanvas */}
        <div
          className="w-10 shrink-0 flex flex-col justify-between py-1 pr-1.5 text-right text-[10px] font-medium text-teal-700 tabular-nums"
          style={{ height: heightPx }}
          title="Thang điểm bất thường Anomaly Score (0.0 → 1.0)"
        >
          <span>1.0</span>
          <span className="text-red-600 font-semibold">τ {clampedThreshold.toFixed(2)}</span>
          <span>0.0</span>
        </div>

        {/* Khung đồ thị Anomaly Score & Threshold */}
        <div
          ref={containerRef}
          className="relative flex-1 rounded-xl overflow-hidden border border-slate-200/80 bg-slate-50/50"
          style={{ height: heightPx }}
        >
          <canvas
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHover(null)}
            onClick={handleClick}
            className="absolute inset-0 cursor-crosshair"
            aria-label={`Đồ thị Anomaly Score và ngưỡng ${clampedThreshold.toFixed(2)}`}
          />

          {/* Nhãn góc trái giải thích cơ chế xét ngưỡng trên Anomaly Score */}
          <div className="pointer-events-none absolute top-1.5 left-2.5 z-10 inline-flex items-center gap-2 px-2 py-0.5 rounded-md bg-white/90 border border-slate-200/80 text-[10px] text-slate-600 shadow-2xs">
            <span className="inline-flex items-center gap-1 font-semibold text-teal-800">
              <span className="w-2.5 h-0.5 bg-teal-700 inline-block" />
              Anomaly Score s(t)
            </span>
            <span className="text-slate-300">|</span>
            <span className="inline-flex items-center gap-1 font-semibold text-red-600">
              <span className="w-2.5 border-t border-dashed border-red-600 inline-block" />
              Ngưỡng τ = {clampedThreshold.toFixed(2)}
            </span>
            <span className="hidden sm:inline text-slate-400">
              (Khi s(t) ≥ τ → Tô vùng bất thường trên sóng ECG)
            </span>
          </div>

          {/* Tooltip khi hover trên đồ thị Anomaly Score */}
          {hover && (
            <div
              className="pointer-events-none absolute z-20 px-2.5 py-1 rounded-lg bg-slate-900/90 text-white text-[11px] shadow-md tabular-nums whitespace-nowrap"
              style={{
                left: Math.min(
                  Math.max(8, hover.xPx + 10),
                  (containerRef.current?.clientWidth ?? 300) - 220,
                ),
                top: 6,
              }}
            >
              <span className="text-slate-300">{formatTimeMs(hover.tMs)}</span>
              <span className="mx-1.5 text-slate-500">·</span>
              <span>
                Score:{' '}
                <strong className={hover.aboveThreshold ? 'text-emerald-300' : 'text-teal-200'}>
                  {hover.score.toFixed(2)}
                </strong>
              </span>
              <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-white/10">
                {hover.aboveThreshold
                  ? `≥ τ (${clampedThreshold.toFixed(2)}) · Bất thường`
                  : `< τ (${clampedThreshold.toFixed(2)}) · Bình thường`}
              </span>
              {hover.anomaly && (
                <span className="ml-1.5 text-amber-300 font-medium">
                  ({getAnomalyLabel(hover.anomaly.anomalyType)} · {SEVERITY_LABEL_VI[hover.anomaly.severity]})
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

