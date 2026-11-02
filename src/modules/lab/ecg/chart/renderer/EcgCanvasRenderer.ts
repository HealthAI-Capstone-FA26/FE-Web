import type { EcgAnomalyEvent, EcgScorePoint, EcgSignal } from '../../../../../types/ecg';
import type { EcgDataSource } from '../data/EcgDataSource';
import { minMaxDecimate } from '../math/minMaxDecimate';
import { formatTimeMs, readEcgThemeTokens, type EcgThemeTokens } from '../../ecgMeta';
import { drawAnomalyBands } from './bandLayer';
import { drawGridLayer, type EcgGridMode } from './gridLayer';
import { SweepState } from './sweep';

export type EcgRenderStyle = 'static' | 'sweep' | 'scroll';

export interface CaliperMeasurement {
  startMs: number;
  endMs: number;
  deltaMs: number;
  bpm: number | null;
}

export interface HoverReadout {
  xPx: number;
  yPx: number;
  tMs: number;
  sampleIndex: number;
  mv: number;
  leadName: string;
  rrMs: number | null;
  anomaly: EcgAnomalyEvent | null;
}

export interface EcgRendererOptions {
  style: EcgRenderStyle;
  gridMode: EcgGridMode;
  gainMmPerMv: 5 | 10 | 20;
  leadIndices: number[];
  leadLabels: string[];
  showCalibrationPulse: boolean;
  viewStartMs: number;
  viewEndMs: number;
  anomalies: EcgAnomalyEvent[];
  secondaryAnomalies?: EcgAnomalyEvent[];
  selectedEventId?: string | null;
  hoveredEventId?: string | null;
  colorBySeverity: boolean;
  scoreSeries?: EcgScorePoint[];
  threshold?: number | null;
  rPeaksMs?: number[];
  saliency?: { tMs: number; w: number }[];
  reducedMotion: boolean;
  revealProgress?: number;
}

/**
 * Bộ vẽ 3 lớp Canvas chồng nhau (thuần TypeScript, không phụ thuộc React):
 * - Layer 1 (`gridCanvas`): lưới nền + xung chuẩn 1mV + nhãn đạo trình (chỉ vẽ khi resize/đổi cấu hình).
 * - Layer 2 (`waveCanvas`): dải màu bất thường + sóng ECG (min-max decimation giữ nguyên đỉnh QRS) + điểm score.
 * - Layer 3 (`overlayCanvas`): con trỏ sweep, R-peak markers, crosshair, thước đo caliper, vùng chọn zoom.
 */
export class EcgCanvasRenderer {
  private readonly gridCanvas: HTMLCanvasElement;
  private readonly waveCanvas: HTMLCanvasElement;
  private readonly overlayCanvas: HTMLCanvasElement;
  private readonly gridCtx: CanvasRenderingContext2D;
  private readonly waveCtx: CanvasRenderingContext2D;
  private readonly overlayCtx: CanvasRenderingContext2D;

  private width = 0;
  private height = 0;
  private dpr = 1;
  private tokens: EcgThemeTokens = readEcgThemeTokens();
  private signal: EcgSignal | null = null;
  private dataSource: EcgDataSource | null = null;
  private opts: EcgRendererOptions;
  private readonly sweep = new SweepState();
  private readonly scratch = new Float32Array(16384);
  private lastPointsCount = 0;
  private onPointsChange?: (pts: number) => void;

  // Overlay trạng thái tương tác
  private hoverX: number | null = null;
  private hoverY: number | null = null;
  private rubberBand: { x1: number; x2: number } | null = null;
  private caliper: { startMs: number; endMs: number } | null = null;

  constructor(
    gridCanvas: HTMLCanvasElement,
    waveCanvas: HTMLCanvasElement,
    overlayCanvas: HTMLCanvasElement,
    initialOpts: EcgRendererOptions,
    onPointsChange?: (pts: number) => void,
  ) {
    this.gridCanvas = gridCanvas;
    this.waveCanvas = waveCanvas;
    this.overlayCanvas = overlayCanvas;
    const g = gridCanvas.getContext('2d');
    const w = waveCanvas.getContext('2d');
    const o = overlayCanvas.getContext('2d');
    if (!g || !w || !o) throw new Error('Canvas 2D context unavailable');
    this.gridCtx = g;
    this.waveCtx = w;
    this.overlayCtx = o;
    this.opts = initialOpts;
    this.onPointsChange = onPointsChange;
    this.refreshTheme();
  }

  refreshTheme(): void {
    this.tokens = readEcgThemeTokens();
  }

  setSignal(signal: EcgSignal | null): void {
    this.signal = signal;
    this.sweep.reset();
    this.renderStatic();
  }

  setDataSource(ds: EcgDataSource | null): void {
    this.dataSource = ds;
    this.sweep.reset();
  }

  resize(cssWidth: number, cssHeight: number): void {
    const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2.5) : 1;
    const w = Math.max(1, Math.floor(cssWidth));
    const h = Math.max(1, Math.floor(cssHeight));
    if (w === this.width && h === this.height && dpr === this.dpr) return;
    this.width = w;
    this.height = h;
    this.dpr = dpr;

    for (const c of [this.gridCanvas, this.waveCanvas, this.overlayCanvas]) {
      c.width = Math.floor(w * dpr);
      c.height = Math.floor(h * dpr);
      c.style.width = `${w}px`;
      c.style.height = `${h}px`;
      const ctx = c.getContext('2d');
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    this.sweep.reset();
    this.drawGrid();
    this.renderStatic();
  }

  updateOptions(next: EcgRendererOptions, redrawGrid = false): void {
    const prev = this.opts;
    const needGrid =
      redrawGrid ||
      prev.gridMode !== next.gridMode ||
      prev.gainMmPerMv !== next.gainMmPerMv ||
      prev.leadIndices.length !== next.leadIndices.length ||
      prev.leadLabels.join(',') !== next.leadLabels.join(',') ||
      prev.showCalibrationPulse !== next.showCalibrationPulse ||
      (next.gridMode === 'paper' && prev.viewEndMs - prev.viewStartMs !== next.viewEndMs - next.viewStartMs);

    if (
      prev.style !== next.style ||
      prev.gridMode !== next.gridMode ||
      prev.gainMmPerMv !== next.gainMmPerMv ||
      prev.leadIndices.join(',') !== next.leadIndices.join(',')
    ) {
      this.sweep.reset();
    }

    this.opts = next;
    if (needGrid) this.drawGrid();
    if (next.style === 'static') {
      this.renderStatic();
    }
  }

  drawGrid(): void {
    if (this.width <= 0 || this.height <= 0) return;
    drawGridLayer(this.gridCtx, {
      width: this.width,
      height: this.height,
      mode: this.opts.gridMode,
      tokens: this.tokens,
      gainMmPerMv: this.opts.gainMmPerMv,
      windowDurationMs: Math.max(200, this.opts.viewEndMs - this.opts.viewStartMs),
      numRows: Math.max(1, this.opts.leadIndices.length),
      leadLabels: this.opts.leadLabels,
      showCalibrationPulse: this.opts.showCalibrationPulse,
    });
  }

  /** Vẽ chế độ tĩnh / zoom-pan (Card 1 Anomaly hoặc Card 4 Mini chart hoặc khi tạm dừng xem lại). */
  renderStatic(): void {
    if (this.width <= 0 || this.height <= 0) return;
    const { width, height } = this;
    const {
      viewStartMs,
      viewEndMs,
      anomalies,
      secondaryAnomalies,
      selectedEventId,
      hoveredEventId,
      colorBySeverity,
      scoreSeries,
      threshold,
      leadIndices,
      gainMmPerMv,
      gridMode,
      saliency,
      revealProgress,
    } = this.opts;

    this.waveCtx.clearRect(0, 0, width, height);

    drawAnomalyBands(this.waveCtx, {
      width,
      height,
      viewStartMs,
      viewEndMs,
      anomalies,
      secondaryAnomalies,
      selectedEventId,
      hoveredEventId,
      colorBySeverity,
      tokens: this.tokens,
      scoreSeries,
      threshold,
      revealProgress,
    });

    // Saliency heatmap dưới sóng (dùng trong Card 4 chi tiết sự kiện)
    if (saliency && saliency.length > 1) {
      const span = Math.max(1, viewEndMs - viewStartMs);
      const bandY = height - 10;
      for (let i = 0; i < saliency.length - 1; i++) {
        const p0 = saliency[i];
        const p1 = saliency[i + 1];
        const x0 = ((p0.tMs - viewStartMs) / span) * width;
        const x1 = ((p1.tMs - viewStartMs) / span) * width;
        if (x1 < 0 || x0 > width) continue;
        const w = Math.max(0, Math.min(1, p0.w));
        this.waveCtx.fillStyle = `rgba(220, 38, 38, ${(w * 0.75).toFixed(3)})`;
        this.waveCtx.fillRect(x0, bandY, Math.max(1, x1 - x0 + 0.5), 8);
      }
    }

    if (!this.signal) {
      this.reportPoints(0);
      this.drawOverlay();
      return;
    }

    const fs = this.signal.sampleRateHz;
    const totalSamples = this.signal.leads[0]?.length ?? 0;
    const startSample = Math.max(0, Math.floor((viewStartMs / 1000) * fs));
    const endSample = Math.min(totalSamples, Math.ceil((viewEndMs / 1000) * fs));
    const numRows = Math.max(1, leadIndices.length);
    const rowHeight = height / numRows;
    const mvScalePx = rowHeight * 0.34 * (gainMmPerMv / 10);
    const spanMs = Math.max(1, viewEndMs - viewStartMs);

    const strokeColor =
      gridMode === 'monitor'
        ? this.tokens.waveMonitor
        : gridMode === 'paper'
          ? this.tokens.wavePaper
          : this.tokens.wave;

    this.waveCtx.save();
    this.waveCtx.strokeStyle = strokeColor;
    this.waveCtx.lineWidth = 1.25;
    this.waveCtx.lineJoin = 'round';
    this.waveCtx.lineCap = 'round';

    let totalPoints = 0;
    for (let r = 0; r < numRows; r++) {
      const leadIdx = leadIndices[r] ?? 0;
      const leadArr = this.signal.leads[leadIdx] ?? this.signal.leads[0];
      if (!leadArr) continue;
      const centerY = r * rowHeight + rowHeight * 0.52;
      const n = minMaxDecimate((i) => leadArr[i] ?? 0, startSample, endSample, width, this.scratch);
      totalPoints += n;
      if (n < 2) continue;

      this.waveCtx.beginPath();
      for (let i = 0; i < n; i++) {
        const sampleIdx = this.scratch[i * 2];
        const mv = this.scratch[i * 2 + 1];
        const tMs = (sampleIdx / fs) * 1000;
        const x = ((tMs - viewStartMs) / spanMs) * width;
        const y = centerY - mv * mvScalePx;
        if (i === 0) this.waveCtx.moveTo(x, y);
        else this.waveCtx.lineTo(x, y);
      }
      this.waveCtx.stroke();
    }
    this.waveCtx.restore();

    this.reportPoints(totalPoints);
    this.drawOverlay();
  }

  /** Vẽ 1 frame cho chế độ Live (Sweep hoặc Scroll) ở vị trí thời gian `positionMs`. */
  renderLiveFrame(positionMs: number): void {
    if (this.width <= 0 || this.height <= 0 || !this.dataSource) return;
    const fs = this.dataSource.sampleRateHz;
    const currentAbsSample = Math.max(0, Math.floor((positionMs / 1000) * fs));
    this.dataSource.pumpTo(currentAbsSample);

    const windowDurationMs = Math.max(500, this.opts.viewEndMs - this.opts.viewStartMs);
    if (this.opts.style === 'sweep') {
      const { pointsDrawn } = this.sweep.stepFrame(this.waveCtx, this.overlayCtx, this.dataSource.buffer, currentAbsSample, {
        width: this.width,
        height: this.height,
        sampleRateHz: fs,
        windowDurationMs,
        gainMmPerMv: this.opts.gainMmPerMv,
        leadIndices: this.opts.leadIndices,
        mode: this.opts.gridMode,
        tokens: this.tokens,
        reducedMotion: this.opts.reducedMotion,
      });
      this.reportPoints(pointsDrawn);
      this.drawLiveAnnotations(positionMs, windowDurationMs);
      return;
    }

    // Scroll mode: sóng trôi từ phải sang trái, điểm mới nhất ở mép phải
    const endMs = Math.max(windowDurationMs, positionMs);
    const startMs = endMs - windowDurationMs;
    this.opts = { ...this.opts, viewStartMs: startMs, viewEndMs: endMs };
    this.renderScrollFrame(startMs, endMs, currentAbsSample);
  }

  private renderScrollFrame(startMs: number, endMs: number, currentAbsSample: number): void {
    if (!this.dataSource) return;
    const { width, height } = this;
    const fs = this.dataSource.sampleRateHz;
    const buffer = this.dataSource.buffer;
    const { leadIndices, gainMmPerMv, gridMode, anomalies, colorBySeverity } = this.opts;

    this.waveCtx.clearRect(0, 0, width, height);
    drawAnomalyBands(this.waveCtx, {
      width,
      height,
      viewStartMs: startMs,
      viewEndMs: endMs,
      anomalies: anomalies.filter((a) => a.startOffsetMs <= (currentAbsSample / fs) * 1000),
      colorBySeverity,
      tokens: this.tokens,
    });

    const startSample = Math.max(buffer.start, Math.floor((startMs / 1000) * fs));
    const endSample = Math.min(buffer.end, currentAbsSample);
    const spanMs = Math.max(1, endMs - startMs);
    const numRows = Math.max(1, leadIndices.length);
    const rowHeight = height / numRows;
    const mvScalePx = rowHeight * 0.34 * (gainMmPerMv / 10);

    const strokeColor =
      gridMode === 'monitor'
        ? this.tokens.waveMonitor
        : gridMode === 'paper'
          ? this.tokens.wavePaper
          : this.tokens.wave;

    this.waveCtx.save();
    this.waveCtx.strokeStyle = strokeColor;
    this.waveCtx.lineWidth = gridMode === 'monitor' ? 1.6 : 1.35;
    this.waveCtx.lineJoin = 'round';
    if (gridMode === 'monitor' && !this.opts.reducedMotion) {
      this.waveCtx.shadowColor = this.tokens.waveMonitor;
      this.waveCtx.shadowBlur = 6;
    }

    let pts = 0;
    for (let r = 0; r < numRows; r++) {
      const leadIdx = leadIndices[r] ?? 0;
      const centerY = r * rowHeight + rowHeight * 0.52;
      const n = minMaxDecimate((i) => buffer.get(leadIdx, i), startSample, endSample, width, this.scratch);
      pts += n;
      if (n < 2) continue;
      this.waveCtx.beginPath();
      for (let i = 0; i < n; i++) {
        const sampleIdx = this.scratch[i * 2];
        const mv = this.scratch[i * 2 + 1];
        const tMs = (sampleIdx / fs) * 1000;
        const x = ((tMs - startMs) / spanMs) * width;
        const y = centerY - mv * mvScalePx;
        if (i === 0) this.waveCtx.moveTo(x, y);
        else this.waveCtx.lineTo(x, y);
      }
      this.waveCtx.stroke();
    }
    this.waveCtx.restore();
    this.reportPoints(pts);
    this.drawOverlay();
  }

  /** Vẽ R-peak markers + dải màu đoạn bất thường đang quét qua trong Sweep mode. */
  private drawLiveAnnotations(positionMs: number, windowDurationMs: number): void {
    const { width, height } = this;
    const cycleStartMs = Math.floor(positionMs / windowDurationMs) * windowDurationMs;
    const cursorInWinMs = positionMs - cycleStartMs;

    // Đánh dấu các đoạn anomaly thuộc chu kỳ hiện tại đã được con trỏ quét qua
    for (const ev of this.opts.anomalies) {
      const s = Math.max(cycleStartMs, ev.startOffsetMs);
      const e = Math.min(positionMs, ev.endOffsetMs);
      if (e <= s) continue;
      const x1 = ((s - cycleStartMs) / windowDurationMs) * width;
      const x2 = ((e - cycleStartMs) / windowDurationMs) * width;
      this.overlayCtx.save();
      this.overlayCtx.fillStyle =
        ev.severity === 'critical'
          ? 'rgba(248,113,113,0.22)'
          : ev.severity === 'high'
            ? 'rgba(253,186,116,0.22)'
            : 'rgba(253,230,138,0.22)';
      this.overlayCtx.fillRect(x1, 0, Math.max(2, x2 - x1), height);
      this.overlayCtx.restore();
    }

    // Tam giác nhỏ xám trên đỉnh R
    if (this.opts.rPeaksMs && this.opts.rPeaksMs.length > 0) {
      this.overlayCtx.save();
      this.overlayCtx.fillStyle = this.opts.gridMode === 'monitor' ? '#94A3B8' : '#64748B';
      for (const peakMs of this.opts.rPeaksMs) {
        if (peakMs < cycleStartMs || peakMs > cycleStartMs + cursorInWinMs) continue;
        const x = ((peakMs - cycleStartMs) / windowDurationMs) * width;
        this.overlayCtx.beginPath();
        this.overlayCtx.moveTo(x - 3.5, 5);
        this.overlayCtx.lineTo(x + 3.5, 5);
        this.overlayCtx.lineTo(x, 11);
        this.overlayCtx.closePath();
        this.overlayCtx.fill();
      }
      this.overlayCtx.restore();
    }
  }

  /** Vẽ lớp overlay tương tác (R-peaks, crosshair, rubber-band zoom, caliper). */
  drawOverlay(): void {
    const { width, height } = this;
    if (width <= 0 || height <= 0) return;
    this.overlayCtx.clearRect(0, 0, width, height);
    const { viewStartMs, viewEndMs, rPeaksMs, gridMode } = this.opts;
    const span = Math.max(1, viewEndMs - viewStartMs);

    // 1. R-peak markers (tam giác nhỏ trên đỉnh)
    if (rPeaksMs && rPeaksMs.length > 0) {
      this.overlayCtx.save();
      this.overlayCtx.fillStyle = gridMode === 'monitor' ? '#94A3B8' : '#64748B';
      for (const peakMs of rPeaksMs) {
        if (peakMs < viewStartMs || peakMs > viewEndMs) continue;
        const x = ((peakMs - viewStartMs) / span) * width;
        this.overlayCtx.beginPath();
        this.overlayCtx.moveTo(x - 3.5, 5);
        this.overlayCtx.lineTo(x + 3.5, 5);
        this.overlayCtx.lineTo(x, 11);
        this.overlayCtx.closePath();
        this.overlayCtx.fill();
      }
      this.overlayCtx.restore();
    }

    // 2. Rubber-band zoom (Ctrl + kéo)
    if (this.rubberBand) {
      const x = Math.min(this.rubberBand.x1, this.rubberBand.x2);
      const w = Math.abs(this.rubberBand.x2 - this.rubberBand.x1);
      this.overlayCtx.save();
      this.overlayCtx.fillStyle = 'rgba(59, 130, 246, 0.14)';
      this.overlayCtx.strokeStyle = '#2563EB';
      this.overlayCtx.lineWidth = 1;
      this.overlayCtx.fillRect(x, 0, w, height);
      this.overlayCtx.strokeRect(x + 0.5, 0.5, Math.max(1, w - 1), height - 1);
      this.overlayCtx.restore();
    }

    // 3. Thước đo Caliper (Alt + kéo): đo khoảng thời gian (ms) và quy đổi bpm
    if (this.caliper) {
      const x1 = ((this.caliper.startMs - viewStartMs) / span) * width;
      const x2 = ((this.caliper.endMs - viewStartMs) / span) * width;
      const left = Math.min(x1, x2);
      const right = Math.max(x1, x2);
      const midY = Math.round(height * 0.24);

      this.overlayCtx.save();
      this.overlayCtx.fillStyle = 'rgba(15, 118, 110, 0.12)';
      this.overlayCtx.fillRect(left, 0, Math.max(1, right - left), height);
      this.overlayCtx.strokeStyle = '#0F766E';
      this.overlayCtx.lineWidth = 1.5;
      this.overlayCtx.beginPath();
      this.overlayCtx.moveTo(left, 0);
      this.overlayCtx.lineTo(left, height);
      this.overlayCtx.moveTo(right, 0);
      this.overlayCtx.lineTo(right, height);
      this.overlayCtx.moveTo(left, midY);
      this.overlayCtx.lineTo(right, midY);
      this.overlayCtx.stroke();
      this.overlayCtx.restore();
    }

    // 4. Crosshair dọc khi hover
    if (this.hoverX !== null && this.hoverX >= 0 && this.hoverX <= width) {
      this.overlayCtx.save();
      this.overlayCtx.strokeStyle = gridMode === 'monitor' ? 'rgba(148,163,184,0.55)' : 'rgba(71,85,105,0.45)';
      this.overlayCtx.lineWidth = 1;
      this.overlayCtx.setLineDash([3, 3]);
      this.overlayCtx.beginPath();
      this.overlayCtx.moveTo(Math.round(this.hoverX) + 0.5, 0);
      this.overlayCtx.lineTo(Math.round(this.hoverX) + 0.5, height);
      this.overlayCtx.stroke();
      this.overlayCtx.restore();
    }
  }

  setHover(xPx: number | null, yPx: number | null): HoverReadout | null {
    this.hoverX = xPx;
    this.hoverY = yPx;
    if (this.opts.style === 'static') this.drawOverlay();
    if (xPx === null || yPx === null || !this.signal || this.width <= 0) return null;

    const span = Math.max(1, this.opts.viewEndMs - this.opts.viewStartMs);
    const tMs = this.opts.viewStartMs + (xPx / this.width) * span;
    const sampleIndex = Math.max(
      0,
      Math.min((this.signal.leads[0]?.length ?? 1) - 1, Math.round((tMs / 1000) * this.signal.sampleRateHz)),
    );
    const numRows = Math.max(1, this.opts.leadIndices.length);
    const rowIdx = Math.max(0, Math.min(numRows - 1, Math.floor((yPx / Math.max(1, this.height)) * numRows)));
    const leadIdx = this.opts.leadIndices[rowIdx] ?? 0;
    const mv = this.signal.leads[leadIdx]?.[sampleIndex] ?? 0;
    const leadName = this.opts.leadLabels[rowIdx] ?? this.signal.leadNames[leadIdx] ?? 'II';

    // Khoảng RR nếu hover gần đỉnh R
    let rrMs: number | null = null;
    if (this.opts.rPeaksMs && this.opts.rPeaksMs.length > 1) {
      for (let i = 1; i < this.opts.rPeaksMs.length; i++) {
        if (Math.abs(this.opts.rPeaksMs[i] - tMs) <= 90) {
          rrMs = this.opts.rPeaksMs[i] - this.opts.rPeaksMs[i - 1];
          break;
        }
      }
    }

    let anomaly: EcgAnomalyEvent | null = null;
    const tol = (3 / this.width) * span;
    for (const ev of this.opts.anomalies) {
      if (tMs >= ev.startOffsetMs - tol && tMs <= ev.endOffsetMs + tol) {
        anomaly = ev;
        break;
      }
    }

    return { xPx, yPx, tMs, sampleIndex, mv, leadName, rrMs, anomaly };
  }

  setRubberBand(rb: { x1: number; x2: number } | null): void {
    this.rubberBand = rb;
    if (this.opts.style === 'static') this.drawOverlay();
  }

  setCaliper(caliper: { startMs: number; endMs: number } | null): CaliperMeasurement | null {
    this.caliper = caliper;
    if (this.opts.style === 'static') this.drawOverlay();
    if (!caliper) return null;
    const deltaMs = Math.abs(caliper.endMs - caliper.startMs);
    const bpm = deltaMs >= 180 && deltaMs <= 3000 ? Math.round(60000 / deltaMs) : null;
    return {
      startMs: Math.min(caliper.startMs, caliper.endMs),
      endMs: Math.max(caliper.startMs, caliper.endMs),
      deltaMs: Math.round(deltaMs),
      bpm,
    };
  }

  /** Xuất PNG gộp cả 3 lớp + header thông tin bệnh nhân & thang chuẩn y khoa. */
  exportPng(meta: { patientName: string; encounterCode: string; title: string }): string {
    const headerH = 44;
    const out = document.createElement('canvas');
    out.width = this.gridCanvas.width;
    out.height = this.gridCanvas.height + Math.floor(headerH * this.dpr);
    const ctx = out.getContext('2d');
    if (!ctx) return '';

    ctx.save();
    ctx.scale(this.dpr, this.dpr);
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, this.width, headerH);
    ctx.fillStyle = '#F8FAFC';
    ctx.font = '600 12px "Be Vietnam Pro", system-ui, sans-serif';
    ctx.fillText(`${meta.title} · BN: ${meta.patientName} (${meta.encounterCode})`, 14, 18);
    ctx.fillStyle = '#94A3B8';
    ctx.font = '500 11px "Be Vietnam Pro", system-ui, sans-serif';
    ctx.fillText(
      `Thang chuẩn: 25 mm/s · ${this.opts.gainMmPerMv} mm/mV · Khoảng: ${formatTimeMs(this.opts.viewStartMs)} – ${formatTimeMs(this.opts.viewEndMs)}`,
      14,
      35,
    );
    ctx.restore();

    const offsetY = Math.floor(headerH * this.dpr);
    ctx.drawImage(this.gridCanvas, 0, offsetY);
    ctx.drawImage(this.waveCanvas, 0, offsetY);
    ctx.drawImage(this.overlayCanvas, 0, offsetY);
    return out.toDataURL('image/png');
  }

  private reportPoints(pts: number): void {
    if (pts !== this.lastPointsCount) {
      this.lastPointsCount = pts;
      this.onPointsChange?.(pts);
    }
  }
}

