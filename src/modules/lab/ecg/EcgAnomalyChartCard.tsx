import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Download, Link2, Link2Off, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import type { EcgAnalysis, EcgAnomalyEvent, EcgSignal } from '../../../types/ecg';
import type { SignalState } from '../../../hooks/useEcgRecording';
import { EcgCanvas, type EcgCanvasHandle } from './chart/EcgCanvas';
import { AnomalyScoreSubChart } from './chart/AnomalyScoreSubChart';
import { Minimap } from './chart/Minimap';
import { formatTimeMs, getAnomalyLabel, SEVERITY_LABEL_VI } from './ecgMeta';

interface EcgAnomalyChartCardProps {
  signalState: SignalState;
  analysis: EcgAnalysis | null;
  comparisonAnalysis?: EcgAnalysis | null;
  leadName: string;
  durationMs: number;
  viewStartMs: number;
  viewEndMs: number;
  onViewChange: (startMs: number, endMs: number) => void;
  onResetZoom: () => void;
  linkedZoom: boolean;
  onToggleLinkedZoom: () => void;
  selectedEventId: string | null;
  onSelectEvent: (event: EcgAnomalyEvent) => void;
  canReanalyze: boolean;
  onOpenReanalyze: () => void;
  patientName: string;
  encounterCode: string;
  onRetrySignal: () => void;
  evaluatedSampleLimit?: number | null;
  isStreamingEval?: boolean;
}

export const EcgAnomalyChartCard: React.FC<EcgAnomalyChartCardProps> = ({
  signalState,
  analysis,
  comparisonAnalysis,
  leadName,
  durationMs,
  viewStartMs,
  viewEndMs,
  onViewChange,
  onResetZoom,
  linkedZoom,
  onToggleLinkedZoom,
  selectedEventId,
  onSelectEvent,
  canReanalyze,
  onOpenReanalyze,
  patientName,
  encounterCode,
  onRetrySignal,
  evaluatedSampleLimit = null,
  isStreamingEval = false,
}) => {
  const canvasRef = useRef<EcgCanvasHandle | null>(null);
  const [pts, setPts] = useState(0);
  const [colorBySeverity, setColorBySeverity] = useState(false);
  const [showScoreSubChart, setShowScoreSubChart] = useState(true);
  const [xAxisMode, setXAxisMode] = useState<'time' | 'sample'>('sample');
  const [revealProgress, setRevealProgress] = useState(1);

  const anomalies = analysis?.anomalies ?? [];
  const status = analysis?.status;

  // Hiệu ứng stagger fade-in dải màu khi trạng thái completed mới xuất hiện (mục 5)
  useEffect(() => {
    if (status !== 'completed') return;
    let raf = 0;
    const t0 = performance.now();
    const totalMs = Math.min(900, 350 + anomalies.length * 25);
    setRevealProgress(0);
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / totalMs);
      setRevealProgress(p);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [analysis?.id, status, anomalies.length]);

  const handleExportPng = () => {
    const dataUrl = canvasRef.current?.exportPng({
      patientName,
      encounterCode,
      title: `Anomaly Detection (API 3) · Lead ${leadName}`,
    });
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `ecg-anomaly-${encounterCode}-${leadName}.png`;
    a.click();
  };

  const signal: EcgSignal | null = signalState.kind === 'ready' ? signalState.signal : null;
  const totalSamples = signal?.leads[0]?.length ?? 0;
  const displayPts =
    typeof evaluatedSampleLimit === 'number' && evaluatedSampleLimit >= 0
      ? Math.min(totalSamples, evaluatedSampleLimit)
      : totalSamples > 0 && viewStartMs === 0 && viewEndMs >= durationMs - 10
        ? totalSamples
        : pts;

  return (
    <section className="glass-card !rounded-[20px] p-4 space-y-3">
      {/* Thanh tiến trình indeterminate khi analysis đang running (mục 5) */}
      {(status === 'running' || status === 'queued' || isStreamingEval) && (
        <div className="h-1 -mx-4 -mt-4 mb-2 bg-emerald-100 overflow-hidden rounded-t-[20px]">
          <div className="h-full w-1/3 bg-emerald-500 animate-pulse rounded-full" />
        </div>
      )}

      {/* Header (mục 3.4: Anomaly Detection (API 3) · Evaluating with anomaly-transformer...) */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2.5">
          <h3 className="text-[14px] font-semibold text-slate-900">
            Anomaly Detection (API 3) · Lead {leadName}
          </h3>

          {status === 'queued' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Đang chờ phân tích</span>
            </span>
          )}

          {(status === 'running' || isStreamingEval) && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>
                Evaluating with {analysis?.modelName ?? 'anomaly-transformer'}...
              </span>
            </span>
          )}

          {status === 'completed' && !isStreamingEval && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="tabular-nums">
                Evaluating with {analysis?.modelName ?? 'anomaly-transformer'} · Hoàn tất ({analysis?.inferenceLatencyMs ?? 142}ms)
              </span>
            </span>
          )}
        </div>

        {/* Cụm nút bên phải: Liên kết trục · Pts · Reset Zoom · Xuất PNG */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleLinkedZoom}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition cursor-pointer ${
              linkedZoom
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-white text-slate-500 border-slate-200 hover:text-slate-800'
            }`}
            title="Liên kết thu/phóng trục thời gian giữa 2 biểu đồ"
          >
            {linkedZoom ? <Link2 className="w-3.5 h-3.5" /> : <Link2Off className="w-3.5 h-3.5" />}
            <span>Đồng bộ trục</span>
          </button>

          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200/80 tabular-nums">
            Pts: {displayPts}
          </span>

          <button
            type="button"
            onClick={onResetZoom}
            className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 transition cursor-pointer"
          >
            Reset Zoom
          </button>

          <button
            type="button"
            onClick={handleExportPng}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 transition cursor-pointer"
            title="Xuất ảnh PNG đoạn đang xem"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Xuất PNG</span>
          </button>
        </div>
      </div>

      {/* Banners trạng thái đặc biệt (mục 5) */}
      {status === 'failed' && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>
              Phân tích AI lỗi ({analysis?.errorCode ?? 'ERR_INFERENCE'}). Quy trình khám vẫn tiếp tục.
            </span>
          </div>
          {canReanalyze && (
            <button
              type="button"
              onClick={onOpenReanalyze}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Chạy lại</span>
            </button>
          )}
        </div>
      )}

      {status === 'skipped' && (
        <div className="px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600">
          Chưa cấu hình dịch vụ AI — chỉ hiển thị tín hiệu
        </div>
      )}

      {analysis?.overallResult === 'poor_signal' && (
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Chất lượng tín hiệu thấp — Kiểm tra điện cực / ghi lại để kết quả chính xác hơn.</span>
        </div>
      )}

      {/* Legend (Detected 1-1 & Normal 0-0) */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
        {!colorBySeverity ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#86EFAC] border border-emerald-600/40" />
              <span>Detected (1-1)</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-white border border-dashed border-slate-400" />
              <span>Normal (0-0): no color</span>
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#FEF3C7] border border-yellow-500/40" />
              <span>Thấp</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#FDE68A] border border-amber-500/40" />
              <span>Trung bình</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#FDBA74] border border-orange-500/40" />
              <span>Cao</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#FCA5A5] border border-red-500/40" />
              <span>Nguy cấp</span>
            </span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showScoreSubChart}
              onChange={(e) => setShowScoreSubChart(e.target.checked)}
              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
            />
            <span>Đồ thị Anomaly Score & Ngưỡng</span>
          </label>

          <label className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={colorBySeverity}
              onChange={(e) => setColorBySeverity(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Tô theo mức độ</span>
          </label>
        </div>
      </div>

      {comparisonAnalysis && (
        <div className="text-[11px] text-indigo-700 bg-indigo-50/80 border border-indigo-200 px-3 py-1.5 rounded-lg flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span>
            Đang so sánh 2 lần phân tích: nửa trên là <strong>{analysis?.modelName} v{analysis?.modelVersion}</strong>, nửa dưới là{' '}
            <strong>{comparisonAnalysis.modelName} v{comparisonAnalysis.modelVersion}</strong>.
          </span>
        </div>
      )}

      {/* Vùng hiển thị biểu đồ theo trạng thái tải tín hiệu */}
      {signalState.kind === 'loading' && (
        <div className="h-[200px] rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col items-center justify-center gap-2 overflow-hidden relative">
          <svg className="w-full h-16 stroke-slate-300 animate-pulse" viewBox="0 0 600 60" fill="none">
            <path
              d="M0 30 L80 30 L95 22 L105 34 L112 8 L120 48 L128 30 L155 20 L175 30 L260 30 L275 22 L285 34 L292 8 L300 48 L308 30 L335 20 L355 30 L450 30 L465 22 L475 34 L482 8 L490 48 L498 30 L525 20 L600 30"
              strokeWidth="2"
            />
          </svg>
          <span className="text-xs text-slate-400">Đang tải và giải mã tín hiệu ECG...</span>
        </div>
      )}

      {signalState.kind === 'error' && (
        <div className="h-[200px] rounded-xl border border-red-200 bg-red-50/60 flex flex-col items-center justify-center gap-2 p-4 text-center">
          <p className="text-xs text-red-700 font-medium">{signalState.message}</p>
          <button
            type="button"
            onClick={onRetrySignal}
            className="px-3 py-1.5 rounded-lg bg-white border border-red-300 text-xs font-semibold text-red-700 hover:bg-red-50 cursor-pointer"
          >
            Thử tải lại tín hiệu
          </button>
        </div>
      )}

      {signalState.kind === 'unsupported' && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 space-y-3">
          <div className="text-xs text-amber-900 font-medium">
            Định dạng <code className="font-mono uppercase px-1.5 py-0.5 rounded bg-amber-100">{signalState.format}</code> cần chuyển đổi phía server — vẫn hiển thị dòng thời gian kết quả AI bên dưới:
          </div>
          <div className="relative h-14 rounded-lg bg-white border border-amber-200 overflow-hidden">
            {anomalies.map((ev) => {
              const left = (ev.startOffsetMs / Math.max(1, durationMs)) * 100;
              const width = Math.max(1, ((ev.endOffsetMs - ev.startOffsetMs) / Math.max(1, durationMs)) * 100);
              return (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => onSelectEvent(ev)}
                  style={{ left: `${left}%`, width: `${width}%` }}
                  className="absolute top-1.5 bottom-1.5 rounded bg-red-400/75 hover:bg-red-500 border border-red-600 cursor-pointer"
                  title={`${getAnomalyLabel(ev.anomalyType)} (${SEVERITY_LABEL_VI[ev.severity]}) · ${formatTimeMs(ev.startOffsetMs)}`}
                />
              );
            })}
          </div>
        </div>
      )}

      {signalState.kind === 'ready' && (
        <>
          <EcgCanvas
            ref={canvasRef}
            signal={signal}
            styleMode="static"
            gridMode="standard"
            gainMmPerMv={10}
            leadNames={[leadName]}
            showCalibrationPulse={false}
            showZeroBaseline
            maxSampleLimit={evaluatedSampleLimit}
            viewStartMs={viewStartMs}
            viewEndMs={viewEndMs}
            durationMs={durationMs}
            onViewChange={onViewChange}
            anomalies={anomalies}
            secondaryAnomalies={comparisonAnalysis?.anomalies}
            selectedEventId={selectedEventId}
            onSelectEvent={onSelectEvent}
            colorBySeverity={colorBySeverity}
            heightPx={200}
            showYAxis
            showXAxis
            xAxisMode={xAxisMode}
            onToggleXAxisMode={() => setXAxisMode((m) => (m === 'time' ? 'sample' : 'time'))}
            onPointsChange={setPts}
            revealProgress={revealProgress}
            ariaLabel={`Biểu đồ phát hiện bất thường AI đạo trình ${leadName}, ${Math.round(durationMs / 1000)} giây, ${anomalies.length} sự kiện bất thường`}
          />

          {/* Đồ thị con (Sub-chart) tách riêng hiển thị Anomaly Score s(t) ∈ [0, 1] và Ngưỡng τ */}
          {showScoreSubChart && analysis?.scoreSeries && analysis.scoreSeries.length > 0 && (
            <AnomalyScoreSubChart
              scoreSeries={analysis.scoreSeries}
              threshold={analysis.thresholdUsed ?? 0.5}
              anomalies={anomalies}
              selectedEventId={selectedEventId}
              onSelectEvent={onSelectEvent}
              colorBySeverity={colorBySeverity}
              viewStartMs={viewStartMs}
              viewEndMs={viewEndMs}
              heightPx={84}
            />
          )}

          <div className="pl-10">
            <Minimap
              signal={signal}
              leadName={leadName}
              durationMs={durationMs}
              viewStartMs={viewStartMs}
              viewEndMs={viewEndMs}
              anomalies={anomalies}
              colorBySeverity={colorBySeverity}
              onViewChange={onViewChange}
            />
          </div>
        </>
      )}
    </section>
  );
};
