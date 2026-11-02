import type { EcgSignal } from '../../../../../types/ecg';
import { parseSignalText, type ParsedSignalPayload, type ParseRequest } from './parseSignal';

type WorkerResponse =
  | { requestId: number; ok: true; payload: ParsedSignalPayload }
  | { requestId: number; ok: false; error: string };

let worker: Worker | null = null;
let seq = 0;
const pending = new Map<number, { resolve: (p: ParsedSignalPayload) => void; reject: (e: Error) => void }>();

function getWorker(): Worker | null {
  if (typeof Worker === 'undefined') return null;
  if (!worker) {
    worker = new Worker(new URL('../workers/ecgParser.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const data = event.data;
      const entry = pending.get(data.requestId);
      if (!entry) return;
      pending.delete(data.requestId);
      if (data.ok) entry.resolve(data.payload);
      else entry.reject(new Error(data.error));
    };
    worker.onerror = () => {
      pending.forEach((p) => p.reject(new Error('Web Worker phân tích tín hiệu gặp lỗi.')));
      pending.clear();
      worker?.terminate();
      worker = null;
    };
  }
  return worker;
}

export function toEcgSignal(payload: ParsedSignalPayload): EcgSignal {
  const samples = payload.leads[0]?.length ?? 0;
  return {
    sampleRateHz: payload.sampleRateHz,
    leadNames: payload.leadNames,
    leads: payload.leads,
    overview: payload.overview,
    durationMs: (samples / payload.sampleRateHz) * 1000,
  };
}

/** Parse trong Web Worker (fallback main thread nếu môi trường không hỗ trợ Worker). */
export function parseSignalInWorker(req: ParseRequest): Promise<EcgSignal> {
  const w = getWorker();
  if (!w) return Promise.resolve(toEcgSignal(parseSignalText(req)));
  const requestId = ++seq;
  return new Promise<ParsedSignalPayload>((resolve, reject) => {
    pending.set(requestId, { resolve, reject });
    w.postMessage({ requestId, ...req });
  }).then(toEcgSignal);
}

