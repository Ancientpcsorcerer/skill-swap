import { useLayoutEffect, useRef, useState } from 'react';
import frames from 'virtual:connect-frames';
import { ConnectRenderer, type ConnectRenderState } from './ConnectRenderer';
import { clampConnectProgress, selectConnectFrame } from './sequence';

interface Props {
  progress: number;
  active: boolean;
  available: boolean;
}

export function ConnectCheckpoint({ progress: inputProgress, active, available }: Props) {
  const progress = clampConnectProgress(inputProgress);
  const surface = useRef<HTMLImageElement>(null);
  const renderer = useRef<ConnectRenderer | null>(null);
  const props = useRef({ active });
  props.current = { active };
  const [state, setState] = useState<ConnectRenderState>({ frame: null, target: null, pending: false, error: false });

  useLayoutEffect(() => {
    const instance = new ConnectRenderer(surface.current!, frames, setState);
    renderer.current = instance;
    if (import.meta.env.DEV) {
      Object.defineProperty(window, '__CONNECT__', { configurable: true, get: () => ({
        core: 'CONNECT', ...props.current, ...instance.snapshot(),
        displayed: surface.current?.dataset.source ?? frames.forward[0],
        cache: instance.stats(),
      }) });
    }
    return () => {
      instance.destroy();
      renderer.current = null;
      if (import.meta.env.DEV) Reflect.deleteProperty(window, '__CONNECT__');
    };
  }, []);

  useLayoutEffect(() => {
    const instance = renderer.current!;
    if (available) {
      instance.enter();
      instance.update(progress, active);
    } else instance.exit();
  }, [available, active, progress]);

  const target = state.target ?? selectConnectFrame(frames, 0, 'forward');
  const direction = target.direction;
  const checkpointState = progress === 0 ? 'CONNECT_CHECKPOINT_START'
    : progress === 1 ? 'CONNECT_CHECKPOINT_COMPLETE' : 'CONNECT_ANIMATION';

  return (
    <section id="connect-checkpoint" className="core-checkpoint connect-checkpoint" aria-label="Connect checkpoint" aria-busy={state.pending}
      data-checkpoint-id="connect" data-checkpoint-state={checkpointState}
      data-core-progress={progress.toFixed(6)} data-direction={direction}
      data-frame-index={state.frame?.index ?? 0} data-frame-total={target.total}
      data-target-index={target.index} data-render-direction={state.frame?.direction ?? 'forward'}
      data-loading={state.pending} data-frame-error={state.error}>
      <img ref={surface} className="connect-sequence" src={frames.forward[0]}
        width="1920" height="1080" decoding="async" fetchPriority="low"
        alt={progress === 0 ? "Empty Connect environment with diagonal architectural panels"
          : "Connect: hands and dimensional lettering between diagonal architectural panels"} />
    </section>
  );
}
