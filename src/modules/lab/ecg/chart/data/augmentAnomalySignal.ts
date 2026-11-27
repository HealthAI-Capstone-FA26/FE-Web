import type { EcgAnomalyEvent, EcgSignal } from '../../../../../types/ecg';

/**
 * Giữ nguyên 100% tín hiệu sóng ECG gốc từ tệp dữ liệu (.npy / .csv / .json).
 * Các đoạn bất thường do AI phát hiện được hiển thị bằng lớp tô nền (bandLayer) trên biểu đồ,
 * không cộng đè gai nhân tạo làm biến dạng sóng điện tim thật của bệnh nhân.
 */
export function augmentSignalWithAnomalies(
  rawSignal: EcgSignal | null,
  _anomalies: EcgAnomalyEvent[],
): EcgSignal | null {
  return rawSignal;
}
