/// <reference lib="webworker" />
// Parse csv/json + tính LTTB overview ngoài main thread, trả về bằng transferable ArrayBuffer.
import { collectTransferables, parseSignalText, type ParseRequest } from '../data/parseSignal';

interface WorkerRequest extends ParseRequest {
  requestId: number;
}

const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { requestId, ...req } = event.data;
  try {
    const payload = parseSignalText(req);
    ctx.postMessage({ requestId, ok: true, payload }, collectTransferables(payload));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Không đọc được tín hiệu.';
    ctx.postMessage({ requestId, ok: false, error: message });
  }
};

