// Allow `atmosphereMaterial` (and any future drei-style shaderMaterial)
import type { ThreeElements } from '@react-three/fiber';

declare module '@react-three/fiber' {
  interface ThreeElements {
    atmosphereMaterial: ThreeElements['shaderMaterial'] & {
      uTime?: number;
      uColor?: string | number;
      uOpacity?: number;
    };
  }
}
