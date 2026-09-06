// Lightweight GPU tier detection
// We don't pull in useDetectGPU to keep the bundle small
// Instead, a quick tier based on UA + WebGL fingerprint

export type GPUTier = 'high' | 'medium' | 'low' | 'none';

export const detectGPUTier = (): GPUTier => {
  if (typeof window === 'undefined') return 'medium';

  // No WebGL at all
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');
    if (!gl) return 'none';
  } catch {
    return 'none';
  }

  // Reduced motion: treat as low (static composition)
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return 'low';
  }

  // Coarse mobile detection
  const ua = navigator.userAgent.toLowerCase();
  const isMobile = /iphone|ipod|android.*mobile|windows phone/.test(ua);
  const isTablet = /ipad|android(?!.*mobile)/.test(ua);

  // Hard cap: devicePixelRatio as a rough signal
  const dpr = window.devicePixelRatio || 1;

  if (isMobile) {
    if (dpr < 2) return 'low';
    return 'medium';
  }
  if (isTablet) {
    return dpr < 2 ? 'low' : 'medium';
  }
  return 'high';
};
