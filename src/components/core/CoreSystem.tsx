import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { ConnectCheckpoint } from './connect/ConnectCheckpoint';
import { CONNECT_SCROLL_VIEWPORTS } from './connect/config';
import { CreateCheckpoint, createDefinition } from './create/CreateCheckpoint';
import { LearnCheckpoint, learnDefinition } from './learn/LearnCheckpoint';
import { DiscoverCheckpoint, discoverDefinition } from './discover/DiscoverCheckpoint';
import { availableCoreChain, checkpointProgress, layoutCores } from './shared/sequence';
import type { CheckpointProps } from './shared/SequenceCheckpoint';
import type { CoreCheckpointId } from '../../types/checkpoints';

// Ranges are assembled from independent definitions; there is no combined animation timeline.
export const coreRanges = layoutCores([
  { id: 'connect', label: 'Connect', scrollViewports: CONNECT_SCROLL_VIEWPORTS, holdViewports: 0, available: true },
  createDefinition, learnDefinition, discoverDefinition,
]);
export const publicCoreChain = availableCoreChain(coreRanges);
export const CORE_SCROLL_VIEWPORTS = publicCoreChain.at(-1)!.exit;

function ConnectAdapter({ position, range, active, available, onReady }: CheckpointProps) {
  const root = useRef<HTMLDivElement>(null);
  const progress = checkpointProgress(position, range);
  const activeRef = useRef(active);
  const checkRef = useRef<(() => void) | null>(null);
  activeRef.current = active;
  useLayoutEffect(() => {
    const node = root.current!;
    const check = () => {
      const image = node.querySelector('img');
      const checkpoint = node.querySelector<HTMLElement>('#connect-checkpoint');
      if (activeRef.current && checkpoint?.dataset.cinematicDisabled === 'true') { onReady('connect'); return; }
      if (activeRef.current && image?.complete && image.naturalWidth && checkpoint?.dataset.loading === 'false'
        && checkpoint.dataset.frameIndex === checkpoint.dataset.targetIndex) onReady('connect');
    };
    checkRef.current = check;
    // Observe rendering metadata only; this performs no layout measurement.
    const observer = new MutationObserver(check);
    observer.observe(node, { subtree: true, attributes: true, attributeFilter: ['data-loading', 'data-frame-index', 'src'] });
    node.addEventListener('load', check, true);
    check();
    return () => { checkRef.current = null; observer.disconnect(); node.removeEventListener('load', check, true); };
  }, [onReady]);
  useLayoutEffect(() => { checkRef.current?.(); }, [active, progress]);
  return <div ref={root}><ConnectCheckpoint progress={progress} active={active} available={available} /></div>;
}
const components = { connect: ConnectAdapter, create: CreateCheckpoint, learn: LearnCheckpoint, discover: DiscoverCheckpoint };
export const checkpointComponents = components;

export function CoreSystem({ position, active, available }: { position: number; active: boolean; available: boolean }) {
  const requested = publicCoreChain.find(range => position <= range.exit) ?? publicCoreChain.at(-1)!;
  const requestedId = useRef(requested.id);
  requestedId.current = requested.id;
  const [displayed, setDisplayed] = useState<CoreCheckpointId>('connect');
  const displayedRef = useRef(displayed);
  displayedRef.current = displayed;
  const onReady = useCallback((id: CoreCheckpointId) => {
    if (id === requestedId.current && id !== displayedRef.current) { displayedRef.current = id; setDisplayed(id); }
  }, []);
  const index = publicCoreChain.findIndex(range => range.id === requested.id);
  const progress = checkpointProgress(position, requested);
  useLayoutEffect(() => {
    if (!import.meta.env.DEV) return;
    Object.defineProperty(window, '__CORES__', { configurable: true, get: () => ({
      requested: requested.id, displayed, position, blockedAt: coreRanges.find(range => !range.available)?.id ?? null,
      checkpoints: coreRanges.map(range => ({ ...range, progress: checkpointProgress(position, range) })),
    }) });
    return () => { Reflect.deleteProperty(window, '__CORES__'); };
  }, [requested.id, displayed, position]);
  return <div className="core-system" data-current-core={displayed} data-requested-core={requested.id}>
    {publicCoreChain.map((range, slot) => {
      const Component = components[range.id];
      const prepare = slot === index || range.id === displayed || (slot === index + 1 && progress >= .75)
        || (slot === index - 1 && progress <= .25);
      return <div key={range.id} className="core-slot" data-visible={range.id === displayed}
        inert={range.id !== displayed} aria-hidden={range.id !== displayed}>
        <Component position={position} range={range} active={active && range.id === requested.id}
          available={available && prepare} onReady={onReady} />
      </div>;
    })}
  </div>;
}
