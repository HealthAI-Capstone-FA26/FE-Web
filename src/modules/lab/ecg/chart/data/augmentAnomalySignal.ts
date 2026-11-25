import type { EcgAnomalyEvent, EcgSignal } from '../../../../../types/ecg';
import { lttb } from '../math/lttb';

function triangleSpike(phase: number): number {
  const p = ((phase % 1) + 1) % 1;
  if (p < 0.25) return p / 0.25;
  if (p < 0.75) return 1 - ((p - 0.25) / 0.5) * 2;
  return -1 + (p - 0.75) / 0.25;
}

/**
 * Cộng thêm xung dao động lên/xuống tại các đoạn bất thường (tỷ lệ theo score)
 * để đường sóng đỏ hiển thị rõ vị trí và mức độ bất thường trên biểu đồ.
 */
export function augmentSignalWithAnomalies(
  rawSignal: EcgSignal | null,
  anomalies: EcgAnomalyEvent[],
): EcgSignal | null {
  if (!rawSignal || anomalies.length === 0) return rawSignal;
  const fs = rawSignal.sampleRateHz || 500;
  const activeAnomalies = anomalies.filter((a) => a.reviewVerdict !== 'false_positive');
  if (activeAnomalies.length === 0) return rawSignal;

  const leads = rawSignal.leads.map((src) => {
    const out = new Float32Array(src);
    for (const ev of activeAnomalies) {
      const rawStart = Math.max(0, Math.floor((ev.startOffsetMs / 1000) * fs));
      const rawEnd = Math.min(out.length - 1, Math.ceil((ev.endOffsetMs / 1000) * fs));
      const center = Math.floor((rawStart + rawEnd) / 2);
      const amp = 0.45 + Math.min(1, Math.max(0, ev.score)) * 0.95;

      // Đoạn ngắn: nối thẳng 0 -> +amp -> -amp -> 0 không có điểm bẻ ở giữa
      if (rawEnd - rawStart <= 4 && center - 1 >= 0 && center + 1 < out.length) {
        out[center - 1] += amp;
        out[center + 1] -= amp;
        continue;
      }

      const startIdx = Math.max(0, Math.min(rawStart, center - 3));
      const endIdx = Math.min(out.length - 1, Math.max(rawEnd, center + 3));
      const spanSamples = Math.max(2, endIdx - startIdx + 1);
      const cycles = Math.max(1, Math.round(spanSamples / 12));
      for (let i = startIdx; i <= endIdx; i++) {
        const progress = (i - startIdx) / Math.max(1, spanSamples - 1);
        out[i] += triangleSpike(progress * cycles) * amp;
      }
    }
    return out;
  });

  const overview = leads.map((arr) => lttb(arr, 1600));
  return { ...rawSignal, leads, overview };
}
