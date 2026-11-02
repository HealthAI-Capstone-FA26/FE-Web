// Dữ liệu ECG tổng hợp để dev khi chưa có BE (bật bằng VITE_ECG_MOCK=true).
// Sóng P-QRS-T dựng từ tổng các hàm Gauss, 500Hz, 12 lead, nhiễu nền + baseline wander,
// kèm các đoạn bất thường giả: PVC, AFib, nhịp nhanh, ST chênh lên.
import type {
  EcgAnalysis,
  EcgAnomalyEvent,
  EcgRecordingDetail,
  EcgScorePoint,
  EcgSignal,
} from '../../types/ecg';
import { STANDARD_12_LEADS } from '../../types/ecg';
import { lttb } from '../../modules/lab/ecg/chart/math/lttb';

const FS = 500;
const DURATION_S = 30;

/** PRNG có seed để tín hiệu ổn định giữa các lần reload. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Wave { at: number; amp: number; width: number }
type BeatKind = 'normal' | 'pvc' | 'pac' | 'afib' | 'st';

const NORMAL: Wave[] = [
  { at: -0.2, amp: 0.12, width: 0.025 },
  { at: -0.035, amp: -0.12, width: 0.01 },
  { at: 0, amp: 1.15, width: 0.011 },
  { at: 0.035, amp: -0.28, width: 0.012 },
  { at: 0.26, amp: 0.32, width: 0.045 },
];
const PVC: Wave[] = [
  { at: -0.01, amp: -0.35, width: 0.03 },
  { at: 0.03, amp: 1.75, width: 0.035 },
  { at: 0.1, amp: -0.6, width: 0.03 },
  { at: 0.32, amp: -0.45, width: 0.06 },
];
const AFIB_BEAT: Wave[] = NORMAL.slice(1);
const ST_BEAT: Wave[] = [...NORMAL, { at: 0.13, amp: 0.22, width: 0.06 }];

const LEAD_GAIN: Record<string, number> = {
  I: 0.62, II: 1, III: 0.48, aVR: -0.8, aVL: 0.3, aVF: 0.74,
  V1: -0.55, V2: -0.28, V3: 0.55, V4: 1.32, V5: 1.18, V6: 0.88,
};

interface Beat { t: number; kind: BeatKind }

function buildBeats(rand: () => number): Beat[] {
  const beats: Beat[] = [];
  let t = 0.45;
  while (t < DURATION_S - 0.3) {
    let kind: BeatKind = 'normal';
    let rr = 60 / 72 + (rand() - 0.5) * 0.04;
    if (t >= 12 && t < 16.5) { kind = 'afib'; rr = 0.42 + rand() * 0.5; }
    else if (t >= 21 && t < 25) { rr = 60 / 140 + (rand() - 0.5) * 0.015; }
    else if (t >= 8 && t < 10.2) { kind = 'st'; }
    beats.push({ t, kind });
    t += rr;
  }
  // Ngoại tâm thu: thay nhịp gần mốc thời gian bằng PVC/PAC.
  const replace = (at: number, kind: BeatKind) => {
    let best = 0;
    for (let i = 1; i < beats.length; i++) if (Math.abs(beats[i].t - at) < Math.abs(beats[best].t - at)) best = i;
    beats[best] = { t: beats[best].t - (kind === 'pac' ? 0.22 : 0.28), kind };
  };
  replace(3.4, 'pac');
  replace(6.2, 'pvc');
  replace(18.9, 'pvc');
  replace(27.3, 'pvc');
  return beats;
}

let cachedSignal: { signal: EcgSignal; rPeaksMs: number[]; beats: Beat[] } | null = null;

export function getMockSignal(): { signal: EcgSignal; rPeaksMs: number[] } {
  if (cachedSignal) return cachedSignal;
  const rand = mulberry32(20261101);
  const n = FS * DURATION_S;
  const base = new Float32Array(n);
  const beats = buildBeats(rand);

  for (const beat of beats) {
    const waves = beat.kind === 'pvc' ? PVC : beat.kind === 'afib' ? AFIB_BEAT : beat.kind === 'st' ? ST_BEAT : NORMAL;
    const pacScale = beat.kind === 'pac' ? 0.9 : 1;
    for (const w of waves) {
      const center = (beat.t + w.at) * FS;
      const sigma = w.width * FS;
      const from = Math.max(0, Math.floor(center - sigma * 5));
      const to = Math.min(n, Math.ceil(center + sigma * 5));
      for (let i = from; i < to; i++) {
        const d = (i - center) / sigma;
        base[i] += w.amp * pacScale * Math.exp(-0.5 * d * d);
      }
    }
  }

  // Sóng f của rung nhĩ.
  for (let i = 12 * FS; i < 16.5 * FS; i++) {
    const t = i / FS;
    base[i] += 0.045 * Math.sin(2 * Math.PI * 6.3 * t) + 0.03 * Math.sin(2 * Math.PI * 8.7 * t + 1.3);
  }

  const leads = STANDARD_12_LEADS.map((name, li) => {
    const gain = LEAD_GAIN[name] ?? 1;
    const lead = new Float32Array(n);
    const phase = li * 0.7;
    for (let i = 0; i < n; i++) {
      const t = i / FS;
      const wander = 0.06 * Math.sin(2 * Math.PI * 0.28 * t + phase) + 0.025 * Math.sin(2 * Math.PI * 0.07 * t);
      const noise = (rand() - 0.5) * 0.028;
      lead[i] = base[i] * gain + wander + noise;
    }
    return lead;
  });

  const signal: EcgSignal = {
    sampleRateHz: FS,
    leadNames: [...STANDARD_12_LEADS],
    leads,
    durationMs: DURATION_S * 1000,
    overview: leads.map((l) => lttb(l, 1600)),
  };
  const rPeaksMs = beats.map((b) => Math.round((b.t + (b.kind === 'pvc' ? 0.03 : 0)) * 1000));
  cachedSignal = { signal, rPeaksMs, beats };
  return cachedSignal;
}

function peaksIn(rPeaksMs: number[], start: number, end: number): number[] {
  return rPeaksMs.filter((t) => t >= start - 1500 && t <= end + 1500);
}

function saliency(start: number, end: number): { tMs: number; w: number }[] {
  const out: { tMs: number; w: number }[] = [];
  const mid = (start + end) / 2;
  const half = Math.max(120, (end - start) / 2);
  for (let t = start - 600; t <= end + 600; t += 40) {
    const d = (t - mid) / half;
    out.push({ tMs: t, w: Math.max(0, Math.exp(-d * d * 1.6)) });
  }
  return out;
}

function mockEvents(rPeaksMs: number[]): EcgAnomalyEvent[] {
  const ev = (
    id: string, anomalyType: EcgAnomalyEvent['anomalyType'], score: number, severity: EcgAnomalyEvent['severity'],
    start: number, end: number, leads: string[], hr: number | null,
    alertStatus: EcgAnomalyEvent['alertStatus'], reviewVerdict: EcgAnomalyEvent['reviewVerdict'],
    review?: { by: string; at: string; note: string },
  ): EcgAnomalyEvent => ({
    id, anomalyType, score, severity, startOffsetMs: start, endOffsetMs: end, affectedLeads: leads,
    heartRateBpm: hr, alertStatus, reviewVerdict,
    details: { rPeaks: peaksIn(rPeaksMs, start, end), saliency: saliency(start, end) },
    reviewNote: review?.note ?? null, reviewedByName: review?.by ?? null, reviewedAt: review?.at ?? null,
  });

  return [
    ev('evt-pac-1', 'pac', 0.58, 'low', 3080, 3330, ['II', 'V1'], 76, 'acknowledged', 'uncertain',
      { by: 'BS. Trịnh Khải Minh', at: '2026-11-01T08:14:00+07:00', note: 'P sớm, hình dạng khác nhẹ; cần thêm dải nhịp để kết luận.' }),
    ev('evt-pvc-1', 'pvc', 0.87, 'medium', 5880, 6300, ['II', 'V4', 'V5'], 74, 'active', 'pending'),
    ev('evt-st-1', 'st_elevation', 0.71, 'high', 8050, 10180, ['II', 'III', 'aVF'], 72, 'active', 'pending'),
    ev('evt-af-1', 'afib', 0.94, 'critical', 12000, 16500, ['II', 'V1'], 118, 'active', 'pending'),
    ev('evt-pvc-2', 'pvc', 0.81, 'medium', 18560, 18980, ['II', 'V5'], 73, 'resolved', 'true_positive',
      { by: 'BS. Trịnh Khải Minh', at: '2026-11-01T08:16:00+07:00', note: 'QRS rộng 140ms, bù trừ hoàn toàn.' }),
    ev('evt-noise-1', null, 0.53, 'low', 19720, 19790, ['V2'], null, 'auto_dismissed', 'false_positive',
      { by: 'BS. Trịnh Khải Minh', at: '2026-11-01T08:17:00+07:00', note: 'Nhiễu điện cực V2, không phải nhịp.' }),
    ev('evt-tachy-1', 'tachycardia', 0.77, 'high', 21000, 25000, ['II'], 141, 'acknowledged', 'pending'),
    ev('evt-pvc-3', 'pvc', 0.84, 'medium', 26980, 27400, ['II', 'V4'], 75, 'active', 'pending'),
  ];
}

function scoreSeriesFrom(events: EcgAnomalyEvent[], seed: number): EcgScorePoint[] {
  const rand = mulberry32(seed);
  const out: EcgScorePoint[] = [];
  for (let t = 0; t <= DURATION_S * 1000; t += 250) {
    let s = 0.1 + rand() * 0.12;
    for (const e of events) {
      if (t >= e.startOffsetMs - 250 && t <= e.endOffsetMs + 250) s = Math.max(s, e.score - rand() * 0.06);
    }
    out.push({ tMs: t, score: Math.min(1, s) });
  }
  return out;
}

export function buildMockAnalysis(id: string, overrides: Partial<EcgAnalysis> = {}): EcgAnalysis {
  const { rPeaksMs } = getMockSignal();
  const anomalies = mockEvents(rPeaksMs);
  const abnormalDurationMs = anomalies
    .filter((a) => a.reviewVerdict !== 'false_positive')
    .reduce((sum, a) => sum + (a.endOffsetMs - a.startOffsetMs), 0);
  return {
    id,
    status: 'completed',
    overallResult: 'abnormal',
    maxAnomalyScore: 0.94,
    thresholdUsed: 0.5,
    windowMs: 2000,
    strideMs: 250,
    signalQuality: 0.91,
    summaryMetrics: { hrMean: 84, hrMin: 68, hrMax: 141, abnormalDurationMs },
    inferenceLatencyMs: 412,
    errorCode: null,
    modelName: 'ECG-AnomalyNet',
    modelVersion: '2.3.1',
    createdAt: '2026-11-01T08:05:00+07:00',
    scoreSeries: scoreSeriesFrom(anomalies, 7),
    anomalies,
    ...overrides,
  };
}

export function buildMockRecordings(): EcgRecordingDetail[] {
  const current = buildMockAnalysis('ana-002');
  const older: EcgAnalysis = {
    ...buildMockAnalysis('ana-001', {
      modelVersion: '2.1.0',
      thresholdUsed: 0.6,
      maxAnomalyScore: 0.89,
      inferenceLatencyMs: 538,
      createdAt: '2026-11-01T07:58:00+07:00',
    }),
  };
  older.anomalies = older.anomalies
    .filter((a) => a.anomalyType !== 'st_elevation')
    .map((a) => ({ ...a, id: `${a.id}-v1`, reviewVerdict: 'pending', startOffsetMs: a.startOffsetMs + 120, endOffsetMs: a.endOffsetMs - 60 }));
  older.scoreSeries = scoreSeriesFrom(older.anomalies, 11);

  const common = {
    taskId: 'task-ecg-demo',
    encounterId: 'enc-demo-0412',
    signalFormat: 'json' as const,
    sampleRateHz: FS,
    numLeads: 12,
    leadNames: [...STANDARD_12_LEADS],
    durationMs: DURATION_S * 1000,
    deviceModel: 'Nihon Kohden ECG-2350',
    deviceSerial: 'NK-23-08814',
    patientName: 'Lương Thị Hải Yến',
    encounterCode: 'KB-20261101-0412',
  };

  return [
    {
      ...common,
      id: 'rec-001',
      recordingType: 'resting_12_lead',
      startedAt: '2026-11-01T07:52:10+07:00',
      endedAt: '2026-11-01T07:52:40+07:00',
      status: 'completed',
      fileName: 'ecg_12lead_0752.json',
      createdAt: '2026-11-01T07:53:02+07:00',
      latestAnalysis: current,
      analyses: [current, older],
    },
    {
      ...common,
      id: 'rec-002',
      recordingType: 'rhythm_strip',
      startedAt: '2026-11-01T08:21:44+07:00',
      endedAt: '2026-11-01T08:22:14+07:00',
      status: 'analyzing',
      fileName: 'rhythm_II_0821.csv',
      createdAt: '2026-11-01T08:22:30+07:00',
      latestAnalysis: null,
      analyses: [],
    },
  ];
}

