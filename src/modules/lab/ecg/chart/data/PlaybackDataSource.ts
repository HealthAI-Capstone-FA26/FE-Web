import type { EcgSignal } from '../../../../../types/ecg';
import type { EcgDataSource } from './EcgDataSource';
import { RingBuffer } from './RingBuffer';

/** Phát lại tín hiệu đã tải đủ: đẩy dần mẫu vào ring buffer theo đồng hồ playback. */
export class PlaybackDataSource implements EcgDataSource {
  readonly kind = 'playback' as const;
  readonly sampleRateHz: number;
  readonly numLeads: number;
  readonly buffer: RingBuffer;
  readonly totalSamples: number;
  private readonly signal: EcgSignal;
  private pushed = 0;

  constructor(signal: EcgSignal, maxWindowSec: number) {
    this.signal = signal;
    this.sampleRateHz = signal.sampleRateHz;
    this.numLeads = signal.leads.length;
    this.totalSamples = signal.leads[0]?.length ?? 0;
    // capacity = sampleRate × windowSec × 2 theo đặc tả
    this.buffer = new RingBuffer(this.numLeads, signal.sampleRateHz * maxWindowSec * 2);
  }

  pumpTo(absIndex: number): void {
    const target = Math.min(this.totalSamples, Math.max(0, Math.floor(absIndex)));
    if (target < this.pushed) {
      this.seek(target, this.buffer.capacity / 2);
      return;
    }
    const length = target - this.pushed;
    if (length <= 0) return;
    this.buffer.push(this.signal.leads, this.pushed, length);
    this.pushed = target;
  }

  seek(absIndex: number, historySamples: number): void {
    const target = Math.min(this.totalSamples, Math.max(0, Math.floor(absIndex)));
    const from = Math.max(0, target - Math.min(Math.floor(historySamples), this.buffer.capacity));
    this.buffer.reset(from);
    this.pushed = from;
    this.pumpTo(target);
  }

  dispose(): void {
    this.pushed = 0;
  }
}

