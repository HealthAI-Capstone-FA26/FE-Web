// Dữ liệu ECG chuẩn từ bộ thực nghiệm ECG_A (Anomaly Transformer, 1841 mẫu × 2 kênh Lead I & II, <f8)
// kèm dữ liệu tổng hợp 12 đạo trình để dev khi chưa có BE (bật bằng VITE_ECG_MOCK=true).
import type {
  EcgAnalysis,
  EcgAnomalyEvent,
  EcgRecordingDetail,
  EcgScorePoint,
  EcgSignal,
} from '../../types/ecg';
import { STANDARD_12_LEADS } from '../../types/ecg';
import { lttb } from '../../modules/lab/ecg/chart/math/lttb';
import { buildConfusionSegments } from '../../modules/lab/ecg/ecgMeta';
import {
  ECG_A_ANOMALY_COUNT,
  ECG_A_ANOMALY_RATIO,
  ECG_A_DTYPE,
  ECG_A_GT_RANGE,
  ECG_A_LEAD_I,
  ECG_A_LEAD_II,
  ECG_A_SAMPLE_RATE_HZ,
  ECG_A_SHAPE,
  ECG_A_TOTAL_SAMPLES,
} from './ecgA.data';

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

/* ------------------------------------------------------------------ */
/* 1. Bộ dữ liệu chuẩn ECG_A (1841 mẫu × 2 kênh Lead I, II, <f8)        */
/* ------------------------------------------------------------------ */

let cachedEcgASignal: EcgSignal | null = null;

export function getEcgASignal(): EcgSignal {
  if (cachedEcgASignal) return cachedEcgASignal;
  const leadI = Float32Array.from(ECG_A_LEAD_I);
  const leadII = Float32Array.from(ECG_A_LEAD_II);
  const leads = [leadI, leadII];
  cachedEcgASignal = {
    sampleRateHz: ECG_A_SAMPLE_RATE_HZ,
    leadNames: ['I', 'II'],
    leads,
    durationMs: (ECG_A_TOTAL_SAMPLES / ECG_A_SAMPLE_RATE_HZ) * 1000, // 18410 ms
    overview: leads.map((l) => lttb(l, 900)),
  };
  return cachedEcgASignal;
}

export function buildEcgAConfusionData(): {
  groundTruth: (0 | 1)[];
  predicted: (0 | 1)[];
} {
  const groundTruth: (0 | 1)[] = new Array(ECG_A_TOTAL_SAMPLES).fill(0);
  const predicted: (0 | 1)[] = new Array(ECG_A_TOTAL_SAMPLES).fill(0);
  for (let i = ECG_A_GT_RANGE.startIndex; i <= ECG_A_GT_RANGE.endIndex; i++) {
    groundTruth[i] = 1;
    predicted[i] = 1;
  }

  return { groundTruth, predicted };
}

export function buildEcgAAnalysis(id = 'ana-ecg-a-001', overrides: Partial<EcgAnalysis> = {}): EcgAnalysis {
  const { groundTruth, predicted } = buildEcgAConfusionData();
  const segments = buildConfusionSegments(groundTruth, predicted, ECG_A_SAMPLE_RATE_HZ);
  const threshold = overrides.thresholdUsed ?? 0.5;

  const anomalies: EcgAnomalyEvent[] = segments.map((seg, idx) => {
    const isTrueAnomaly = seg.kind === '1-1';
    const isMissed = seg.kind === '1-0';
    return {
      id: `evt-ecga-${idx + 1}`,
      anomalyType: isTrueAnomaly || isMissed ? 'pvc' : 'unclassified',
      score: isTrueAnomaly ? 0.94 : isMissed ? Number((threshold - 0.05).toFixed(2)) : 0.62,
      severity: isTrueAnomaly ? 'high' : isMissed ? 'medium' : 'low',
      startOffsetMs: seg.startOffsetMs,
      endOffsetMs: seg.endOffsetMs,
      affectedLeads: isTrueAnomaly || isMissed ? ['I', 'II'] : seg.startIndex < 1000 ? ['I'] : ['II'],
      heartRateBpm: isTrueAnomaly ? 88 : isMissed ? 85 : 74,
      alertStatus: isTrueAnomaly ? 'active' : isMissed ? 'acknowledged' : 'auto_dismissed',
      reviewVerdict: isTrueAnomaly ? 'true_positive' : isMissed ? 'uncertain' : 'false_positive',
      details: {
        startIndex: seg.startIndex,
        endIndex: seg.endIndex,
        confusion: seg.kind,
        saliency: saliency(seg.startOffsetMs, seg.endOffsetMs),
      },
      reviewNote:
        isTrueAnomaly
          ? 'Detected (1-1): Anomaly Transformer bắt đúng đoạn biến dạng sóng [505..758].'
          : isMissed
            ? `Missed (1-0): Biên chuyển tiếp [${seg.startIndex}..${seg.endIndex}] có Ground-Truth = 1 nhưng score dưới ngưỡng.`
            : `False alarm (0-1): Nhiễu ngắn tại [${seg.startIndex}..${seg.endIndex}] vượt ngưỡng tạm thời.`,
      reviewedByName: 'Anomaly-Transformer GT',
      reviewedAt: '2026-11-02T08:00:00+07:00',
    };
  });

  // Chuỗi Anomaly Score s(t) khớp chính xác với trạng thái pred[i] so với threshold
  const rand = mulberry32(20261102);
  const scoreSeries: EcgScorePoint[] = [];
  for (let i = 0; i < ECG_A_TOTAL_SAMPLES; i += 4) {
    const tMs = i * 10;
    const gt = groundTruth[i];
    const pred = predicted[i];
    let s = 0.12 + Math.sin(i / 28) * 0.04 + rand() * 0.06;
    if (gt === 1 && pred === 1) {
      const rel = (i - 505) / Math.max(1, 758 - 505);
      s = Math.max(threshold + 0.08, 0.76 + Math.sin(rel * Math.PI) * 0.18 - rand() * 0.03);
    } else if (gt === 1 && pred === 0) {
      s = threshold - 0.04 - rand() * 0.04;
    } else if (gt === 0 && pred === 1) {
      s = threshold + 0.08 + rand() * 0.06;
    }
    scoreSeries.push({ tMs, score: Number(Math.min(1, Math.max(0, s)).toFixed(3)) });
  }

  return {
    id,
    status: 'completed',
    overallResult: 'abnormal',
    maxAnomalyScore: 0.94,
    thresholdUsed: threshold,
    windowMs: 1000,
    strideMs: 100,
    signalQuality: 0.98,
    summaryMetrics: {
      dataset: 'ECG_A',
      shape: ECG_A_SHAPE,
      dtype: ECG_A_DTYPE,
      anomalyCount: ECG_A_ANOMALY_COUNT,
      anomalyRatio: ECG_A_ANOMALY_RATIO / 100,
      hrMean: 76,
      hrMin: 68,
      hrMax: 96,
      abnormalDurationMs: 2690,
    },
    inferenceLatencyMs: 142,
    errorCode: null,
    modelName: 'anomaly-transformer',
    modelVersion: '1.0.0',
    createdAt: '2026-11-02T08:00:00+07:00',
    scoreSeries,
    anomalies,
    ...overrides,
  };
}

/* ------------------------------------------------------------------ */
/* 2. Dữ liệu tổng hợp 12 đạo trình lâm sàng (rec-001, rec-002)          */
/* ------------------------------------------------------------------ */

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
    confusion: '1-1' | '1-0' | '0-1',
    review?: { by: string; at: string; note: string },
  ): EcgAnomalyEvent => ({
    id, anomalyType, score, severity, startOffsetMs: start, endOffsetMs: end, affectedLeads: leads,
    heartRateBpm: hr, alertStatus, reviewVerdict,
    details: { rPeaks: peaksIn(rPeaksMs, start, end), saliency: saliency(start, end), confusion },
    reviewNote: review?.note ?? null, reviewedByName: review?.by ?? null, reviewedAt: review?.at ?? null,
  });

  return [
    ev('evt-pac-1', 'pac', 0.58, 'low', 3080, 3330, ['II', 'V1'], 76, 'acknowledged', 'true_positive', '1-1',
      { by: 'BS. Trịnh Khải Minh', at: '2026-11-01T08:14:00+07:00', note: 'Ngoại tâm thu nhĩ (PAC), sóng P đến sớm.' }),
    ev('evt-pvc-1', 'pvc', 0.87, 'medium', 5880, 6300, ['II', 'V4', 'V5'], 74, 'active', 'true_positive', '1-1'),
    ev('evt-st-1', 'st_elevation', 0.71, 'high', 8050, 10180, ['II', 'III', 'aVF'], 72, 'active', 'true_positive', '1-1'),
    ev('evt-af-1', 'afib', 0.94, 'critical', 12000, 16500, ['II', 'V1'], 118, 'active', 'true_positive', '1-1'),
    ev('evt-pvc-2', 'pvc', 0.81, 'medium', 18560, 18980, ['II', 'V5'], 73, 'resolved', 'true_positive', '1-1',
      { by: 'BS. Trịnh Khải Minh', at: '2026-11-01T08:16:00+07:00', note: 'QRS rộng 140ms, bù trừ hoàn toàn.' }),
    ev('evt-tachy-1', 'tachycardia', 0.77, 'high', 21000, 25000, ['II'], 141, 'acknowledged', 'true_positive', '1-1'),
    ev('evt-pvc-3', 'pvc', 0.84, 'medium', 26980, 27400, ['II', 'V4'], 75, 'active', 'true_positive', '1-1'),
  ];
}

function scoreSeriesFrom(events: EcgAnomalyEvent[], seed: number): EcgScorePoint[] {
  const rand = mulberry32(seed);
  const out: EcgScorePoint[] = [];
  const stepMs = 60;
  for (let t = 0; t <= DURATION_S * 1000; t += stepMs) {
    let s = 0.1 + Math.sin(t / 450) * 0.04 + rand() * 0.08;
    for (const e of events) {
      if (t >= e.startOffsetMs && t <= e.endOffsetMs) {
        const span = Math.max(1, e.endOffsetMs - e.startOffsetMs);
        const rel = (t - e.startOffsetMs) / span;
        const arch = Math.sin(rel * Math.PI);
        const insideScore = Math.max(0.54, e.score - 0.12 * (1 - arch) - rand() * 0.03);
        s = Math.max(s, insideScore);
      }
    }
    out.push({ tMs: t, score: Number(Math.min(1, s).toFixed(3)) });
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
    summaryMetrics: {
      dataset: 'ECG_12LEAD',
      shape: [15000, 12],
      dtype: '<f4',
      anomalyCount: 1715,
      anomalyRatio: abnormalDurationMs / (DURATION_S * 1000),
      hrMean: 84,
      hrMin: 68,
      hrMax: 141,
      abnormalDurationMs,
    },
    inferenceLatencyMs: 412,
    errorCode: null,
    modelName: 'anomaly-transformer',
    modelVersion: '2.3.1',
    createdAt: '2026-11-01T08:05:00+07:00',
    scoreSeries: scoreSeriesFrom(anomalies, 7),
    anomalies,
    ...overrides,
  };
}

export function buildMockRecordings(): EcgRecordingDetail[] {
  const ecgAAnalysis = buildEcgAAnalysis('ana-ecg-a-001');
  const ecgAOlder = buildEcgAAnalysis('ana-ecg-a-000', {
    modelVersion: '0.9.5',
    thresholdUsed: 0.6,
    inferenceLatencyMs: 185,
    createdAt: '2026-11-01T07:40:00+07:00',
  });

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

  return [
    {
      id: 'rec-ecg-a',
      taskId: 'task-ecg-demo',
      encounterId: 'enc-demo-0412',
      recordingType: 'continuous_monitoring',
      signalFormat: 'json',
      sampleRateHz: ECG_A_SAMPLE_RATE_HZ,
      numLeads: 2,
      leadNames: ['I', 'II'],
      durationMs: (ECG_A_TOTAL_SAMPLES / ECG_A_SAMPLE_RATE_HZ) * 1000,
      startedAt: '2026-11-02T08:00:00+07:00',
      endedAt: '2026-11-02T08:00:18+07:00',
      deviceModel: 'Anomaly-Transformer Benchmark (ECG_A)',
      deviceSerial: 'AT-ECGA-1841',
      status: 'completed',
      fileName: 'ECG_A',
      createdAt: '2026-11-02T08:00:18+07:00',
      patientName: 'Lương Thị Hải Yến',
      encounterCode: 'KB-20261101-0412',
      latestAnalysis: ecgAAnalysis,
      analyses: [ecgAAnalysis, ecgAOlder],
    },
    {
      id: 'rec-001',
      taskId: 'task-ecg-demo',
      encounterId: 'enc-demo-0412',
      recordingType: 'resting_12_lead',
      signalFormat: 'json',
      sampleRateHz: FS,
      numLeads: 12,
      leadNames: [...STANDARD_12_LEADS],
      durationMs: DURATION_S * 1000,
      startedAt: '2026-11-01T07:52:10+07:00',
      endedAt: '2026-11-01T07:52:40+07:00',
      deviceModel: 'Nihon Kohden ECG-2350',
      deviceSerial: 'NK-23-08814',
      status: 'completed',
      fileName: 'ecg_12lead_0752.json',
      createdAt: '2026-11-01T07:53:02+07:00',
      patientName: 'Lương Thị Hải Yến',
      encounterCode: 'KB-20261101-0412',
      latestAnalysis: current,
      analyses: [current, older],
    },
    {
      id: 'rec-002',
      taskId: 'task-ecg-demo',
      encounterId: 'enc-demo-0412',
      recordingType: 'rhythm_strip',
      signalFormat: 'csv',
      sampleRateHz: FS,
      numLeads: 12,
      leadNames: [...STANDARD_12_LEADS],
      durationMs: DURATION_S * 1000,
      startedAt: '2026-11-01T08:21:44+07:00',
      endedAt: '2026-11-01T08:22:14+07:00',
      deviceModel: 'Nihon Kohden ECG-2350',
      deviceSerial: 'NK-23-08814',
      status: 'analyzing',
      fileName: 'rhythm_II_0821.csv',
      createdAt: '2026-11-01T08:22:30+07:00',
      patientName: 'Lương Thị Hải Yến',
      encounterCode: 'KB-20261101-0412',
      latestAnalysis: null,
      analyses: [],
    },
  ];
}
