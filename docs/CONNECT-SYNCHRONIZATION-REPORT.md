# Connect synchronization correction

Connect now scrubs the original Connect_start sequence in both directions. Each absolute progress value selects one exact image, removing the composition and color switch caused by changing source sequences.

The user explicitly approved this final policy: "Use forward sequence both ways." Connect_back is preserved in the project and excluded from runtime loading and production packaging.

## Final behavior

The sole frame-selection input is clamped normalized Connect progress:

```
index = round(clamp(connectProgress, 0, 1) * (frameCount - 1))
image = Connect_start[index]
```

There are 300 original 1920 x 1080 frames, ordered numerically from ezgif-frame-001.jpg through ezgif-frame-300.jpg. Progress zero selects the empty environment; progress one selects the completed CONNECT image. Decreasing progress retraces those same frames. No playback queue runs through intermediate images after a large scroll jump.

Travel direction is derived from successive clamped progress values and is used for diagnostics only. It cannot select different artwork. Equal progress retains the previous travel direction. A reversal that stays within the same rounded frame updates diagnostic metadata without assigning src again or restarting a pending decode.

The existing renderer, single image surface, cache, lifecycle, and scroll pipeline remain in place. Delayed requests still carry version checks, preventing old loads from replacing the latest target. The diagnostic and DOM frame metadata use the renderer's own selection.

## Why the source policy changed

The existing forward and reverse index formulas were already absolute-progress lookups. However, overall page direction was passed into Connect. This could switch source images while Connect progress remained clamped at zero, or retain the wrong direction when a resize changed normalized progress without changing scroll offset. Connect now owns direction derivation from its progress.

Inspection also established that the supplied sequences are not visual reversals of one another. At p = 0.50, the required two-sequence mapping selected ezgif-frame-151.jpg from each folder. The forward frame has tilted lettering and extended hands; the reverse frame has upright lettering and retracted hands. At 75%, the hand positions also differ.

An unobstructed background patch at 50% averaged RGB 230.39, 236.39, 236.22 in the forward JPEG and 236.07, 241.01, 244.48 in the reverse JPEG. These differences are baked into the source files, rather than introduced by browser styling.

After reviewing this finding, the user approved using Connect_start for both directions. The [original-frame comparison](connect-sync/comparison.html) and [measurements with source hashes](connect-sync/asset-comparison.json) document the reason. The comparison is a development artifact and does not participate in runtime rendering.

No crossfade, tint, opacity adjustment, color filter, or reconstructed environment was added. The supplied forward artwork, including its existing lighting and motion, remains unmodified.

## Loading and preservation

The runtime manifest now contains only the 300 Connect_start files. Approximately 10.9 MB of compressed images load progressively; the initial endpoint/neighbor preparation remains small. Fetch and decode concurrency remain limited to two. The decoded LRU remains bounded at eight frames for desktop pointers and six for coarse pointers.

Production packages original forward JPEG bytes in dist/cores/Connect_start. All 300 packaged files were checked byte for byte against their source files. Connect_back remains at its original path and is not exported or requested by the application.

SHA-256 verification confirms 612 protected items are unchanged: all 600 source JPEGs, four design references, the Frame/landing media components, Core/Frame styles, scroll/transition logic, and runtime landing video. The only App integration change removes the obsolete direction prop. No future Core logic changed.

## Verification

The final TypeScript/Vite production build passed.

Connect browser tests: **31 passed, 8 shared-check skips**, across desktop, phone, and tablet. The final tests cover all requested trajectories:

- 0 -> .25 -> .50 -> .75 -> 1 and the full return.
- 0 -> .60 -> .55 -> .60 -> .40 -> .45 -> .80.
- .80 -> .79 -> .81 -> .80 -> .79 -> .90.
- .50 -> .51 -> .50 -> .51 -> .50 -> .49 -> .50 -> .51.
- 0 -> .20 -> .40 -> .60 -> .55 -> .50 -> .55 -> .65.
- .58 -> .56 -> .58.
- Direct 0 -> 1 -> 0 jumps.

At each step the selected index and source match the actual normalized browser progress. Endpoint and repeated-entry tests confirm one persistent image/video element and stable completion.

Additional checks verify unchanged-progress stability, resize-derived direction, same-frame reversal without src reassignment, and delayed requests during forward/reverse movement. Production loading checks confirm no Connect_back or future Core requests.

Screenshot comparisons at 50% are **pixel-identical before and after reversal on all three device profiles**. See [the paired screenshots](connect-sync/screenshots). This verifies that the same progress now returns to the same rendered scene, including its background color.

Two further entry/exit cycles at desktop 1672 x 941, touch phone 412 x 839, and touch tablet 768 x 1024 verified the 8/6/6 decoded-cache limits, bounded loading concurrency, and zero detached preload images after each exit. Results and refreshed screenshots are in [viewport/cache verification](connect/verification.json) and [Connect screenshots](connect/screenshots).

## Main changes

- src/components/core/connect/sequence.ts: canonical progress sampling and direction-independent frame lookup.
- src/components/core/connect/ConnectRenderer.ts: progress-derived diagnostics, same-frame reversal handling, and forward-only preload.
- src/components/core/connect/ConnectCheckpoint.tsx: progress-only updates and shared target metadata.
- src/components/core/CoreExperience.tsx and src/app/App.tsx: remove the page-direction input.
- build/connect-assets.ts and src/types/connect-assets.d.ts: forward-only runtime manifest.
- tests/connect.spec.ts: exact scrub sequences, source identity, pixel identity, unchanged-progress/resize behavior, and loading races.
- scripts/inspect-connect-sync.py and docs/connect-sync: reproducible source analysis and comparison.

Local preview: http://127.0.0.1:5173/.
