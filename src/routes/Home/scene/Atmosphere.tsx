import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
import { prefersReducedMotion } from '@/lib/gsap';

// Very subtle atmosphere — a back-side sphere with an additive fresnel.
// Reduced from uOpacity 0.15 to 0.04 — was washing the whole scene pink.

const AtmosphereMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor: new THREE.Color('#C66E4F'),
    uOpacity: 0.04,
  },
  /* glsl */ `
    varying vec3 vN;
    varying vec3 vViewDir;
    void main() {
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vN = normalize(normalMatrix * normal);
      vViewDir = normalize(cameraPosition - worldPos.xyz);
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
  /* glsl */ `
    uniform float uTime;
    uniform vec3 uColor;
    uniform float uOpacity;
    varying vec3 vN;
    varying vec3 vViewDir;
    void main() {
      float fres = pow(1.0 - max(dot(vN, vViewDir), 0.0), 3.2);
      gl_FragColor = vec4(uColor, fres * uOpacity);
    }
  `,
);

extend({ AtmosphereMaterial });

export const Atmosphere = () => {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const reduced = prefersReducedMotion();

  useFrame((state) => {
    if (!matRef.current) return;
    if (reduced) return;
    (matRef.current.uniforms as { uTime: { value: number } }).uTime.value =
      state.clock.elapsedTime;
  });

  return (
    <mesh scale={7}>
      <sphereGeometry args={[1, 64, 64]} />
      <atmosphereMaterial
        ref={matRef}
        transparent
        depthWrite={false}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
};
