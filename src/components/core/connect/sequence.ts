export type ConnectDirection = 'forward' | 'reverse';
export interface ConnectFrames { forward: readonly string[] }
export interface ConnectFrame { direction: ConnectDirection; index: number; total: number; url: string }

export interface ConnectPosition { progress: number; direction: ConnectDirection }
export const clampConnectProgress = (progress: number) =>
  Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0));

// Only a change in normalized checkpoint position can change sequence selection.
// Equal/clamped progress keeps the last direction, including during the reveal.
export function sampleConnectPosition(progress: number, previous: ConnectPosition): ConnectPosition {
  const p = clampConnectProgress(progress);
  return { progress: p, direction: p > previous.progress ? 'forward'
    : p < previous.progress ? 'reverse' : previous.direction };
}

// Numeric chunks compare numerically; a final ordinal tie-break makes ordering stable.
export function compareFrameNames(a: string, b: string): number {
  const left = a.match(/\d+|\D+/g) ?? [];
  const right = b.match(/\d+|\D+/g) ?? [];
  for (let i = 0; i < Math.min(left.length, right.length); i++) {
    const x = left[i], y = right[i];
    const numeric = /^\d+$/.test(x) && /^\d+$/.test(y);
    const difference = numeric ? Number(x) - Number(y) : x.toLowerCase() < y.toLowerCase() ? -1 : x.toLowerCase() > y.toLowerCase() ? 1 : 0;
    if (difference) return difference;
  }
  return left.length - right.length || (a < b ? -1 : a > b ? 1 : 0);
}

export function selectConnectFrame(frames: ConnectFrames, progress: number, direction: ConnectDirection): ConnectFrame {
  // Travel direction is diagnostic only. Both paths select the same original frame.
  const sequence = frames.forward;
  if (!sequence.length) throw new Error('Connect sequence is empty');
  const p = clampConnectProgress(progress);
  const index = Math.min(sequence.length - 1, Math.max(0, Math.round(p * (sequence.length - 1))));
  return { direction, index, total: sequence.length, url: sequence[index] };
}
