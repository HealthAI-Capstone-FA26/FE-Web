import type { EcgThemeTokens } from '../../ecgMeta';

export type EcgGridMode = 'standard' | 'paper' | 'monitor';

export interface GridLayerOptions {
  width: number;
  height: number;
  mode: EcgGridMode;
  tokens: EcgThemeTokens;
  gainMmPerMv: 5 | 10 | 20;
  windowDurationMs: number;
  numRows: number;
  leadLabels: string[];
  showCalibrationPulse: boolean;
}

/**
 * Vẽ lớp lưới nền (Layer 1 — chỉ vẽ lại khi resize/zoom/đổi chế độ giấy ECG).
 * Chuẩn y khoa: 25 mm/s (1 ô nhỏ 1mm = 40ms, 1 ô lớn 5mm = 200ms) và 10 mm/mV (hoặc 5/20 mm/mV).
 */
export function drawGridLayer(ctx: CanvasRenderingContext2D, opts: GridLayerOptions): void {
  const { width, height, mode, tokens, gainMmPerMv, windowDurationMs, numRows, leadLabels, showCalibrationPulse } = opts;
  ctx.clearRect(0, 0, width, height);

  if (mode === 'paper') {
    ctx.fillStyle = tokens.paperBg;
    ctx.fillRect(0, 0, width, height);
  } else if (mode === 'monitor') {
    ctx.fillStyle = '#0B1220';
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
  }

  const rowHeight = height / Math.max(1, numRows);

  if (mode === 'paper') {
    // Tính kích thước 1mm theo trục ngang từ tốc độ giấy 25mm/s (40ms / 1mm)
    // Kẹp khoảng hợp lý để khi zoom sâu/rộng vẫn nhìn rõ ô giấy.
    const rawMmPx = (width / Math.max(200, windowDurationMs)) * 40;
    const mmPx = Math.max(3, Math.min(18, rawMmPx));
    const majorPx = mmPx * 5;

    ctx.strokeStyle = tokens.paperMinor;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let x = 0; x <= width; x += mmPx) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = 0; y <= height; y += mmPx) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    ctx.strokeStyle = tokens.paperMajor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= width; x += majorPx) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = 0; y <= height; y += majorPx) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();
  } else {
    const gridColor = mode === 'monitor' ? '#13233A' : tokens.grid;
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    const hLines = numRows === 1 ? 5 : numRows * 2;
    ctx.beginPath();
    for (let i = 1; i < hLines; i++) {
      const y = Math.round((height / hLines) * i) + 0.5;
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    const vLines = 10;
    for (let i = 1; i < vLines; i++) {
      const x = Math.round((width / vLines) * i) + 0.5;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    ctx.stroke();
  }

  // Đường baseline mảnh + xung chuẩn 1mV + nhãn đạo trình cho mỗi dải
  const mvScalePx = (rowHeight * 0.34) * (gainMmPerMv / 10);
  for (let r = 0; r < numRows; r++) {
    const centerY = r * rowHeight + rowHeight * 0.52;
    if (numRows > 1 && r > 0) {
      ctx.strokeStyle = mode === 'monitor' ? '#1E293B' : '#CBD5E1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, r * rowHeight);
      ctx.lineTo(width, r * rowHeight);
      ctx.stroke();
    }

    if (showCalibrationPulse) {
      const pulseColor =
        mode === 'monitor' ? tokens.waveMonitor : mode === 'paper' ? tokens.wavePaper : tokens.wave;
      ctx.strokeStyle = pulseColor;
      ctx.lineWidth = 1.25;
      const x0 = 10;
      const pulseW = 18;
      ctx.beginPath();
      ctx.moveTo(x0, centerY);
      ctx.lineTo(x0 + 4, centerY);
      ctx.lineTo(x0 + 4, centerY - mvScalePx);
      ctx.lineTo(x0 + 4 + pulseW, centerY - mvScalePx);
      ctx.lineTo(x0 + 4 + pulseW, centerY);
      ctx.lineTo(x0 + 8 + pulseW, centerY);
      ctx.stroke();
    }

    const label = leadLabels[r];
    if (label) {
      ctx.font = '600 11px "Be Vietnam Pro", system-ui, sans-serif';
      ctx.fillStyle = mode === 'monitor' ? '#94A3B8' : '#334155';
      ctx.fillText(label, showCalibrationPulse ? 42 : 10, r * rowHeight + 16);
    }
  }
}

