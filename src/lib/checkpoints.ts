import { plannedCoreRanges } from '../components/core/corePlan';
import { CONNECT_START_VIEWPORT } from '../components/core/connect/config';
import type { CoreCheckpointBoundary, CoreCheckpointId, PostZoomSnapshot } from '../types/checkpoints';
import { clamp01 } from './frame';

export const coreCheckpoints = Object.fromEntries(plannedCoreRanges.map((range, index) => [
  range.id, { id: range.id, startState: (range.id.toUpperCase() + '_CHECKPOINT_START') as CoreCheckpointBoundary['startState'],
    next: plannedCoreRanges[index + 1]?.id ?? null,
    animationRange: range.available ? { start: CONNECT_START_VIEWPORT + range.start, end: CONNECT_START_VIEWPORT + range.end } : null },
])) as Record<CoreCheckpointId, CoreCheckpointBoundary>;

// A pure scroll sample: the same position always produces the same blend,
// regardless of direction, elapsed time, or how often the user has entered.
export function samplePostZoom(frameProgress: number, transitionProgress: number): PostZoomSnapshot {
  const t = clamp01(transitionProgress);
  return {
    phase: frameProgress < 1 ? 'FRAME_ZOOM'
      : t === 0 ? 'POST_ZOOM_LIGHT'
      : t === 1 ? 'CONNECT_CHECKPOINT_START' : 'CONNECT_REVEAL',
    revealProgress: t * t * (3 - 2 * t),
  };
}


