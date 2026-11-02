import React, { useEffect, useState } from 'react';
import type { EcgAnalysis, EcgRecording } from '../../../types/ecg';
import { OVERALL_RESULT_META } from './ecgMeta';

interface EcgKpiCardsProps {
  recording: EcgRecording | null;
  analysis: EcgAnalysis | null;
  liveHeartRateBpm: number | null;
}

/** Count-up nhẹ 400ms khi số liệu thay đổi (mục 3.3). */
function useAnimatedNumber(target: number | null, durationMs = 400): number | null {
  const [val, setVal] = useState<number | null>(target);
  useEffect(() => {
    if (target === null || !Number.isFinite(target)) {
      setVal(null);
      return;
    }
    const startVal = val ?? target;
    if (Math.abs(target - startVal) < 0.001) {
      setVal(target);
      return;
    }
    const t0 = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(startVal + (target - startVal) * eased);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, durationMs]);
  return val;
}

export const EcgKpiCards: React.FC<EcgKpiCardsProps> = ({ recording, analysis, liveHeartRateBpm }) => {
  const hrMean = liveHeartRateBpm ?? analysis?.summaryMetrics?.hrMean ?? null;
  const hrMin = analysis?.summaryMetrics?.hrMin;
  const hrMax = analysis?.summaryMetrics?.hrMax;
  const animatedHr = useAnimatedNumber(hrMean);

  const maxScore = analysis?.maxAnomalyScore ?? null;
  const animatedScore = useAnimatedNumber(maxScore);
  const threshold = analysis?.thresholdUsed ?? 0.5;

  const qualityPct = analysis?.signalQuality != null ? analysis.signalQuality * 100 : null;
  const animatedQuality = useAnimatedNumber(qualityPct);

  const anomalies = React.useMemo(() => analysis?.anomalies ?? [], [analysis?.anomalies]);
  const animatedEventsCount = useAnimatedNumber(anomalies.length);
  const sevCounts = React.useMemo(() => {
    const c = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const a of anomalies) c[a.severity]++;
    return c;
  }, [anomalies]);

  const durationMs = recording?.durationMs ?? 30000;
  const abnormalMs =
    analysis?.summaryMetrics?.abnormalDurationMs ??
    anomalies
      .filter((a) => a.reviewVerdict !== 'false_positive')
      .reduce((sum, a) => sum + Math.max(0, a.endOffsetMs - a.startOffsetMs), 0);
  const abnormalPct = durationMs > 0 && analysis ? (abnormalMs / durationMs) * 100 : null;
  const animatedAbnormalPct = useAnimatedNumber(abnormalPct);
  const isHighAbnormalPct = (abnormalPct ?? 0) > 10;

  const overallMeta = analysis?.overallResult ? OVERALL_RESULT_META[analysis.overallResult] : null;
  const activeBars = qualityPct == null ? 0 : Math.max(1, Math.min(4, Math.ceil(qualityPct / 25)));

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-6 gap-3">
      {/* 1. Nhịp tim */}
      <div className="glass-card !rounded-[14px] p-4 flex flex-col justify-between">
        <span className="text-[11px] font-medium text-slate-500">Nhịp tim trung bình</span>
        <div className="mt-1 flex items-baseline gap-1.5 tabular-nums">
          <span className="text-xl font-semibold text-slate-900">
            {animatedHr != null ? Math.round(animatedHr) : '—'}
          </span>
          <span className="text-xs font-medium text-slate-500">bpm</span>
        </div>
        <div className="mt-1 text-[11px] text-slate-400 tabular-nums">
          {hrMin != null && hrMax != null ? `Khoảng: ${hrMin}–${hrMax} bpm` : 'Đo từ đỉnh R-R'}
        </div>
      </div>

      {/* 2. Kết quả AI */}
      <div className="glass-card !rounded-[14px] p-4 flex flex-col justify-between">
        <span className="text-[11px] font-medium text-slate-500">Kết quả phân tích AI</span>
        <div className="mt-1.5">
          {overallMeta ? (
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${overallMeta.bg} ${overallMeta.text} ${overallMeta.border}`}
            >
              {overallMeta.label}
            </span>
          ) : (
            <span className="text-sm font-medium text-slate-400">
              {analysis?.status === 'running' || analysis?.status === 'queued' ? 'Đang xử lý...' : 'Chưa có'}
            </span>
          )}
        </div>
        <div className="mt-1 text-[11px] text-slate-400 truncate">
          {analysis?.modelName ? `${analysis.modelName} v${analysis.modelVersion ?? '1.0'}` : 'Mô hình AI ECG'}
        </div>
      </div>

      {/* 3. Điểm bất thường max */}
      <div className="glass-card !rounded-[14px] p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-500">Điểm bất thường max</span>
          <span className="text-[10px] text-slate-400 tabular-nums">Ngưỡng {threshold.toFixed(2)}</span>
        </div>
        <div className="mt-1 text-xl font-semibold text-slate-900 tabular-nums">
          {animatedScore != null ? animatedScore.toFixed(2) : '—'}
        </div>
        <div className="mt-1.5 relative h-1.5 rounded-full bg-slate-200/80 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              (maxScore ?? 0) >= threshold ? 'bg-teal-600' : 'bg-slate-400'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, (maxScore ?? 0) * 100))}%` }}
          />
          <span
            className="absolute top-0 bottom-0 w-0.5 bg-red-600"
            style={{ left: `${Math.min(100, Math.max(0, threshold * 100))}%` }}
            title={`Ngưỡng: ${threshold}`}
          />
        </div>
      </div>

      {/* 4. Chất lượng tín hiệu */}
      <div className="glass-card !rounded-[14px] p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-500">Chất lượng tín hiệu</span>
          {/* Icon 4 vạch tín hiệu */}
          <span className="inline-flex items-end gap-0.5 h-3.5" aria-hidden="true">
            {[1, 2, 3, 4].map((bar) => (
              <span
                key={bar}
                className={`w-1 rounded-xs ${
                  bar <= activeBars ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
                style={{ height: `${bar * 25}%` }}
              />
            ))}
          </span>
        </div>
        <div className="mt-1 text-xl font-semibold text-slate-900 tabular-nums">
          {animatedQuality != null ? `${animatedQuality.toFixed(1)}%` : '—'}
        </div>
        <div className="mt-1 text-[11px] text-slate-400 tabular-nums">
          {recording ? `${recording.sampleRateHz} Hz · ${recording.numLeads} đạo trình` : '—'}
        </div>
      </div>

      {/* 5. Số sự kiện */}
      <div className="glass-card !rounded-[14px] p-4 flex flex-col justify-between">
        <span className="text-[11px] font-medium text-slate-500">Số sự kiện phát hiện</span>
        <div className="mt-1 text-xl font-semibold text-slate-900 tabular-nums">
          {analysis ? Math.round(animatedEventsCount ?? 0) : '—'}
        </div>
        <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-600 tabular-nums">
          <span className="inline-flex items-center gap-1" title="Nguy cấp">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            {sevCounts.critical}
          </span>
          <span className="inline-flex items-center gap-1" title="Cao">
            <span className="w-2 h-2 rounded-full bg-orange-400" />
            {sevCounts.high}
          </span>
          <span className="inline-flex items-center gap-1" title="Trung bình">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            {sevCounts.medium}
          </span>
          <span className="inline-flex items-center gap-1" title="Thấp">
            <span className="w-2 h-2 rounded-full bg-yellow-300" />
            {sevCounts.low}
          </span>
        </div>
      </div>

      {/* 6. % thời gian bất thường (tô đỏ #DC2626 nếu > 10% giống ảnh mẫu) */}
      <div className="glass-card !rounded-[14px] p-4 flex flex-col justify-between">
        <span className="text-[11px] font-medium text-slate-500">% thời gian bất thường</span>
        <div
          className={`mt-1 text-xl font-semibold tabular-nums ${
            isHighAbnormalPct ? 'text-[#DC2626]' : 'text-slate-900'
          }`}
        >
          {animatedAbnormalPct != null ? `${animatedAbnormalPct.toFixed(2)}%` : '—'}
        </div>
        <div className="mt-1 text-[11px] text-slate-400 tabular-nums">
          {(abnormalMs / 1000).toFixed(1)}s / {(durationMs / 1000).toFixed(0)}s
        </div>
      </div>
    </div>
  );
};

