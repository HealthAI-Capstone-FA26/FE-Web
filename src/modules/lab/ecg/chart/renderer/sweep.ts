import type { RingBuffer } from '../data/RingBuffer';
import { minMaxDecimate } from '../math/minMaxDecimate';
import type { EcgThemeTokens } from '../../ecgMeta';
import type { EcgGridMode } from './gridLayer';

export interface SweepRenderConfig {
  width: number;
  height: number;
  sampleRateHz: number;
  windowDurationMs: number;
  gainMmPerMv: 5 | 10 | 20;
  yDomain?: [number, number];
  leadIndices: number[];
  mode: EcgGridMode;
  tokens: EcgThemeTokens;
  reducedMotion: boolean;
}

export function mapValueToRowY(
  mv: number,
  rowIndex: number,
  rowHeight: number,
  yDomain: [number, number],
  gainMmPerMv: 5 | 10 | 20,
): number {
  const scale = 10 / gainMmPerMv;
  const yMin = yDomain[0] * scale;
  const yMax = yDomain[1] * scale;
  const pad = Math.min(8, rowHeight * 0.06);
  const usable = Math.max(4, rowHeight - pad * 2);
  const ratio = (yMax - mv) / Math.max(0.001, yMax - yMin);
  return rowIndex * rowHeight + pad + ratio * usable;
}

/**
 * Bộ vẽ Sweep mode chuẩn monitor bệnh viện:
 * - Con trỏ quét từ trái sang phải theo chu kỳ `windowDurationMs`.
 * - Khi tới mép phải quay lại trái và ghi đè sóng cũ; phía trước đầu bút có khoảng xoá (eraser gap ~ 40ms).
 * - Chỉ `clearRect` vùng hẹp phía trước con trỏ + vẽ đoạn mẫu mới mỗi frame (dirty-region).
 */
export class SweepState {
  private lastAbsSample = -1;
  private lastWindowMs = 0;
  private lastWidth = 0;
  private lastHeight = 0;
  private readonly scratch = new Float32Array(8192);

  reset(): void {
    this.lastAbsSample = -1;
  }

  /** Vẽ lại toàn bộ cửa sổ hiện tại lên canvas sóng (dùng khi seek, resize hoặc đổi đạo trình). */
  fullRedraw(
    waveCtx: CanvasRenderingContext2D,
    buffer: RingBuffer,
    currentAbsSample: number,
    cfg: SweepRenderConfig,
  ): void {
    const { width, height, sampleRateHz, windowDurationMs } = cfg;
    waveCtx.clearRect(0, 0, width, height);
    const windowSamples = Math.max(1, Math.round((windowDurationMs / 1000) * sampleRateHz));
    const cursorInWindow = ((currentAbsSample % windowSamples) + windowSamples) % windowSamples;
    const cycleBaseSample = currentAbsSample - cursorInWindow;
    const eraserSamples = Math.max(2, Math.round(0.04 * sampleRateHz)); // ~40ms eraser gap

    // 1. Vẽ phần sóng của chu kỳ hiện tại: [0 .. cursorInWindow]
    if (cursorInWindow > 1) {
      this.drawSegment(waveCtx, buffer, cycleBaseSample, cycleBaseSample + cursorInWindow, cycleBaseSample, windowSamples, cfg);
    }

    // 2. Vẽ phần sóng của chu kỳ trước nằm sau eraser gap: [cursorInWindow + eraserSamples .. windowSamples]
    const prevStartOffset = cursorInWindow + eraserSamples;
    if (prevStartOffset < windowSamples - 1) {
      const prevCycleBase = cycleBaseSample - windowSamples;
      this.drawSegment(
        waveCtx,
        buffer,
        prevCycleBase + prevStartOffset,
        prevCycleBase + windowSamples,
        prevCycleBase,
        windowSamples,
        cfg,
      );
    }

    this.lastAbsSample = currentAbsSample;
    this.lastWindowMs = windowDurationMs;
    this.lastWidth = width;
    this.lastHeight = height;
  }

  /** Cập nhật mỗi frame: chỉ xoá eraser gap phía trước đầu bút và vẽ đoạn mẫu mới. */
  stepFrame(
    waveCtx: CanvasRenderingContext2D,
    overlayCtx: CanvasRenderingContext2D,
    buffer: RingBuffer,
    currentAbsSample: number,
    cfg: SweepRenderConfig,
  ): { cursorX: number; pointsDrawn: number } {
    const { width, height, sampleRateHz, windowDurationMs } = cfg;
    const windowSamples = Math.max(1, Math.round((windowDurationMs / 1000) * sampleRateHz));

    if (
      this.lastAbsSample < 0 ||
      currentAbsSample < this.lastAbsSample ||
      currentAbsSample - this.lastAbsSample > windowSamples / 2 ||
      this.lastWindowMs !== windowDurationMs ||
      this.lastWidth !== width ||
      this.lastHeight !== height
    ) {
      this.fullRedraw(waveCtx, buffer, currentAbsSample, cfg);
    } else if (currentAbsSample > this.lastAbsSample) {
      const eraserSamples = Math.max(2, Math.round(0.04 * sampleRateHz)); // ~40ms
      const prevMod = ((this.lastAbsSample % windowSamples) + windowSamples) % windowSamples;
      const currMod = ((currentAbsSample % windowSamples) + windowSamples) % windowSamples;

      const clearSpan = (fromSampleMod: number, toSampleMod: number) => {
        const x1 = Math.max(0, Math.floor((fromSampleMod / windowSamples) * width) - 1);
        const x2 = Math.min(width, Math.ceil((toSampleMod / windowSamples) * width) + 2);
        if (x2 > x1) waveCtx.clearRect(x1, 0, x2 - x1, height);
      };

      const eraseEndMod = (currMod + eraserSamples) % windowSamples;
      if (eraseEndMod >= prevMod && currMod >= prevMod) {
        clearSpan(prevMod, eraseEndMod);
      } else {
        clearSpan(prevMod, windowSamples);
        clearSpan(0, eraseEndMod);
      }

      const cycleBase = currentAbsSample - currMod;
      if (currMod >= prevMod) {
        this.drawSegment(waveCtx, buffer, Math.max(cycleBase, this.lastAbsSample - 1), currentAbsSample, cycleBase, windowSamples, cfg);
      } else {
        const prevCycleBase = cycleBase - windowSamples;
        this.drawSegment(waveCtx, buffer, Math.max(prevCycleBase, this.lastAbsSample - 1), prevCycleBase + windowSamples, prevCycleBase, windowSamples, cfg);
        this.drawSegment(waveCtx, buffer, cycleBase, currentAbsSample, cycleBase, windowSamples, cfg);
      }
      this.lastAbsSample = currentAbsSample;
    }

    const cursorMod = ((currentAbsSample % windowSamples) + windowSamples) % windowSamples;
    const cursorX = (cursorMod / windowSamples) * width;
    this.drawSweepCursor(overlayCtx, buffer, currentAbsSample, cursorX, cfg);
    const pointsDrawn = Math.min(windowSamples, Math.floor(width * 2));
    return { cursorX, pointsDrawn };
  }

  private drawSegment(
    ctx: CanvasRenderingContext2D,
    buffer: RingBuffer,
    fromAbs: number,
    toAbs: number,
    cycleBaseAbs: number,
    windowSamples: number,
    cfg: SweepRenderConfig,
  ): void {
    const { width, height, gainMmPerMv, yDomain = [-1.5, 1.5], leadIndices, mode, tokens, reducedMotion } = cfg;
    const clampedFrom = Math.max(fromAbs, buffer.start);
    const clampedTo = Math.min(toAbs, buffer.end);
    if (clampedTo - clampedFrom < 2) return;

    const numRows = Math.max(1, leadIndices.length);
    const rowHeight = height / numRows;
    const spanPx = Math.max(2, ((clampedTo - clampedFrom) / windowSamples) * width);

    const strokeColor =
      mode === 'monitor' ? tokens.waveMonitor : mode === 'paper' ? tokens.wavePaper : tokens.wave;

    ctx.save();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = mode === 'monitor' ? 1.6 : 1.35;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    if (mode === 'monitor' && !reducedMotion) {
      ctx.shadowColor = tokens.waveMonitor;
      ctx.shadowBlur = 6;
    }

    for (let r = 0; r < numRows; r++) {
      const leadIdx = leadIndices[r] ?? 0;
      const n = minMaxDecimate((idx) => buffer.get(leadIdx, idx), clampedFrom, clampedTo, spanPx, this.scratch);
      if (n < 2) continue;
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < n; i++) {
        const sampleIdx = this.scratch[i * 2];
        const mv = this.scratch[i * 2 + 1];
        if (!Number.isFinite(mv)) continue;
        const x = ((sampleIdx - cycleBaseAbs) / windowSamples) * width;
        const y = mapValueToRowY(mv, r, rowHeight, yDomain, gainMmPerMv);
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawSweepCursor(
    overlayCtx: CanvasRenderingContext2D,
    buffer: RingBuffer,
    currentAbsSample: number,
    cursorX: number,
    cfg: SweepRenderConfig,
  ): void {
    const { width, height, gainMmPerMv, yDomain = [-1.5, 1.5], leadIndices, mode, tokens, reducedMotion } = cfg;
    overlayCtx.clearRect(0, 0, width, height);
    if (currentAbsSample <= buffer.start) return;

    const numRows = Math.max(1, leadIndices.length);
    const rowHeight = height / numRows;
    const dotColor = mode === 'monitor' ? tokens.waveMonitor : mode === 'paper' ? tokens.wavePaper : '#DC2626';

    overlayCtx.save();
    overlayCtx.strokeStyle = mode === 'monitor' ? 'rgba(34,197,94,0.35)' : 'rgba(220,38,38,0.28)';
    overlayCtx.lineWidth = 1;
    overlayCtx.beginPath();
    overlayCtx.moveTo(cursorX, 0);
    overlayCtx.lineTo(cursorX, height);
    overlayCtx.stroke();

    for (let r = 0; r < numRows; r++) {
      const leadIdx = leadIndices[r] ?? 0;
      const mv = buffer.get(leadIdx, currentAbsSample - 1);
      if (!Number.isFinite(mv)) continue;
      const y = mapValueToRowY(mv, r, rowHeight, yDomain, gainMmPerMv);
      if (!reducedMotion) {
        overlayCtx.fillStyle = mode === 'monitor' ? 'rgba(34,197,94,0.28)' : 'rgba(220,38,38,0.22)';
        overlayCtx.beginPath();
        overlayCtx.arc(cursorX, y, 6.5, 0, Math.PI * 2);
        overlayCtx.fill();
      }
      overlayCtx.fillStyle = dotColor;
      overlayCtx.beginPath();
      overlayCtx.arc(cursorX, y, 3, 0, Math.PI * 2);
      overlayCtx.fill();
    }
    overlayCtx.restore();
  }
}
