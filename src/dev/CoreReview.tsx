import { useCallback, useLayoutEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { checkpointComponents, coreRanges } from '../components/core/CoreSystem';
import type { CoreCheckpointId } from '../types/checkpoints';
import '../styles/core.css';
import './core-review.css';

// This development entry is not an application route or a production build input.
function CoreReview() {
  const [requested, setRequested] = useState(new URLSearchParams(location.search).get('core') ?? 'learn');
  const definition = coreRanges.find(range => range.id === requested) ?? coreRanges[2];
  const range = { ...definition, start: 0, end: definition.scrollViewports, exit: definition.scrollViewports + definition.holdViewports };
  const [position, setPosition] = useState(scrollY / innerHeight);
  const [ready, setReady] = useState(false);
  const onReady = useCallback((_id: CoreCheckpointId) => setReady(true), []);
  useLayoutEffect(() => {
    let pending = 0;
    const measure = () => { pending = 0; setPosition(scrollY / innerHeight); };
    const schedule = () => { if (!pending) pending = requestAnimationFrame(measure); };
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', schedule);
    measure();
    return () => { cancelAnimationFrame(pending); removeEventListener('scroll', schedule); removeEventListener('resize', schedule); };
  }, []);
  const Component = checkpointComponents[range.id];
  const progress = Math.max(0, Math.min(1, position / range.scrollViewports));
  return <>
    <header className="review-controls">
      <strong>Checkpoint review</strong>
      <nav>{coreRanges.map(core => <button key={core.id} type="button" aria-current={core.id === range.id ? 'page' : undefined}
        onClick={() => { scrollTo(0, 0); setPosition(0); setReady(false); setRequested(core.id); history.replaceState(null, '', '?core=' + core.id); }}>{core.label}</button>)}</nav>
      <label>Progress <input id="review-progress" type="range" min="0" max="1" step=".001" value={progress}
        onChange={event => scrollTo(0, Number(event.target.value) * range.scrollViewports * innerHeight)} /></label>
      <output>{progress.toFixed(3)} {ready ? 'ready' : ''}</output>
    </header>
    {range.available ? <main className="review-track" style={{ height: (range.exit + 1) * 100 + 'dvh' }}>
      <div className="review-stage">
        <Component position={position} range={range} active={true} available={true} onReady={onReady} />
      </div>
    </main> : <main className="review-unavailable"><h1>{range.label} is awaiting valid assets</h1><p>{range.issue}</p>
      <p>No duplicated Connect frames or provisional keycap interaction are rendered.</p></main>}
  </>;
}
if (import.meta.env.DEV) createRoot(document.getElementById('review-root')!).render(<CoreReview />);
