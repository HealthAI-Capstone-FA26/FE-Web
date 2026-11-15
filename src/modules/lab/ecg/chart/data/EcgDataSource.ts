import type { RingBuffer } from './RingBuffer';

/**
 * Nguồn dữ liệu cho renderer. Hiện có PlaybackDataSource (phát lại file đã ghi);
 * sau này SocketDataSource chỉ cần implement cùng interface và đẩy chunk vào cùng RingBuffer.
 */
export interface EcgDataSource {
  readonly kind: 'playback' | 'socket';
  readonly sampleRateHz: number;
  readonly numLeads: number;
  readonly buffer: RingBuffer;
  /** Tổng số mẫu nếu biết trước (playback), null với stream vô hạn. */
  readonly totalSamples: number | null;
  /** Đẩy dữ liệu tới absolute sample index (exclusive). Playback gọi mỗi frame theo đồng hồ. */
  pumpTo(absIndex: number): void;
  /** Nhảy tới vị trí: làm đầy buffer với `historySamples` mẫu phía trước. */
  seek(absIndex: number, historySamples: number): void;
  dispose(): void;
}

