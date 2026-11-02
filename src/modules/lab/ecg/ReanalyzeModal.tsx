import React, { useState } from 'react';
import { RefreshCw, X } from 'lucide-react';

interface ReanalyzeModalProps {
  open: boolean;
  onClose: () => void;
  defaultThreshold: number;
  onSubmit: (payload: { modelVersionId?: string; threshold: number }) => Promise<void>;
}

const MODEL_OPTIONS = [
  { id: 'model-v2.3.1', label: 'ECG-AnomalyNet v2.3.1 (Đa đạo trình · Khuyến nghị)' },
  { id: 'model-v2.1.0', label: 'ECG-AnomalyNet v2.1.0 (Ổn định)' },
  { id: 'model-unsupervised-v1', label: 'BeatAutoEncoder v1.4 (Không giám sát)' },
];

export const ReanalyzeModal: React.FC<ReanalyzeModalProps> = ({
  open,
  onClose,
  defaultThreshold,
  onSubmit,
}) => {
  const [modelVersionId, setModelVersionId] = useState(MODEL_OPTIONS[0].id);
  const [threshold, setThreshold] = useState(defaultThreshold);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ modelVersionId, threshold });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không gửi được yêu cầu phân tích lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 backdrop-blur-xs p-4">
      <div className="glass-card !bg-white !rounded-[20px] w-full max-w-md p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Chạy lại phân tích AI ECG</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label htmlFor="ecg-model-select" className="font-medium text-slate-700 block">
              Phiên bản mô hình AI
            </label>
            <select
              id="ecg-model-select"
              value={modelVersionId}
              onChange={(e) => setModelVersionId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 font-medium"
            >
              {MODEL_OPTIONS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="ecg-threshold-range" className="font-medium text-slate-700">
                Ngưỡng phát hiện bất thường (Threshold)
              </label>
              <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 font-semibold tabular-nums border border-teal-200">
                {threshold.toFixed(2)}
              </span>
            </div>
            <input
              id="ecg-threshold-range"
              type="range"
              min={0.1}
              max={0.95}
              step={0.01}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full accent-teal-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>0.10 (Nhạy cao — bắt nhiều nghi ngờ)</span>
              <span>0.95 (Chặt chẽ)</span>
            </div>
          </div>

          {error && (
            <div className="px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-red-700 font-medium">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-2xs cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${submitting ? 'animate-spin' : ''}`} />
              <span>{submitting ? 'Đang xếp hàng...' : 'Bắt đầu phân tích'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

