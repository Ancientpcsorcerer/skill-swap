# Core checkpoints implementation status

Connect is preserved. Learn and Discover now have independent scroll-driven checkpoints using their supplied forward and reverse images. Create is registered but disabled, as instructed by the CEO after all 600 Create files were found to duplicate Connect. The public journey therefore still ends on completed Connect. This is not a completed four-Core release.

## Source inspection

All eight folders were inspected before implementation, including first and last images at original resolution. Filenames are sorted numerically. Every folder starts at `ezgif-frame-001.jpg`; the final filename matches its actual count.

| Folder | Frames | Resolution | Observed first -> last |
| --- | ---: | --- | --- |
| Connect_start | 300 | 1920 x 1080 | Master environment -> hands and CONNECT |
| Connect_back | 300 | 1920 x 1080 | CONNECT -> empty environment; preserved, unused |
| Create_start | 300 | 1920 x 1080 | Exact copies of Connect_start; invalid |
| Create_back | 300 | 1920 x 1080 | Exact copies of Connect_back; invalid |
| Learn_start | 300 | 1920 x 1080 | Empty diagonal environment -> LEARN with plants and diamond panels |
| Learn_back | 300 | 1280 x 720 | Completed LEARN -> empty environment |
| Discover_start | 120 | 1920 x 1080 | Empty architectural environment -> vertical DISCOVER |
| Discover_back | 120 | 1920 x 1080 | DISCOVER -> empty environment |

[Machine-readable inspection](core-chain/asset-inspection.json) records sizes, endpoint hashes, and duplicate checks. Source frames, reference_0.webp, prompt.txt, Ideas/physical depth.png, and Ideas/Connect_1_1.png remain unchanged. The existing Connect implementation and its source-selection plugin also remain byte-identical.

The supplied image pixels remain authoritative for slabs, bevels, side faces, shadows, plants, lettering, and movement. The renderer contains each complete image at its original aspect ratio. It adds no reconstructed machinery, depth animation, generated artwork, or reference-sheet annotations.

## Architecture

`CoreSystem` registers independent Connect, Create, Learn, and Discover modules. It assigns scroll offsets from each module's own configuration; it does not play a combined animation. Each available checkpoint owns normalized progress, direction, requested/displayed frames, cache, lifecycle, and cleanup. Connect is integrated through an adapter, leaving its corrected implementation intact.

The public chain includes only the contiguous available prefix. Because Create is unavailable, its current prefix contains Connect alone. Learn and Discover can be reviewed independently on the development page. Production does not expose that page or debug controls.

| Planned Core | Relative animation range in viewport heights | Hold | Current status |
| --- | --- | --- | --- |
| Connect | 0-4 | 0 | Public, unchanged |
| Create | 4-8 | 1 reserved | Disabled pending correct artwork and keycap implementation |
| Learn | 9-13 | 0 | Implemented; separate development review |
| Discover | 13-17 | 0 | Implemented; separate development review |

These offsets begin after the existing intro, at four viewport heights of document scroll. The public track still uses only four additional viewport heights, preserving the previous landing, Frame, white-light reveal, and Connect positions. The Create hold is a configurable scroll interval, not a timer, and reserves no space in the current public track.

Connect continues to select `round(p * (N - 1))` from Connect_start in both directions. The CEO explicitly reaffirmed that correction. Connect_back is never restored as its reverse source.

Learn and Discover use `round(p * (N - 1))` from their _start sequence while normalized progress increases, and `round((1 - p) * (M - 1))` from their _back sequence while it decreases. Equal progress retains the current direction. One persistent image surface displays the requested decoded frame, with version checks rejecting obsolete loads. There are no Core playback clocks or wheel-event counters.

Each new controller uses a separate FrameCache instance: at most eight decoded images and two concurrent fetches/two concurrent decodes on desktop. Entry prepares endpoints; activation progressively fetches that Core's compressed images. Nearby frames receive decode priority. Exit aborts outstanding work, revokes blob URLs, and drops image references. The coordinator prepares the current, displayed, and nearby checkpoint and switches only after incoming rendering is ready. Actual multi-Core handoffs remain unvalidated while Create is disabled.

The build packages 1,140 original images in five folders: Connect_start, Learn_start, Learn_back, Discover_start, Discover_back. It excludes the duplicate Create assets and unused Connect_back. Packaged availability does not trigger downloads: public landing requests only Connect_start images as its checkpoint approaches.

## Asset limitations and deferred work

Create's current images cannot establish its mechanical switch, completed CREATE state, CLICK TO ENTER region, or press/release geometry. Its module and range remain registered but render nothing. Implementing its real coded interaction awaits inspection of the correct Create_start and Create_back replacements. Correct Connect files must not be modified to compensate.

The other supplied sequences also do not prove the requested seamless boundaries. Learn_start begins with an empty environment rather than an identifiable completed Create state. Discover_start begins with an empty diagonal scene, while Learn_start ends with plants, lettering, and a diamond panel arrangement. Learn_back/Discover_back likewise end on empty environments. A Learn-to-Discover switch between these originals would visibly change composition.

Forward and reverse artwork is independently authored. Matching the specified numeric progress does not guarantee matching pixels when switching sources. Learn_back also has lower native resolution. The implementation preserves the required Learn/Discover source mapping; it does not claim pixel-identical reversals or seamless source boundaries. Those visual limitations require aligned source assets or a later explicit change to source-selection requirements.

After correct Create assets arrive: inspect their ordering and endpoints, validate all adjacent boundaries, implement Create and its real keycap press/release against that artwork, then enable its configuration and run the complete forward/reverse chain matrix. Create and full-chain validation are deferred at the user's direction. Discover search remains a separate future task.

## Validation

Desktop Chromium (installed Microsoft Edge) only, as requested. New sequence matrices ran at 1672 x 941 and 1366 x 768. Existing landing/Frame/Connect regressions ran at 1487 x 1058.

- TypeScript and production build passed.
- 36 desktop tests passed; one mobile-only test was skipped. Coverage includes original navigation/signup, ambient video looping, reversible white-light transition, corrected Connect mapping, Learn/Discover direction changes and endpoint jumps, stale-load protection, persistent image surfaces, and exclusion of invalid Create.
- Three repeated Learn -> Discover -> unavailable Create review cycles passed cache and cleanup checks. Each ended with zero detached DOM trees, 55 DOM nodes, and 183 listeners. Active decoded counts stayed at or below eight; fetch/decode concurrency stayed at or below two. These are bounded-cycle measurements, not a long-duration memory guarantee.
- Reference hashes passed. A before/after snapshot verifies 2,056 original assets and protected implementation files; production copies are checked against their original bytes.
- Completed and reverse-midpoint screenshots were reviewed against the supplied compositions. See [screenshots](core-chain/screenshots) and [memory measurements](core-chain/memory-verification.json).
- Full Connect -> Create -> Learn -> Discover -> Learn -> Create -> Connect traversal is deferred because Create is invalid. Phone/tablet validation was not performed.

With `npm.cmd run dev` running, open:

- [Learn review](http://127.0.0.1:5173/docs/core-chain/review.html?core=learn)
- [Discover review](http://127.0.0.1:5173/docs/core-chain/review.html?core=discover)
- [Create status](http://127.0.0.1:5173/docs/core-chain/review.html?core=create)

Scroll or use the progress slider; the development toolbar changes checkpoints in the same document so cleanup is reviewable. Review controls are absent from the production build.

Reproduce the current validation:

```powershell
npm.cmd run build
npm.cmd test -- tests/core-chain.spec.ts tests/connect.spec.ts tests/post-zoom.spec.ts tests/landing.spec.ts --project=desktop --reporter=list
node scripts/check-core-memory.mjs
node scripts/check-core-preservation.mjs
npm.cmd run check:references
```

The new review tests and memory check require the dev server on port 5173. Playwright starts the production preview on port 4173. Earlier reports document prior completed work; this report records the current four-Core task status.
