# CONNECT checkpoint implementation

Historical checkpoint report. The user subsequently approved using Connect_start for both directions to remove mismatches between the two source sequences. See [the current synchronization report](CONNECT-SYNCHRONIZATION-REPORT.md) for the final runtime policy and validation.

Only CONNECT is implemented. The existing landing video, Frame zoom, and scroll-driven white-light blend lead into a dedicated image-sequence checkpoint. Increasing scroll uses Connect_start; decreasing scroll uses Connect_back. At the end, the completed CONNECT composition remains stationary.

## Inspected sources and ordering

Both authoritative source folders were enumerated before implementation. First, middle, and last images were inspected at their original resolution, along with Ideas/physical depth.png and the existing implementation.

| Source | Count | Dimensions | Ordered filenames | Bytes |
| --- | ---: | --- | --- | ---: |
| Cores/Connect_start | 300 | 1920 x 1080 | ezgif-frame-001.jpg through ezgif-frame-300.jpg | 10,864,597 |
| Cores/Connect_back | 300 | 1920 x 1080 | ezgif-frame-001.jpg through ezgif-frame-300.jpg | 10,156,801 |

The first forward image and last reverse image show the empty diagonal-panel environment. The last forward and first reverse images show the completed hands/CONNECT composition. The dedicated reverse sequence contains its own choreography and is used directly.

The comparator sorts numeric filename segments numerically, with deterministic string/tie ordering. Counts are discovered independently for each sequence. Runtime mapping uses zero-based indices:

- Forward: round(clamp(p, 0, 1) * (N - 1)).
- Reverse: round((1 - clamp(p, 0, 1)) * (M - 1)).

The source files remain in place. Development serves the original folders. The Vite asset plugin packages only these two folders into dist/cores for standalone production deployment. All 600 packaged files were checked byte for byte against the originals.

## Master image and visual treatment

The frames already contain the background, diagonal architectural panels, inset strips, lighting, shadows, hands, and lettering. The renderer displays the complete supplied frame without adding duplicate slabs or rebuilding generated motion.

The sequence artwork differs from the preceding SVG master in background tone and depth treatment. The first forward frame now supplies the master image during the existing white-light reveal so Connect entry has no artwork swap. This is a deliberate visual-source choice: the original sequence is authoritative and remains unmodified. The original SVG implementation is retained for reference. The baked-in slab treatment is not claimed to be an exact reproduction of every depth detail in Ideas/physical depth.png.

No reference-sheet labels, diagrams, or replacement artwork are introduced. A single persistent img uses object-fit: contain, preserving the entire 16:9 composition. Portrait and other nonmatching aspect ratios have ivory letterboxing.

## Integration and lifecycle

The page retains one scroll observer and its existing requestAnimationFrame coalescing. The global layer provides availability, active status, and normalized progress. Connect now derives direction from changes in its own clamped progress; see CONNECT-SYNCHRONIZATION-REPORT.md. Frame selection and loading belong to the Connect module.

| Scroll distance in viewport heights | Behavior |
| --- | --- |
| 0 to 0.25 | Existing landing interval |
| 0.25 to 3 | Existing Frame zoom, scale curve, and camera origin |
| 3 to 4 | Existing reversible white-light/master reveal |
| 4 to 8 | CONNECT progress 0 to 1 |
| 8 | Completed CONNECT holds |

The total track is nine viewport heights including the pinned viewport. The original first four viewport heights of scroll retain their preceding zoom/reveal mapping. A Connect configuration constant controls its four-viewport animation range.

ConnectCheckpoint owns one ConnectRenderer with enter/update/render/exit/destroy responsibilities. Frame requests carry a monotonically increasing version; obsolete async loads cannot replace a newer target or a subsequent lifecycle instance. The renderer retains the last decoded image until the latest target is ready, avoiding an empty surface during a cold load. A failed request retains that image and exposes the error in checkpoint data.

There is no Core timer, animation playback loop, MP4, canvas, WebGL, or CSS recreation of moving objects. The existing ambient video receives no Connect state and continues its native loop. Existing pause and reduced-motion behavior remain intact.

Only Connect has an active animation range. Existing future Core declarations remain inactive, with no future assets loaded and no automatic advancement.

## Loading and cleanup

The first frame is available from initial render. During the latter half of Frame zoom, Connect prepares a small endpoint/neighbor set for entry and reversal. Remaining compressed frames load progressively once the checkpoint becomes active.

Network fetches and image decoding each have two concurrent slots. Current/nearby decoded images use an LRU limited to eight frames for desktop pointers or six for coarse pointers. The compressed sequences total 21,021,398 bytes; they are not all decoded. Queued obsolete decode work is discarded when the target changes.

Leaving the preparation/reveal region aborts fetches, rejects queued work, revokes object URLs, and drops compressed and decoded references. Cleanup deliberately does not clear the src attribute on detached preload images: measurement showed that doing so caused Chromium to retain broken-image shadow DOM. Revoking URLs and dropping image references eliminated that retention.

In development, window.__CONNECT__ exposes progress, direction, target index/count, displayed source, and cache counts. This getter is excluded from production.

## Verification

- Production TypeScript/Vite build passed.
- Full regression suite: 57 passed, 9 device-specific skips.
- After the final cache cleanup change: all 14 applicable Connect production tests passed across desktop, phone, and tablet; four duplicate shared checks were skipped.
- Tests cover forward/reverse endpoints, the exact small reversals and nonlinear jumps from the task, final-frame stability, repeated entry, a delayed obsolete network response, staged loading, persistent image/video identity, production diagnostics exclusion, and original asset packaging.
- Additional responsive checks passed at 320 x 568, 844 x 390, 1280 x 956, and 3440 x 1440, including the existing video-failure fallback and guest traversal.
- Two repeated cycles each at 1672 x 941, touch phone 412 x 839, and touch tablet 768 x 1024 stayed within decoded-cache limits of 8/6/6 and two fetch/decode slots. After exit, detached nodes were zero and DOM counts remained constant within each viewport.
- Five additional desktop cycles left zero detached nodes, zero owned cache entries, one document, 291 DOM nodes, and 214 listeners each time. JS heap used ranged from 6.55 to 6.79 MB after collection. These measurements verify lifecycle retention in local Edge; they do not measure total browser image/GPU memory or guarantee performance on every device/network.
- Local script-observed target-ready maxima were 193 ms desktop, 157 ms phone, and 161 ms tablet, including polling/load/decode overhead. These are not animation frame-rate measurements.
- Original SHA-256 checks passed for reference_0.webp, prompt.txt, Ideas/Connect_1_1.png, and Ideas/physical depth.png.

Artifacts: [screenshots](connect/screenshots), [viewport/cache results](connect/verification.json), [five-cycle memory results](connect/memory-verification.json), and [responsive checks](connect/responsive-checks.json).

## Main implementation files

- src/components/core/connect/ConnectCheckpoint.tsx: scoped React integration and development diagnostic.
- src/components/core/connect/ConnectRenderer.ts: lifecycle, direction-aware lookup, and stale-request protection.
- src/components/core/connect/FrameCache.ts: staged fetching, bounded decoding, LRU, and cleanup.
- src/components/core/connect/sequence.ts: numerical ordering and progress formulas.
- src/components/core/connect/config.ts: Connect scroll range.
- build/connect-assets.ts: source discovery and production packaging.
- src/lib/frame.ts and src/hooks/useFrameProgress.ts: existing measurement pipeline extended with Connect progress/direction.
- tests/connect.spec.ts: checkpoint integration and production checks.

The local development preview is available at http://127.0.0.1:5173/.
