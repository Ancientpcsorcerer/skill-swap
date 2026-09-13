import { FrameCache } from '../connect/FrameCache';
import { clampCoreProgress, selectCoreFrame, type CoreDirection, type CoreFrame, type CoreFrames } from './sequence';

export interface SequenceState { frame: CoreFrame | null; target: CoreFrame | null; pending: boolean; error: boolean }
const empty = (): SequenceState => ({ frame: null, target: null, pending: false, error: false });

// Each checkpoint creates its own controller and cache. There is no shared playback state.
export class SequenceController {
  private cache: FrameCache | null = null;
  private version = 0;
  private progress = 0;
  private direction: CoreDirection = 'forward';
  private requested: CoreFrame | null = null;
  private displayed: CoreFrame | null = null;
  private progressing = false;
  constructor(private readonly surface: HTMLImageElement, private readonly frames: CoreFrames,
    private readonly notify: (state: SequenceState) => void, private readonly capacity = 8) {}
  enter() {
    if (this.cache || !this.frames.valid) return;
    this.cache = new FrameCache(this.capacity);
    this.cache.preload([...this.frames.forward.slice(0, 4), this.frames.forward.at(-1)!,
      this.frames.reverse[0], ...this.frames.reverse.slice(-3)], 20);
  }
  update(progress: number, active: boolean) {
    const p = clampCoreProgress(progress);
    this.direction = p > this.progress ? 'forward' : p < this.progress ? 'reverse' : this.direction;
    this.progress = p;
    if (!this.cache) return;
    const target = selectCoreFrame(this.frames, p, this.direction);
    if (active && !this.progressing) {
      this.progressing = true;
      this.cache.preload([...this.frames.forward, ...this.frames.reverse]);
    }
    if (this.requested?.url === target.url) return;
    this.requested = target;
    this.cache.retainDecodes(target.url);
    this.cache.pin([target.url, this.displayed?.url ?? target.url]);
    this.notify({ frame: this.displayed, target, pending: true, error: false });
    void this.render(target);
  }
  private async render(target: CoreFrame) {
    const version = ++this.version;
    const cache = this.cache!;
    try {
      const decoded = await cache.get(target.url, 100);
      if (version !== this.version || cache !== this.cache) return;
      this.surface.src = decoded.src;
      await this.surface.decode();
      if (version !== this.version || cache !== this.cache) return;
      this.displayed = target;
      this.surface.dataset.source = target.url;
      cache.pin([target.url]);
      this.notify({ frame: target, target, pending: false, error: false });
      const nearby = [-2, -1, 1, 2].map(offset => this.frames[target.direction][target.index + offset])
        .filter((url): url is string => Boolean(url));
      const opposite = target.direction === 'forward' ? 'reverse' : 'forward';
      nearby.push(selectCoreFrame(this.frames, this.progress, opposite).url);
      for (const url of nearby) void cache.get(url, 5).catch(() => {});
    } catch {
      if (version !== this.version || cache !== this.cache) return;
      this.requested = null;
      this.notify({ frame: this.displayed, target, pending: false, error: true });
    }
  }
  snapshot() {
    return { progress: this.progress, direction: this.direction, requested: this.requested, displayed: this.displayed,
      cache: this.cache?.stats() ?? { decoded: 0, compressed: 0, fetching: 0, decoding: 0, capacity: 0 } };
  }
  exit() {
    if (!this.cache) return;
    this.version++;
    this.surface.src = this.frames.forward[0];
    delete this.surface.dataset.source;
    this.cache.destroy();
    this.cache = null;
    this.requested = null;
    this.displayed = null;
    this.progressing = false;
    this.notify(empty());
    // Keep the normalized sample: returning from a later checkpoint must decrease from 1.
  }
  destroy() { this.exit(); }
}
