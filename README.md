# Skill Swap

A cinematic introduction and one full-screen application containing Profile, Connect, Create, Learn and Discover. Sign-up/login, projects, connections, learning choices and profile edits work with account-specific local storage. React + TypeScript + Vite.

## Run

Requires Node.js 22.12+ and npm.

```powershell
npm.cmd ci
npm.cmd run dev
```

Open [sign-up](http://127.0.0.1:5173/#/signup) to create an account on this device, or open [Discover](http://127.0.0.1:5173/#/app/discover) to enter that Core after sign-up. Existing local accounts can [log in](http://127.0.0.1:5173/#/login). The [public cinematic entry](http://127.0.0.1:5173/) remains available. Get Started opens its existing dialog with Create account; completed cinematic Connect retains Enter Connect.

```powershell
npm.cmd run build
npm.cmd run preview
npm.cmd test -- --project=desktop
npm.cmd run check:references
node scripts/check-ui-foundation-preservation.mjs
node scripts/check-core-preservation.mjs
```

Browser tests use installed Microsoft Edge against the production preview on port 4173. Keep the dev server on port 5173 running for the existing cinematic review tests. The final desktop suite passed 47 tests, with one existing mobile-only test skipped.

## Product application

One ApplicationRoot, SessionProvider and ApplicationShell serve `/#/app/profile`, `/#/app/connect`, `/#/app/create`, `/#/app/learn` and `/#/app/discover`. Sidebar navigation, topbar Quick Access, global people search and the user menu are shared. Browser history and direct refresh work. Guests see the actual sign-up form; the temporary demo gate and module placeholders are removed.

The AuthProvider interface separates local account handling from a future authentication service. ConnectRepository owns asynchronous people/request data, while WorkspaceProvider owns account-specific project, learning, saved-item, community and activity state. Models/catalogs live under `src/app/data`; Core UIs live under `src/modules`. No new dependencies, backend, messaging or cinematic playback integration were added.

The five original UI references in Ideas are preserved. Static artwork/portrait regions are displayed through SVG viewports into their unchanged files; the UI itself uses real HTML controls and state. Styles are scoped to the application/auth roots. Desktop and laptop screenshots, the full file inventory, local-state limitations and verification details are in the [Application UI Foundation report](docs/UI-FOUNDATION-REPORT.md). The earlier [Connect-only report](docs/APPLICATION-UI-REPORT.md) is historical and superseded for the application layer.

Accounts, project metadata, requests and learning choices persist on the current device/browser origin. File selection stores only names and sizes. Catalogs are fictional samples; connection requests are not delivered, and resources are not hosted courses. A production authentication/database/upload implementation is a later milestone.

CinematicEntry observes the fully rendered final Connect frame and exposes its existing entry action without changing timing. Opening sign-up/the workspace unmounts the cinematic layer and releases its existing caches. The product UI does not fetch cinematic frames. Developer checkpoint controls are not production routes.

## Scene and state architecture

App owns one document scroll track and one useFrameProgress instance. The original quarter-viewport landing interval, 2.75-viewport zoom distance, scale curve, and camera origin remain intact. One viewport supplies the reversible reveal. FrameTransition retains the same playing media element throughout.

measureFrame returns independent zoom, transition, and Connect progress from one measurement. Full white occurs at three viewport heights of scroll; the master environment is fully revealed at four. The next four viewport heights map to Connect progress 0-1. Stopping scroll preserves the visual state. There is no timed hold, reveal, or Core playback loop.

CoreExperience delegates to CoreSystem, which registers separate Connect, Create, Learn, and Discover modules. The available public prefix ends before invalid Create. A small adapter preserves ConnectCheckpoint unchanged. Its controller owns enter/update/render/exit/destroy, frame selection, staged loading, and cleanup. Cores/Connect_start and Cores/Connect_back contain 300 original 1920 x 1080 JPEGs each. The approved synchronization correction uses Connect_start in both directions. A Vite plugin enumerates and numerically sorts only Connect_start, packaging its 300 original files into dist/cores. Connect_back remains preserved outside the runtime manifest.

Connect derives travel direction from successive clamped progress samples for diagnostics; unchanged progress retains the previous direction. Frame selection is independent of direction: round(p * (N - 1)) always selects from Connect_start, so returning to the same progress returns to the exact same image. One persistent img displays decoded frames. Version checks prevent late loads from replacing newer targets, and reversals within one frame do not reassign src. Fetch and decode concurrency are each limited to two, with an LRU of eight decoded frames on desktop or six for coarse pointers. Approximately 10.9 MB of compressed assets load progressively; leaving the preparation/reveal region aborts work and clears the checkpoint cache.

The supplied frames include the background, panels, shadows, hands, and text. The first forward image also supplies the master reveal, avoiding an artwork swap at Connect entry. The baked-in architectural treatment differs from the preceding SVG master; it is preserved unmodified as the authoritative animation artwork. The original SVG implementation and references remain available. Object-fit contain preserves the full source composition, with ivory letterboxing on other aspect ratios.

The cinematic scroll path ends on completed Connect, where Enter Connect opens the product workspace. Create has a reserved independent range but renders nothing until correct artwork and its keycap geometry are inspected. Learn and Discover each own progress, forward/reverse selection, a separate bounded cache, one persistent image, and cleanup. Their supplied _start/_back images remain unmodified; their sources do not currently establish seamless cross-Core boundaries.

With the dev server running, open [Learn review](http://127.0.0.1:5173/docs/core-chain/review.html?core=learn) or [Discover review](http://127.0.0.1:5173/docs/core-chain/review.html?core=discover). Scroll or use the review slider. This page and its controls are not production routes. Development getters window.__CONNECT__, window.__LEARN__, window.__DISCOVER__, and window.__CORES__ expose current progress and render/cache state where applicable. They are omitted from production.

A separate asset plugin packages 840 original Learn/Discover images alongside the existing 300 Connect images, excluding duplicated Create files. Only the active/prepared checkpoint requests images. See the [cinematic Core implementation report](docs/CORE-CHECKPOINTS-REPORT.md) for asset limitations, deferred Create interaction/full-chain validation, and desktop/laptop test evidence.

HeroMedia owns ambient playback without receiving scroll/checkpoint state. Native looping keeps the clip playing; scrolling never seeks, reloads, or restarts it. The explicit pause control and reduced-motion preference remain supported. Reduced motion retains the existing poster and static endpoint crop with the same reversible reveal.

Authentication and experience state remain independent. Guests can traverse the Frame. Both Get Started controls open the existing signup dialog and preserve scroll; Create account proceeds to the actual form route. About us and Contact remain inactive. No partner content or logos appear at the bottom.

## Reference preservation

Preserve reference_0.webp, prompt.txt, Ideas/Connect_1_1.png, Ideas/physical depth.png, the original Cores folders, and public/video/portal.mp4. The original reference checker verifies four cinematic design files by SHA-256. The UI foundation audit additionally protects all Ideas references, Core assets and unchanged cinematic source against the pre-task baseline.

Runtime landing media remains public/video/landing-ambient.mp4 and public/images/landing-poster.webp. The original full-camera source is retained for provenance and never used as an autoplay fallback. Python is unnecessary for the app; the existing offline media helpers reproduce the derived landing assets.

See the [synchronization correction and source-mismatch report](docs/CONNECT-SYNCHRONIZATION-REPORT.md), [source-frame comparison](docs/connect-sync/comparison.html), [Connect checkpoint report](docs/CONNECT-CHECKPOINT-REPORT.md) and [Connect screenshots](docs/connect/screenshots). The [scroll-transition report](docs/SCROLL-TRANSITION-REPORT.md) documents the preceding transition; its static-SVG destination is superseded by the supplied sequence. The [TASK-002 report](docs/TASK-002-REPORT.md) documents the earlier landing/Frame correction.
