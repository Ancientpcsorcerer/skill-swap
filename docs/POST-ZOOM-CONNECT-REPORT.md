# Portal light to Connect

The former black Skill Swap destination is removed. The existing Frame endpoint now holds its own portal light for 1000 ms, reveals the dimensional Connect environment for 2400 ms, and stays at CONNECT_CHECKPOINT_START with Core progress 0.

## Cause and removal

AppExperience.tsx rendered the centered Skill Swap mark and heading against the stage's black background. FrameTransition faded its scene out over progress 0.74–1 and faded that destination in over 0.84–1. measureFrame selected inside-app at the endpoint.

AppExperience.tsx, its render/import, destination layer, interstitial styles, old opacity variables, and inside-app endpoint mapping have been removed. A fully opaque ivory Connect layer sits behind the retained portal during the reveal.

## Continuity and timing

The four-viewport scroll track, quarter-viewport landing hold, scale = 1 + 11 × progress², and 50% 56% transform origin are unchanged. The retained video pauses during traversal as before. No new white asset, video, seek, replay, or separate camera is introduced.

The late-zoom landing vignette loses its opacity over the former 0.74–1 fade interval. This exposes the source portal light, particularly on portrait layouts where the landing contrast gradient otherwise darkens it. The portal itself no longer fades away during the zoom.

At progress 1, usePostZoomTransition enters POST_ZOOM_LIGHT with opacity 1. samplePostZoom defines an exact 1000 ms hold boundary using performance.now(); the next browser animation frame paints each timed state. The reveal uses smoothstep over 2400 ms and only decreases the existing portal layer's opacity. Camera scale remains 12. No UI or text appears during the hold.

Leaving the endpoint immediately hides the Core layer and cancels the pending animation frame. Re-entry starts a new hold. Strict Mode cleanup and cancellation prevent overlapping runs. The timer stops once Connect settles.

## Reference geometry and materials

Both Ideas/Connect_1_1.png and Ideas/physical depth.png were inspected at their actual 1672 × 941 resolution. Connect_1_1 defines the composition. The physical-depth sheet defines construction and materials; its annotations, detail panels, and different lower-left framing are excluded.

Measured native top-face intersections:

| Structure | First viewport edge | Second viewport edge |
| --- | --- | --- |
| Top right | Top x = 1081–1203 | Right y = 452–569 |
| Bottom left | Left y = 376–506 | Bottom x = 406–535 |

The black faces and narrow gray insets are traced in ConnectEnvironment.tsx. Dark side faces add approximately 16 source pixels of visible extrusion. Separate broad cast shadows and close contact shadows ground the slabs. Matte black gradients, brushed gray noise, an inset edge highlight, and subtle ivory surface grain supply the physical treatment using native SVG/CSS. Depth and shadows continue beyond the viewport crop. The central space stays empty.

At other aspect ratios, a uniform scale of min(viewportWidth / 1672, viewportHeight / 941) preserves diagonal angles and thickness. The two structures stay anchored to the original opposite corners; portrait layouts gain central negative space.

## Checkpoint boundaries

src/lib/checkpoints.ts defines independently keyed Connect, Create, Learn, and Discover boundaries, each with a unique start state and its own future animation range. All ranges are currently null. Only ConnectEnvironment mounts; no Core video or image sequence loads or plays.

CoreExperience owns the connect-checkpoint section and its data-core-progress = 0 boundary. Its appearance can be edited without changing the post-zoom controller. Later checkpoint assets and traversal ranges remain future work.

## Validation

The complete Edge browser suite passed 43 tests with 5 device-specific skips across desktop, phone, and tablet. It covers the exact 1000 ms boundary, a gradual reveal, the same paused media node, an unchanged endpoint transform, cancellation and re-entry from hold/reveal/settled states, and a stationary Connect checkpoint. Existing signup, inactive navigation, guest traversal, reverse scroll, reduced motion, idle playback, touch/wheel, console, and accessibility checks also pass.

Native-resolution visual review compares the traced edges with Connect_1_1 and the depth treatment with the supplied sheet. Screenshots include source-light hold, partial reveal, and settled Connect. Additional viewport and blocked-video checks are recorded in docs/post-zoom.

npm run build and reference SHA-256 checks pass. No WebGL, Three.js, canvas renderer, or new dependency was introduced. All four supplied design reference files retain their original hashes.

