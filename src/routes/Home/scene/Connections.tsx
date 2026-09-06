import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import { GRAPH_EDGES, GRAPH_NODES } from '@/data/graph';
import { prefersReducedMotion } from '@/lib/gsap';

const colors = {
  exchange: '#C66E4F',
  could: '#8B847D',
  wants: '#A8563A',
};

export const Connections = () => {
  const reduced = prefersReducedMotion();
  const lineRefs = useRef<Map<number, THREE.Line>>(new Map());

  const nodeIndex = useMemo(() => {
    const m = new Map<string, [number, number, number]>();
    for (const n of GRAPH_NODES) m.set(n.profileId, n.position);
    return m;
  }, []);

  useFrame((state) => {
    if (reduced) return;
    const t = state.clock.elapsedTime;
    lineRefs.current.forEach((line, key) => {
      const mat = line.material as THREE.LineBasicMaterial;
      mat.opacity = 0.5 + Math.sin(t * 0.7 + key * 0.5) * 0.15;
    });
  });

  return (
    <group>
      {GRAPH_EDGES.map((edge, i) => {
        const from = nodeIndex.get(edge.from);
        const to = nodeIndex.get(edge.to);
        if (!from || !to) return null;
        const isExchange = edge.type === 'exchange';
        const color = isExchange
          ? colors.exchange
          : edge.type === 'wants-to-learn'
            ? colors.wants
            : colors.could;
        const opacity = isExchange ? 0.7 : 0.18;
        const lineWidth = isExchange ? 1.2 : 0.6;

        return (
          <Line
            key={`${edge.type}-${edge.from}-${edge.to}-${i}`}
            points={[from, to]}
            color={color}
            lineWidth={lineWidth}
            transparent
            opacity={opacity}
            ref={(l) => {
              if (l) lineRefs.current.set(i, l as unknown as THREE.Line);
            }}
          />
        );
      })}
    </group>
  );
};
