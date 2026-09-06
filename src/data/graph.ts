import type { GraphEdge, GraphNode } from '@/types';
import { PROFILES } from './profiles';
import { TRADES } from './exchanges';

// 3D graph topology
// Nodes = profiles, placed on a sphere with a Fibonacci-lattice pattern (deterministic)
// Smaller spread and node sizes to keep the scene readable and not dominated by one sphere

// Fibonacci sphere lattice — distributes N points evenly
const fibonacciSphere = (n: number, radius = 1) => {
  const points: Array<[number, number, number]> = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    const x = Math.cos(theta) * r;
    const z = Math.sin(theta) * r;
    points.push([x * radius, y * radius, z * radius]);
  }
  return points;
};

// Smaller spread so all 20 nodes fit in frame
const clusterPositions = (count: number): Array<[number, number, number]> => {
  const fib = fibonacciSphere(count, 1);
  return fib.map(([x, y, z]) => [
    x * 2.2,
    y * 1.4,
    z * 2.2,
  ] as [number, number, number]);
};

// Each node carries a focus priority. The two "protagonists" of the
// narrative (Aria, Mateo) are bright; the wider community is dim —
// the network supports them, not the other way around.
export const FOCUS_PROFILES = new Set(['p.aria', 'p.mateo']);

export const GRAPH_NODES: GraphNode[] = PROFILES.map((p, i) => {
  const positions = clusterPositions(PROFILES.length);
  const position = positions[i] ?? [0, 0, 0];
  return {
    profileId: p.id,
    position,
    size: 0.13,
    focus: FOCUS_PROFILES.has(p.id) ? 1 : 0,
  };
});

const _tradePairs = new Set<string>();
const exchangeEdges: GraphEdge[] = [];

for (const t of TRADES) {
  const key = [t.fromId, t.toId].sort().join(':');
  if (_tradePairs.has(key)) continue;
  _tradePairs.add(key);
  exchangeEdges.push({ from: t.fromId, to: t.toId, type: 'exchange' });
}

const exchangeSet = new Set(
  exchangeEdges.flatMap((e) => [`${e.from}:${e.to}`, `${e.to}:${e.from}`]),
);

const couldMatchEdges: GraphEdge[] = [];
for (const a of PROFILES) {
  for (const b of PROFILES) {
    if (a.id >= b.id) continue;
    if (exchangeSet.has(`${a.id}:${b.id}`)) continue;
    const aTeachesBLearns = a.teaches.some((s) => b.learns.includes(s));
    const bTeachesALearns = b.teaches.some((s) => a.learns.includes(s));
    if (aTeachesBLearns || bTeachesALearns) {
      couldMatchEdges.push({
        from: a.id,
        to: b.id,
        type: aTeachesBLearns && bTeachesALearns ? 'wants-to-learn' : 'could-teach',
      });
    }
  }
}

export const GRAPH_EDGES: GraphEdge[] = [...exchangeEdges, ...couldMatchEdges];

export const GRAPH_STATS = {
  profileCount: PROFILES.length,
  exchangeCount: exchangeEdges.length,
  couldMatchCount: couldMatchEdges.length,
  totalTrades: TRADES.length,
  totalHoursTraded: TRADES.length,
};
