import { useEffect, useMemo, useState } from 'react';

type FrameListener = (positionMs: number, deltaMs: number) => void;
type SeekListener = (positionMs: number) => void;
type StateListener = () => void;

/**
 * Đồng hồ playback thuần TS — chạy bằng requestAnimationFrame, KHÔNG gây React re-render mỗi frame.
 * Renderer đăng ký onFrame; UI chữ đọc qua hook useEcgPlayback (throttle 4 lần/giây).
 */
export class PlaybackClock {
  durationMs = 0;
  positionMs = 0;
  playing = false;
  speed = 1;
  loop = true;
  private raf = 0;
  private last = 0;
  private pausedByVisibility = false;
  private readonly frameListeners = new Set<FrameListener>();
  private readonly seekListeners = new Set<SeekListener>();
  private readonly stateListeners = new Set<StateListener>();

  constructor() {
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', this.onVisibility);
  }

  private onVisibility = () => {
    if (document.hidden && this.playing) {
      this.pausedByVisibility = true;
      this.pause();
    } else if (!document.hidden && this.pausedByVisibility) {
      this.pausedByVisibility = false;
      this.play();
    }
  };

  private tick = (now: number) => {
    // Kẹp delta để không nhảy cóc khi tab bị throttle.
    const delta = Math.min(250, Math.max(0, now - this.last));
    this.last = now;
    let next = this.positionMs + delta * this.speed;
    if (this.durationMs > 0 && next >= this.durationMs) {
      if (this.loop) {
        next = 0;
        this.positionMs = 0;
        this.seekListeners.forEach((l) => l(0));
      } else {
        next = this.durationMs;
        this.positionMs = next;
        this.frameListeners.forEach((l) => l(next, delta));
        this.pause();
        return;
      }
    }
    this.positionMs = next;
    this.frameListeners.forEach((l) => l(next, delta * this.speed));
    this.raf = requestAnimationFrame(this.tick);
  };

  setDuration(ms: number): void {
    this.durationMs = ms;
    if (this.positionMs > ms) this.seek(0);
  }

  play(): void {
    if (this.playing || this.durationMs <= 0) return;
    if (this.positionMs >= this.durationMs) this.seek(0);
    this.playing = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.tick);
    this.emitState();
  }

  pause(): void {
    if (!this.playing) return;
    this.playing = false;
    cancelAnimationFrame(this.raf);
    this.emitState();
  }

  toggle(): void {
    if (this.playing) this.pause();
    else this.play();
  }

  seek(ms: number): void {
    this.positionMs = Math.max(0, Math.min(this.durationMs, ms));
    this.seekListeners.forEach((l) => l(this.positionMs));
    this.frameListeners.forEach((l) => l(this.positionMs, 0));
    this.emitState();
  }

  setSpeed(speed: number): void {
    this.speed = speed;
    this.emitState();
  }

  onFrame(l: FrameListener): () => void {
    this.frameListeners.add(l);
    return () => this.frameListeners.delete(l);
  }

  onSeek(l: SeekListener): () => void {
    this.seekListeners.add(l);
    return () => this.seekListeners.delete(l);
  }

  onState(l: StateListener): () => void {
    this.stateListeners.add(l);
    return () => this.stateListeners.delete(l);
  }

  private emitState(): void {
    this.stateListeners.forEach((l) => l());
  }

  dispose(): void {
    cancelAnimationFrame(this.raf);
    this.frameListeners.clear();
    this.seekListeners.clear();
    this.stateListeners.clear();
    if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', this.onVisibility);
  }
}

export interface PlaybackSnapshot {
  positionMs: number;
  playing: boolean;
  speed: number;
  durationMs: number;
}

/** Tạo PlaybackClock và phát snapshot cho UI chữ, throttle 250ms (4 lần/giây). */
export function useEcgPlayback(durationMs: number) {
  const clock = useMemo(() => new PlaybackClock(), []);
  const [snapshot, setSnapshot] = useState<PlaybackSnapshot>({ positionMs: 0, playing: false, speed: 1, durationMs });

  useEffect(() => () => clock.dispose(), [clock]);

  useEffect(() => {
    clock.setDuration(durationMs);
    setSnapshot((s) => ({ ...s, durationMs }));
  }, [clock, durationMs]);

  useEffect(() => {
    let lastEmit = 0;
    const read = () =>
      setSnapshot({ positionMs: clock.positionMs, playing: clock.playing, speed: clock.speed, durationMs: clock.durationMs });
    const offFrame = clock.onFrame(() => {
      const now = performance.now();
      if (now - lastEmit >= 250) {
        lastEmit = now;
        read();
      }
    });
    const offState = clock.onState(read);
    return () => {
      offFrame();
      offState();
    };
  }, [clock]);

  return { clock, snapshot };
}

