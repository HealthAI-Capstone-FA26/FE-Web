import { ApiError, apiFetch } from '../api';
import type {
  EcgAlertSocketPayload,
  EcgAlertStatus,
  EcgAnalysis,
  EcgAnalysisStatus,
  EcgAnomalyEvent,
  EcgAnomalyFilter,
  EcgAnomalyType,
  EcgOverallResult,
  EcgRecording,
  EcgRecordingDetail,
  EcgRecordingStatus,
  EcgRecordingType,
  EcgReviewVerdict,
  EcgScorePoint,
  EcgSeverity,
  EcgSignal,
  EcgSignalFormat,
  EcgUploadPayload,
} from '../../types/ecg';
import { STANDARD_12_LEADS } from '../../types/ecg';
import { buildMockAnalysis, buildMockRecordings, getMockSignal } from './ecg.mock';
import { parseSignalInWorker } from '../../modules/lab/ecg/chart/data/parserClient';

/* ------------------------------------------------------------------ */
/* Chế độ mock                                                          */
/* ------------------------------------------------------------------ */

const MOCK_STORAGE_KEY = 'ecg_mock';

export function isEcgMockMode(): boolean {
  if (import.meta.env.VITE_ECG_MOCK === 'true') return true;
  try {
    return localStorage.getItem(MOCK_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setEcgMockMode(enabled: boolean): void {
  if (enabled) localStorage.setItem(MOCK_STORAGE_KEY, 'true');
  else localStorage.removeItem(MOCK_STORAGE_KEY);
}

/** Bus giả lập socket `ecg-alert-update` khi chạy mock. */
export const ecgMockBus = new EventTarget();

function emitMock(payload: EcgAlertSocketPayload): void {
  ecgMockBus.dispatchEvent(new CustomEvent<EcgAlertSocketPayload>('ecg-alert-update', { detail: payload }));
}

let mockStore: EcgRecordingDetail[] | null = null;
function store(): EcgRecordingDetail[] {
  if (!mockStore) {
    mockStore = buildMockRecordings();
    // Bản ghi thứ 2 đang phân tích → mô phỏng queued → running → completed.
    const pending = mockStore.find((r) => r.status === 'analyzing');
    if (pending) simulateMockAnalysis(pending.id, 0.5, undefined);
  }
  return mockStore;
}

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const clone = <T,>(v: T): T => structuredClone(v);

function simulateMockAnalysis(recordingId: string, threshold: number, modelVersionId: string | undefined): EcgAnalysis {
  const rec = store().find((r) => r.id === recordingId);
  const id = `ana-${Date.now().toString(36)}`;
  const queued: EcgAnalysis = {
    ...buildMockAnalysis(id),
    status: 'queued', overallResult: null, maxAnomalyScore: null, signalQuality: null,
    summaryMetrics: null, inferenceLatencyMs: null, anomalies: [], scoreSeries: undefined,
    thresholdUsed: threshold, modelVersion: modelVersionId ? modelVersionId.slice(0, 8) : '2.3.1',
    createdAt: new Date().toISOString(),
  };
  if (rec) {
    rec.analyses = [queued, ...rec.analyses];
    rec.latestAnalysis = queued;
    rec.status = 'analyzing';
  }
  const update = (patch: Partial<EcgAnalysis>, recStatus?: EcgRecordingStatus) => {
    const r = store().find((x) => x.id === recordingId);
    if (!r) return;
    r.analyses = r.analyses.map((a) => (a.id === id ? { ...a, ...patch } : a));
    r.latestAnalysis = r.analyses[0] ?? null;
    if (recStatus) r.status = recStatus;
    emitMock({ encounterId: r.encounterId ?? '', recordingId, analysisId: id, status: patch.status });
  };
  setTimeout(() => update({ status: 'running' }), 1400);
  setTimeout(() => {
    const done = buildMockAnalysis(id, { thresholdUsed: threshold, createdAt: queued.createdAt, modelVersion: queued.modelVersion });
    update(done, 'completed');
  }, 5200);
  return queued;
}

/* ------------------------------------------------------------------ */
/* Adapter DTO → model (component KHÔNG phụ thuộc trực tiếp DTO)        */
/* ------------------------------------------------------------------ */

type Dto = Record<string, unknown>;

function isDto(v: unknown): v is Dto {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
const obj = (v: unknown): Dto => (isDto(v) ? v : {});
function str(...values: unknown[]): string | null {
  for (const v of values) if (typeof v === 'string' && v.length > 0) return v;
  for (const v of values) if (typeof v === 'number') return String(v);
  return null;
}
function num(...values: unknown[]): number | null {
  for (const v of values) {
    if (v === null || v === undefined || v === '') continue;
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}
function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}
function list(v: unknown): unknown[] {
  if (Array.isArray(v)) return v;
  const o = obj(v);
  if (Array.isArray(o.data)) return o.data;
  if (Array.isArray(o.items)) return o.items;
  return [];
}

const ANOMALY_TYPES: readonly EcgAnomalyType[] = ['afib', 'pvc', 'pac', 'vt', 'bradycardia', 'tachycardia', 'st_elevation', 'st_depression', 'av_block', 'unclassified'];
const SEVERITIES: readonly EcgSeverity[] = ['low', 'medium', 'high', 'critical'];
const ALERT_STATUSES: readonly EcgAlertStatus[] = ['active', 'acknowledged', 'resolved', 'auto_dismissed'];
const VERDICTS: readonly EcgReviewVerdict[] = ['pending', 'true_positive', 'false_positive', 'uncertain'];
const ANALYSIS_STATUSES: readonly EcgAnalysisStatus[] = ['queued', 'running', 'completed', 'failed', 'skipped'];
const OVERALL: readonly EcgOverallResult[] = ['normal', 'abnormal', 'inconclusive', 'poor_signal'];
const REC_TYPES: readonly EcgRecordingType[] = ['resting_12_lead', 'continuous_monitoring', 'holter', 'rhythm_strip'];
const FORMATS: readonly EcgSignalFormat[] = ['wfdb', 'edf', 'csv', 'json', 'dicom_ecg', 'scp_ecg'];
const REC_STATUSES: readonly EcgRecordingStatus[] = ['uploaded', 'analyzing', 'completed', 'failed', 'cancelled'];

function leadsFrom(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === 'string' && v.trim()) return v.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
}

export function mapEcgAnomalyDto(raw: unknown): EcgAnomalyEvent {
  const d = obj(raw);
  const reviewer = obj(d.reviewedBy ?? d.reviewer);
  const type = d.anomalyType ?? d.type;
  return {
    id: str(d.eventId, d.anomalyEventId, d.ecgAnomalyEventId, d.id) ?? crypto.randomUUID(),
    anomalyType: type === null || type === undefined ? null : oneOf(type, ANOMALY_TYPES, 'unclassified'),
    score: num(d.score, d.anomalyScore) ?? 0,
    severity: oneOf(d.severity, SEVERITIES, 'low'),
    startOffsetMs: num(d.startOffsetMs, d.startMs) ?? 0,
    endOffsetMs: num(d.endOffsetMs, d.endMs) ?? 0,
    affectedLeads: leadsFrom(d.affectedLeads ?? d.leads),
    heartRateBpm: num(d.heartRateBpm, d.heartRate),
    details: isDto(d.details) ? d.details : null,
    alertStatus: oneOf(d.alertStatus, ALERT_STATUSES, 'active'),
    reviewVerdict: oneOf(d.reviewVerdict, VERDICTS, 'pending'),
    reviewNote: str(d.reviewNote),
    reviewedByName: str(d.reviewedByName, obj(reviewer.profile).fullName, reviewer.fullName, reviewer.email),
    reviewedAt: str(d.reviewedAt),
  };
}

function mapScoreSeries(v: unknown): EcgScorePoint[] | undefined {
  const arr = list(v);
  if (!arr.length) return undefined;
  const out: EcgScorePoint[] = [];
  for (const item of arr) {
    const o = obj(item);
    const t = num(o.tMs, o.offsetMs, o.startOffsetMs, o.t);
    const s = num(o.score, o.value);
    if (t !== null && s !== null) out.push({ tMs: t, score: s });
  }
  return out.length ? out : undefined;
}

export function mapEcgAnalysisDto(raw: unknown): EcgAnalysis {
  const d = obj(raw);
  const model = obj(d.modelVersion ?? d.model);
  const metrics = obj(d.summaryMetrics);
  const hasMetrics = Object.keys(metrics).length > 0;
  return {
    id: str(d.analysisId, d.ecgAnalysisId, d.id) ?? crypto.randomUUID(),
    status: oneOf(d.status, ANALYSIS_STATUSES, 'queued'),
    overallResult: d.overallResult ? oneOf(d.overallResult, OVERALL, 'inconclusive') : null,
    maxAnomalyScore: num(d.maxAnomalyScore),
    thresholdUsed: num(d.thresholdUsed, d.threshold),
    windowMs: num(d.windowMs),
    strideMs: num(d.strideMs),
    signalQuality: num(d.signalQuality),
    summaryMetrics: hasMetrics
      ? {
          hrMean: num(metrics.hrMean) ?? undefined,
          hrMin: num(metrics.hrMin) ?? undefined,
          hrMax: num(metrics.hrMax) ?? undefined,
          abnormalDurationMs: num(metrics.abnormalDurationMs) ?? undefined,
        }
      : null,
    inferenceLatencyMs: num(d.inferenceLatencyMs),
    errorCode: str(d.errorCode),
    modelName: str(d.modelName, model.modelName, model.name) ?? undefined,
    modelVersion: str(typeof d.modelVersion === 'string' ? d.modelVersion : null, model.version, model.modelVersion) ?? undefined,
    createdAt: str(d.createdAt, d.requestedAt) ?? undefined,
    scoreSeries: mapScoreSeries(d.scoreSeries ?? d.windowScores ?? obj(d.details).scoreSeries),
    anomalies: list(d.anomalies ?? d.anomalyEvents ?? d.events).map(mapEcgAnomalyDto),
  };
}

export function mapEcgRecordingDto(raw: unknown): EcgRecordingDetail {
  const d = obj(raw);
  const task = obj(d.labTask ?? d.task);
  const encounter = obj(d.encounter ?? obj(obj(obj(task.orderItem).order).encounter));
  const patient = obj(encounter.patient ?? d.patient);
  const analyses = list(d.analyses).map(mapEcgAnalysisDto);
  const latestRaw = d.latestAnalysis ?? d.currentAnalysis ?? d.analysis;
  const latest = latestRaw ? mapEcgAnalysisDto(latestRaw) : analyses[0] ?? null;
  const numLeads = num(d.numLeads) ?? 12;
  const leadNames = leadsFrom(d.leadNames);
  return {
    id: str(d.recordingId, d.ecgRecordingId, d.id) ?? '',
    taskId: str(d.taskId, d.labTaskId, task.taskId) ?? '',
    encounterId: str(d.encounterId, encounter.encounterId),
    recordingType: oneOf(d.recordingType, REC_TYPES, 'rhythm_strip'),
    signalFormat: oneOf(d.signalFormat, FORMATS, 'csv'),
    sampleRateHz: num(d.sampleRateHz) ?? 500,
    numLeads,
    leadNames: leadNames.length ? leadNames : STANDARD_12_LEADS.slice(0, numLeads),
    durationMs: num(d.durationMs),
    startedAt: str(d.startedAt),
    endedAt: str(d.endedAt),
    deviceModel: str(d.deviceModel),
    deviceSerial: str(d.deviceSerial),
    status: oneOf(d.status, REC_STATUSES, latest?.status === 'completed' ? 'completed' : 'uploaded'),
    fileName: str(d.originalFileName, d.fileName),
    createdAt: str(d.createdAt) ?? new Date().toISOString(),
    patientName: str(patient.fullName, d.patientName),
    encounterCode: str(encounter.encounterCode, d.encounterCode),
    latestAnalysis: latest,
    analyses: analyses.length ? analyses : latest ? [latest] : [],
  };
}

/* ------------------------------------------------------------------ */
/* Thông báo lỗi tiếng Việt                                             */
/* ------------------------------------------------------------------ */

export type EcgErrorContext = 'upload' | 'reanalyze' | 'alert' | 'review' | 'load' | 'cancel';

export function ecgErrorMessage(err: unknown, context: EcgErrorContext): string {
  if (err instanceof ApiError) {
    if (context === 'upload') {
      if (err.status === 400) return `Tệp hoặc thông số bản ghi không hợp lệ: ${err.message}`;
      if (err.status === 403) return 'Không thể tải lên: chỉ định chưa được thanh toán hoặc bạn không phải KTV phụ trách.';
      if (err.status === 409) return 'Tệp này đã được tải lên trước đó (trùng checksum).';
      if (err.status === 413) return 'Tệp vượt quá giới hạn 50MB.';
    }
    if (context === 'reanalyze' && err.status === 409) return 'Đang có một lần phân tích chưa hoàn tất. Đợi xong rồi chạy lại.';
    if (context === 'alert' && err.status === 409) return 'Cảnh báo không còn ở trạng thái active.';
    if (context === 'review' && err.status === 403) return 'Chỉ bác sĩ mới được đánh giá kết quả AI.';
    if (context === 'cancel' && err.status === 409) return 'Chỉ huỷ được bản ghi khi nhiệm vụ còn đang thực hiện.';
    if (err.status === 401) return 'Phiên đăng nhập đã hết hạn. Đăng nhập lại để tiếp tục.';
    if (err.status === 404) return 'Không tìm thấy dữ liệu ECG được yêu cầu.';
    return err.message;
  }
  if (err instanceof TypeError) return 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.';
  return err instanceof Error ? err.message : 'Đã có lỗi xảy ra.';
}

export class EcgUnsupportedFormatError extends Error {
  readonly format: EcgSignalFormat;
  constructor(format: EcgSignalFormat) {
    super('Định dạng cần chuyển đổi phía server');
    this.name = 'EcgUnsupportedFormatError';
    this.format = format;
  }
}

/* ------------------------------------------------------------------ */
/* Upload với tiến trình (fetch không hỗ trợ upload progress → XHR)     */
/* ------------------------------------------------------------------ */

const API_BASE_URL: string = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

function uploadWithProgress(endpoint: string, form: FormData, onProgress: (pct: number) => void): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE_URL}${endpoint}`);
    const token = localStorage.getItem('access_token');
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      let body: unknown = {};
      try { body = JSON.parse(xhr.responseText || '{}'); } catch { body = {}; }
      if (xhr.status >= 200 && xhr.status < 300) resolve(body);
      else {
        const msg = obj(body).message;
        const text = Array.isArray(msg) ? msg.join(', ') : str(msg) ?? `Lỗi yêu cầu (${xhr.status})`;
        reject(new ApiError(text, xhr.status, body));
      }
    };
    xhr.onerror = () => reject(new TypeError('Network error'));
    xhr.send(form);
  });
}

/* ------------------------------------------------------------------ */
/* Service                                                              */
/* ------------------------------------------------------------------ */

export const ecgService = {
  async listRecordings(taskId: string): Promise<EcgRecording[]> {
    if (isEcgMockMode()) {
      await delay(250);
      return clone(store());
    }
    const raw = await apiFetch<unknown>(`/lab-tasks/${taskId}/ecg-recordings`, { method: 'GET' });
    return list(raw).map(mapEcgRecordingDto);
  },

  async getRecording(id: string): Promise<EcgRecordingDetail> {
    if (isEcgMockMode()) {
      await delay(200);
      const rec = store().find((r) => r.id === id);
      if (!rec) throw new ApiError('Không tìm thấy bản ghi', 404);
      return clone(rec);
    }
    const [detail, analyses] = await Promise.all([
      apiFetch<unknown>(`/ecg-recordings/${id}`, { method: 'GET' }),
      apiFetch<unknown>(`/ecg-recordings/${id}/analyses`, { method: 'GET' }).catch(() => null),
    ]);
    const mapped = mapEcgRecordingDto(detail);
    if (analyses) {
      const list2 = list(analyses).map(mapEcgAnalysisDto);
      if (list2.length) {
        mapped.analyses = list2;
        mapped.latestAnalysis = list2[0];
      }
    }
    return mapped;
  },

  async getSignalUrl(id: string): Promise<string> {
    const raw = await apiFetch<unknown>(`/ecg-recordings/${id}/signal-url`, { method: 'GET' });
    const d = obj(raw);
    const url = str(d.url, d.signalUrl, d.signedUrl);
    if (!url) throw new Error('Máy chủ không trả về URL tín hiệu.');
    return url;
  },

  /** Tải + parse tín hiệu. Tự lấy lại signal-url khi URL tạm (10 phút) hết hạn. */
  async loadSignal(recording: EcgRecording): Promise<EcgSignal> {
    if (isEcgMockMode()) {
      await delay(450);
      const { signal } = getMockSignal();
      if (recording.recordingType === 'rhythm_strip') {
        const ii = signal.leadNames.indexOf('II');
        return { ...signal, leadNames: ['II'], leads: [signal.leads[ii]], overview: [signal.overview[ii]] };
      }
      return signal;
    }
    if (recording.signalFormat !== 'csv' && recording.signalFormat !== 'json') {
      throw new EcgUnsupportedFormatError(recording.signalFormat);
    }
    let text: string | null = null;
    for (let attempt = 0; attempt < 2 && text === null; attempt++) {
      const url = await this.getSignalUrl(recording.id);
      const res = await fetch(url);
      if (res.ok) text = await res.text();
      else if (!(res.status === 403 || res.status === 401 || res.status === 410) || attempt === 1) {
        throw new Error(`Không tải được tín hiệu (${res.status}).`);
      }
    }
    return parseSignalInWorker({
      format: recording.signalFormat,
      text: text ?? '',
      sampleRateHz: recording.sampleRateHz,
      leadNames: recording.leadNames,
      overviewPoints: 1600,
    });
  },

  async uploadRecording(taskId: string, payload: EcgUploadPayload, onProgress: (pct: number) => void): Promise<EcgRecording> {
    if (isEcgMockMode()) {
      for (let p = 0; p <= 100; p += 10) { onProgress(p); await delay(90); }
      const base = store()[0];
      const rec: EcgRecordingDetail = {
        ...clone(base),
        id: `rec-${Date.now().toString(36)}`,
        recordingType: payload.recordingType,
        signalFormat: payload.signalFormat,
        fileName: payload.file.name,
        createdAt: new Date().toISOString(),
        status: payload.autoAnalyze === false ? 'uploaded' : 'analyzing',
        latestAnalysis: null,
        analyses: [],
      };
      store().unshift(rec);
      if (payload.autoAnalyze !== false) simulateMockAnalysis(rec.id, 0.5, undefined);
      return clone(rec);
    }
    const form = new FormData();
    form.append('file', payload.file);
    form.append('recordingType', payload.recordingType);
    form.append('signalFormat', payload.signalFormat);
    form.append('sampleRateHz', String(payload.sampleRateHz));
    form.append('numLeads', String(payload.numLeads));
    const optional: [string, string | number | boolean | undefined][] = [
      ['leadNames', payload.leadNames], ['durationMs', payload.durationMs], ['startedAt', payload.startedAt],
      ['endedAt', payload.endedAt], ['deviceModel', payload.deviceModel], ['deviceSerial', payload.deviceSerial],
      ['acquisitionMeta', payload.acquisitionMeta], ['autoAnalyze', payload.autoAnalyze],
    ];
    for (const [k, v] of optional) if (v !== undefined && v !== '') form.append(k, String(v));
    const raw = await uploadWithProgress(`/lab-tasks/${taskId}/ecg-recordings`, form, onProgress);
    return mapEcgRecordingDto(raw);
  },

  async cancelRecording(id: string): Promise<void> {
    if (isEcgMockMode()) {
      const rec = store().find((r) => r.id === id);
      if (rec) rec.status = 'cancelled';
      return;
    }
    await apiFetch(`/ecg-recordings/${id}/cancel`, { method: 'PATCH' });
  },

  async reanalyze(recordingId: string, body: { modelVersionId?: string; threshold?: number }): Promise<EcgAnalysis> {
    if (isEcgMockMode()) {
      await delay(300);
      const rec = store().find((r) => r.id === recordingId);
      const busy = rec?.analyses[0] && (rec.analyses[0].status === 'queued' || rec.analyses[0].status === 'running');
      if (busy) throw new ApiError('Analysis in progress', 409);
      return clone(simulateMockAnalysis(recordingId, body.threshold ?? 0.5, body.modelVersionId));
    }
    const raw = await apiFetch<unknown>(`/ecg-recordings/${recordingId}/analyses`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return mapEcgAnalysisDto(raw);
  },

  async listEncounterEvents(encounterId: string, filter: EcgAnomalyFilter): Promise<EcgAnomalyEvent[]> {
    if (isEcgMockMode()) {
      const all = store().flatMap((r) => r.latestAnalysis?.anomalies ?? []);
      return clone(all.filter((e) =>
        (!filter.alertStatus || e.alertStatus === filter.alertStatus) &&
        (!filter.severity || e.severity === filter.severity) &&
        (!filter.reviewVerdict || e.reviewVerdict === filter.reviewVerdict)));
    }
    const qs = new URLSearchParams();
    if (filter.alertStatus) qs.set('alertStatus', filter.alertStatus);
    if (filter.severity) qs.set('severity', filter.severity);
    if (filter.reviewVerdict) qs.set('reviewVerdict', filter.reviewVerdict);
    const raw = await apiFetch<unknown>(`/encounters/${encounterId}/ecg-anomaly-events?${qs.toString()}`, { method: 'GET' });
    return list(raw).map(mapEcgAnomalyDto);
  },

  async updateEventStatus(eventId: string, action: 'acknowledge' | 'resolve'): Promise<void> {
    if (isEcgMockMode()) {
      await delay(250);
      mutateMockEvent(eventId, (e) => {
        if (action === 'acknowledge' && e.alertStatus !== 'active') throw new ApiError('Not active', 409);
        e.alertStatus = action === 'acknowledge' ? 'acknowledged' : 'resolved';
      });
      return;
    }
    await apiFetch(`/ecg-anomaly-events/${eventId}/${action}`, { method: 'PATCH' });
  },

  async reviewEvent(eventId: string, verdict: Exclude<EcgReviewVerdict, 'pending'>, note: string, reviewerName: string): Promise<void> {
    if (isEcgMockMode()) {
      await delay(300);
      mutateMockEvent(eventId, (e) => {
        e.reviewVerdict = verdict;
        e.reviewNote = note || null;
        e.reviewedByName = reviewerName;
        e.reviewedAt = new Date().toISOString();
      });
      return;
    }
    await apiFetch(`/ecg-anomaly-events/${eventId}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ verdict, note: note || undefined }),
    });
  },
};

function mutateMockEvent(eventId: string, fn: (e: EcgAnomalyEvent) => void): void {
  for (const rec of store()) {
    for (const a of rec.analyses) {
      const e = a.anomalies.find((x) => x.id === eventId);
      if (e) {
        fn(e);
        rec.latestAnalysis = rec.analyses[0] ?? null;
        return;
      }
    }
  }
  throw new ApiError('Không tìm thấy sự kiện', 404);
}

