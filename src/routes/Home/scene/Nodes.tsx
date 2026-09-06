import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { GRAPH_NODES } from '@/data/graph';
import { PROFILE_INDEX } from '@/data/profiles';
import { useGraph } from '@/store/graph';
import { prefersReducedMotion } from '@/lib/gsap';

// Individual mesh per profile. With only 20 profiles, this is fine for perf
// and guarantees each sphere gets its own color (InstancedMesh + per-instance
// color was unreliable in our setup).
export const Nodes = () => {
  const groupRef = useRef<THREE.Group>(null);
  const setHovered = useGraph((s) => s.setHovered);
  const reduced = prefersReducedMotion();

  const baseNodes = useMemo(() => GRAPH_NODES, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    if (reduced) return;
    const t = state.clock.elapsedTime;
    groupRef.current.rotation.y = t * 0.04;
    groupRef.current.position.y = Math.sin(t * 0.2) * 0.05;
  });

  return (
    <group ref={groupRef}>
      {baseNodes.map((n) => {
        const profile = PROFILE_INDEX[n.profileId];
        if (!profile) return null;
        // Protagonists (Aria, Mateo) stay saturated; the wider network
        // is a softer tint of the same hue so each person is still
        // recognizable but the story finds the lead.
        const isProtagonist = (n.focus ?? 0) > 0;
        const sphereColor = isProtagonist
          ? new THREE.Color().setHSL(profile.hue / 360, 0.6, 0.5)
          : new THREE.Color().setHSL(profile.hue / 360, 0.32, 0.66);
        return (
          <mesh
            key={n.profileId}
            position={n.position}
            scale={n.size}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHovered(n.profileId);
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              setHovered(null);
              document.body.style.cursor = '';
            }}
          >
            <sphereGeometry args={[1, 32, 32]} />
            <meshBasicMaterial color={sphereColor} />
          </mesh>
        );
      })}
    </group>
  );
};

// Labels appear on scroll progress, get stronger on hover
export const NodeLabels = () => {
  const hovered = useGraph((s) => s.hovered);
  const cameraProgress = useGraph((s) => s.cameraProgress);
  const showLabels = cameraProgress > 0.25;

  if (!showLabels) return null;

  return (
    <>
      {GRAPH_NODES.map((n) => {
        const profile = PROFILE_INDEX[n.profileId];
        if (!profile) return null;
        const isHovered = hovered === n.profileId;
        return (
          <Html
            key={n.profileId}
            position={n.position}
            center
            distanceFactor={6}
            style={{
              pointerEvents: 'none',
              transition: 'opacity 0.4s var(--ease-out)',
              opacity: isHovered ? 1 : 0.7,
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: isHovered ? '11px' : '10px',
                color: 'var(--ink)',
                background: 'rgba(244, 241, 235, 0.85)',
                padding: '2px 6px',
                borderRadius: '2px',
                whiteSpace: 'nowrap',
                border: isHovered ? '1px solid var(--accent)' : '1px solid transparent',
                letterSpacing: '0.02em',
              }}
            >
              {profile.name}
            </div>
          </Html>
        );
      })}
    </>
  );
};
