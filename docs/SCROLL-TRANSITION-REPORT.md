# Scroll-driven Frame / Connect correction

This change fixes only the delay, interrupted background playback, and abrupt reverse blend. The supplied physical-depth and Connect geometry references were inspected again. Their assets and the existing environment implementation remain unchanged.

## Causes and fixes

- usePostZoomTransition introduced a 1000 ms hold and 2400 ms timer. Both durations and the hook are removed. samplePostZoom now derives the blend directly from scroll progress.
- App passed suspended whenever zoom progress was positive. HeroMedia paused for that prop and latched the finite clip's ended state. The prop and ended latch are removed. One persistent video uses native looping; scroll never calls play, pause, load, or assigns currentTime. Explicit pause and reduced motion remain supported.
- Leaving the zoom endpoint reset the timed reveal to zero. The same scroll observer now measures an adjacent transition range. Its smoothstep blend is sampled identically in both directions, while zoom stays at its endpoint until the white light is fully restored.

## Scroll boundaries

The track gains one viewport for the reveal. The original zoom distance, curve, origin, media crop, and responsive layout are preserved.

| Scroll position, in viewport heights | Behavior |
| --- | --- |
| 0–0.25 | Existing landing interval |
| 0.25–3 | Existing zoom: scale 1 + 11 × progress², origin 50% 56% |
| 3 | Full source portal light; no timed hold |
| 3–4 | Continuous white-light / Connect interpolation |
| 4 | Independently scoped Connect checkpoint at Core progress 0 |

Every forward pixel beyond the zoom boundary starts revealing Connect. Stopping scroll retains the chosen blend. Reverse scroll retraces that blend before the camera zoom reverses. A one-pixel reverse at Connect produces less than 0.001 white-layer opacity instead of jumping to 1.

The retained Connect underlay is visible throughout the reveal range. Its pre-zoom visibility guard changes only while the source portal is fully opaque. It does not determine the blend.

Connect remains isolated in CoreExperience and its checkpoint registry. No Connect Core animation, later Core range, or new renderer is introduced.

## Verification

- Build and TypeScript pass.
- All 43 applicable browser tests pass across desktop, phone, and tablet; 5 device-specific cases are skipped. Two initial failures were overly exact zoom assertions at fractional native scroll positions. After allowing normal pixel rounding, both passed on rerun.
- Repeated complete forward/backward traversals keep the same video element playing. Instrumented play/pause/load calls and currentTime setters do not change during traversal.
- A real native loop under the fully revealed Connect layer continues playback and returns to landing without freezing.
- Immediate reveal, stationary intermediate blend, one-pixel reverse, progressive reverse opacity, and camera retracing pass.
- Existing navigation, signup/focus restoration, guest access, touch/wheel, accessibility, and reduced-motion checks pass.
- Additional small-phone, landscape, ultrawide, and failed-video checks pass.
- Native Connect screenshots before/after this task are pixel-identical. Forward/reverse midpoint captures are pixel-identical with reduced-motion poster playback on desktop and phone.
- The source video, poster, landing stylesheet, Connect component, and Core stylesheet retain their pre-task SHA-256 hashes. All four supplied design-reference hashes also match.

Current captures and viewport evidence: [scroll-transition](scroll-transition). This report supersedes the timed hold and playback-freeze behavior described in the earlier post-zoom report.

