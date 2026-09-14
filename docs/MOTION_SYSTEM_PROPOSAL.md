# Skill Swap — Motion System Proposal & Choreography Specs

> **Unified Interaction, Choreography & Motion Architecture**  
> Complete specifications across all 14 motion categories (A through N) with exact millisecond timings, custom cubic-bezier easing curves, transform pipelines, performance budgets, and accessibility fallbacks.

---

## 1. Motion Philosophy: "Weight, Precision, and Continuity"

Motion in Skill Swap is not decorative flourish; it is functional spatial architecture. The system is governed by three foundational tenets:
1. **Immediate Reaction, Weighted Arrival:** When a user initiates an interaction (click, hover, tap), the visual reaction begins within $0\text{–}20\text{ms}$. The element accelerates instantly, but settles with a weighted, organic deceleration curve (`cubic-bezier(0.22, 1, 0.36, 1)` or `cubic-bezier(0.16, 1, 0.3, 1)`), avoiding harsh mechanical snapping.
2. **Spatial Continuity (FLIP & Anchor Linking):** Elements never materialize out of thin air or vanish without context. When a learning card or project expands into a workspace, the card's bounding box mathematically morphs into the full-screen canvas (First, Last, Invert, Play).
3. **Strict 60 FPS Performance Budget:** 100% of transitions animate exclusively `transform` and `opacity`. Layout thrashing (`height`, `top`, `margin`) is banned. Zero WebGL overhead.

---

## 2. Global Easing Curves & Timing Tokens

All transitions are powered by calibrated easing curves defined in CSS custom properties:

```css
:root {
  /* ==========================================================================
     Skill Swap Calibrated Easing Tokens
     ========================================================================== */
  /* Ultra-Fast Responsive: Immediate micro-hover, toggle & tab snap */
  --sw-ease-snap:       cubic-bezier(0.25, 0.46, 0.45, 0.94); /* Quad Out */

  /* Standard Deceleration: Modals, dropdowns, directional popovers */
  --sw-ease-decel:      cubic-bezier(0.16, 1, 0.3, 1);        /* Quint Out */

  /* Architectural Smooth: Core transitions, section transformations */
  --sw-ease-smooth:     cubic-bezier(0.22, 1, 0.36, 1);       /* Quintic Soft */

  /* Viscous Weighted: Pill springs, badge reveals, tactile cards */
  --sw-ease-tactile:    cubic-bezier(0.34, 1.56, 0.64, 1);    /* Soft Elastic Overdrive */

  /* Sharp Acceleration: Elements exiting the viewport */
  --sw-ease-exit:       cubic-bezier(0.7, 0, 0.84, 0);        /* Fast In */

  /* ==========================================================================
     Duration Tokens
     ========================================================================== */
  --sw-dur-instant:     80ms;   /* Pressed button states, checkbox ticks */
  --sw-dur-fast:        140ms;  /* Card hover lift, tab underline slide */
  --sw-dur-normal:      240ms;  /* Dropdowns, tooltips, list row appearance */
  --sw-dur-moderate:    360ms;  /* Modals, drawer slide-outs, detail cards */
  --sw-dur-macro:       500ms;  /* Core-to-core transitions, full workspace morph */
}
```

---

## 3. The 14 Motion Categories (A through N)

### Category A: Page & Core Transitions (Switching Between Cores)

*Switching between `CONNECT`, `CREATE`, `DISCOVER`, `LEARN`, `CHAT`, and `PROFILE`.*

| Property | Specification |
| :--- | :--- |
| **Duration** | `380ms` |
| **Easing** | `var(--sw-ease-smooth)` (`cubic-bezier(0.22, 1, 0.36, 1)`) |
| **Transform Pipeline** | Exiting Core: `transform: scale(0.985); opacity: 0;` (duration: 160ms)<br>Entering Core: `0% { transform: translateY(12px) scale(0.995); opacity: 0; } 100% { transform: translateY(0) scale(1); opacity: 1; }` |
| **Interruptibility** | **Fully Interruptible:** Tapping another navigation item immediately retargets transform coordinates via CSS transition without snapping to start. |
| **Reversibility** | Browser Back/Forward (`popstate`) executes symmetric reverse transform (`translateY(-12px)`). |
| **Performance Cost** | **Low:** Composite-only layers (`opacity`, `transform`). |
| **Reduced-Motion** | Instantaneous fade (`opacity 100ms linear`), zero scale or translation. |

---

### Category B: Section-to-Section Transitions

*Navigating within a Core (e.g. from Explore Skills grid to an Active Learning Environment).*

| Property | Specification |
| :--- | :--- |
| **Duration** | `320ms` |
| **Easing** | `var(--sw-ease-decel)` (`cubic-bezier(0.16, 1, 0.3, 1)`) |
| **Transform Pipeline** | Left column / breadcrumb slides in `translateX(-8px) -> 0`, main workspace expands `translateY(16px) -> 0` with `opacity: 0 -> 1`. |
| **Performance Cost** | **Low** |
| **Reduced-Motion** | Crossfade `opacity: 120ms ease`. |

---

### Category C: Card & Module Hover Interactions

*Hovering over learning paths, mentor cards, project showcases, and post tiles.*

| Property | Specification |
| :--- | :--- |
| **Duration** | `160ms` enter / `140ms` leave |
| **Easing** | `var(--sw-ease-snap)` |
| **Transform Pipeline** | `transform: translateY(-3px) scale(1.008);`<br>`box-shadow: var(--sw-shadow-hover);`<br>`border-color: var(--sw-line-strong);` |
| **Performance Cost** | **Low:** GPU accelerated. |
| **Reduced-Motion** | `border-color` highlights only; zero translateY or scale. |

---

### Category D: Card Open / Expansion Interactions (Card-to-Detail FLIP)

*Tapping a Learning Card ("Python for Robotics") to open the full Learning Environment.*

| Property | Specification |
| :--- | :--- |
| **Duration** | `420ms` (morph) / `280ms` (content reveal) |
| **Easing** | `var(--sw-ease-smooth)` |
| **Choreography Pipeline** | 1. **FLIP Invert:** Card coordinates cloned to absolute overlay.<br>2. **Expansion:** Morph width/height using `transform: translate3d(dx, dy, 0) scale(dw, dh)`.<br>3. **Crossfade:** Card preview artwork crossfades smoothly into the hero banner.<br>4. **Content Cascade:** Milestones, teachers, and notes stagger in over 180ms. |
| **Interruptibility** | Closing mid-expansion runs inverse FLIP timeline to restore card into exact grid slot. |
| **Performance Cost** | **Medium:** Pre-calculated bounding boxes prevent DOM layout recalculation during animation. |
| **Reduced-Motion** | Modal overlay appears instantly with `opacity: 150ms`. |

---

### Category E: Dialog, Modal & Drawer Entrances and Exits

*Authentication modal, project composer drawer, connection request confirmation.*

| Property | Specification |
| :--- | :--- |
| **Duration** | Entrance: `280ms` / Exit: `180ms` |
| **Easing** | Entrance: `var(--sw-ease-decel)` / Exit: `var(--sw-ease-exit)` |
| **Transform Pipeline** | Scrim: `opacity: 0 -> 1` (`200ms`)<br>Modal Card: `0% { transform: translateY(16px) scale(0.96); opacity: 0; } 100% { transform: translateY(0) scale(1.0); opacity: 1; }` |
| **Performance Cost** | **Low** |
| **Reduced-Motion** | `opacity: 100ms ease`, zero translation or scale. |

---

### Category F: Scroll-Driven & Scroll-Revealed Transitions

*Revealing list items, sticky headers, and timeline milestones as the user scrolls.*

| Property | Specification |
| :--- | :--- |
| **Duration** | `300ms` per item |
| **Easing** | `var(--sw-ease-smooth)` |
| **Intersection Observer** | Triggered at `threshold: 0.15`. Un-intersected items have `opacity: 0; transform: translateY(14px);`. On intersect, `.is-revealed` class applied. |
| **Performance Cost** | **Low:** Passive event listeners, `will-change: transform, opacity` applied during transition only. |
| **Reduced-Motion** | All items statically visible at 100% opacity, zero scroll delay. |

---

### Category G: Interactive State Feedback (Buttons, Chips, Form Fields)

*Clicking buttons, selecting pills, focusing inputs.*

| Property | Specification |
| :--- | :--- |
| **Duration** | Press: `80ms` / Release: `160ms` |
| **Easing** | `var(--sw-ease-snap)` |
| **Transform Pipeline** | Button Active: `transform: scale(0.975);`<br>Focus Ring: `outline: 2px solid var(--sw-line-emphasis); outline-offset: 2px;` with 120ms fade. |
| **Performance Cost** | **Low** |
| **Reduced-Motion** | Visual color/border shift without scale. |

---

### Category H: Stagger Patterns (Grids, Lists, Navigation Items)

*Loading a grid of mentors or milestone tasks.*

| Property | Specification |
| :--- | :--- |
| **Base Delay** | `25ms` per sibling element (capped at maximum `200ms` total stagger window) |
| **Duration** | `260ms` per item |
| **Easing** | `var(--sw-ease-decel)` |
| **Pipeline** | `animation: staggerSlideUp 260ms var(--sw-ease-decel) forwards; animation-delay: calc(var(--index) * 25ms);` |
| **Performance Cost** | **Low** |
| **Reduced-Motion** | All items appear simultaneously with `animation: none;`. |

---

### Category I: Micro-Animations (Badges, Beacons, Pulse Effects)

*Live session active beacons, unread chat counters, verified mentor badges.*

| Property | Specification |
| :--- | :--- |
| **Type** | Infinite ambient pulse / badge pop |
| **Keyframes (`sw-beacon-pulse`)** |
  ```css
  @keyframes swBeaconPulse {
    0%   { transform: scale(1); box-shadow: 0 0 0 0 rgba(43, 110, 78, 0.45); }
    70%  { transform: scale(1.05); box-shadow: 0 0 0 8px rgba(43, 110, 78, 0); }
    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(43, 110, 78, 0); }
  }
  ```
| **Duration** | `2200ms` infinite loop |
| **Performance Cost** | **Low** |
| **Reduced-Motion** | Static solid dot, zero pulsing or box-shadow expansion. |

---

### Category J: Media, Image & Artwork Reveals

*Loading mentor avatars, project art, or learning journey diagrams.*

| Property | Specification |
| :--- | :--- |
| **Duration** | `340ms` |
| **Easing** | `var(--sw-ease-smooth)` |
| **Transform Pipeline** | Image container: `clip-path: inset(0 0 0 0 round var(--sw-radius-md));`<br>Image content: `0% { opacity: 0; filter: blur(6px); transform: scale(1.04); } 100% { opacity: 1; filter: blur(0px); transform: scale(1); }` |
| **Performance Cost** | **Medium:** Filter blur isolated to thumbnail element. |
| **Reduced-Motion** | Plain crossfade `opacity: 150ms`, zero blur or scale. |

---

### Category K: Navigation & Tab Switching Motion

*Switching between `In Progress` / `Saved` / `Completed` or `Explore Skills` / `My Progress`.*

| Property | Specification |
| :--- | :--- |
| **Mechanism** | **Sliding Pill Indicator:** A single active backdrop pill slides behind the selected tab button using CSS `transform: translate3d(x, 0, 0)` and `width`. |
| **Duration** | `180ms` |
| **Easing** | `var(--sw-ease-snap)` |
| **Performance Cost** | **Low** |
| **Reduced-Motion** | Instant jump of indicator pill, zero sliding transform. |

---

### Category L: Loading, Skeleton & Shimmer States

*Loading project cards, network requests, or conversation threads.*

| Property | Specification |
| :--- | :--- |
| **Shimmer Pipeline** | Neutral ivory gradient passing across skeleton shapes:
  ```css
  @keyframes swShimmer {
    0%   { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  ```
  `background: linear-gradient(90deg, #edeae3 0%, #f5f3ee 50%, #edeae3 100%);`<br>`background-size: 200% 100%;` |
| **Duration** | `1600ms` infinite |
| **Performance Cost** | **Low** |
| **Reduced-Motion** | Static muted placeholder (`#edeae3`), zero shimmer movement. |

---

### Category M: Error, Alert & Toast Notifications

*Auth errors, form validation, milestone completion announcements.*

| Property | Specification |
| :--- | :--- |
| **Entrance** | `translateY(-8px) scale(0.97) -> translateY(0) scale(1.0)` over `240ms var(--sw-ease-decel)`. |
| **Shake on Error** | Ultra-subtle 4px horizontal shake:
  `0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); }` (duration: `220ms`). |
| **Auto-Dismiss** | Slides up `translateY(-12px)` and fades over `180ms`. |
| **Performance Cost** | **Low** |
| **Reduced-Motion** | Pop up statically, zero shaking. |

---

### Category N: Reduced-Motion Architecture & Fallbacks

*Global compliance with WCAG 2.2 Success Criterion 2.3.3 (Animation from Interactions).*

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  
  /* Retain graceful opacity crossfades without vestibular disorientation */
  .application-shell,
  .workspace-dialog,
  .module-main {
    transition: opacity 120ms linear !important;
  }
}
```
