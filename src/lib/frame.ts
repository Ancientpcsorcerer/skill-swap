import type { ExperienceSnapshot } from '../types/experience';

export const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

// Keep the original landing hold and zoom distance. The following viewport is
// an immediately adjacent, reversible light-to-Connect range, with no timed hold.
export const LANDING_HOLD_VIEWPORTS = 0.25;
export const CONNECT_REVEAL_VIEWPORTS = 1;

export function measureFrame(top: number, height: number, viewportHeight: number, connectViewports = 0): ExperienceSnapshot {
  const connectDistance = viewportHeight * connectViewports;
  const hold = viewportHeight * LANDING_HOLD_VIEWPORTS;
  const revealDistance = viewportHeight * CONNECT_REVEAL_VIEWPORTS;
  const zoomDistance = Math.max(1, height - connectDistance - viewportHeight - hold - revealDistance);
  const travelled = -top - hold;
  const frameProgress = travelled >= zoomDistance - 0.5 ? 1 : clamp01(travelled / zoomDistance);
  // Subpixel tolerance applies only at the actual end of the document.
  const transitionProgress = travelled >= zoomDistance + revealDistance - 0.5
    ? 1 : clamp01((travelled - zoomDistance) / revealDistance);
  return {
    frameProgress,
    transitionProgress,
    connectProgress: connectDistance > 0 ? clamp01((travelled - zoomDistance - revealDistance) / connectDistance) : 0,
    connectDirection: 'forward',
    experience: frameProgress === 0 ? 'landing' : 'frame-transition',
  };
}


