import { useLayoutEffect, useState } from 'react';

// Integration observes the existing checkpoint's completed render; it does not control cinematic playback.
export function CinematicEntry({ enabled, onEnter }: { enabled: boolean; onEnter: () => void }) {
  const [ready, setReady] = useState(false);
  useLayoutEffect(() => {
    if (!enabled) { setReady(false); return; }
    const checkpoint = document.getElementById('connect-checkpoint');
    if (!checkpoint) return;
    const check = () => {
      const data = checkpoint.dataset;
      const image = checkpoint.querySelector('img');
      setReady(data.coreProgress === '1.000000' && data.loading === 'false' && data.frameError === 'false'
        && (data.cinematicDisabled === 'true' || (Number(data.frameIndex) === Number(data.frameTotal) - 1 && Boolean(image?.complete && image.naturalWidth))));
    };
    const observer = new MutationObserver(check);
    observer.observe(checkpoint, { subtree: true, attributes: true,
      attributeFilter: ['data-core-progress', 'data-loading', 'data-frame-index', 'data-frame-error', 'src'] });
    checkpoint.addEventListener('load', check, true); check();
    return () => { observer.disconnect(); checkpoint.removeEventListener('load', check, true); };
  }, [enabled]);
  if (!enabled || !ready) return null;
  return <div className="cinematic-entry"><button type="button" onClick={onEnter}>Enter Connect <span aria-hidden="true">&#8599;</span></button>
</div>;
}
