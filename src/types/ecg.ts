// Kiểu dữ liệu domain cho module ECG (Live waveform + AI anomaly).
// Component chỉ phụ thuộc các kiểu này — DTO backend được map qua adapter trong ecg.service.ts.

export type EcgOverallResult = 'normal' | 'abnormal' | 'inconclusive' | 'poor_signal';
export type EcgSeverity = 'low' | 'medium' | 'high' | 'critical';
export type EcgAnalysisStatus = 'queued' | 'running' | 'completed' | 'failed' | 'skipped';
export type EcgAlertStatus = 'active' | 'acknowledged' | 'resolved' | 'auto_dismissed';
export type EcgReviewVerdict = 'pending' | 'true_positive' | 'false_positive' | 'uncertain';
export type EcgAnomalyType =
  | 'afib' | 'pvc' | 'pac' | 'vt' | 'bradycardia' | 'tachycardia'
  | 'st_elevation' | 'st_depression' | 'av_block' | 'unclassified';

export type EcgRecordingType = 'resting_12_lead' | 'continuous_monitoring' | 'holter' | 'rhythm_strip';
export type EcgSignalFormat = 'wfdb' | 'edf' | 'csv' | 'json' | 'dicom_ecg' | 'scp_ecg';
export type EcgRecordingStatus = 'uploaded' | 'analyzing' | 'completed' | 'failed' | 'cancelled';

export interface EcgAnomalyEvent {
  id: string;
  anomalyType: EcgAnomalyType | null; // null nếu model unsupervised
  score: number; // 0..1
  severity: EcgSeverity;
  startOffsetMs: number; // tính từ đầu recording
  endOffsetMs: number;
  affectedLeads: string[];
  heartRateBpm: number | null;
  details: Record<string, unknown> | null; // rPeaks, saliency, per-lead score...
  alertStatus: EcgAlertStatus;
  reviewVerdict: EcgReviewVerdict;
  reviewNote?: string | null;
  reviewedByName?: string | null;
  reviewedAt?: string | null;
}

export interface EcgScorePoint {
  tMs: number;
  score: number;
}

export interface EcgAnalysis {
  id: string;
  status: EcgAnalysisStatus;
  overallResult: EcgOverallResult | null;
  maxAnomalyScore: number | null;
  thresholdUsed: number | null;
  windowMs: number | null;
  strideMs: number | null;
  signalQuality: number | null; // 0..1
  summaryMetrics: { hrMean?: number; hrMin?: number; hrMax?: number; abnormalDurationMs?: number } | null;
  inferenceLatencyMs: number | null;
  errorCode?: string | null;
  modelName?: string;
  modelVersion?: string;
  createdAt?: string;
  /** Chuỗi điểm bất thường theo cửa sổ trượt (nếu BE trả về). Nếu không có, UI dựng bậc thang từ events. */
  scoreSeries?: EcgScorePoint[];
  anomalies: EcgAnomalyEvent[];
}

export interface EcgRecording {
  id: string;
  taskId: string;
  encounterId: string | null;
  recordingType: EcgRecordingType;
  signalFormat: EcgSignalFormat;
  sampleRateHz: number;
  numLeads: number;
  leadNames: string[];
  durationMs: number | null;
  startedAt: string | null;
  endedAt: string | null;
  deviceModel: string | null;
  deviceSerial: string | null;
  status: EcgRecordingStatus;
  fileName: string | null;
  createdAt: string;
  patientName: string | null;
  encounterCode: string | null;
  /** Tóm tắt analysis hiện hành (có trong list). */
  latestAnalysis: EcgAnalysis | null;
}

export interface EcgRecordingDetail extends EcgRecording {
  analyses: EcgAnalysis[];
}

/** Tín hiệu đã parse: mỗi lead là một Float32Array đơn vị mV. */
export interface EcgSignal {
  sampleRateHz: number;
  leadNames: string[];
  leads: Float32Array[];
  durationMs: number;
  /** Overview LTTB cho minimap (x = sample index, y = mV) theo từng lead. */
  overview: { x: Float32Array; y: Float32Array }[];
}

export interface EcgUploadPayload {
  file: File;
  recordingType: EcgRecordingType;
  signalFormat: EcgSignalFormat;
  sampleRateHz: number;
  numLeads: number;
  leadNames?: string;
  durationMs?: number;
  startedAt?: string;
  endedAt?: string;
  deviceModel?: string;
  deviceSerial?: string;
  acquisitionMeta?: string;
  autoAnalyze?: boolean;
}

export interface EcgAnomalyFilter {
  alertStatus?: EcgAlertStatus;
  severity?: EcgSeverity;
  reviewVerdict?: EcgReviewVerdict;
}

export interface EcgAlertSocketPayload {
  encounterId: string;
  recordingId?: string;
  analysisId?: string;
  status?: EcgAnalysisStatus;
  anomalies?: unknown[];
}

export const STANDARD_12_LEADS = ['I', 'II', 'III', 'aVR', 'aVL', 'aVF', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6'];

