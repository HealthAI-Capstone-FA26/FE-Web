import React, { useEffect, useRef } from 'react';
import type { EcgAnomalyEvent, EcgSignal } from '../../../../types/ecg';
import { getBandColor, readEcgThemeTokens } from '../ecgMeta';

interface MinimapProps {
  signal: EcgSignal | null;
  leadName: string;
  durationMs: number;
  viewStartMs: number;
  viewEndMs: number;
  anomalies: EcgAnomalyEvent[];
  colorBySeverity?: boolean;
  onViewChange: (startMs: number, endMs: number) => void;
}

/**
 * Thanh Minimap + Brush (cao 36px):
 * - Nền `#EEF2FF`, vẽ toàn bộ tín hiệu đã giảm mẫu bằng LTTB (trong Worker) + vạch màu bất thường.
 * - Khung vùng đang xem `#93C5FD` có 2 tay nắm tròn trái/phải để kéo co giãn (zoom) hoặc kéo giữa khung để trượt (pan).
 */
export const Minimap: React.FC<MinimapProps> = ({
  signal,
  leadName,
  durationMs,
  viewStartMs,
  viewEndMs,
  anomalies,
  colorBySeverity = false,
  onViewChange,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const draw = () => {
      const rect = container.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = 36;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const tokens = readEcgThemeTokens();
      ctx.fillStyle = tokens.brushBg;
      ctx.fillRect(0, 0, w, h);

      // Dải bất thường trên minimap
      const total = Math.max(1, durationMs);
      for (const ev of anomalies) {
        const x1 = (ev.startOffsetMs / total) * w;
        const x2 = (ev.endOffsetMs / total) * w;
        const { fill } = getBandColor(ev, colorBySeverity, tokens);
        ctx.fillStyle = fill;
        ctx.globalAlpha = 0.7;
        ctx.fillRect(x1, 0, Math.max(2, x2 - x1), h);
      }
      ctx.globalAlpha = 1;

      if (!signal) return;
      const leadIdx = Math.max(0, signal.leadNames.indexOf(leadName));
      const ov = signal.overview[leadIdx] ?? signal.overview[0];
      if (!ov || ov.x.length < 2) return;

      const totalSamples = Math.max(1, signal.leads[leadIdx]?.length ?? 1);
      let minY = -1.2;
      let maxY = 1.2;
      for (let i = 0; i < ov.y.length; i++) {
        const v = ov.y[i];
        if (v < minY) minY = v;
        if (v > maxY) maxY = v;
      }
      const spanY = Math.max(0.5, maxY - minY);
      const pad = 4;
      const plotH = h - pad * 2;
      ctx.strokeStyle = '#64748B';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < ov.x.length; i++) {
        const x = (ov.x[i] / totalSamples) * w;
        const y = pad + ((maxY - ov.y[i]) / spanY) * plotH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(container);
    return () => ro.disconnect();
  }, [signal, leadName, durationMs, anomalies, colorBySeverity]);

  const total = Math.max(1, durationMs);
  const leftPct = Math.max(0, Math.min(100, (viewStartMs / total) * 100));
  const rightPct = Math.max(leftPct + 1, Math.min(100, (viewEndMs / total) * 100));
  const widthPct = Math.max(1, rightPct - leftPct);

  const startDrag = (mode: 'pan' | 'left' | 'right', e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const startX = e.clientX;
    const initStart = viewStartMs;
    const initEnd = viewEndMs;
    const minSpan = 500;

    const onMove = (ev: MouseEvent) => {
      const dxMs = ((ev.clientX - startX) / Math.max(1, rect.width)) * total;
      if (mode === 'pan') {
        const span = initEnd - initStart;
        const nextStart = Math.max(0, Math.min(total - span, initStart + dxMs));
        onViewChange(nextStart, nextStart + span);
      } else if (mode === 'left') {
        const nextStart = Math.max(0, Math.min(initEnd - minSpan, initStart + dxMs));
        onViewChange(nextStart, initEnd);
      } else {
        const nextEnd = Math.min(total, Math.max(initStart + minSpan, initEnd + dxMs));
        onViewChange(initStart, nextEnd);
      }
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickMs = ((e.clientX - rect.left) / Math.max(1, rect.width)) * total;
    const span = viewEndMs - viewStartMs;
    const nextStart = Math.max(0, Math.min(total - span, clickMs - span / 2));
    onViewChange(nextStart, nextStart + span);
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleTrackClick}
      className="relative h-9 rounded-lg overflow-hidden border border-indigo-200/80 bg-[#EEF2FF] select-none cursor-pointer"
      title="Kéo khung xanh để di chuyển, kéo 2 nút tròn hai đầu để thu/phóng vùng xem"
    >
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

      {/* Khung vùng đang xem (Brush window) */}
      <div
        onMouseDown={(e) => startDrag('pan', e)}
        className="absolute top-0 bottom-0 bg-[#93C5FD]/35 border-x-2 border-blue-500 cursor-grab active:cursor-grabbing"
        style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
      >
        {/* Tay nắm tròn bên trái */}
        <span
          onMouseDown={(e) => startDrag('left', e)}
          className="absolute -left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-blue-600 shadow cursor-ew-resize"
        />
        {/* Tay nắm tròn bên phải */}
        <span
          onMouseDown={(e) => startDrag('right', e)}
          className="absolute -right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-blue-600 shadow cursor-ew-resize"
        />
      </div>
    </div>
  );
};

