import type { EcgAnomalyEvent, EcgAnomalyType, EcgOverallResult, EcgReviewVerdict, EcgSeverity } from '../../../types/ecg';

export const ANOMALY_LABEL_VI: Record<EcgAnomalyType | 'null', string> = {
  afib: 'Rung nhĩ (AFib)',
  pvc: 'Ngoại tâm thu thất (PVC)',
  pac: 'Ngoại tâm thu nhĩ (PAC)',
  vt: 'Nhịp nhanh thất (VT)',
  bradycardia: 'Nhịp chậm',
  tachycardia: 'Nhịp nhanh',
  st_elevation: 'ST chênh lên',
  st_depression: 'ST chênh xuống',
  av_block: 'Block nhĩ thất',
  unclassified: 'Bất thường chưa phân loại',
  null: 'Bất thường chưa phân loại',
};

export function getAnomalyLabel(type: EcgAnomalyType | null): string {
  return ANOMALY_LABEL_VI[type ?? 'null'] ?? 'Bất thường chưa phân loại';
}

export const SEVERITY_LABEL_VI: Record<EcgSeverity, string> = {
  low: 'Thấp',
  medium: 'Trung bình',
  high: 'Cao',
  critical: 'Nguy cấp',
};

export const VERDICT_LABEL_VI: Record<EcgReviewVerdict, string> = {
  pending: 'Chờ đánh giá',
  true_positive: 'AI đúng',
  false_positive: 'Báo nhầm',
  uncertain: 'Chưa chắc',
};

export const OVERALL_RESULT_META: Record<
  EcgOverallResult,
  { label: string; bg: string; text: string; border: string }
> = {
  normal: { label: 'Bình thường', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  abnormal: { label: 'Bất thường', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  inconclusive: { label: 'Chưa kết luận', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  poor_signal: { label: 'Tín hiệu kém', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300' },
};

export function formatTimeMs(ms: number, showMillis = true): string {
  const safe = Math.max(0, ms);
  const totalSec = Math.floor(safe / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  const millis = Math.floor(safe % 1000);
  const base = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return showMillis ? `${base}.${String(millis).padStart(3, '0')}` : base;
}

export interface EcgThemeTokens {
  wave: string;
  wavePaper: string;
  waveMonitor: string;
  score: string;
  grid: string;
  paperBg: string;
  paperMinor: string;
  paperMajor: string;
  tp: string;
  fp: string;
  uncertain: string;
  sevLow: string;
  sevMedium: string;
  sevHigh: string;
  sevCritical: string;
  brush: string;
  brushBg: string;
}

export function readEcgThemeTokens(): EcgThemeTokens {
  if (typeof window === 'undefined') {
    return {
      wave: '#B91C1C',
      wavePaper: '#111827',
      waveMonitor: '#22C55E',
      score: '#0F766E',
      grid: '#E5E7EB',
      paperBg: '#FFF5F5',
      paperMinor: '#FBD5D5',
      paperMajor: '#F5A3A3',
      tp: '#86EFAC',
      fp: '#FCA5A5',
      uncertain: '#FCD34D',
      sevLow: '#FEF3C7',
      sevMedium: '#FDE68A',
      sevHigh: '#FDBA74',
      sevCritical: '#F87171',
      brush: '#93C5FD',
      brushBg: '#EEF2FF',
    };
  }
  const style = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
  return {
    wave: read('--color-ecg-wave', '#B91C1C'),
    wavePaper: read('--color-ecg-wave-paper', '#111827'),
    waveMonitor: read('--color-ecg-wave-monitor', '#22C55E'),
    score: read('--color-ecg-score', '#0F766E'),
    grid: read('--color-ecg-grid', '#E5E7EB'),
    paperBg: read('--color-ecg-paper-bg', '#FFF5F5'),
    paperMinor: read('--color-ecg-paper-minor', '#FBD5D5'),
    paperMajor: read('--color-ecg-paper-major', '#F5A3A3'),
    tp: read('--color-ecg-tp', '#86EFAC'),
    fp: read('--color-ecg-fp', '#FCA5A5'),
    uncertain: read('--color-ecg-uncertain', '#FCD34D'),
    sevLow: read('--color-sev-low', '#FEF3C7'),
    sevMedium: read('--color-sev-medium', '#FDE68A'),
    sevHigh: read('--color-sev-high', '#FDBA74'),
    sevCritical: read('--color-sev-critical', '#F87171'),
    brush: read('--color-brush', '#93C5FD'),
    brushBg: read('--color-brush-bg', '#EEF2FF'),
  };
}

export function getBandColor(
  event: EcgAnomalyEvent,
  colorBySeverity: boolean,
  tokens: EcgThemeTokens,
): { fill: string; stroke: string; pattern: 'solid' | 'stripe' | 'dots' } {
  if (colorBySeverity || event.reviewVerdict === 'pending') {
    switch (event.severity) {
      case 'critical':
        return { fill: tokens.sevCritical, stroke: '#DC2626', pattern: 'solid' };
      case 'high':
        return { fill: tokens.sevHigh, stroke: '#EA580C', pattern: 'solid' };
      case 'medium':
        return { fill: tokens.sevMedium, stroke: '#D97706', pattern: 'solid' };
      default:
        return { fill: tokens.sevLow, stroke: '#CA8A04', pattern: 'solid' };
    }
  }
  switch (event.reviewVerdict) {
    case 'true_positive':
      return { fill: tokens.tp, stroke: '#16A34A', pattern: 'solid' };
    case 'false_positive':
      return { fill: tokens.fp, stroke: '#DC2626', pattern: 'stripe' };
    default:
      return { fill: tokens.uncertain, stroke: '#D97706', pattern: 'dots' };
  }
}

