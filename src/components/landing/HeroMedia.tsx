import { useEffect, useRef, useState } from 'react';
import { BigFrameEnvironment } from './BigFrameEnvironment';
import { assets } from '../../lib/assets';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export function HeroMedia() {
  const video = useRef<HTMLVideoElement>(null);
  const reducedMotion = useReducedMotion();
  const [playing, setPlaying] = useState(false);
  const [pausedByUser, setPausedByUser] = useState(false);

  // Playback responds only to the user's motion preference or explicit control.
  // Scroll, zoom, checkpoint state, and visual opacity never enter this effect.
  useEffect(() => {
    const media = video.current;
    if (!media) return;
    if (reducedMotion || pausedByUser) media.pause();
    else void media.play().catch(() => setPlaying(false));
    return () => media.pause();
  }, [reducedMotion, pausedByUser]);

  return (
    <>
      <div className="plate" aria-hidden="true">
        <BigFrameEnvironment />
        <img className="plate-video plate-poster" src={assets.landingPoster} alt="" fetchPriority="high" />
        <video ref={video} className="plate-video"
          autoPlay={!reducedMotion && !pausedByUser}
          muted loop playsInline preload={reducedMotion ? 'none' : 'auto'} poster={assets.landingPoster}
          aria-hidden="true" tabIndex={-1}
          onPlaying={() => setPlaying(true)} onPause={() => setPlaying(false)}>
          <source src={assets.landingVideo} type="video/mp4" />
        </video>
      </div>
      {!reducedMotion && (
        <button type="button" className="motion-control"
          aria-label={playing ? 'Pause background video' : 'Play background video'}
          onClick={() => {
            setPausedByUser(playing);
            // Retry blocked autoplay directly within the user's click gesture.
            if (!playing) void video.current?.play().catch(() => setPlaying(false));
          }}>
          <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            {playing ? <path d="M5 4h3v12H5zM12 4h3v12h-3z" /> : <path d="m6 3 10 7-10 7z" />}
          </svg>
        </button>
      )}
    </>
  );
}

