# Skill Swap — Redesign Research & Architectural Benchmark

> **Design & Motion Research Milestone**  
> Comprehensive audit, live browser inspection, and design system extraction across 5 top-tier digital experiences (Prolibu, Grainient, Linear, Raycast, Reflect). Includes comparative rankings, a borrow/adapt/reject framework, and technical specifications for Skill Swap.

---

## 1. Research Objectives & Methodology

The goal of this research phase is not superficial cosmetic re-skinning. It is to establish a rigorous, production-grade visual and motion architecture for the Skill Swap platform. Skill Swap already has robust backend functionality (TigerData PostgreSQL, Render API, JWT/OAuth, real community seeds, posts, connections, and projects). The interface, however, currently uses standard utilitarian CSS boxes, static dialog popups, and basic list views.

To elevate Skill Swap into a memorable, world-class interactive product without violating our core constraints:
- **Zero WebGL / Three.js / Canvas dependencies:** All advanced visual depth and motion must be executed with standard, high-performance browser DOM, CSS transforms, SVGs, and cubic-bezier transition curves.
- **Cinematic System Lock:** The 2,056-frame cinematic landing canvas (`Cores/*_start`), Big Frame placement, and portal zooms are strictly preserved.
- **Backend Lock:** All data contracts, schema models, and auth lifecycles remain canonical.

### Live Inspection Target Matrix

| Target | URL | Primary Aesthetic / Functional Discipline | Key Innovation Extracted |
| :--- | :--- | :--- | :--- |
| **1. Prolibu** | `https://prolibu.com/en/platform/sales/` | High-density enterprise presentation & narrative spatial rhythm | Alternating light/dark surface transitions, Geist variable typography, 800ms deceleration curves, live embedded widgets |
| **2. Grainient** | `https://grainient.supply/` | Tactile organic surfaces, frosted glass pills & micro-depth | Static SVG grain overlays, pill border inset highlights (`inset 0 0.48px 1.25px`), card micro-scaling |
| **3. Linear** | `https://linear.app/` | Architectural minimalism, high-density baseline grid & typography | Variable weight interpolation (`510`), tight letter-spacing (`-0.022em`), ultra-fast 100ms quad-out hover feedback |
| **4. Raycast** | `https://www.raycast.com/` | Spatial continuity, card-to-detail transformations, non-WebGL layers | Directional popover continuity (`slideUpAndFade`, 2px–10px Y-offsets with 0.95->1.0 scale), anchored command overlays |
| **5. Reflect** | `https://reflect.app/` | Tactile glassmorphism, dual typography pairing & viscous spring curves | Multi-layered backdrop blurs (`blur(8px)`), tactile inset pill shadows, viscous cubic-bezier curves (`cubic-bezier(0.6, 0.6, 0, 1)`) |

---

## 2. In-Depth Site Audits

### Reference 1: Prolibu (`prolibu.com/en/platform/sales/`)

#### Visual Language
- **Typography Tokens:**
  - Font Family: `Geist, sans-serif`
  - Display H1: `64px` (`4rem`), `font-weight: 400`, `line-height: 1.1` (`70.4px`), `letter-spacing: -1.92px` (`-0.03em`). Creates intense, modern headline density.
  - Section H2: `43.2px` – `48px`, `font-weight: 400`, `line-height: 1.1`, `letter-spacing: -0.864px` to `-1.44px`.
  - Body Text: `16.8px` – `18px`, `font-weight: 400`, `line-height: 28.56px` (`1.7` ratio), color `#585858`.
  - Eyebrow Badges: `10px` – `12px`, `font-weight: 500`, uppercase letter-spacing `+0.6px`.
- **Palette & Surfaces:**
  - Base Dark Surface: `#0A0A0A`
  - Dark Accent Surface: `#1F1C1B`
  - Warm Canvas Light Surface: `#F7F6F0` (tactile off-white)
  - Pure White: `#FFFFFF`
  - Brand Accents: Electric Blue `#2563EB`, Emerald Green `#02A270`, Hot Pink `#F32A73`, Golden Yellow `#FDBF00`.
- **Surfaces & Borders:**
  - Floating Nav Header: `rgba(10, 10, 10, 0.88)` with `backdrop-filter: blur(20px)`, `border-radius: 33px`, `box-shadow: 0px 2px 20px rgba(0, 0, 0, 0.12)`.
  - Buttons: Full pill geometry (`border-radius: 100px`), `12px 28px` padding.

#### Motion Language & Keyframes
- **Hero Reveal Transition:** `transform 0.8s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.5s`. Decelerates smoothly with zero overshoot.
- **Sticky Nav Entrance:** `transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), background 0.4s`.
- **Mega Menu Hover:** `opacity 0.25s ease-out, transform 0.25s ease-out`. Staggered items use `cubic-bezier(0.2, 0, 0, 1)` over `0.3s`.
- **Extracted Spring Keyframes (`implWave`):**
  ```css
  @keyframes implWave {
    0%   { transform: translateY(30px); opacity: 0; }
    30%  { transform: translateY(-6px); opacity: 1; }
    55%  { transform: translateY(2px); }
    75%  { transform: translateY(0px); }
    100% { transform: translateY(0px); opacity: 1; }
  }
  ```
- **Pulse Ring Keyframes (`vi-btn-rings`):**
  ```css
  @keyframes vi-btn-rings {
    0%   { box-shadow: rgba(2, 162, 112, 0.5) 0 0, rgba(2, 162, 112, 0.3) 0 0; }
    100% { box-shadow: rgba(2, 162, 112, 0) 0 0 0 18px, rgba(2, 162, 112, 0) 0 0 0 38px; }
  }
  ```

#### Why It Feels Premium
Prolibu balances high-contrast editorial typography with living product artifacts. Instead of flat marketing illustrations, it embeds realistic, interactive dark-mode components (a dialer with pulse rings, kanban pipeline, and an interactive proposal viewer) set on an alternating rhythm between deep space black and warm off-white canvas.

---

### Reference 2: Grainient (`grainient.supply/`)

#### Visual Language
- **Typography Tokens:**
  - Headings: `SF Pro Rounded Bold`, `SF Pro Rounded Semibold` (`56px` – `64px`, `font-weight: 700`, `line-height: 1.1`).
  - Body: `Inter` / `Geist Regular` (`14px`, `line-height: 1.4`).
- **Tactile Grain & Surface Architecture:**
  - Canvas: `#000000` base with `#141414` surface cards.
  - Organic Texture: Grainy noise overlay layer producing tactile depth.
  - Card Curvature: `20px` card border-radius with nested `15px` inner image radius (perfect optical radius offset: $R_{outer} - Padding = R_{inner}$).
  - Glassmorphic Inset Highlights: Pill badges use dual inset box shadows:
    `box-shadow: inset 0px 0.48px 1.25px rgba(255, 255, 255, 0.02), inset 0px 4px 10.4px rgba(255, 255, 255, 0.18)`.

#### Motion Language
- **Card Micro-Scaling:** On hover, cards transition `transform: scale(1.02)` with `0.2s cubic-bezier(0.2, 0, 0, 1)` and a subtle shadow lift.
- **Filter Chip Interactions:** Instantaneous background toggle with 150ms border-color interpolation.

#### Why It Feels Premium
Grainient proves that tactile texture (fine grain and inset light reflections on pill badges) immediately removes the cold, sterile feeling of flat digital interfaces. It feels like an actual physical object with surface friction.

---

### Reference 3: Linear (`linear.app/`)

#### Visual Language
- **Typography Tokens:**
  - Font Family: `Inter Variable, sans-serif`.
  - Display H1: `64px` (`clamp(3.5rem, 5vw, 4rem)`), custom variable `font-weight: 510`, `letter-spacing: -1.408px` (`-0.022em`), `line-height: 1.0` (tight 64px line box).
  - Section H2: `48px`, `font-weight: 510`, `letter-spacing: -1.056px` (`-0.022em`), `line-height: 48px`.
  - Body (p): `15px`, `font-weight: 400`, `letter-spacing: -0.165px` (`-0.011em`), `line-height: 24px` (`1.6`).
- **Palette & Architectural Surfaces:**
  - Canvas: Deep obsidian `#08090a`.
  - Primary Ink: Crisp white `#f7f8f8`.
  - Precision Border Strokes: `1px solid rgba(255, 255, 255, 0.06)` with low-opacity surface tints (`linear-gradient(rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.04))`).
  - Curvature: Restrained, disciplined `6px` / `8px` radii.

#### Motion Language
- **Micro-Transitions:** `color 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94), background 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94)`.
- **Latency Budget:** Ultra-fast 100ms response time ensures that power users experience zero drag or hesitation.

#### Why It Feels Premium
Linear is the industry benchmark for software craftsmanship. It achieves extreme luxury through restraint: zero gaudy gradients, mathematical tracking proportions, 1px hairline border strokes, and instantaneous interaction speeds.

---

### Reference 4: Raycast (`raycast.com/`)

#### Visual Language
- **Typography Tokens:**
  - Font Family: `Inter, sans-serif`.
  - Headline H1: `64px`, `font-weight: 600`, `line-height: 70.4px` (`1.1`).
  - Section Headings: `20px`, `font-weight: 500`, `letter-spacing: 0.2px`.
  - Body: `18px`, `font-weight: 400`, `letter-spacing: 0.2px`.
- **Surfaces & Spatial Layers:**
  - Dark backdrop `#07080a` with floating command layer overlays.
  - Curvature: `6px` – `12px` rounded modules.

#### Motion Language & Spatial Continuity Keyframes
- **Spatial Modal Entrance (`fadeInScaleUp`):**
  ```css
  @keyframes fadeInScaleUp {
    0%   { opacity: 0; transform: translate(10px, 10px) scale(0.95); }
    100% { opacity: 1; transform: translate(0px, 0px) scale(1.0); }
  }
  ```
- **Directional Continuity (`slideUpAndFade` & `slideDownAndFade`):**
  ```css
  @keyframes slideUpAndFade {
    0%   { opacity: 0; transform: translateY(4px); }
    100% { opacity: 1; transform: translateY(0px); }
  }
  @keyframes slideDownAndFade {
    0%   { opacity: 0; transform: translateY(-4px); }
    100% { opacity: 1; transform: translateY(0px); }
  }
  ```

#### Why It Feels Premium
Raycast makes UI feel spatial and continuous. When a command, popover, or detail view triggers, it never simply pops into existence; it springs out from the parent element with directional 4px offsets and a subtle 0.95 to 1.0 scale factor, preserving the user's mental map of where they came from.

---

### Reference 5: Reflect (`reflect.app/`)

#### Visual Language
- **Typography Tokens:**
  - Heading Font: `AeonikPro, sans-serif` (geometric modern grotesque).
  - Body Font: `Inter V, sans-serif`.
  - Display H1: `72px`, `font-weight: 500`, `line-height: 80px` (`1.11`).
  - Section H2: `56px`, `font-weight: 500`, `line-height: 64px`.
- **Surfaces & Glass Depth:**
  - Canvas: Cosmic obsidian `#030014`.
  - Glass Pill Buttons: `backdrop-filter: blur(8px)`, `border-radius: 32px`.
  - Inset Ambient Glow: `box-shadow: inset 0px -7px 11px 0px rgba(164, 143, 255, 0.12)`.

#### Motion Language
- **Viscous Easing Curves:** Navigation link hovers and badge springs use custom curve `cubic-bezier(0.6, 0.6, 0, 1)` with `300ms` – `450ms` duration, creating a liquid, weighted tactile response.

#### Why It Feels Premium
Reflect excels at dual typography pairing (geometric display plus neutral body) and tactile inset shadows. Its controls feel like polished glass pebbles on a physical desk.

---

## 3. Comparative Evaluation & Benchmark Rankings

Each site was evaluated and ranked across 5 core dimensions on a 1–5 scale ($5 = \text{Flawless Masterclass}$):

| Evaluation Dimension | Prolibu | Grainient | Linear | Raycast | Reflect | Skill Swap Target |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Typography Choreography** | 4.8 | 4.0 | 5.0 | 4.5 | 4.9 | **5.0** (Manrope tuned tracking) |
| **Spatial Continuity** | 4.5 | 3.8 | 4.7 | 5.0 | 4.4 | **5.0** (Shared layout transforms) |
| **Tactile Surface Depth** | 4.4 | 4.9 | 4.3 | 4.6 | 4.8 | **4.9** (Warm ivory + grain + inset) |
| **Micro-Interaction Latency** | 4.5 | 4.2 | 5.0 | 4.9 | 4.6 | **5.0** (100–180ms responsive curves) |
| **Living Product Realism** | 4.9 | 3.5 | 5.0 | 4.8 | 4.2 | **5.0** (Embedded functional flows) |
| **Total Score (out of 25)** | **23.1** | **20.4** | **24.0** | **23.8** | **22.9** | **24.9** |

---

## 4. Borrow / Adapt / Reject Framework for Skill Swap

```
┌────────────────────────────────────────────────────────────────────────┐
│               SKILL SWAP DESIGN & MOTION SYNTHESIS                      │
├────────────────────────────────┬───────────────────────────────────────┤
│ BORROW DIRECTLY                │ ADAPT FOR SKILL SWAP                  │
│ • Geist/Linear negative        │ • Prolibu dark/light rhythm           │
│   letter-spacing tracking      │   → Adapted to Warm Ivory (#f7f4ef)   │
│ • Linear 100ms quad-out hover  │     primary canvas with Deep Ink      │
│ • Raycast 4px directional      │     overlay zones                     │
│   slideUp/Down continuity      │ • Grainient grain texture             │
│ • Reflect inset pill shadows   │   → Re-engineered as lightweight      │
│ • Prolibu spring keyframes     │     SVG noise filter (0 GPU load)     │
│   for task & badge reveals     │ • Raycast command layer               │
│                                │   → Adapted into Unified Action Hub   │
├────────────────────────────────┴───────────────────────────────────────┤
│ REJECT UNCONDITIONALLY                                                 │
│ ✕ WebGL / Three.js canvas shaders (violates strict performance lock)   │
│ ✕ Neon / Crypto color palettes (violates editorial warm ivory identity)│
│ ✕ Heavy 600ms+ full-page blocking loaders (destroys snappy workspace)  │
│ ✕ Arbitrary floating gradient blobs without functional grounding       │
└────────────────────────────────────────────────────────────────────────┘
```

### Detailed Borrow / Adapt / Reject Breakdown

#### What We Borrow:
1. **Linear's Typographic Discipline:**
   - Display headlines using custom negative tracking ratios (`-0.022em` on H1, `-0.015em` on H2) to bring editorial density to `@fontsource-variable/manrope`.
   - Ultra-fast 100ms hover transitions (`cubic-bezier(0.25, 0.46, 0.45, 0.94)`) for buttons, tabs, and list items.
   - Hairline 1px borders with subtle opacity tints (`rgba(20, 21, 20, 0.08)` on light, `rgba(255, 255, 255, 0.1)` on dark).
2. **Raycast's Spatial Continuity:**
   - Directional slide and scale keyframes (`0.95 -> 1.0` scale combined with 4px translation) for modals, menus, popovers, and card detail expansions.
   - Consistent focus ring mechanics with 2px offset.
3. **Reflect's Micro-Pill Tactility:**
   - Dual inset shadows on badges and status pills (`inset 0 1px 1px rgba(255,255,255,0.6), inset 0 -1px 1px rgba(0,0,0,0.06)`).
4. **Prolibu's Dynamic Motion & Realism:**
   - Deceleration curve `cubic-bezier(0.22, 1, 0.36, 1)` for 350ms–500ms macro layout expansions.
   - Pulse ring micro-animations for live meeting indicators and mentor availability beacons.

#### What We Adapt:
1. **Prolibu's Light/Dark Alternation:**
   - Rather than jumping abruptly between deep black and stark white, Skill Swap adapts this into an **Architectural Warm Editorial Canvas**:
     - Light Primary Canvas: `#f7f4ef` (warm linen/ivory).
     - Elevated Cards: `#fdfcfb` with `#dfddd8` border stroke.
     - Dark Focal Spaces: Deep ink obsidian `#141514` reserved for the Cinematic Big Frame portal, live audio/video session stages, and high-impact hero moments.
2. **Grainient's Texture:**
   - Re-implemented strictly as a static CSS background overlay using inline SVG `feTurbulence` data URI at $3.5\%$ opacity with `pointer-events: none; mix-blend-mode: multiply;`. Zero WebGL, zero canvas recalculation, 60fps locked.

#### What We Reject:
1. **WebGL / Canvas Shaders:** Completely banned. All visual depth, lighting, and transitions are achieved with CSS transforms, opacities, and box-shadows.
2. **Neon Accent Colors:** Electric lime (`#c2f13c`), hot pink, or purple neon have no place in Skill Swap. Accents must remain organic: Deep Forest Ink (`#18220e`), Ochre Terra Cotta (`#c86432`), and Muted Slate (`#4a5240`).
3. **Sluggish Animations:** Reject any animation longer than 500ms that delays user input. Interactive state changes must take $\le 200\text{ms}$.
