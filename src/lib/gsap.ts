// Shared motion helpers
import { gsap } from 'gsap';

export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Reveal on scroll: fade + rise
export const fadeUp = (
  target: gsap.DOMTarget,
  opts: { y?: number; duration?: number; delay?: number; stagger?: number } = {},
): gsap.core.Tween | null => {
  if (prefersReducedMotion()) {
    gsap.set(target, { opacity: 1, y: 0, clearProps: 'all' });
    return null;
  }
  return gsap.from(target, {
    y: opts.y ?? 24,
    opacity: 0,
    duration: opts.duration ?? 0.9,
    delay: opts.delay ?? 0,
    stagger: opts.stagger ?? 0,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: target as gsap.DOMTarget,
      start: 'top 88%',
      once: true,
    },
  });
};

// Pin + scrub master timeline
export const pinScrub = (
  trigger: Element,
  config: { end: string; scrub?: number; onUpdate?: (progress: number) => void },
) => {
  if (prefersReducedMotion()) {
    config.onUpdate?.(1);
    return null;
  }
  return gsap.timeline({
    scrollTrigger: {
      trigger,
      start: 'top top',
      end: config.end,
      pin: true,
      scrub: config.scrub ?? 0.6,
    },
  });
};

// Time-based scrub (called from useFrame)
export const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
