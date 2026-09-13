import { useLayoutEffect, useState } from 'react';
import type { RefObject } from 'react';
import { measureFrame } from '../lib/frame';
import type { ExperienceSnapshot } from '../types/experience';

export function useFrameProgress(track: RefObject<HTMLElement | null>, connectViewports = 0) {
  const [snapshot, setSnapshot] = useState<ExperienceSnapshot>({ frameProgress: 0, transitionProgress: 0, connectProgress: 0, connectDirection: 'forward', experience: 'landing' });

  useLayoutEffect(() => {
    let pending = 0;
    let previousTop = 0;
    let direction: ExperienceSnapshot['connectDirection'] = 'forward';
    const measure = () => {
      pending = 0;
      if (!track.current) return;
      const rect = track.current.getBoundingClientRect();
      if (rect.top !== previousTop) direction = rect.top < previousTop ? 'forward' : 'reverse';
      previousTop = rect.top;
      const next = measureFrame(rect.top, rect.height, window.innerHeight, connectViewports);
      next.connectDirection = direction;
      setSnapshot(previous => (
        previous.frameProgress === next.frameProgress && previous.transitionProgress === next.transitionProgress
        && previous.connectProgress === next.connectProgress && previous.connectDirection === next.connectDirection
        && previous.experience === next.experience
          ? previous : next
      ));
    };
    const schedule = () => { if (!pending) pending = requestAnimationFrame(measure); };
    const observer = new ResizeObserver(schedule);
    if (track.current) observer.observe(track.current);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    measure();
    return () => {
      cancelAnimationFrame(pending);
      observer.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [track, connectViewports]);

  return snapshot;
}


