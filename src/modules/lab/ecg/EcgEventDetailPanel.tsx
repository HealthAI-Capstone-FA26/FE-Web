import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, GitCompare, HelpCircle, RefreshCw, Save, XCircle } from 'lucide-react';
import type { EcgAnalysis, EcgAnomalyEvent, EcgReviewVerdict, EcgSignal } from '../../../types/ecg';
import { EcgCanvas } from './chart/EcgCanvas';
import { formatTimeMs, getAnomalyLabel, SEVERITY_LABEL_VI, VERDICT_LABEL_VI } from './ecgMeta';

interface EcgEventDetailPanelProps {
  event: EcgAnomalyEvent | null;
  analysis: EcgAnalysis | null;
  analyses: EcgAnalysis[];
  comparisonAnalysisId: string | null;
  onChangeComparisonAnalysisId: (id: string | null) => void;
  signal: EcgSignal | null;
  canReview: boolean;
  canReanalyze: boolean;
  onSaveReview: (eventId: string, verdict: Exclude<EcgReviewVerdict, 'pending'>, note: string) => Promise<void>;
  onOpenReanalyze: () => void;
}

export const EcgEventDetailPanel: React.FC<EcgEventDetailPanelProps> = ({
  event,
  analysis,
  analyses,
  comparisonAnalysisId,
  onChangeComparisonAnalysisId,
  signal,
  canReview,
  canReanalyze,
  onSaveReview,
  onOpenReanalyze,
}) => {
  const [activeTab, setActiveTab] = useState<'detail' | 'compare'>('detail');
  const [verdict, setVerdict] = useState<Exclude<EcgReviewVerdict, 'pending'>>('true_positive');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!event) return;
    if (event.reviewVerdict !== 'pending') {
      setVerdict(event.reviewVerdict);
    } else {
      setVerdict('true_positive');
    }
    setNote(event.reviewNote ?? '');
  }, [event]);

  const rPeaksMs = useMemo(() => {
    const raw = event?.details?.rPeaks;
    return Array.isArray(raw) ? raw.map(Number).filter(Number.isFinite) : [];
  }, [event]);

  const saliency = useMemo(() => {
    const raw = event?.details?.saliency;
    if (!Array.isArray(raw)) return undefined;
    return raw
      .map((item) => {
        if (typeof item === 'object' && item !== null) {
          const rec = item as Record<string, unknown>;
          return { tMs: Number(rec.tMs ?? 0), w: Number(rec.w ?? 0) };
        }
        return null;
      })
      .filter((x): x is { tMs: number; w: number } => x !== null);
  }, [event]);

  const durationMs = signal?.durationMs ?? 30000;
  const miniStartMs = event ? Math.max(0, event.startOffsetMs - 2000) : 0;
  const miniEndMs = event ? Math.min(durationMs, event.endOffsetMs + 2000) : 4000;
  const miniLead = event?.affectedLeads[0] ?? 'II';

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    setSaving(true);
    try {
      await onSaveReview(event.id, verdict, note.trim());
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="glass-card !rounded-[20px] p-4 space-y-3.5 flex flex-col">
      {/* Header + Tab chuyển đổi Chi tiết / So sánh phân tích + Nút Chạy lại AI */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex p-0.5 rounded-xl bg-slate-100 border border-slate-200/80 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('detail')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
              activeTab === 'detail' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Chi tiết & Đánh giá
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('compare')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg transition cursor-pointer ${
              activeTab === 'compare' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>So sánh ({analyses.length})</span>
          </button>
        </div>

        {canReanalyze && (
          <button
            type="button"
            onClick={onOpenReanalyze}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Chạy lại AI</span>
          </button>
        )}
      </div>

      {activeTab === 'compare' ? (
        <div className="space-y-3 text-xs">
          <p className="text-slate-600">
            Chọn một lần phân tích trước đó để chồng 2 hàng dải màu bất thường lên cùng trục thời gian trên biểu đồ AI Anomaly (Card 1):
          </p>
          <div className="space-y-2">
            {analyses.map((a, idx) => {
              const isPrimary = a.id === analysis?.id;
              const isCompared = a.id === comparisonAnalysisId;
              return (
                <div
                  key={a.id}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                    isPrimary
                      ? 'bg-blue-50/70 border-blue-200'
                      : isCompared
                        ? 'bg-indigo-50/80 border-indigo-300'
                        : 'bg-white border-slate-200/80'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-slate-900">
                      {a.modelName ?? 'ECG-AnomalyNet'} v{a.modelVersion ?? '1.0'}{' '}
                      {isPrimary && (
                        <span className="ml-1 px-1.5 py-0.5 rounded bg-blue-600 text-white text-[10px]">
                          Hiện hành
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-[11px] text-slate-500 tabular-nums">
                      Ngưỡng: {(a.thresholdUsed ?? 0.5).toFixed(2)} · {a.anomalies.length} sự kiện · Điểm max:{' '}
                      {a.maxAnomalyScore != null ? a.maxAnomalyScore.toFixed(2) : '—'} · Lần #{analyses.length - idx}
                    </div>
                  </div>

                  {!isPrimary && (
                    <button
                      type="button"
                      onClick={() => onChangeComparisonAnalysisId(isCompared ? null : a.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                        isCompared
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {isCompared ? 'Đang so sánh' : 'Chọn đối chiếu'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : !event ? (
        <div className="py-10 text-center text-xs text-slate-400">
          Chọn một dải màu trên biểu đồ hoặc một dòng trong bảng sự kiện để xem phóng to (±2 giây) và đánh giá lâm sàng.
        </div>
      ) : (
        <>
          {/* Mini chart phóng to đoạn bất thường (±2s), đánh dấu R-peak và saliency heatmap dưới sóng */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>
                Đoạn phóng to (±2s) · Đạo trình <strong className="text-slate-800">{miniLead}</strong>
              </span>
              <span className="tabular-nums">
                {formatTimeMs(event.startOffsetMs)} – {formatTimeMs(event.endOffsetMs)}
              </span>
            </div>

            <EcgCanvas
              signal={signal}
              styleMode="static"
              gridMode="paper"
              gainMmPerMv={10}
              leadNames={[miniLead]}
              showCalibrationPulse={false}
              viewStartMs={miniStartMs}
              viewEndMs={miniEndMs}
              durationMs={durationMs}
              anomalies={[event]}
              selectedEventId={event.id}
              rPeaksMs={rPeaksMs}
              saliency={saliency}
              heightPx={132}
              showYAxis={false}
              showXAxis
              ariaLabel={`Đoạn phóng to sự kiện ${getAnomalyLabel(event.anomalyType)}`}
            />
            {saliency && (
              <div className="text-[10px] text-slate-400 flex items-center justify-between">
                <span>▲ Đỉnh R ({rPeaksMs.length} nhịp)</span>
                <span>Dải đỏ dưới đáy: vùng Saliency AI chú ý</span>
              </div>
            )}
          </div>

          {/* Thông tin chi tiết sự kiện */}
          <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50/90 border border-slate-200/80 text-xs">
            <div>
              <span className="text-[11px] text-slate-400 block">Loại bất thường</span>
              <span className="font-semibold text-slate-900">{getAnomalyLabel(event.anomalyType)}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">Điểm / Ngưỡng</span>
              <span className="font-semibold text-slate-900 tabular-nums">
                {event.score.toFixed(2)} / {(analysis?.thresholdUsed ?? 0.5).toFixed(2)} ({SEVERITY_LABEL_VI[event.severity]})
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">Đạo trình · Nhịp tim</span>
              <span className="font-medium text-slate-800 tabular-nums">
                {event.affectedLeads.join(', ') || 'II'} · {event.heartRateBpm != null ? `${event.heartRateBpm} bpm` : '—'}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">Mô hình AI</span>
              <span className="font-medium text-slate-800">
                {analysis?.modelName ?? 'ECG-AnomalyNet'} v{analysis?.modelVersion ?? '1.0'}
              </span>
            </div>
          </div>

          {/* Thông tin đã đánh giá trước đó (nếu có) */}
          {event.reviewedByName && (
            <div className="px-3 py-2 rounded-xl bg-blue-50/70 border border-blue-200/80 text-[11px] text-blue-900">
              <div>
                Đã đánh giá: <strong>{VERDICT_LABEL_VI[event.reviewVerdict]}</strong> bởi{' '}
                <strong>{event.reviewedByName}</strong>
                {event.reviewedAt && (
                  <span className="tabular-nums">
                    {' '}
                    lúc {new Date(event.reviewedAt).toLocaleString('vi-VN')}
                  </span>
                )}
              </div>
              {event.reviewNote && <div className="mt-0.5 text-slate-700 italic">“{event.reviewNote}”</div>}
            </div>
          )}

          {/* Khối Review dành riêng cho DOCTOR (ẩn hẳn với role khác theo mục 9) */}
          {canReview && (
            <form onSubmit={handleSubmitReview} className="space-y-2.5 pt-1 border-t border-slate-200/80">
              <div className="text-xs font-semibold text-slate-800">
                Thẩm định lâm sàng của Bác sĩ
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    {
                      id: 'true_positive',
                      label: 'AI đúng',
                      icon: CheckCircle2,
                      activeCls: 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-1 ring-emerald-500/30',
                    },
                    {
                      id: 'false_positive',
                      label: 'AI báo nhầm',
                      icon: XCircle,
                      activeCls: 'bg-red-50 border-red-500 text-red-800 ring-1 ring-red-500/30',
                    },
                    {
                      id: 'uncertain',
                      label: 'Chưa chắc',
                      icon: HelpCircle,
                      activeCls: 'bg-amber-50 border-amber-500 text-amber-800 ring-1 ring-amber-500/30',
                    },
                  ] as const
                ).map((opt) => {
                  const Icon = opt.icon;
                  const active = verdict === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setVerdict(opt.id)}
                      className={`flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                        active ? opt.activeCls : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                  <label htmlFor="ecg-review-note">Ghi chú nhận định lâm sàng</label>
                  <span className="tabular-nums">{note.length}/2000</span>
                </div>
                <textarea
                  id="ecg-review-note"
                  rows={2}
                  maxLength={2000}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Nhập diễn giải hình thái sóng P-QRS-T, khoảng PR/QT hoặc lý do báo nhầm..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-blue-500 custom-scrollbar"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition cursor-pointer disabled:opacity-60"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Đang lưu đánh giá...' : 'Lưu đánh giá'}</span>
              </button>
            </form>
          )}
        </>
      )}
    </section>
  );
};

