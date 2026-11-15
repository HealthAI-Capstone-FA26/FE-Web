/**
 * Ring buffer đa lead, đánh chỉ số theo "absolute sample index" (tính từ đầu bản ghi / đầu stream).
 * Renderer chỉ đọc từ đây nên Playback và Socket stream dùng chung một đường vẽ.
 */
export class RingBuffer {
  readonly capacity: number;
  readonly numLeads: number;
  private readonly data: Float32Array[];
  /** Absolute index của mẫu kế tiếp sẽ được ghi. */
  private head = 0;
  /** Absolute index của mẫu cũ nhất còn giữ. */
  private tail = 0;

  constructor(numLeads: number, capacity: number) {
    this.numLeads = numLeads;
    this.capacity = Math.max(1, Math.floor(capacity));
    this.data = Array.from({ length: numLeads }, () => new Float32Array(this.capacity));
  }

  /** Xoá và đặt lại vị trí bắt đầu (dùng khi seek). */
  reset(startAbsIndex: number): void {
    this.head = startAbsIndex;
    this.tail = startAbsIndex;
  }

  /** Đẩy một chunk: chunk[lead] có cùng độ dài. */
  push(chunk: ArrayLike<number>[], offset = 0, length = chunk[0]?.length ?? 0): void {
    for (let i = 0; i < length; i++) {
      const slot = this.head % this.capacity;
      for (let l = 0; l < this.numLeads; l++) {
        const src = chunk[l];
        this.data[l][slot] = src ? src[offset + i] : 0;
      }
      this.head++;
    }
    if (this.head - this.tail > this.capacity) this.tail = this.head - this.capacity;
  }

  get start(): number {
    return this.tail;
  }

  get end(): number {
    return this.head;
  }

  has(absIndex: number): boolean {
    return absIndex >= this.tail && absIndex < this.head;
  }

  get(lead: number, absIndex: number): number {
    if (absIndex < this.tail || absIndex >= this.head) return Number.NaN;
    const arr = this.data[lead];
    return arr ? arr[absIndex % this.capacity] : Number.NaN;
  }
}

