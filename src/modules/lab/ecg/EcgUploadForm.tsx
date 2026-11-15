import React, { useState } from 'react';
import { FileCheck2, Sparkles, Upload, X } from 'lucide-react';
import type {
  EcgRecording,
  EcgRecordingType,
  EcgSignal,
  EcgSignalFormat,
  EcgUploadPayload,
} from '../../../types/ecg';
import { STANDARD_12_LEADS } from '../../../types/ecg';
import { ecgErrorMessage, ecgService } from '../../../services/lab/ecg.service';
import { getMockSignal } from '../../../services/lab/ecg.mock';
import { parseSignalInWorker } from './chart/data/parserClient';
import { EcgCanvas } from './chart/EcgCanvas';

interface EcgUploadFormProps {
  open: boolean;
  onClose: () => void;
  taskId: string;
  onUploaded: (recording: EcgRecording) => void;
}

const MAX_BYTES = 50 * 1024 * 1024; // 50MB

const RECORDING_TYPES: { id: EcgRecordingType; label: string; desc: string }[] = [
  { id: 'resting_12_lead', label: 'ECG 12 đạo trình lúc nghỉ', desc: 'Chuẩn 10–30 giây tại giường khám' },
  { id: 'rhythm_strip', label: 'Dải nhịp (Rhythm Strip)', desc: 'Theo dõi tập trung 1–3 đạo trình (thường Lead II)' },
  { id: 'continuous_monitoring', label: 'Monitoring liên tục', desc: 'Theo dõi bệnh nhân cấp cứu / hồi sức' },
  { id: 'holter', label: 'Holter ECG dài hạn', desc: 'Ghi lưu động 24–48 giờ' },
];

function inferFormat(fileName: string): EcgSignalFormat {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.csv')) return 'csv';
  if (lower.endsWith('.json')) return 'json';
  if (lower.endsWith('.edf')) return 'edf';
  if (lower.endsWith('.zip') || lower.endsWith('.hea') || lower.endsWith('.dat')) return 'wfdb';
  if (lower.endsWith('.dcm')) return 'dicom_ecg';
  if (lower.endsWith('.scp')) return 'scp_ecg';
  return 'csv';
}

export const EcgUploadForm: React.FC<EcgUploadFormProps> = ({ open, onClose, taskId, onUploaded }) => {
  const [file, setFile] = useState<File | null>(null);
  const [recordingType, setRecordingType] = useState<EcgRecordingType>('resting_12_lead');
  const [signalFormat, setSignalFormat] = useState<EcgSignalFormat>('json');
  const [sampleRateHz, setSampleRateHz] = useState<number>(500);
  const [numLeads, setNumLeads] = useState<number>(12);
  const [leadNames, setLeadNames] = useState<string>(STANDARD_12_LEADS.join(','));
  const [deviceModel, setDeviceModel] = useState('Nihon Kohden ECG-2350');
  const [deviceSerial, setDeviceSerial] = useState('NK-23-08814');
  const [startedAt, setStartedAt] = useState('');
  const [endedAt, setEndedAt] = useState('');
  const [autoAnalyze, setAutoAnalyze] = useState(true);

  const [previewSignal, setPreviewSignal] = useState<EcgSignal | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSelectFile = async (selected: File | null) => {
    setError(null);
    setPreviewError(null);
    setPreviewSignal(null);
    if (!selected) {
      setFile(null);
      return;
    }
    if (selected.size > MAX_BYTES) {
      setError('Tệp vượt quá giới hạn 50MB. Chọn tệp nhỏ hơn.');
      return;
    }
    setFile(selected);
    const fmt = inferFormat(selected.name);
    setSignalFormat(fmt);

    if (fmt === 'csv' || fmt === 'json') {
      try {
        const text = await selected.text();
        const sig = await parseSignalInWorker({
          format: fmt,
          text,
          sampleRateHz,
          leadNames: leadNames.split(',').map((s) => s.trim()).filter(Boolean),
          overviewPoints: 800,
        });
        setPreviewSignal(sig);
      } catch (err) {
        setPreviewError(err instanceof Error ? err.message : 'Không đọc trước được tệp tín hiệu.');
      }
    }
  };

  /** Tạo tệp JSON mẫu từ bộ sinh sóng tổng hợp để KTV test nhanh ngay trên UI. */
  const handleGenerateSampleFile = async () => {
    const { signal } = getMockSignal();
    const tenSecSamples = signal.sampleRateHz * 10;
    const leadsObj: Record<string, number[]> = {};
    signal.leadNames.forEach((name, idx) => {
      leadsObj[name] = Array.from(signal.leads[idx].slice(0, tenSecSamples)).map((v) => Number(v.toFixed(4)));
    });
    const jsonText = JSON.stringify({ sampleRateHz: signal.sampleRateHz, leads: leadsObj });
    const sampleFile = new File([jsonText], `ecg_12lead_${Date.now().toString().slice(-4)}.json`, {
      type: 'application/json',
    });
    await handleSelectFile(sampleFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Chọn tệp bản ghi ECG trước khi tải lên.');
      return;
    }
    setError(null);
    setProgress(0);
    const payload: EcgUploadPayload = {
      file,
      recordingType,
      signalFormat,
      sampleRateHz,
      numLeads,
      leadNames,
      durationMs: previewSignal ? Math.round(previewSignal.durationMs) : undefined,
      startedAt: startedAt ? new Date(startedAt).toISOString() : undefined,
      endedAt: endedAt ? new Date(endedAt).toISOString() : undefined,
      deviceModel: deviceModel || undefined,
      deviceSerial: deviceSerial || undefined,
      autoAnalyze,
    };

    try {
      const created = await ecgService.uploadRecording(taskId, payload, setProgress);
      onUploaded(created);
      onClose();
    } catch (err) {
      setError(ecgErrorMessage(err, 'upload'));
    } finally {
      setProgress(null);
    }
  };

  const previewLead = previewSignal?.leadNames.includes('II')
    ? 'II'
    : previewSignal?.leadNames[0] ?? 'II';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="glass-card !bg-white !rounded-[22px] w-full max-w-2xl p-5 space-y-4 shadow-xl my-auto max-h-[92vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Tải lên bản ghi Điện tâm đồ (ECG)</h3>
            <p className="text-xs text-slate-500">
              Hỗ trợ <code className="font-mono">.csv, .json, .edf, .zip (WFDB), .dcm, .scp</code> · tối đa 50MB
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Dropzone lớn */}
          <div className="space-y-2">
            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const dropped = e.dataTransfer.files?.[0] ?? null;
                void handleSelectFile(dropped);
              }}
              className="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/40 hover:bg-blue-50/70 transition cursor-pointer text-center"
            >
              <input
                type="file"
                accept=".csv,.json,.edf,.zip,.dcm,.scp"
                onChange={(e) => void handleSelectFile(e.target.files?.[0] ?? null)}
                className="hidden"
              />
              {file ? (
                <>
                  <FileCheck2 className="w-7 h-7 text-emerald-600" />
                  <div className="font-semibold text-slate-900">{file.name}</div>
                  <div className="text-[11px] text-slate-500 tabular-nums">
                    {(file.size / 1024).toFixed(1)} KB · Bấm để chọn tệp khác
                  </div>
                </>
              ) : (
                <>
                  <Upload className="w-7 h-7 text-blue-600" />
                  <div className="font-semibold text-slate-800">
                    Kéo thả tệp tín hiệu ECG vào đây hoặc bấm để chọn tệp
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Tự động nhận diện định dạng và hiển thị bản xem trước 10 giây đầu
                  </div>
                </>
              )}
            </label>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => void handleGenerateSampleFile()}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tạo nhanh tệp mẫu 12 đạo trình (.json) để kiểm thử</span>
              </button>
            </div>
          </div>

          {/* Preview 10s đầu Lead II trước khi upload (mục 3.8) */}
          {previewSignal && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-600">
                <span className="font-semibold text-slate-800">
                  Xem trước tín hiệu (10 giây đầu · Đạo trình {previewLead})
                </span>
                <span className="tabular-nums">
                  {previewSignal.sampleRateHz} Hz · {previewSignal.leadNames.length} đạo trình
                </span>
              </div>
              <EcgCanvas
                signal={previewSignal}
                styleMode="static"
                gridMode="paper"
                gainMmPerMv={10}
                leadNames={[previewLead]}
                showCalibrationPulse
                viewStartMs={0}
                viewEndMs={Math.min(10000, previewSignal.durationMs)}
                durationMs={previewSignal.durationMs}
                anomalies={[]}
                heightPx={115}
                showYAxis={false}
                showXAxis
                ariaLabel="Xem trước 10 giây đầu bản ghi ECG"
              />
            </div>
          )}

          {previewError && (
            <div className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
              {previewError}
            </div>
          )}

          {/* Thông số bản ghi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-slate-700 block">Loại bản ghi</label>
              <select
                value={recordingType}
                onChange={(e) => {
                  const val = e.target.value as EcgRecordingType;
                  setRecordingType(val);
                  if (val === 'rhythm_strip') {
                    setNumLeads(1);
                    setLeadNames('II');
                  } else {
                    setNumLeads(12);
                    setLeadNames(STANDARD_12_LEADS.join(','));
                  }
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 font-medium"
              >
                {RECORDING_TYPES.map((rt) => (
                  <option key={rt.id} value={rt.id}>
                    {rt.label} — {rt.desc}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-slate-700 block">Định dạng tín hiệu</label>
              <select
                value={signalFormat}
                onChange={(e) => setSignalFormat(e.target.value as EcgSignalFormat)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 font-medium"
              >
                <option value="json">JSON (.json)</option>
                <option value="csv">CSV (.csv)</option>
                <option value="wfdb">WFDB (.zip gồm .hea + .dat)</option>
                <option value="edf">EDF (.edf)</option>
                <option value="dicom_ecg">DICOM ECG (.dcm)</option>
                <option value="scp_ecg">SCP-ECG (.scp)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-slate-700 block">Tần số lấy mẫu (Hz)</label>
              <div className="flex items-center gap-1.5">
                {([250, 360, 500, 1000] as const).map((hz) => (
                  <button
                    key={hz}
                    type="button"
                    onClick={() => setSampleRateHz(hz)}
                    className={`px-2.5 py-1.5 rounded-lg font-semibold border transition cursor-pointer tabular-nums ${
                      sampleRateHz === hz
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {hz}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-medium text-slate-700">Danh sách đạo trình ({numLeads})</label>
                <button
                  type="button"
                  onClick={() => {
                    setNumLeads(12);
                    setLeadNames(STANDARD_12_LEADS.join(','));
                  }}
                  className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                >
                  Preset 12 đạo trình chuẩn
                </button>
              </div>
              <input
                type="text"
                value={leadNames}
                onChange={(e) => {
                  setLeadNames(e.target.value);
                  const count = e.target.value.split(',').map((s) => s.trim()).filter(Boolean).length;
                  if (count > 0) setNumLeads(count);
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-slate-700 block">Thiết bị ghi (Model)</label>
              <input
                type="text"
                value={deviceModel}
                onChange={(e) => setDeviceModel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-slate-700 block">Số Serial thiết bị</label>
              <input
                type="text"
                value={deviceSerial}
                onChange={(e) => setDeviceSerial(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-slate-700 block">Thời điểm bắt đầu ghi</label>
              <input
                type="datetime-local"
                value={startedAt}
                onChange={(e) => setStartedAt(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-slate-700 block">Thời điểm kết thúc ghi</label>
              <input
                type="datetime-local"
                value={endedAt}
                onChange={(e) => setEndedAt(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800"
              />
            </div>
          </div>

          <label className="inline-flex items-center gap-2 font-medium text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoAnalyze}
              onChange={(e) => setAutoAnalyze(e.target.checked)}
              className="rounded border-slate-300 text-blue-600"
            />
            <span>Tự động chạy phân tích AI ngay sau khi tải lên</span>
          </label>

          {/* Thanh tiến trình upload */}
          {progress !== null && (
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-semibold text-blue-700 tabular-nums">
                <span>Đang tải bản ghi lên máy chủ...</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-blue-100 overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 font-medium">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={!file || progress !== null}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Tải bản ghi lên</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

