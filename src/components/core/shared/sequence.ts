import type { CoreCheckpointId } from '../../../types/checkpoints';

export type CoreDirection = 'forward' | 'reverse';
export interface CoreFrames {
  forward: readonly string[];
  reverse: readonly string[];
  valid: boolean;
  issue: string | null;
}
export interface CoreFrame { direction: CoreDirection; index: number; total: number; url: string }
export interface CoreDefinition {
  id: CoreCheckpointId;
  label: string;
  scrollViewports: number;
  holdViewports: number;
  available: boolean;
  issue?: string | null;
}
export interface CoreRange extends CoreDefinition { start: number; end: number; exit: number }
export const clampCoreProgress = (p: number) => Math.max(0, Math.min(1, Number.isFinite(p) ? p : 0));
export function selectCoreFrame(frames: CoreFrames, progress: number, direction: CoreDirection): CoreFrame {
  const sequence = frames[direction];
  if (!sequence.length) throw new Error('No validated frames for this checkpoint');
  const p = clampCoreProgress(progress);
  const index = Math.round((direction === 'forward' ? p : 1 - p) * (sequence.length - 1));
  return { direction, index, total: sequence.length, url: sequence[index] };
}
export function layoutCores(definitions: readonly CoreDefinition[]): CoreRange[] {
  let cursor = 0;
  return definitions.map(definition => {
    const start = cursor;
    const end = start + definition.scrollViewports;
    cursor = end + definition.holdViewports;
    return { ...definition, start, end, exit: cursor };
  });
}
export function availableCoreChain(ranges: readonly CoreRange[]) {
  const blocked = ranges.findIndex(range => !range.available);
  return ranges.slice(0, blocked < 0 ? ranges.length : blocked);
}
export const checkpointProgress = (position: number, range: CoreRange) =>
  clampCoreProgress((position - range.start) / (range.end - range.start));
