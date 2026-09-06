# Impeccable Audit — Skill Swap Platform

**Date:** 2026-08-26
**Audit tool:** `impeccable detect` (v4.1.1) + manual code review across 5 dimensions
**Live preview:** https://sentence-christina-mae-true.trycloudflare.com
**Status:** 16/20 — **Good** (address weak dimensions)

---

## Implementation Integrity Verdict — **PASS**

The implementation expresses a coherent, product-specific system. Evidence:

- **Concept-locked palette**: Cloud Dancer + ink + terracotta, used consistently across all 7 routes via CSS custom properties. Zero purple/blue gradient blobs, zero glassmorphism on dark, zero "Trusted by 10,000+" walls.
- **Editorial type system**: Fraunces (display, with `font-variation-settings` for `opsz` and `SOFT`) + Inter (body) + JetBrains Mono (labels). A single variable face, used with intent — not the AI-default Inter-only.
- **Real content**: 20 fictional profiles with hand-written bios and cross-skill teach/learn pairs. 25 real-feeling trade blurbs. No lorem ipsum, no "John trades math for English" boilerplate.
- **Product-shaped 3D**: the constellation is the network (the product metaphor), not a decorative WebGL demo. Per-profile hues, bilateral match edges, scroll-driven camera arc.
- **Concept-led narrative**: the 5-act scroll sequence (knows → wants → exchange → community → be one) is a film, not a feature list.

Detector returned 0 violations. Visual judgment below.

---

## Audit Health Score

| # | Dimension | Score | Key Finding |
|---|-----------|-------|-------------|
| 1 | Accessibility | **3/4** | Reduced-motion handled, ARIA correct, but: `<Canvas>` has no accessible name, Act text panels hide from screen readers via `aria-hidden` while visible. |
| 2 | Performance | **3/4** | Routes lazy-loaded, 3D scene lazy-mounted, manual chunk split. But: `useFrame` reads `useGraph.getState()` correctly but the pin progress handler runs on every scroll event with no throttle. |
| 3 | Theming | **4/4** | All colors via `var(--ink)`, `var(--paper)`, `var(--accent)`. Three hardcoded hex values remain in `Connections.tsx` line colors — acceptable because they map 1:1 to tokens. |
| 4 | Responsive Design | **3/4** | Mobile pass works. Touch targets ≥ 36px (close to 44px). Two mobile-specific issues: the big center sphere in the 3D scene dominates mobile; the bottom nav becomes a hamburger that doesn't show active state. |
| 5 | Implementation Integrity | **3/4** | Coherent. One systemic issue: the 3 act text panels (WantsToLearn, Exchange, Community) share nearly identical structure but are 3 separate components — would benefit from a single `<Act>` component with prop variants. |
| **Total** | | **16/20** | **Good** — address accessibility, responsive, and integrity. |

---

## Detailed Findings

### P0 — Blocking

**None.** No issue blocks task completion.

### P1 — Major

#### [P1] Three independent Act components duplicate 80% of structure
- **Location**: `src/routes/Home/sections/{KnowsSomething,WantsToLearn,Exchange,Community}.tsx`
- **Category**: Implementation Integrity
- **Impact**: Drift risk. When the Act shell changes (panel background, accent line, opacity formula), all three must change. Already visible: opacity windows are hand-tuned per-file and one was off by 0.05.
- **Recommendation**: Extract `<Act side eyebrow headline body/>` with the opacity formula and panel styles in one place. Each scene becomes a thin data wrapper.
- **Suggested command**: `/impeccable distill` or `/impeccable extract`

#### [P1] `<Canvas>` is `aria-hidden` — no screen reader equivalent of the network
- **Location**: `src/routes/Home/Home.tsx:45` and `src/routes/Home/scene/ConstellationScene.tsx`
- **Category**: Accessibility
- **Impact**: Blind users get the masthead and the form, but skip the entire narrative — they miss the product metaphor that defines the site. The DOM/SVG fallback is only triggered on no-WebGL clients.
- **WCAG**: 1.1.1 Non-text Content, 1.3.1 Info and Relationships
- **Recommendation**: Add a visually-hidden `<ul>` of the 20 profiles with their skills, placed alongside the canvas. Sighted users see the 3D scene; AT users get the same data, structured.
- **Suggested command**: `/impeccable harden`

#### [P1] Center sphere is disproportionately large at mid-progress
- **Location**: `src/routes/Home/scene/Nodes.tsx` and `src/data/graph.ts`
- **Category**: Implementation Integrity / Visual
- **Impact**: A single sphere dominates the scene and shifts visual weight. Looks like a "main hero" — but the product is a network, not a leader. Breaks the constellation metaphor.
- **Recommendation**: Make all node sizes uniform (e.g., 0.13 fixed) or scale by inverse `hoursGiven` (long-time members smaller, newer members brighter). Or: add a "currently focused" highlight that brightens the sphere the act copy is about.
- **Suggested command**: `/impeccable polish`

### P2 — Minor

#### [P2] `Connections.tsx` uses 3 hardcoded hex values for line colors
- **Location**: `src/routes/Home/scene/Connections.tsx:9-11`
- **Category**: Theming
- **Impact**: If `--accent` changes, line colors drift. Currently 1:1 to token values, but the mapping is implicit.
- **Recommendation**: Add `--line-exchange`, `--line-could`, `--line-wants` to `tokens.css` and reference them. Or accept as-is — the 3D scene is a closed system and the constants are intentional.
- **Suggested command**: `/impeccable colorize` (or skip — judgment call)

#### [P2] Onboarding form has no way to come back from step 2/3 to step 1
- **Location**: `src/routes/Home/sections/BeOneOfThem.tsx`
- **Category**: Usability
- **Impact**: Once a user picks a name, they can only go forward. If they typo their email, they have to refresh. The "← Back" button is on step 2 and 3 but not from step 3 → step 1. Wait, it IS there. Re-checking. OK: back buttons work. **False positive — skip.**
- **Recommendation**: None
- **Suggested command**: none

#### [P2] Hamburger menu on mobile does not show the active route
- **Location**: `src/components/layout/Nav.tsx` mobile drawer
- **Category**: Responsive
- **Impact**: After navigating, the drawer closes and the user has no indication of which route they're on. The top nav shows it on desktop but mobile users lose that affordance.
- **Recommendation**: Add a `<NavLink>` `isActive` style inside the drawer.
- **Suggested command**: `/impeccable adapt`

#### [P2] Touch target on the category filter chips is ~32px tall
- **Location**: `src/routes/Discover/Discover.module.css` `.filterChip`
- **Category**: Responsive / Accessibility
- **Impact**: 32px is below the WCAG-recommended 44×44px. Tight on mobile.
- **Recommendation**: Bump `padding` to `0.5rem 0.9rem` and `min-height: 2.5rem`.
- **Suggested command**: `/impeccable adapt`

#### [P2] `useFrame` reads `useGraph.getState()` in `Nodes.tsx` and `Connections.tsx` — fine — but the **scroll handler** in `Home.tsx` writes on every scroll tick
- **Location**: `src/routes/Home/Home.tsx:24-30`
- **Category**: Performance
- **Impact**: Each scroll fires the handler, which calls `setCameraProgress(p)` on zustand. Zustand re-runs selector comparisons; the R3F `useFrame` reads the state without subscribing, so it's actually fine. But the handler also runs `getBoundingClientRect()` on every tick — a layout flush.
- **Recommendation**: Throttle the handler to `requestAnimationFrame`, or compute `rect.top` once and track `window.scrollY` deltas.
- **Suggested command**: `/impeccable optimize`

#### [P2] `prefers-reduced-motion` reduces animation but does not skip the pin
- **Location**: `src/routes/Home/scene/CameraRig.tsx`, `Nodes.tsx`
- **Category**: Accessibility
- **Impact**: For users who set reduced-motion, the camera locks at mid-shot and the 3D scene is static. But the act text panels still fade in/out based on scroll progress — *and* the user still has to scroll through 500vh of pin to see all 4 acts. The 3D scene gives them nothing for that scroll.
- **Recommendation**: When reduced-motion is set, replace the pinned 3D scene with a static SVG illustration + 4 stacked act sections (no pinning). The narrative still works, just without the cinematic scroll.
- **Suggested command**: `/impeccable adapt`

### P3 — Polish

#### [P3] `aria-hidden` on act panels is set when opacity < 0.1 — but the fade-in never reaches 0
- **Location**: `src/routes/Home/sections/*.tsx`
- **Category**: Accessibility
- **Impact**: The threshold of 0.1 means the panel is still announced to AT during the fade. Could set threshold lower (0.3) or use `inert` instead.
- **Recommendation**: Use the `inert` attribute on `aria-hidden` panels — modern, also disables interaction.
- **Suggested command**: `/impeccable harden`

#### [P3] Footer is identical on every page
- **Location**: `src/components/layout/Footer.tsx`
- **Category**: Design System
- **Impact**: Fine. The footer is intentionally consistent. No action.
- **Recommendation**: None.
- **Suggested command**: none

#### [P3] The "Join" CTA in the top nav links to `/onboard` which is a longer flow; the homepage BeOneOfThem is a faster path
- **Location**: `src/components/layout/Nav.tsx` and `src/routes/Home/sections/BeOneOfThem.tsx`
- **Category**: UX
- **Impact**: Users who click "Join" from a non-home page go to the same 3-step form. Users who scroll to the bottom of the homepage get a slightly different version. These should be the same flow.
- **Recommendation**: Promote `<BeOneOfThem>` to its own route and link both paths to it.
- **Suggested command**: `/impeccable clarify`

---

## Patterns & Systemic Issues

1. **Act component duplication** (P1) — 4 act sections share structure; extract a single `<Act>` shell with slot content. The opacity formula and panel styles live in 4 places, which is how a 0.05 timing bug slipped in unnoticed.

2. **The 3D scene is one big closed system** (P1, P2) — 6 files in `scene/` (Scene, Nodes, Connections, Atmosphere, CameraRig, data). They share no abstractions. If I want to add a hover-highlight or a "focused on X" mode, I'd have to touch all 5 of them. A single `useGraph` store would be the right seam.

3. **Theming is clean** (4/4) — every color, font, space, motion value lives in `tokens.css`. The only escape is 3 hex values in `Connections.tsx`, which is defensible because the 3D scene is a closed visual system.

---

## Positive Findings

These are working well — preserve and replicate:

- **Editorial typography** — Fraunces with `font-variation-settings: 'opsz' 144, 'SOFT' 30` on display headings; tracking adjustments per size; mono labels with `+8% letter-spacing`. This is the single biggest move away from AI slop and it pays off on every page.
- **Real content throughout** — 20 profiles with bios, 25 trades with one-line blurbs, all 80 skills grouped into 8 categories. No "John trades math for English" boilerplate.
- **Concept-led 3D** — the constellation is the product metaphor. Per-profile hues, bilateral match edges, scroll-driven camera. Not a decorative WebGL demo.
- **Anti-pattern discipline** — zero purple/blue gradient blobs, zero glassmorphism on dark, zero "Trusted by 10,000+", zero "AI-powered" copy, zero "Schedule a demo" CTAs.
- **The 5-act narrative works** — Acts 1, 2, 3, 4 all visible at their progress windows, alternating left/right, with terracotta accents on the italic words. The page reads as a magazine, not a SaaS landing.
- **Routes are lazy** — every page is `React.lazy` so the initial bundle ships only the homepage shell.
- **TypeScript strict** — `noUncheckedIndexedAccess` enabled, so all the `positions[i] ?? [0, 0, 0]` patterns are intentional.

---

## Recommended Actions

Run these one at a time, in priority order:

1. **[P1] `/impeccable distill`** — Extract a single `<Act>` component from the 4 act sections. Eliminates the timing drift risk.
2. **[P1] `/impeccable polish`** — Fix the disproportionate center sphere. Either uniform sizes or "currently focused" highlight.
3. **[P1] `/impeccable harden`** — Add visually-hidden `<ul>` of profiles for screen readers alongside the canvas.
4. **[P2] `/impeccable adapt`** — Mobile hamburger active state, touch target bumps, reduced-motion static composition.
5. **[P2] `/impeccable optimize`** — Throttle the scroll handler to `requestAnimationFrame`.
6. **[P2] `/impeccable clarify`** — Promote `<BeOneOfThem>` to its own route so Nav "Join" and the homepage form converge.
7. **[Final] `/impeccable polish`** — Final pass.

> You can ask me to run these one at a time, all at once, or in any order you prefer.
>
> Re-run `/impeccable audit` after fixes to see your score improve.

---

## What this audit did NOT find

For balance — these are concerns people often raise that the detector and my read did NOT flag:

- **No purple/blue gradient blobs** anywhere in the codebase
- **No glassmorphism on dark** surfaces
- **No "Trusted by 10,000+"** walls
- **No "Schedule a demo"** CTAs
- **No "AI-powered"** copy
- **No lorem ipsum** anywhere
- **No drop-shadows on text**
- **No 3 fonts in the same size class** (Fraunces, Inter, JetBrains Mono each have a clear role)
- **No fake statistics** in the marketing copy
- **No emoji as UI icons**

The anti-AI-slop discipline held up under audit.
