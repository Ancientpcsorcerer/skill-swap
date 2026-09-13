# Application shell and Connect product UI

Implemented one full-screen application shell and the Connect product module. The existing cinematic experience remains the introduction. At the fully rendered Connect endpoint, Enter Connect opens the workspace in the same application. No developer review controls are part of this product flow.

## 1. Files changed

Existing source changes are limited to:

- `src/main.tsx`: mount ApplicationRoot under the existing React StrictMode and stylesheet setup.
- `src/app/App.tsx`: accept an optional application-entry callback and render CinematicEntry after completed cinematic Connect. Existing scene, progress, media, signup, and checkpoint logic remains intact.

New source files:

- `src/app/ApplicationRoot.tsx`
- `src/app/ApplicationShell.tsx`
- `src/app/CinematicEntry.tsx`
- `src/app/GlobalSidebar.tsx`
- `src/app/GlobalTopBar.tsx`
- `src/app/application.css`
- `src/app/components/Avatar.tsx`
- `src/app/components/ModulePlaceholder.tsx`
- `src/app/components/SearchField.tsx`
- `src/app/navigation.ts`
- `src/app/session/SessionProvider.tsx`
- `src/modules/connect/ConnectModule.tsx`
- `src/modules/connect/ConnectProvider.tsx`
- `src/modules/connect/components/ConnectionAction.tsx`
- `src/modules/connect/components/PersonRow.tsx`
- `src/modules/connect/components/RequestsPanel.tsx`
- `src/modules/connect/data.ts`
- `src/modules/connect/repository.ts`
- `src/modules/connect/selectors.ts`
- `src/modules/connect/types.ts`
- `src/modules/create/CreateModule.tsx`
- `src/modules/discover/DiscoverModule.tsx`
- `src/modules/learn/LearnModule.tsx`
- `src/modules/profile/ProfileModule.tsx`
- `src/modules/profile/ProfilePreview.tsx`

Other changes: `tests/application.spec.ts`, `scripts/check-application-preservation.mjs`, this report, `README.md`, and verification/screenshot artifacts under `docs/application/`. Existing regression tests were not edited or weakened. No packages were added or upgraded.

## 2. Architecture added

ApplicationRoot is the single boundary between cinematic introduction and workspace. A small hash router supports direct workspace links, in-place navigation, and browser history without adding a routing dependency. Production URLs use `#/app/connect`, `#/app/profile`, `#/app/create`, `#/app/learn`, and `#/app/discover` within the same application.

SessionProvider supplies one shared identity and session. The CEO approved an explicitly labeled local demo session because the project has no authentication service. Direct workspace links show a demo entry screen; the cinematic Enter Connect button opens that same demo session. No real authentication or remote account creation is claimed.

ApplicationShell owns the shared GlobalTopBar, GlobalSidebar, content region, product styling, and module registry. The top bar displays SKILL SWAP, a working people-search control, and the shared profile identity. Sidebar order is Profile, Connect, Create, Learn, Discover, with a restrained active marker and lower Settings/Log out positions. Settings is reserved and disabled. Log out ends the demo session and returns to the landing.

Product modules live under `src/modules/`; the cinematic checkpoint modules remain under `src/components/core/`. Create, Learn, Discover, and Profile currently render only a title and a short unavailable message inside the common shell. Their future features are not fabricated. ConnectProvider owns Connect's local view/request state above the content switch, so module and tab navigation preserve it. Leaving the workspace, reloading, or logging out resets this in-memory demo data.

The product theme is scoped to `.application-shell` and `.session-gate`. It uses warm ivory, Manrope typography, subtle lines, a fixed top bar/sidebar, and a separately scrolling main content area. There are no new gradients, dashboard cards, banner artwork, glass effects, or heavy UI dependencies. Local monogram SVG images represent fictional demo identities.

## 3. Connect functionality

- People is the default tab; Suggested and Requests share the same directory language and state.
- Search deterministically matches name, skills, interests, project interests, and description. It supports multiple search terms, case-insensitive matching, a result count, clearing, and a useful empty state.
- Suggestions use a transparent local matching score: shared skill, project interest, and interest. Each suggestion shows a reason. No AI recommendation service is implied.
- Connect sends a local request and changes to Request Sent with a stable button width and restrained color transition. Duplicate submissions are guarded in both controller and repository.
- Incoming requests support Accept and Decline. Accept produces Connected in the directory; Decline removes the incoming request. Outgoing requests show Request Sent and Pending.
- Clicking an avatar or name opens a small reusable ProfilePreview from the Profile module boundary. It shares connection state and supports Escape, dialog focus handling, and focus restoration.
- The tabs support arrow keys, Home, and End. Search controls have accessible names; request updates use a live status region. Global search returns to People and focuses the search field.

People and request fixtures are isolated in `data.ts`. The asynchronous ConnectRepository interface owns persistence operations; the current adapter is entirely local. A later backend can implement this contract without placing API calls inside row components.

## 4. Existing systems preserved

CinematicEntry observes the existing Connect rendering metadata only when normalized progress reaches 1. It requires the final frame index, successful loading state, and a complete image before exposing the action. Reversing away from the endpoint removes it. It adds no timer, new scroll interval, or playback controller.

Opening the workspace unmounts the cinematic layer and invokes its existing cleanup. Tests verify that no video or sequence renderer remains in the workspace and that ordinary workspace navigation requests no cinematic images. The dashboard is never permanently overlaid on the cinematic frame.

The landing, Get Started/signup behavior, walking-person/mist media, Frame geometry, white-light transition, CoreSystem, frame caches, Connect source policy, all image sequences, and existing design references remain intact. Connect_start still supplies both directions; Connect_back is not restored. Invalid Create cinematic assets remain excluded. Product Create navigation does not enable the Create cinematic checkpoint.

The new before/after audit inspected 2,113 existing files: 2,111 are byte-identical, with only App.tsx and main.tsx differing as described above. The preceding Core audit also passes for all 2,056 protected files and all 1,140 packaged image copies. The four original design-reference hashes pass.

`docs/core-chain/review.html` remains a development-only checkpoint review page and is not used as product navigation, a production route, or an application shell.

## 5. Tests and results

Validation used desktop Chromium through installed Microsoft Edge. Product screenshots were checked at 1672 x 941 and 1366 x 768; the existing regression project uses 1487 x 1058. No phone/tablet checks or layout tuning were performed.

- `npm.cmd run build -- --logLevel warn`: TypeScript and production build passed.
- `npm.cmd test -- --project=desktop --reporter=list --output=test-results/application-desktop`: 46 passed, one failed pixel comparison, one mobile-only test skipped. All 11 new application tests passed, including demo entry, cinematic handoff, no workspace frame fetching, stable shared navigation/history, search, suggestions, request states, profile preview, logout, desktop dimensions, and automated WCAG A/AA checks.
- The sole regression failure compared the same Connect source image in two travel directions. Source URL checks passed; analysis found six changed pixels out of 1,573,246, each differing by one channel value. The unchanged test then passed all three focused reruns using `--grep "returning to the same progress" --repeat-each=3`. This was not resolved by modifying cinematic code or relaxing an assertion. It remains an observed intermittent screenshot variance; its browser-level cause is not established.
- All 47 applicable desktop test cases have passing verification. The initial full run and the three focused reruns are recorded separately above rather than represented as a clean first run.
- `node scripts/check-application-preservation.mjs`: passed; only the two intended integration files differ.
- `node scripts/check-core-preservation.mjs`: passed; protected cinematic sources and packaged image bytes are unchanged.
- `npm.cmd run check:references`: passed; no WebGL/3D-renderer dependency was introduced.

Artifacts: [desktop screenshots](application/screenshots), [application preservation audit](application/preservation-verification.json), and [Core preservation audit](core-chain/preservation-verification.json).

## 6. Decisions, limitations, and entry instructions

The authentication ambiguity was resolved by the CEO: use a local demo session for this pass. Requests are not sent to real people and have no backend persistence. The demo gate and sidebar identify this mode. Existing signup remains unchanged.

The exact cinematic-to-application entry gesture was unspecified. An explicit Enter Connect action at the fully rendered endpoint preserves all existing scroll timing and lets users continue reversing the introduction until they choose the workspace.

Create/Learn/Discover/Profile product features, Settings, real authentication, and backend persistence remain future work as scoped. Invalid Create cinematic artwork remains a separate known asset issue and does not block this product UI. The single intermittent Connect screenshot result is documented above.

Run `npm.cmd run dev`, then open:

- [Full experience](http://127.0.0.1:5173/): scroll through cinematic Connect and choose Enter Connect.
- [Connect workspace](http://127.0.0.1:5173/#/app/connect): choose Enter demo workspace.

To reproduce checks, leave the dev server running for the existing Core review tests, then run:

```powershell
npm.cmd run build -- --logLevel warn
npm.cmd test -- --project=desktop --reporter=list
node scripts/check-application-preservation.mjs
node scripts/check-core-preservation.mjs
npm.cmd run check:references
```
