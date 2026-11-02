import type { EcgAnomalyEvent, EcgScorePoint } from '../../../../../types/ecg';
import { getBandColor, type EcgThemeTokens } from '../../ecgMeta';

export interface BandLayerOptions {
  width: number;
  height: number;
  viewStartMs: number;
  viewEndMs: number;
  anomalies: EcgAnomalyEvent[];
  secondaryAnomalies?: EcgAnomalyEvent[];
  selectedEventId?: string | null;
  hoveredEventId?: string | null;
  colorBySeverity: boolean;
  tokens: EcgThemeTokens;
  scoreSeries?: EcgScorePoint[];
  threshold?: number | null;
  revealProgress?: number; // 0..1 cho hiệu ứng stagger fade-in khi vừa completed
}

/**
 * Vẽ các dải màu bất thường (anomaly bands) + pattern sọc chéo (accessibility cho người mù màu)
 * + đường anomaly score màu teal (#0F766E) và đường ngưỡng nét đứt.
 */
export function drawAnomalyBands(ctx: CanvasRenderingContext2D, opts: BandLayerOptions): void {
  const {
    width,
    height,
    viewStartMs,
    viewEndMs,
    anomalies,
    secondaryAnomalies,
    selectedEventId,
    hoveredEventId,
    colorBySeverity,
    tokens,
    scoreSeries,
    threshold,
    revealProgress = 1,
  } = opts;

  const span = Math.max(1, viewEndMs - viewStartMs);
  const hasComparison = Array.isArray(secondaryAnomalies) && secondaryAnomalies.length > 0;
  const primaryTop = 0;
  const primaryHeight = hasComparison ? height * 0.5 : height;

  const renderEventSet = (events: EcgAnomalyEvent[], topY: number, bandH: number, isSecondary: boolean) => {
    events.forEach((ev, idx) => {
      if (ev.endOffsetMs < viewStartMs || ev.startOffsetMs > viewEndMs) return;
      const staggerDelay = Math.min(0.6, idx * 0.04);
      const localAlpha = Math.max(0, Math.min(1, (revealProgress - staggerDelay) / 0.4));
      if (localAlpha <= 0) return;

      const x1Raw = ((ev.startOffsetMs - viewStartMs) / span) * width;
      const x2Raw = ((ev.endOffsetMs - viewStartMs) / span) * width;
      const x1 = Math.max(0, x1Raw);
      const w = Math.max(2, Math.min(width, x2Raw) - x1); // Tối thiểu 2px theo đặc tả mục 3.4

      const { fill, stroke, pattern } = getBandColor(ev, colorBySeverity, tokens);
      ctx.save();
      ctx.globalAlpha = (isSecondary ? 0.42 : 0.55) * localAlpha;
      ctx.fillStyle = fill;
      ctx.fillRect(x1, topY, w, bandH);

      // Pattern phụ trợ cho người mù màu (mục 8 Accessibility)
      if (pattern === 'stripe' && w >= 6) {
        ctx.beginPath();
        ctx.rect(x1, topY, w, bandH);
        ctx.clip();
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 1;
        for (let sx = x1 - bandH; sx < x1 + w; sx += 7) {
          ctx.moveTo(sx, topY + bandH);
          ctx.lineTo(sx + bandH, topY);
        }
        ctx.stroke();
      } else if (pattern === 'dots' && w >= 6) {
        ctx.fillStyle = stroke;
        for (let dx = x1 + 3; dx < x1 + w - 2; dx += 8) {
          for (let dy = topY + 6; dy < topY + bandH - 4; dy += 10) {
            ctx.fillRect(dx, dy, 1.5, 1.5);
          }
        }
      }
      ctx.restore();

      const isSelected = ev.id === selectedEventId;
      const isHovered = ev.id === hoveredEventId;
      if (isSelected || isHovered) {
        ctx.save();
        ctx.strokeStyle = stroke;
        ctx.lineWidth = isSelected ? 2 : 1.5;
        ctx.strokeRect(x1 + 0.5, topY + 0.5, Math.max(1, w - 1), bandH - 1);
        ctx.restore();
      }
    });
  };

  renderEventSet(anomalies, primaryTop, primaryHeight, false);
  if (hasComparison && secondaryAnomalies) {
    ctx.save();
    ctx.strokeStyle = '#CBD5E1';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, primaryHeight);
    ctx.lineTo(width, primaryHeight);
    ctx.stroke();
    ctx.restore();
    renderEventSet(secondaryAnomalies, primaryHeight, height - primaryHeight, true);
  }

  // Đường ngưỡng (threshold) nét đứt màu teal 50%
  if (typeof threshold === 'number' && threshold > 0 && threshold < 1) {
    const ty = height - threshold * (height - 16) - 8;
    ctx.save();
    ctx.strokeStyle = tokens.score;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(0, ty);
    ctx.lineTo(width, ty);
    ctx.stroke();
    ctx.restore();
  }

  // Đường điểm bất thường (anomaly score) màu teal 1.5px trên trục Y phụ (0..1)
  if (scoreSeries && scoreSeries.length > 1) {
    ctx.save();
    ctx.strokeStyle = tokens.score;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    let started = false;
    for (const pt of scoreSeries) {
      if (pt.tMs < viewStartMs - 500 || pt.tMs > viewEndMs + 500) continue;
      const x = ((pt.tMs - viewStartMs) / span) * width;
      const y = height - Math.max(0, Math.min(1, pt.score)) * (height - 16) - 8;
      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    ctx.restore();
  }
}

export function hitTestAnomalyBand(
  xPx: number,
  width: number,
  viewStartMs: number,
  viewEndMs: number,
  anomalies: EcgAnomalyEvent[],
): EcgAnomalyEvent | null {
  if (width <= 0) return null;
  const span = Math.max(1, viewEndMs - viewStartMs);
  const tMs = viewStartMs + (xPx / width) * span;
  const minMarginMs = (3 / width) * span;
  for (let i = anomalies.length - 1; i >= 0; i--) {
    const ev = anomalies[i];
    if (tMs >= ev.startOffsetMs - minMarginMs && tMs <= ev.endOffsetMs + minMarginMs) {
      return ev;
    }
  }
  return null;
}

