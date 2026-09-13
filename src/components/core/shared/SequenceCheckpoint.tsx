import { useLayoutEffect, useRef, useState } from 'react';
import type { CoreCheckpointId } from '../../../types/checkpoints';
import { SequenceController, type SequenceState } from './SequenceController';
import { checkpointProgress, type CoreFrames, type CoreRange } from './sequence';

export interface CheckpointProps {
  position: number;
  range: CoreRange;
  active: boolean;
  available: boolean;
  onReady: (id: CoreCheckpointId) => void;
}
export function SequenceCheckpoint({ position, range, active, available, onReady, frames, description }:
  CheckpointProps & { frames: CoreFrames; description: string }) {
  const progress = checkpointProgress(position, range);
  const surface = useRef<HTMLImageElement>(null);
  const controller = useRef<SequenceController | null>(null);
  const [state, setState] = useState<SequenceState>({ frame: null, target: null, pending: false, error: false });
  useLayoutEffect(() => {
    const instance = new SequenceController(surface.current!, frames, setState);
    controller.current = instance;
    const diagnostic = '__' + range.id.toUpperCase() + '__';
    if (import.meta.env.DEV) Object.defineProperty(window, diagnostic, {
      configurable: true, get: () => ({ core: range.id.toUpperCase(), ...instance.snapshot() }),
    });
    return () => {
      instance.destroy();
      controller.current = null;
      if (import.meta.env.DEV) Reflect.deleteProperty(window, diagnostic);
    };
  }, [frames, range.id]);
  useLayoutEffect(() => {
    const instance = controller.current!;
    if (available) instance.enter();
    instance.update(progress, active);
    if (!available) instance.exit();
  }, [available, active, progress]);
  useLayoutEffect(() => {
    const requested = controller.current?.snapshot().requested;
    if (active && state.frame && !state.pending && !state.error
      && state.frame.url === requested?.url && surface.current?.complete) onReady(range.id);
  }, [active, progress, state, onReady, range.id]);
  const label = range.id.toUpperCase();
  return (
    <section id={range.id + '-checkpoint'} className="core-checkpoint sequence-checkpoint"
      aria-label={range.label + ' checkpoint'} aria-busy={state.pending}
      data-checkpoint-id={range.id} data-core-progress={progress.toFixed(6)}
      data-checkpoint-state={label + (progress === 0 ? '_CHECKPOINT_START' : progress === 1 ? '_CHECKPOINT_COMPLETE' : '_ANIMATION')}
      data-direction={state.target?.direction ?? 'forward'} data-frame-index={state.frame?.index ?? -1}
      data-target-index={state.target?.index ?? -1} data-frame-total={state.target?.total ?? frames.forward.length}
      data-render-direction={state.frame?.direction ?? 'forward'} data-loading={state.pending} data-frame-error={state.error}>
      <img ref={surface} className="core-sequence" width="1920" height="1080" decoding="async" alt={description} />
    </section>
  );
}
