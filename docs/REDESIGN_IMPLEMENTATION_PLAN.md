# Skill Swap — Redesign Implementation Plan & Rollout Strategy

> **Phased Execution Roadmap, Risk Matrix & Performance Budget**  
> Complete execution blueprint for engineering the Skill Swap platform revamp. Outlines Phases 0 through 7, strict performance budgets, risk mitigations, automated testing with Playwright & TestSprite, and the 10+ point Before-and-After transformation matrix.

---

## 1. Phased Rollout Roadmap

To guarantee stability, zero regression of cinematic assets, and zero backend disruption, the implementation will be executed in 8 disciplined sequential phases:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       PHASED IMPLEMENTATION PIPELINE                        │
├─────────────┬───────────────────────────────────────────────────────────────┤
│ **Phase 0** │ Design Tokens, Typography & Foundations                       │
│ **Phase 1** │ Application Shell, Global Topbar & Navigation Alignment       │
│ **Phase 2** │ LEARN Core Overhaul (Dual Pillars & Learning Environment)     │
│ **Phase 3** │ CREATE & DISCOVER Synergy (Studio Workbench & Living Feed)    │
│ **Phase 4** │ CONNECT & PROFILE Alignment (Reciprocal Skills & Portfolios)  │
│ **Phase 5** │ CHAT Evolution (Context Drawer & Deep-Linking Optimization)   │
│ **Phase 6** │ Motion Layer, FLIP Transforms & Signature Contextual Loom     │
│ **Phase 7** │ Verification, Automated Testing (Playwright/TestSprite) & A11y│
└─────────────┴───────────────────────────────────────────────────────────────┘
```

---

### Phase 0: Design Tokens & Foundations
- **Deliverables:**
  - Create `src/styles/design-tokens.css` with revised color palette (`--sw-canvas-base`, `--sw-ink-primary`, `--sw-line-standard`), typography scale, and easing curves.
  - Configure `@fontsource-variable/manrope` with precision negative letter-spacing tokens.
  - Implement static SVG micro-grain background overlay on shell root.
- **Guardrails:** Verify zero impact on cinematic landing styles (`src/styles/landing.css`, `frame.css`).

---

### Phase 1: Shell & Navigation Alignment
- **Deliverables:**
  - Refactor `GlobalTopBar.tsx` and `GlobalSidebar.tsx` to use the architectural hairline border system (`1px solid var(--sw-line-standard)`).
  - Implement the sliding active pill indicator for sidebar navigation (`180ms var(--sw-ease-snap)`).
  - Add breadcrumb tracking and sticky header blur (`backdrop-filter: blur(16px)`).
- **Guardrails:** Keep hash routing (`#/app/connect`, `#/app/learn`, etc.) strictly intact in `navigation.ts`.

---

### Phase 2: LEARN Core Overhaul (Primary Focus)
- **Deliverables:**
  - Re-architect `src/modules/learn/LearnModule.tsx` into the **Dual-Pillar Interface**:
    - Mode 1: **Explore Skills** (Catalog, category filter chips, search).
    - Mode 2: **My Progress** (Active tracks, hours invested, quick continue).
  - Build the **Card-to-Environment Expansion** component with animated milestone roadmap node tree.
  - Implement the **Milestone Task Checklist** and **Markdown Notes Scratchpad**.
  - Embed the **Session Coordination lifecycle** with clear backend dependency markers:
    `BACKEND DEPENDENCY: Real Zoom meeting provisioning requires backend/provider support.`
  - Wire progress calculation formula into `WorkspaceProvider`.

---

### Phase 3: CREATE & DISCOVER Synergy
- **Deliverables:**
  - Upgrade `CreateModule.tsx` to the Studio Workbench layout (side-by-side composer and live card preview).
  - Add 1-click Project Templates and tag auto-complete.
  - Refactor `DiscoverModule.tsx` to a balanced masonry-style feed with interactive category filters.
  - Establish cross-core link: Publishing in CREATE animates directly into the DISCOVER feed.

---

### Phase 4: CONNECT & PROFILE Alignment
- **Deliverables:**
  - Update `PersonRow.tsx` and `ConnectModule.tsx` to feature reciprocal skill exchange badges (*"Teaches"* $\leftrightarrow$ *"Learns"*).
  - Redesign `ProfileModule.tsx` with multi-deck architectural portfolio showcase (Projects, Skills Matrix, Posts, Connections).
  - Ensure zero layout jump between self-view and public view (`?user=<id>`).

---

### Phase 5: CHAT Evolution
- **Deliverables:**
  - Enhance `ChatModule.tsx` with collapsible right-side Context Drawer (displays active partner's mutual skills, shared projects, and proposed sessions).
  - Implement message grouping physics (sliding upward entrance over 240ms).
  - Add rich interactive link cards for Skill Swap project and learning path URLs.

---

### Phase 6: Motion & Signature Contextual Loom
- **Deliverables:**
  - Implement the **Contextual Loom** floating ribbon at the bottom of the desktop workspace.
  - Calibrate all 14 motion categories (A through N) using custom cubic-beziers.
  - Apply `@media (prefers-reduced-motion: reduce)` accessibility overrides across all components.

---

### Phase 7: Verification, Testing & Optimization
- **Deliverables:**
  - Run Playwright E2E test suites (`npm run test`).
  - Run TestSprite cloud test runs across backend and frontend targets.
  - Execute preservation scripts (`node scripts/check-core-preservation.mjs`, `node scripts/check-ui-foundation-preservation.mjs`).
  - Audit a11y with `@axe-core/playwright` ensuring zero critical violations.

---

## 2. Risk Matrix & Mitigation Strategies

| Risk Identified | Impact Severity | Probability | Concrete Mitigation Strategy |
| :--- | :---: | :---: | :--- |
| **Cinematic Asset Corruption** | Critical | Low | Run `node scripts/check-core-preservation.mjs` before and after every phase. Zero edits to `Cores/` or `CinematicEntry.tsx`. |
| **Backend Contract Drift** | Critical | Low | Absolute backend lock strictly enforced. Zero edits to `backend/`, schema, or API routes. All new UX concepts map to existing REST endpoints or local storage. |
| **Animation Latency on Low-End Devices** | Moderate | Medium | 100% of transitions animate only `transform` and `opacity`. Heavy filters and box-shadow animations are strictly avoided during scroll. |
| **Hash Route De-synchronization** | Moderate | Low | All tab switching, modal states, and profile deep-links are bound to `useApplicationRoute` and `window.location.hash`. |
| **Auth Gating Leaks / Inconsistent State** | High | Low | Centralized through `useAuthGate()`. Unauthenticated actions automatically trigger `SignupModal` with contextual prompts. |

---

## 3. Performance Budget & Cost Classification

To ensure 60 FPS locked performance on desktop and laptop displays, every visual effect is categorized by rendering cost:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PERFORMANCE COST MATRIX                         │
├─────────────────┬──────────────────────────────────────────────────────┤
│ LOW COST        │ • transform: translate3d(), scale()                  │
│ (Green Light)   │ • opacity interpolation                              │
│                 │ • color / background-color transitions               │
│                 │ • Static SVG micro-grain background overlay          │
├─────────────────┼──────────────────────────────────────────────────────┤
│ MEDIUM COST     │ • backdrop-filter: blur(8px) (capped to header/pills)│
│ (Controlled)    │ • Box-shadow elevation transitions                   │
│                 │ • FLIP bounding-box calculations                     │
├─────────────────┼──────────────────────────────────────────────────────┤
│ HIGH COST       │ • WebGL canvases & Three.js shaders (BANNED)         │
│ (Strictly       │ • CSS blur() filters on animated large containers    │
│  Prohibited)    │ • Animate height, width, margin, top, left           │
│                 │ • Uncapped infinite layout reflows                   │
└─────────────────┴──────────────────────────────────────────────────────┘
```

- **Target Frame Time:** $\le 16.6\text{ms}$ per frame (60 FPS minimum).
- **Composite-Only Pipeline:** Only composite properties (`transform`, `opacity`) are modified during active animations.

---

## 4. Comprehensive Testing Strategy

### Local Verification (Playwright)
- **Suite 1: Visual Regression & Layout Stability:** Tests container widths, hairline borders, and font rendering across 1280px, 1440px, and 1920px viewports.
- **Suite 2: Core Routing & Continuity:** Validates hash navigation between all 6 Cores, ensuring state persistence.
- **Suite 3: Accessibility (a11y):** Automated Axe audit ensuring WCAG 2.2 AA compliance, keyboard focus rings, and screen reader labels.

### Cloud E2E Verification (TestSprite)
- **Backend API Suite (`766833db-83f4-4ae2-b503-f33d6b1b611a`):** Continuously verifies live PostgreSQL connections, JWT auth tokens, and CORS security.
- **Frontend Journey Suite (`87583064-c96c-4a0b-a466-6a0f7a690975`):** Validates the entire user path from Cinematic Landing $\to$ Auth $\to$ Explore Skills in LEARN $\to$ Expanding a Learning Path $\to$ Messaging a Mentor in CHAT.

---

## 5. Concrete Transformation Table (Before $\to$ After)

The following matrix documents the specific, tangible transformations that will occur across the platform:

| # | System Area | Current Implementation (Before) | Proposed Redesign (After) |
| :-: | :--- | :--- | :--- |
| **1** | **Overall Palette** | Flat gray backgrounds (`#ece9e3`) with plain black text. | **Tactile Warm Ivory Canvas (`#f7f4ef`, `#fdfcfb`) with deep ink typography (`#141514`) and hairline borders (`#dfddd8`).** |
| **2** | **Typography** | Browser default font rendering without tracking control. | **Variable Manrope with negative letter-spacing ratios (`-0.022em`) for editorial density.** |
| **3** | **Tactile Texture** | Flat digital surfaces with no physical grain. | **Static inline SVG micro-grain noise filter overlay ($3.5\%$ opacity, zero GPU load).** |
| **4** | **LEARN: Landing** *(Learn #1)* | Basic 2-column list with PageHero and 5 cards. | **Dual-Pillar Architecture: Segregated [EXPLORE SKILLS] and [MY PROGRESS] modes with sliding pill toggle.** |
| **5** | **LEARN: Card Interaction** *(Learn #2)* | Clicking a card opens a plain modal `<dialog>` popup. | **Card-to-Environment FLIP expansion morphing the card into a full interactive learning workspace.** |
| **6** | **LEARN: Journey Model** *(Learn #3)* | Simple arbitrary progress percentage bar. | **Interactive Milestone Progress Tree connecting checkpoints with live pulsing node indicators and task checklists.** |
| **7** | **LEARN: Sessions** *(Learn #4)* | No session scheduling or mentor coordination. | **5-stage peer-to-peer session coordination with explicit Zoom backend dependency markers.** |
| **8** | **CREATE: Layout** | Generic stacked form with separate page preview. | **Studio Workbench: Side-by-side composer with live WYSIWYG card preview and 1-click blueprint templates.** |
| **9** | **DISCOVER: Feed** | Basic vertical list of project cards and posts. | **Masonry-balanced editorial stream with real-time category filter chips and micro-bounce engagement metrics.** |
| **10** | **CONNECT: Roster** | Standard directory with "Connect" text button. | **Reciprocal Skill Radar showing *"Teaches"* $\leftrightarrow$ *"Learns"* with fluid state transitions.** |
| **11** | **PROFILE: Decks** | Basic tabs with flat list rows. | **Multi-deck portfolio showcase (Projects, Skills Matrix, Technical Insights stream, Connection network).** |
| **12** | **CHAT: Context** | Plain two-column chat without contextual metadata. | **Collaboration Terminal with collapsible right-side drawer displaying partner's skills and shared projects.** |
| **13** | **Platform Signature** | No global interactive anchor element. | **The Contextual Loom: Floating dual-pill ribbon visualizing active reciprocal skill exchanges.** |
| **14** | **Accessibility** | Basic focus outlines without reduced-motion handling. | **Comprehensive WCAG 2.2 AA compliance with `@media (prefers-reduced-motion)` crossfade fallbacks.** |
