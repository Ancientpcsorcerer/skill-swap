import type { CSSProperties, ReactNode } from 'react';
import { clamp01 } from '../../lib/frame';
import type { PostZoomSnapshot } from '../../types/checkpoints';

interface Props {
  progress: number;
  checkpoint: PostZoomSnapshot;
  media: ReactNode;
  landing: ReactNode;
  children: ReactNode;
}

// The existing pinned camera and its playing media node continue through the reveal.
// Scroll continuously blends the portal over opaque Connect, in either direction.
export function FrameTransition({ progress, checkpoint, media, landing, children }: Props) {
  const atEndpoint = progress === 1;
  const settled = checkpoint.phase === 'CONNECT_CHECKPOINT_START';
  const style = {
    '--frame-scale': 1 + 11 * progress * progress,
    '--portal-opacity': 1 - checkpoint.revealProgress,
    '--portal-fade-opacity': 1 - clamp01((progress - 0.74) / 0.26),
    '--landing-opacity': 1 - clamp01(progress / 0.18),
  } as CSSProperties;

  return (
    <div className="frame-sticky" style={style} data-progress={progress.toFixed(4)}
      data-zoom-complete={atEndpoint} data-checkpoint-state={checkpoint.phase}
      data-reveal-progress={checkpoint.revealProgress.toFixed(6)}>
      <div className="core-underlay" inert={!settled} aria-hidden={!settled}>
        {children}
      </div>
      <div className="frame-visual" inert={progress > 0} aria-hidden={progress > 0}>
        {media}
      </div>
      <div className="landing-layer" inert={progress >= 0.18} aria-hidden={progress >= 0.18}>
        {landing}
      </div>
    </div>
  );
}


