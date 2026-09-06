import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { Nodes, NodeLabels } from './Nodes';
import { Connections } from './Connections';
import { Atmosphere } from './Atmosphere';
import { CameraRig } from './CameraRig';
import { prefersReducedMotion } from '@/lib/gsap';
import type { GPUTier } from '@/lib/gpu';

interface Props {
  gpuTier: GPUTier;
}

export const ConstellationScene = ({ gpuTier }: Props) => {
  const reduced = prefersReducedMotion();

  if (gpuTier === 'none' || reduced) {
    return <DomFallback />;
  }

  const dpr: [number, number] =
    gpuTier === 'high' ? [1, 2] : gpuTier === 'medium' ? [1, 1.5] : [1, 1.2];

  return (
    <Canvas
      dpr={dpr}
      gl={{
        antialias: gpuTier === 'high' || gpuTier === 'medium',
        powerPreference: 'high-performance',
        alpha: true,
      }}
      camera={{ position: [0, 0.4, 4.5], fov: 38 }}
      style={{ background: 'transparent' }}
    >
      <Suspense fallback={null}>
        <Atmosphere />
        <Nodes />
        <Connections />
        <NodeLabels />
        <CameraRig />
      </Suspense>
    </Canvas>
  );
};

// DOM fallback for no WebGL or reduced motion — pure SVG, fully accessible
const DomFallback = () => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
    aria-hidden
  >
    <svg width="min(80%, 800px)" height="min(80%, 800px)" viewBox="-50 -50 100 100">
      <defs>
        <radialGradient id="domAtmo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(198, 110, 79, 0.12)" />
          <stop offset="100%" stopColor="rgba(198, 110, 79, 0)" />
        </radialGradient>
      </defs>
      <circle cx="0" cy="0" r="48" fill="url(#domAtmo)" />
      <circle cx="0" cy="0" r="32" fill="none" stroke="var(--paper-4)" strokeWidth="0.2" strokeDasharray="1 2" />
      <circle cx="0" cy="0" r="20" fill="var(--ink)" />
      <circle cx="0" cy="0" r="6" fill="var(--accent)" />
      <circle cx="28" cy="0" r="3" fill="var(--ink)" />
      <circle cx="-18" cy="18" r="2.5" fill="var(--ink)" />
      <circle cx="10" cy="-26" r="2" fill="var(--ink)" />
      <circle cx="-26" cy="-12" r="1.6" fill="var(--ink)" />
      <circle cx="22" cy="20" r="1.6" fill="var(--ink)" />
      <circle cx="14" cy="28" r="1.4" fill="var(--ink)" />
      <line x1="0" y1="0" x2="28" y2="0" stroke="var(--accent)" strokeWidth="0.4" />
      <line x1="0" y1="0" x2="-18" y2="18" stroke="var(--accent)" strokeWidth="0.3" />
      <line x1="0" y1="0" x2="10" y2="-26" stroke="var(--accent)" strokeWidth="0.3" />
    </svg>
  </div>
);
