interface Job<T> { url: string; priority: number; resolve: (value: T) => void; reject: (error: unknown) => void }
interface DecodedFrame { src: string; image: HTMLImageElement }
const cancelled = () => new DOMException('Connect cache disposed', 'AbortError');

// Compressed blobs are small (~11 MB for the approved forward sequence). Only a
// bounded neighborhood is decoded; each full-resolution RGBA frame is ~8 MB.
export class FrameCache {
  private blobs = new Map<string, Blob>();
  private decoded = new Map<string, DecodedFrame>();
  private fetches = new Map<string, Promise<Blob>>();
  private decodes = new Map<string, Promise<DecodedFrame>>();
  private fetchQueue: Job<Blob>[] = [];
  private decodeQueue: Job<DecodedFrame>[] = [];
  private controllers = new Set<AbortController>();
  private fetching = 0;
  private decoding = 0;
  private disposed = false;
  private pinned = new Set<string>();

  constructor(private readonly capacity = 8) {}

  stats() {
    return { decoded: this.decoded.size, compressed: this.blobs.size,
      fetching: this.fetching, decoding: this.decoding, capacity: this.capacity };
  }

  pin(urls: string[]) { this.pinned = new Set(urls); this.trim(); }

  preload(urls: readonly string[], priority = 0) {
    for (const url of urls) void this.blob(url, priority).catch(() => {});
  }

  private blob(url: string, priority: number): Promise<Blob> {
    if (this.disposed) return Promise.reject(cancelled());
    const ready = this.blobs.get(url);
    if (ready) return Promise.resolve(ready);
    const pending = this.fetches.get(url);
    if (pending) {
      const queued = this.fetchQueue.find(job => job.url === url);
      if (queued) queued.priority = Math.max(queued.priority, priority);
      return pending;
    }
    const promise = new Promise<Blob>((resolve, reject) => {
      this.fetchQueue.push({ url, priority, resolve, reject });
    });
    this.fetches.set(url, promise);
    this.pumpFetch();
    return promise;
  }

  private pumpFetch() {
    while (!this.disposed && this.fetching < 2 && this.fetchQueue.length) {
      this.fetchQueue.sort((a, b) => b.priority - a.priority);
      const job = this.fetchQueue.shift()!;
      const controller = new AbortController();
      this.controllers.add(controller);
      this.fetching++;
      void fetch(job.url, { signal: controller.signal, cache: 'force-cache' })
        .then(response => { if (!response.ok) throw new Error('Connect frame HTTP ' + response.status); return response.blob(); })
        .then(blob => {
          if (this.disposed) throw cancelled();
          this.blobs.set(job.url, blob);
          job.resolve(blob);
        }).catch(job.reject).finally(() => {
          this.fetching--;
          this.controllers.delete(controller);
          this.fetches.delete(job.url);
          this.pumpFetch();
        });
    }
  }

  retainDecodes(url: string) {
    this.decodeQueue = this.decodeQueue.filter(job => {
      if (job.url === url) return true;
      this.decodes.delete(job.url);
      job.reject(cancelled());
      return false;
    });
  }
  get(url: string, priority = 10): Promise<DecodedFrame> {
    if (this.disposed) return Promise.reject(cancelled());
    const ready = this.decoded.get(url);
    if (ready) {
      this.decoded.delete(url);
      this.decoded.set(url, ready);
      return Promise.resolve(ready);
    }
    const pending = this.decodes.get(url);
    if (pending) {
      const queued = this.decodeQueue.find(job => job.url === url);
      if (queued) queued.priority = Math.max(queued.priority, priority);
      // Promote its network request as well.
      if (this.fetches.has(url)) void this.blob(url, priority).catch(() => {});
      return pending;
    }
    const promise = new Promise<DecodedFrame>((resolve, reject) => {
      this.decodeQueue.push({ url, priority, resolve, reject });
    });
    this.decodes.set(url, promise);
    this.pumpDecode();
    return promise;
  }

  private pumpDecode() {
    while (!this.disposed && this.decoding < 2 && this.decodeQueue.length) {
      this.decodeQueue.sort((a, b) => b.priority - a.priority);
      const job = this.decodeQueue.shift()!;
      this.decoding++;
      let src: string | undefined;
      void this.blob(job.url, job.priority).then(async blob => {
        if (this.disposed) throw cancelled();
        src = URL.createObjectURL(blob);
        const image = new Image();
        image.decoding = 'async';
        image.src = src;
        await image.decode();
        if (this.disposed) throw cancelled();
        const frame = { src, image };
        this.decoded.set(job.url, frame);
        job.resolve(frame);
        // Resolving the requested frame lets its owner pin it before LRU eviction.
        queueMicrotask(() => this.trim());
      }).catch(error => {
        if (src) URL.revokeObjectURL(src);
        job.reject(error);
      }).finally(() => {
        this.decoding--;
        this.decodes.delete(job.url);
        this.pumpDecode();
      });
    }
  }

  private trim() {
    for (const [url, frame] of this.decoded) {
      if (this.decoded.size <= this.capacity) break;
      if (this.pinned.has(url)) continue;
      // Drop references without clearing src: Chromium can retain the broken-image
      // shadow DOM created by clearing a detached preload image.
      URL.revokeObjectURL(frame.src);
      this.decoded.delete(url);
    }
  }

  destroy() {
    if (this.disposed) return;
    this.disposed = true;
    for (const controller of this.controllers) controller.abort();
    for (const job of [...this.fetchQueue, ...this.decodeQueue]) job.reject(cancelled());
    this.fetchQueue = [];
    this.decodeQueue = [];
    for (const frame of this.decoded.values()) {
      URL.revokeObjectURL(frame.src);
    }
    this.decoded.clear();
    this.blobs.clear();
    this.fetches.clear();
    this.decodes.clear();
    this.pinned.clear();
  }
}
