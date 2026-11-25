import React, { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { ecgService } from '../../../services/lab/ecg.service';
import type { EcgAiModelOption } from '../../../types/ecg';

interface ReanalyzeModalProps {
  open: boolean;
  onClose: () => void;
  defaultThreshold: number;
  onSubmit: (payload: { modelVersionId?: string; threshold: number }) => Promise<void>;
}

export const ReanalyzeModal: React.FC<ReanalyzeModalProps> = ({
  open,
  onClose,
  defaultThreshold,
  onSubmit,
}) => {
  const [models, setModels] = useState<EcgAiModelOption[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelVersionId, setModelVersionId] = useState<string>('');
  const [threshold, setThreshold] = useState(defaultThreshold);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setThreshold(defaultThreshold);
    setError(null);
    let cancelled = false;
    setLoadingModels(true);
    ecgService
      .listModels()
      .then((items) => {
        if (cancelled) return;
        setModels(items);
        const preferred = items.find((m) => m.isDefault) ?? items[0];
        setModelVersionId(preferred?.modelVersionId ?? '');
        if (preferred?.defaultThreshold !== null && preferred?.defaultThreshold !== undefined) {
          setThreshold(preferred.defaultThreshold);
        }
      })
      .catch(() => {
        if (!cancelled) setModels([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingModels(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, defaultThreshold]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        modelVersionId: modelVersionId || undefined,
        threshold,
      });
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
              disabled={loadingModels}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 font-medium disabled:opacity-60"
            >
              {models.length === 0 ? (
                <option value="">
                  {loadingModels ? 'Đang tải danh sách model...' : 'Mặc định hệ thống (Active model)'}
                </option>
              ) : (
                models.map((m) => (
                  <option key={m.modelVersionId} value={m.modelVersionId}>
                    {m.modelName} v{m.version} ({m.status}
                    {m.isDefault ? ' · Mặc định' : ''})
                  </option>
                ))
              )}
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

