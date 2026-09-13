import { FrameCache } from './FrameCache';
import { sampleConnectPosition, selectConnectFrame, type ConnectPosition, type ConnectFrame, type ConnectFrames } from './sequence';

export interface ConnectRenderState {
  frame: ConnectFrame | null;
  target: ConnectFrame | null;
  pending: boolean;
  error: boolean;
}

export class ConnectRenderer {
  private cache: FrameCache | null = null;
  private version = 0;
  private active = false;
  private requested: ConnectFrame | null = null;
  private displayed: ConnectFrame | null = null;
  private progressing = false;
  private position: ConnectPosition = { progress: 0, direction: 'forward' };

  constructor(private readonly surface: HTMLImageElement, private readonly frames: ConnectFrames,
    private readonly notify: (state: ConnectRenderState) => void) {}

  enter() {
    if (this.active) return;
    this.active = true;
    this.cache = new FrameCache(matchMedia('(pointer: coarse)').matches ? 6 : 8);
    this.cache.preload([
      ...this.frames.forward.slice(0, 4), this.frames.forward.at(-1)!,
    ], 20);
  }

  update(progress: number, inCheckpoint: boolean) {
    if (!this.active || !this.cache) return;
    this.position = sampleConnectPosition(progress, this.position);
    const target = selectConnectFrame(this.frames, this.position.progress, this.position.direction);
    if (inCheckpoint && !this.progressing) {
      this.progressing = true;
      // Fetch progressively with two network slots, never decode all 300 frames.
      this.cache.preload(this.frames.forward);
    }
    const previousTarget = this.requested;
    this.requested = target;
    if (previousTarget?.url === target.url) {
      // A tiny reversal can stay on the same image. Update direction metadata
      // without restarting its pending decode or assigning src again.
      if (previousTarget.direction !== target.direction) {
        if (this.displayed?.url === target.url) this.displayed = target;
        this.notify({ frame: this.displayed, target,
          pending: this.displayed?.url !== target.url, error: false });
      }
      return;
    }
    this.cache.retainDecodes(target.url);
    this.cache.pin([target.url, this.displayed?.url ?? target.url]);
    this.notify({ frame: this.displayed, target, pending: true, error: false });
    void this.render(target);
  }

  private async render(target: ConnectFrame) {
    const version = ++this.version;
    const cache = this.cache!;
    try {
      const decoded = await cache.get(target.url, 100);
      if (!this.active || version !== this.version || cache !== this.cache) return;
      // Same-frame reversals may have updated diagnostic direction while decoding.
      const current = this.requested!;
      this.displayed = current;
      cache.pin([current.url]);
      this.surface.src = decoded.src;
      this.surface.dataset.source = current.url;
      this.notify({ frame: current, target: current, pending: false, error: false });
      const nearby = [-2, -1, 1, 2].map(offset =>
        this.frames.forward[current.index + offset]).filter((url): url is string => Boolean(url));
      for (const url of nearby) void cache.get(url, 5).catch(() => {});
    } catch {
      if (!this.active || version !== this.version) return;
      this.requested = null;
      this.notify({ frame: this.displayed, target: selectConnectFrame(this.frames, this.position.progress, this.position.direction), pending: false, error: true });
    }
  }

  snapshot() {
    return { ...this.position, target: this.requested
      ?? selectConnectFrame(this.frames, this.position.progress, this.position.direction) };
  }

  stats() { return this.cache?.stats() ?? { decoded: 0, compressed: 0, fetching: 0, decoding: 0, capacity: 0 }; }

  exit() {
    if (!this.active) return;
    this.active = false;
    this.version++;
    this.surface.src = this.frames.forward[0];
    delete this.surface.dataset.source;
    this.cache?.destroy();
    this.cache = null;
    this.requested = null;
    this.displayed = null;
    this.progressing = false;
    this.position = { progress: 0, direction: 'forward' };
    this.notify({ frame: null, target: null, pending: false, error: false });
  }

  destroy() { this.exit(); }
}
