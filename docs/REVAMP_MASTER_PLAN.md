# Skill Swap — REVAMP MASTER PLAN

> **Status:** SPECIFICATION READY — AWAITING USER APPROVAL BEFORE EXECUTION  
> **Date:** 2026-09-14  
> **Latest Git SHA:** `c82e558`  
> **Vercel:** `https://skill-swap-xi-lake.vercel.app`  
> **Backend (Render API):** `https://skill-swap-api-0jym.onrender.com`  
> **Database:** TigerData PostgreSQL  
> **TestSprite Projects:** Frontend (`87583064-c96c-4a0b-a466-6a0f7a690975`), Backend (`766833db-83f4-4ae2-b503-f33d6b1b611a`)

---

## 1. Executive Summary & Architecture Audit

Skill Swap is a fully functional web platform built on a modern hybrid stack:
- **Cinematic Landing Canvas:** 2,056-frame scroll-driven canvas sequence with Big Frame placement and portal zoom.
- **Application Shell:** Hash-routed workspace (`#/app/connect`, `#/app/discover`, `#/app/create`, `#/app/learn`, `#/app/chat`, `#/app/profile`) with responsive sidebar, top bar, and guest auth gating.
- **Backend API:** Express TypeScript on Render connected to TigerData PostgreSQL with JWT authentication, strictly guarded endpoints, CORS filtering, and health endpoints (`/health`, `/api/v1/health`).
- **Data Layers:** Live PostgreSQL models (`users`, `projects`, `learning_records`, `learning_goals`, `connections`, `posts`, `communities`) combined with client-side reactive service stores (`postService`, `chatService`, `ConnectProvider`).

### The Objectives
1. **Preserve All Existing Capabilities:** Zero regression of working auth, TigerData DB persistence, connection state, post creation, chat messaging, and cinematic landing assets (1,460 protected files).
2. **Major Visual & Interaction Revamp:** Modernize the platform to world-class digital standards (inspired by Prolibu, Grainient, Linear, Raycast, and Reflect):
   - Tactile warm ivory palette (`#fbf9f5`, `#f6f3ed`), deep ink typography (`#141514`), and hairline architectural borders (`#dfddd8`).
   - High-density typography with `@fontsource-variable/manrope` and precision negative tracking (`-0.022em`).
   - Tactile surface depth via micro-grain noise overlay and inset-highlighted pill geometry.
   - Smooth 60 FPS motion using composite-only properties (`transform`, `opacity`) and viscous cubic-bezier curves.
3. **Synergistic Core Enhancements:**
   - **CREATE & DISCOVER Synergy:** Studio Workbench layout with side-by-side composer and live card preview; publishing instantaneously broadcasts into the masonry DISCOVER feed.
   - **CONNECT & PROFILE Alignment:** Reciprocal skill radar (*"Teaches"* $\leftrightarrow$ *"Learns"*); multi-deck architectural portfolio showcase with zero layout jump between self and public view.
   - **CHAT Evolution:** Collaboration terminal with collapsible right-side Context Drawer displaying mutual skills and shared projects.
   - **Signature Contextual Loom:** Floating bottom ribbon visualizing active reciprocal skill exchanges across the platform.
4. **Backend Contract Hardening:** Ensure all frontend actions map directly to authenticated REST endpoints or synchronized reactive services without mock fallbacks.
5. **Continuous Verification:** Every phase is validated locally with Playwright, checked against core asset preservation, and verified via TestSprite cloud test runs against live Render and Vercel environments before committing and pushing.

---

## 2. 8-Phase Execution Roadmap

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      REVAMP IMPLEMENTATION ROADMAP                          │
├─────────────┬───────────────────────────────────────────────────────────────┤
│ **Phase 0** │ Unified Design System, Tokens & Micro-Texture                 │
│ **Phase 1** │ Application Shell, Global Navigation & Contextual Loom        │
│ **Phase 2** │ LEARN Core Overhaul (Completed & Shipped: Dual-Pillar Model)  │
│ **Phase 3** │ CREATE & DISCOVER Synergy (Studio Workbench & Living Feed)    │
│ **Phase 4** │ CONNECT & PROFILE Alignment (Reciprocal Radar & Multi-Deck)   │
│ **Phase 5** │ CHAT Evolution (Context Drawer & Link Previews)               │
│ **Phase 6** │ Motion Physics, FLIP Transitions & A11y Reductions            │
│ **Phase 7** │ TestSprite Suite, Build Optimization, Deployment & Audit      │
└─────────────┴───────────────────────────────────────────────────────────────┘
```

---

### Phase 0: Unified Design Tokens & Micro-Texture
- **File:** `src/styles/design-tokens.css` (imported into `src/main.tsx`).
- **Color Scale:**
  - Canvas Base: `--sw-canvas-base: #fbf9f5`
  - Canvas Warm: `--sw-canvas-warm: #f6f3ed`
  - Surface Pure: `--sw-surface: #ffffff`
  - Deep Ink: `--sw-ink-primary: #141514`
  - Muted Ink: `--sw-ink-muted: #656862`
  - Subtle Ink: `--sw-ink-subtle: #8e948d`
  - Hairline Border: `--sw-line-standard: #dfddd8`
  - Hairline Subtle: `--sw-line-subtle: rgba(20, 21, 20, 0.07)`
  - Accent Dark: `--sw-accent: #151a10`
- **Typography Scale:** Precision negative tracking (`letter-spacing: -0.022em`) for headings; Manrope variable font weighting.
- **Tactile Grain:** Static inline SVG micro-grain noise overlay ($3.5\%$ opacity, zero GPU computation).

---

### Phase 1: Application Shell & Contextual Loom
- **Files:** `src/app/GlobalSidebar.tsx`, `src/app/GlobalTopBar.tsx`, `src/app/ApplicationShell.tsx`, `src/app/application.css`.
- **Top Bar:** 64px height, sticky backdrop blur (`backdrop-filter: blur(16px)`), hairline bottom border, breadcrumb path indicator, user profile trigger with tactile avatar border.
- **Sidebar:** Architectural column with sliding active pill indicator (`180ms cubic-bezier(0.22, 1, 0.36, 1)`), 6 destinations with clean iconography and badge counts.
- **The Contextual Loom:** Floating bottom-right ribbon indicating active reciprocal skill exchanges between the logged-in user and collaborators.

---

### Phase 2: LEARN Core Overhaul *(COMPLETED)*
- **Status:** Shipped in commit `6951827`, security hardened in commits `1256985` & `c82e558`.
- **Components:** `ExploreSkillsView.tsx`, `MyProgressView.tsx`, `LearnHero.tsx`, `LearnModeSwitcher.tsx`, `LearningDetailModal.tsx`, `useLearnState.ts`, `src/styles/learn.css`.
- **Capabilities:** Server-as-source-of-truth via `/api/v1/learning`, honest empty states, genuine progress calculation, capability-aware placeholders for future Zoom/mentorship milestones.

---

### Phase 3: CREATE & DISCOVER Synergy *(NEXT PRIORITY)*
- **Files:**
  - `src/modules/create/CreateModule.tsx`
  - `src/modules/create/StudioWorkbench.tsx` (NEW)
  - `src/modules/create/LiveCardPreview.tsx` (NEW)
  - `src/modules/discover/DiscoverModule.tsx`
  - `src/modules/discover/MasonryFeed.tsx` (NEW)
  - `src/styles/create-discover.css` (NEW)
- **CREATE Studio Workbench:**
  - Split-pane layout: Left pane has the composer (Project or Post modes, 1-click blueprint templates: "Design System Sprint", "Open Source Rust Tool", "Mobile React Native App"), Right pane has live interactive WYSIWYG preview updating in real-time as the user types.
  - Seamless publishing: Once published, the new project or post is added to `WorkspaceProvider` / `postService` and a toast notification provides a 1-click jump to view it in DISCOVER.
- **DISCOVER Living Feed:**
  - Fluid masonry card layout with editorial category filter chips ("All", "Projects", "Posts", "Skills", "Communities").
  - Reciprocal exchange badges on project cards ("Seeking: Frontend $\leftrightarrow$ Offering: UI Design").
  - Real-time search with instant highlighting and micro-bounce engagement metrics (likes, bookmarks, views).

---

### Phase 4: CONNECT & PROFILE Alignment
- **Files:**
  - `src/modules/connect/ConnectModule.tsx`
  - `src/modules/connect/components/PersonRow.tsx`
  - `src/modules/connect/components/ReciprocalRadar.tsx` (NEW)
  - `src/modules/profile/ProfileModule.tsx`
  - `src/modules/profile/ProfileDecks.tsx` (NEW)
  - `src/styles/connect-profile.css` (NEW)
- **CONNECT Reciprocal Radar:**
  - Modernized directory grid highlighting exact skill complementarity between users (*"You teach TypeScript, they teach Three.js"*).
  - Micro-action button for 1-click Connection Request with tactile state transition ("Connect" $\to$ "Pending" $\to$ "Connected").
- **PROFILE Multi-Deck Showcase:**
  - Multi-tab architectural deck: Projects, Skills Matrix, Technical Posts stream, and Connection network.
  - Zero layout jump between self-profile and public profile (`#/app/profile?user=<id>`).
  - Edit profile modal with real backend synchronization via `PUT /api/v1/profile`.

---

### Phase 5: CHAT Evolution
- **Files:**
  - `src/modules/chat/ChatModule.tsx`
  - `src/modules/chat/ContextDrawer.tsx` (NEW)
  - `src/modules/chat/RichLinkCard.tsx` (NEW)
  - `src/styles/chat.css` (NEW)
- **Collaboration Terminal:**
  - Two-pane layout with optional expandable right-side **Context Drawer**:
    - Displays active conversation partner's bio, mutual skills, reciprocal matches, and shared projects.
    - 1-click action to propose a skill swap session or review a project.
  - Kinetic message bubble entrance (`opacity 0 -> 1, translateY 8px -> 0px` over 240ms).
  - Rich link embedding: When a message contains a `#project/<id>` or `#/app/learn` link, renders an interactive mini-card inside the chat thread.

---

### Phase 6: Motion Physics, Micro-Interactions & A11y
- **Motion System:**
  - Standardized easing: `--sw-ease-out: cubic-bezier(0.22, 1, 0.36, 1)`, `--sw-ease-snap: cubic-bezier(0.16, 1, 0.3, 1)`.
  - Micro-scale on interactive cards: `transform: translateY(-2px) scale(1.008)` on hover with 200ms duration.
  - Inset pill box-shadows: `box-shadow: inset 0 0.5px 1px rgba(255, 255, 255, 0.2), 0 2px 8px rgba(0, 0, 0, 0.04)`.
  - Strict `@media (prefers-reduced-motion: reduce)` fallbacks disabling all translates and transforms in favor of simple instant opacity fades.

---

### Phase 7: Verification, TestSprite Suite & Live Deployment
- **Automated Verification:**
  - TypeScript compilation and Vite build: `npm run build`
  - Playwright test suite: `npx playwright test`
  - Asset preservation: `node scripts/check-core-preservation.mjs` (1,460 files) & `node scripts/check-references.mjs`
- **TestSprite Cloud Verification:**
  - Backend Suite (`766833db-83f4-4ae2-b503-f33d6b1b611a`): Live TigerData DB, auth tokens, guarded routes.
  - Frontend Suite (`87583064-c96c-4a0b-a466-6a0f7a690975`): Complete user journey across Cinematic Landing $\to$ Auth $\to$ Learn $\to$ Create Workbench $\to$ Discover Feed $\to$ Chat Context Drawer.
- **Live Deployment:**
  - Git commit with descriptive conventional commit messages.
  - Push to `main` on GitHub (`Ancientpcsorcerer/skill-swap`).
  - Monitor Render API deployment and Vercel frontend build.
  - Live smoke test against production URLs.

---

## 3. Risk Matrix & Mitigations

| Risk | Impact | Probability | Mitigation |
| :--- | :---: | :---: | :--- |
| **Cinematic Asset Corruption** | High | Zero | `scripts/check-core-preservation.mjs` executed before every commit. Zero edits to `Cores/` or `CinematicEntry.tsx`. |
| **Backend Auth Mismatch** | High | Low | Token handling strictly centralized via `useSession()`, `useAuthGate()`, and `apiClient`. All API calls pass `Bearer <token>`. |
| **Performance Degradation** | Medium | Low | Zero WebGL/Three.js. Only CSS `transform` and `opacity` animated. Backdrop filters limited to sticky headers and pill controls. |
| **State Drift on Page Reload** | Medium | Low | Deep links bound to `window.location.hash` and reconciled with backend state on mount. |

---

## 4. Immediate Next Step: Phase 3 (CREATE & DISCOVER Synergy)
Upon approval, execution will immediately begin with Phase 3:
1. Create `src/styles/design-tokens.css` and configure the shared tactile warm ivory token system.
2. Build `StudioWorkbench.tsx` with side-by-side composer and live card preview in CREATE.
3. Build `MasonryFeed.tsx` with editorial category filter chips and reciprocal indicators in DISCOVER.
4. Establish cross-core publishing animation between CREATE and DISCOVER.
5. Verify with TypeScript build, local Playwright, and TestSprite cloud run.
