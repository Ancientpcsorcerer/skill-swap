import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGraph } from '@/store/graph';
import { prefersReducedMotion } from '@/lib/gsap';

// Scroll-driven camera. Three keyframes for the camera arc:
//   t=0.00  close, on the single Aria node (centered)
//   t=0.40  mid, two nodes + line
//   t=0.75  far, full constellation
//   t=1.00  far + slow rotation
// All positions are far enough back to keep the whole cluster in frame.
const CameraRig = () => {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 0, 5));
  const targetLook = useRef(new THREE.Vector3(0, 0, 0));
  const reduced = prefersReducedMotion();

  useFrame((_, dt) => {
    const t = useGraph.getState().cameraProgress;
    if (reduced) {
      targetPos.current.set(0, 0.5, 5);
      camera.position.lerp(targetPos.current, 0.05);
      camera.lookAt(0, 0, 0);
      return;
    }
    // eased t for smoother arc
    const eased = 1 - Math.pow(1 - t, 2.4);
    // Start a bit closer; pull back to a far position
    targetPos.current.set(
      Math.sin(eased * 0.6) * 0.4,
      0.4 + eased * 0.5,
      5.5 - eased * 1.8,
    );
    targetLook.current.set(0, (eased - 0.4) * 0.1, 0);
    camera.position.lerp(targetPos.current, Math.min(1, dt * 4));
    camera.lookAt(targetLook.current);
  });
  return null;
};

export { CameraRig };
