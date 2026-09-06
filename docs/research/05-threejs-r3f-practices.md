# Three.js, React Three Fiber & Drei — August 2026 Best Practices

**Audience:** Skill-Swap Platform spatial 3D experience. **Date:** 2026-08-26.

## 1. Current Versions (npm, 2026-08-26)

| Package | Version | Notes |
| --- | --- | --- |
| `three` | `0.185.1` | Three.js still on 0.x; WebGPU renderer ships in `three/webgpu` and the unified `WebGPURenderer` is the default in `examples/jsm`. |
| `@react-three/fiber` | `9.7.0` | Major v9 requires **React 19**; drops legacy WebGL1 reconciliation, improves re-render perf. |
| `@react-three/drei` | `10.7.8` | Tracks R3F v9 + React 19; `ScrollControls`, `CameraControls`, `Instances`, `Detailed`, `Float`, `MeshDistortMaterial`, `useReducedMotion` all stable. |
| `three-stdlib` | pin to drei peer | Use for `Line2`, `LineGeometry`, `LineMaterial` if you import three.js examples. |

Install with `npm i three @react-three/fiber @react-three/drei @types/three` and pin Vite to `define: { 'process.env.NODE_ENV': JSON.stringify(mode) }` for tree-shaking.

## 2. Performance Patterns

### `InstancedMesh` and the `<Instances>` helper

Use `THREE.InstancedMesh` (or drei's `<Instances>` / `<Instance>` JSX) when you have more than ~50 identical objects. Below that threshold, draw-call batching via shared material is usually cheaper. The dominant 2026 pattern is the **"levels + instances"** combo: one InstancedMesh per LOD tier, swapped by distance.

```jsx
<Instances limit={5000} range={5000}>
  <sphereGeometry args={[0.4, 16, 16]} />
  <meshStandardMaterial color="#7dd3fc" />
  {nodes.map((n, i) => <Instance key={i} position={n.pos} />)}
</Instances>
```

For per-instance frustum culling, sorting, and visibility flags, `three.ez/instanced-mesh` (InstancedMesh2) is the production go-to in 2026.

### LOD

Use `THREE.LOD` directly, or the idiomatic `<Detailed>` component from drei, which maps children to `addLevel()` calls. Pre-bake the tiers with `gltf-transform` rather than runtime decimation.

```jsx
<Detailed distances={[0, 25, 75]}>
  <mesh geometry={high} />
  <mesh geometry={mid} />
  <mesh geometry={low} />
</Detailed>
```

### Texture compression

KTX2 + Basis Universal is the 2026 default. Generate with `toktx --t2 --genmipmap --bcmp input.ktx2 input.png`. Pick `ETC1S` for color and `UASTC` for normals. Load via `KTX2Loader` with a single shared `Transcoder`. Typical results: 5–8× smaller than PNG, GPU-native decode for BC7, no runtime mipmap cost. Always set `colorSpace = SRGBColorSpace` for color and `LinearSRGBColorSpace` for data textures.

### Shader optimization

- Use `ShaderMaterial` (or `shaderMaterial` from drei) and avoid uniform branches in the fragment stage.
- Prefer `IcosahedronGeometry` over `SphereGeometry` for large background shaders — better vertex distribution, no pole pinching.
- For atmosphere/glow: `BackSide` rendering on a slightly scaled mesh, `AdditiveBlending`, `depthWrite: false`, fresnel `pow(1.0 - dot(viewDir, normal), 2.0)`.
- Combine with `scene.fog` by including `<fog_pars_fragment>` in your shader and setting `fog: true` on the material.

### Frustum culling

Three.js culls by default, but `InstancedMesh` does not cull per instance. Either use InstancedMesh2 (per-instance culling) or split your instancing by spatial bucket. Set `object.frustumCulled = false` only on full-screen quads / postprocess.

### Lazy loading scenes

Wrap the heavy 3D canvas in `React.lazy(() => import('./Scene'))` behind an `IntersectionObserver`. Use `<Suspense fallback={<DomFallback />}>` and `useProgress` from drei to show a `Html` progress HUD. Preload with `<link rel="modulepreload">`.

### Worker-based physics

For >500 nodes, run the force simulation off the main thread: `d3-force-3d` in a Web Worker, posting `{nodes, links}` delta per tick. On the main thread, only lerp the rendered positions toward the worker-computed targets (`useFrame`).

## 3. Common Patterns

### Network / graph visualization

`react-force-graph-3d` (Vasco Asturiano) wraps `3d-force-graph` and d3-force-3d. It composes cleanly inside an R3F scene, supports `linkDirectionalParticles`, custom node renderers via `nodeThreeObject`, and CurvedLink for tubes. For tighter integration, run `d3-force-3d` yourself inside a `useMemo` and push positions into `Instance.matrix` per frame.

```jsx
const fgRef = useRef();
useFrame(() => fgRef.current.tickFrame());
<ForceGraph3D ref={fgRef} graphData={data} nodeThreeObject={nodeObject} linkWidth={1.5} />
```

### Camera animation / scroll

`<ScrollControls pages={N} damping={0.2}>` plus `useScroll().offset` is the canonical 2026 pattern. Drive camera position, FOV, or a uniform:

```jsx
const scroll = useScroll();
useFrame((state) => {
  state.camera.position.z = 5 - scroll.offset * 12;
  state.camera.fov = 45 + scroll.offset * 20;
  state.camera.updateProjectionMatrix();
});
```

For free orbit + scripted, use `CameraControls` from drei (damped, eventful, supports `fitToBox`, `dollyToCursor`).

### Particle systems

For skill/person nodes, use `<Points>` with `<PointsMaterial size={0.05} sizeAttenuation transparent />` for thousands of lightweight dots, or `<Instances>` when you need shaped nodes. Animate `material.size` with a sine or noise function in `useFrame`. For trails, layer a `meshLine` after-image.

### Connection lines

- **Line2** (`three-stdlib`): screen-space pixel width, depth-correct, best for crisp diagrams. Pair with `LineMaterial({ linewidth: 2, resolution: [w, h] })` and update `resolution` on resize.
- **MeshLine** (spite/meshline v3): mesh-based, glows/additive-blends well, ideal for animated, hazy connections.
- **TubeGeometry** along a curve: best for 3D pipes but heavier; cap at a few hundred.

### Custom shaders for atmosphere

```jsx
const Atmosphere = shaderMaterial(
  { uTime: 0, uColor: new THREE.Color('#4ca6ff') },
  /* glsl */`varying vec3 vN; void main(){ vN = normalize(normalMatrix*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  /* glsl */`varying vec3 vN; uniform vec3 uColor; uniform float uTime;
    void main(){ float f = pow(1.0 - dot(normalize(vN), normalize(cameraPosition - (modelMatrix*vec4(0.)).xyz)), 2.0);
    gl_FragColor = vec4(uColor * f * 1.4, f); }`
);
extend({ Atmosphere });
<mesh><sphereGeometry args={[1.05, 64, 64]} /><atmosphereMaterial transparent side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
```

## 4. Drei Helpers Worth Using

- `<ScrollControls>` + `useScroll()` — scroll-driven 3D
- `<CameraControls>` — better than OrbitControls for polished UX
- `<Float>` — gentle hover bob on cards/nodes
- `<Instances>` / `<Instance>` — declarative InstancedMesh
- `<Detailed>` — declarative LOD
- `<MeshDistortMaterial>` / `<MeshTransmissionMaterial>` — cheap "wow" materials
- `<Edges>`, `<Outlines>`, `<ContactShadows>` — depth and grounding
- `<Html occlude>` — DOM nodes anchored in 3D
- `useReducedMotion`, `useDetectGPU`, `PerformanceMonitor` (drei v10)
- `Environment` with `preset="city"` for IBL on PBR materials

## 5. Open Source References

- **pmndrs** — pmndrs.com, github.com/pmndrs/drei. Drei source is the best pattern reference.
- **Bruno Simon** — bruno-simon.com, threejs-journey.com. WebGL/WebGPU lead on three.js; his portfolio remains the gold standard for ScrollTrigger + physics + postprocessing.
- **3d-force-graph** — vasturiano.github.io/3d-force-graph.
- **Codrops / tympanus** — searchable R3F tutorials.
- Awwwards, FWA — for case studies of Active Theory, Resn, Locomotive Scroll, Tool of North America.

## 6. Mobile / WebGL Performance

- Cap `dpr={[1, 1.5]}` on `<Canvas>`; phones rarely benefit from 3.
- Set `gl={{ powerPreference: 'high-performance', antialias: false }}` then add `EffectComposer` with FXAA/SMAA selectively.
- Use `PerformanceMonitor` from drei to dynamically lower dpr / disable postFX when FPS drops.
- Test on a 2019 mid-range Android (Mali-G57) — that's your floor.
- Prefer `RGBA8` over `RGBA16F` for textures unless you need HDR.

## 7. WebGL Fallbacks

Use `useDetectGPU()` (drei) and `navigator.gpu` to tier the experience:

| Tier | dpr | PostFX | Particle count |
| --- | --- | --- | --- |
| WebGPU desktop | 2 | full | 5000 |
| WebGL2 modern mobile | 1.5 | SMAA only | 1500 |
| WebGL2 low-end | 1 | off | 400 |
| No WebGL | — | — | DOM-only fallback |

```jsx
const tier = useDetectGPU({ benchmarkURL: '/gpu-bench' });
if (!tier.tier) return <DomGraph data={data} />;
```

The DOM fallback should be a static SVG force layout (e.g. `d3-force` rendered to SVG) so users without WebGL still get a working product.

## 8. Reduced Motion

`useReducedMotion()` from drei returns `true` when `prefers-reduced-motion: reduce` is set. Branch animations:

```jsx
const reduced = useReducedMotion();
useFrame((_, dt) => { if (reduced) return; /* animate */ });
```

Replace ambient particle drift, camera dolly, and shader time uniforms with a single static frame. Keep transitions on UI elements (they are user-triggered and usually exempt).

## 9. State Management

**Zustand** is the 2026 default with R3F. Subscribe inside components so only the relevant nodes re-render, and read state inside `useFrame` via a ref to avoid React renders per frame:

```js
export const useStore = create((set) => ({ hovered: null, setHovered: (h) => set({ hovered: h }) }));
// Component
const hovered = useStore((s) => s.hovered);
// useFrame (no re-render)
useFrame(() => { if (useStore.getState().hovered) {/*...*/} });
```

For declarative springs (mount/unmount, gestures), `@react-spring/three` integrates without React reconciler churn. Use `useFrame` only for per-frame continuous work (camera, shader uniforms, sim ticks). GSAP timelines via `gsap` + `useGSAP` are still common for choreographed sequences.

## 10. Bundle Size & Tree-Shaking

- Import from `three` entrypoint only what you need: `import { Vector3, Color } from 'three'`. Avoid `import * as THREE`.
- Use `three/addons/...` and `three/examples/jsm/...` paths for examples modules; Vite + Rollup tree-shake these.
- For drei, import named: `import { OrbitControls } from '@react-three/drei'`. Drei is side-effect-free.
- Measure with `vite-bundle-visualizer` or `rollup-plugin-visualizer`. Budget <300 KB gzipped initial JS for a marketing-grade 3D experience.
- Defer heavy addons (postprocessing, glTF) behind a route or `lazy()` import.
- Compress textures (KTX2), Draco-compress glTF, Meshopt-compress where supported.

## Concrete Skill-Swap Recommendations

1. **Stack:** `three@0.185.1`, `@react-three/fiber@9.7.0`, `@react-three/drei@10.7.8`, `react@19`, `zustand`, `@react-spring/three` for mount transitions, `d3-force-3d` in a Web Worker for the skill graph.
2. **Graph:** force-directed 3D, <800 nodes on mobile, <3000 on desktop; render nodes as `<Instances>` (sphere), edges as `Line2` with `linkDirectionalParticles` for energy flow.
3. **Camera:** `CameraControls` for free orbit, `ScrollControls` for the landing-page scroll-into-graph sequence.
4. **Atmosphere:** fresnel shader on a back-side sphere + KTX2 sky environment, `prefers-reduced-motion` disables the time uniform.
5. **Mobile tier:** `useDetectGPU` + `PerformanceMonitor` to scale dpr and particle count; DOM/SVG fallback if WebGL absent.
6. **A11y:** DOM graph alternative, keyboard navigation, `useReducedMotion`, focus-visible outlines on `<Html>` anchors.
7. **Bundle target:** <300 KB gz initial, lazy-load the 3D scene, KTX2 + Draco on all assets.

## Sources

- [100 Three.js Tips That Actually Improve Performance (2026) — Utsubo](https://www.utsubo.com/blog/threejs-best-practices-100-tips)
- [Instanced Rendering in Three.js — Wael Yasmina](https://waelyasmina.net/articles/instanced-rendering-in-three-js/)
- [three.ez InstancedMesh2](https://threejsresources.com/tool/three-ez-instanced-mesh)
- [Three.js LOD docs](https://threejs.org/docs/#api/en/objects/LOD)
- [Optimizing Three.js scenes with LOD and instancing — LogRocket](https://blog.logrocket.com/optimizing-three-js-lod-instancing-2025/)
- [drei Detailed source](https://github.com/pmndrs/drei/blob/master/src/core/Detailed.tsx)
- [3d-force-graph — Vasco Asturiano](https://github.com/vasturiano/3d-force-graph)
- [prefers-reduced-motion with R3F — DEV](https://dev.to/janeoriordan/prefers-reduced-motion-with-r3f-1j1f)
- [Three.js performance tips — Discover Three.js](https://discoverthreejs.com/tips-and-tricks/)
- [WebGL fallback strategies — web.dev](https://web.dev/articles/webgl-gpu)
- [Accessibility at the heart of spatial design — three.js Discourse](https://discourse.threejs.org/t/accessibility-at-the-heart-of-spatial-design-reflections-from-2025/64075)
- [drei docs (pmndrs)](https://drei.pmnd.rs/)
- [R3F v9 release notes (pmndrs/react-three-fiber)](https://github.com/pmndrs/react-three-fiber/releases)
