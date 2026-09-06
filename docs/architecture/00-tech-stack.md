# Skill Swap Platform — Technical Architecture

**Date:** 2026-08-26
**Status:** Locked. Implementation will follow this document.

---

## 1. Stack (Locked)

| Layer | Choice | Version | Reason |
|---|---|---|---|
| Build | **Vite** | 5.x (latest) | Fast HMR, native ESM, tree-shakes drei well |
| Framework | **React** | 19.x | R3F v9 requires React 19; React 19 stable |
| Language | **TypeScript** | strict mode | Catch errors at type time; self-documenting |
| 3D | **three** | 0.185.1 | Confirmed via npm in research |
| 3D React | **@react-three/fiber** | 9.7.0 | Confirmed via npm in research |
| 3D helpers | **@react-three/drei** | 10.7.8 | ScrollControls, Instances, Html, shaderMaterial, useReducedMotion |
| Animation | **GSAP** | 3.13+ | Free, ScrollTrigger, SplitText included |
| Smooth scroll | **Lenis** | latest | Industry standard |
| State | **Zustand** | 4.x | Tiny, R3F-friendly, no boilerplate |
| Routing | **React Router** | 6.x | Lightweight, no SSR needed for static demo |
| Styling | **Vanilla CSS** + CSS Modules | — | No Tailwind. We need editorial control, not utility soup. |
| Form validation | **Zod** | 3.x | Type-safe, no form library bloat |
| Icons | Custom inline SVGs | — | No icon font, no Lucide. We control the line weights. |

### Explicitly **not** used

- **Next.js** — overkill for static demo, adds SSR complexity
- **Tailwind** — utility soup encourages template look; we need editorial control
- **Redux** — Zustand is enough
- **Framer Motion** — GSAP does it all
- **Mantine / MUI / shadcn** — they all ship AI-slop default styles
- **Three.js Journey helper libs** — we'll write our own shaders; their utils are great but we want full control

### Initial JS budget (gzipped)

| Route | Target |
|---|---|
| `/` (homepage, with 3D) | < 250 KB |
| `/discover` (no 3D) | < 80 KB |
| Other routes | < 60 KB |

Lighthouse mobile target: **LCP < 1.5s, CLS < 0.05, INP < 100ms, 60fps sustained.**

---

## 2. Directory Structure

```
skill-swap-platform/
├── public/
│   ├── fonts/                 # Self-hosted woff2 (GT Sectra, Söhne, etc.)
│   ├── textures/              # Paper grain SVG, KTX2 if used
│   └── favicon.svg            # Custom mark
├── src/
│   ├── main.tsx               # Entry; mounts Router + Lenis
│   ├── App.tsx                # Top-level layout; Suspense boundaries
│   ├── styles/
│   │   ├── reset.css          # Modern reset
│   │   ├── tokens.css         # CSS variables (color, type, space, motion)
│   │   ├── typography.css     # Type scale + utility classes
│   │   ├── grain.svg          # SVG noise filter
│   │   └── globals.css        # Body, layout primitives
│   ├── routes/
│   │   ├── Home/              # The 5-act homepage with 3D
│   │   │   ├── Home.tsx
│   │   │   ├── sections/
│   │   │   │   ├── Masthead.tsx
│   │   │   │   ├── KnowsSomething.tsx
│   │   │   │   ├── WantsToLearn.tsx
│   │   │   │   ├── Exchange.tsx
│   │   │   │   ├── Community.tsx
│   │   │   │   └── BeOneOfThem.tsx
│   │   │   └── scene/         # R3F scene
│   │   │       ├── Scene.tsx
│   │   │       ├── Nodes.tsx
│   │   │       ├── Connections.tsx
│   │   │       ├── Camera.tsx
│   │   │       ├── Atmosphere.tsx
│   │   │       └── data.ts    # The 80 skills, 20 profiles, graph
│   │   ├── Discover/
│   │   ├── Profile/
│   │   ├── Exchange/
│   │   ├── Inbox/
│   │   ├── Me/
│   │   ├── Onboard/
│   │   └── NotFound/
│   ├── components/
│   │   ├── primitives/        # Button, Card, Chip, Tag, Field
│   │   ├── layout/            # Nav, Footer, Container, Stack, Cluster
│   │   ├── motion/            # FadeUp, Reveal, Marquee, TypeWeight
│   │   └── data/              # ProfileCard, SkillChip, TradeRow
│   ├── data/
│   │   ├── profiles.ts        # 20 fictional but real-feeling profiles
│   │   ├── skills.ts          # 80 skills across 8 categories
│   │   ├── exchanges.ts       # Sample exchanges to seed
│   │   └── graph.ts           # Network topology for the 3D scene
│   ├── store/
│   │   ├── user.ts            # Zustand: current user, onboarding state
│   │   ├── graph.ts           # Zustand: hover/selection state for the 3D
│   │   └── trades.ts          # Zustand: in-memory trade ledger
│   ├── lib/
│   │   ├── lenis.ts           # Lenis setup + GSAP integration
│   │   ├── gsap.ts            # GSAP plugins registered
│   │   ├── motion.ts          # Shared motion helpers (prefers-reduced-motion)
│   │   ├── gpu.ts             # useDetectGPU + tier logic
│   │   ├── format.ts          # formatHours, formatSkill, etc.
│   │   └── id.ts              # Tiny ID generator
│   └── types/
│       └── index.ts           # Profile, Skill, Exchange, Relation
├── docs/                      # Research, concept, architecture, iteration
├── index.html
├── package.json
├── tsconfig.json              # strict: true, noUncheckedIndexedAccess
├── vite.config.ts             # build target, manualChunks
├── .gitignore
└── README.md
```

---

## 3. Data Model (TypeScript)

```ts
// types/index.ts

export type SkillCategory =
  | 'design' | 'code' | 'music' | 'cooking'
  | 'language' | 'movement' | 'writing' | 'craft';

export interface Skill {
  id: string;                // 'design.foundations'
  label: string;             // 'Design Foundations'
  category: SkillCategory;
  blurb?: string;
}

export type TrustBand = 'new' | 'established' | 'trusted';

export interface Profile {
  id: string;
  name: string;
  initials: string;          // For avatar fallback
  hue: number;               // 0–360, deterministic for sphere color
  location: string;          // 'Mexico City', 'Lagos', 'Berlin'
  timezone: string;          // 'GMT-6'
  bio: string;               // 1–2 sentences, written voice
  teaches: string[];         // Skill ids
  learns: string[];          // Skill ids
  hoursGiven: number;
  hoursReceived: number;
  trust: TrustBand;
  nextAvailable?: string;    // ISO timestamp
  recentTrades: Trade[];
}

export interface Trade {
  id: string;
  fromId: string;            // who gave
  toId: string;              // who received
  skillId: string;           // the skill taught
  hours: number;             // always 1 for MVP
  timestamp: string;         // ISO
  blurb: string;             // "Aria traded 1 hr sourdough for 1 hr generative-art"
}

export interface Relation {
  id: string;
  fromId: string;
  toId: string;
  status: 'proposed' | 'accepted' | 'completed' | 'declined';
  proposedAt: string;
  hoursOffered: number;      // 1
  hoursWanted: number;       // 1
  skillOffered: string;
  skillWanted: string;
}

export interface GraphNode {
  profileId: string;
  position: [number, number, number];
  size: number;              // base on hoursGiven (0.2–0.6)
}

export interface GraphEdge {
  from: string;              // profileId
  to: string;                // profileId
  bidirectional: boolean;    // true for true exchanges; false for "wants to learn" alone
}
```

---

## 4. Skill Taxonomy (80 skills, hand-picked)

8 categories × 10 skills each. Curated for variety, recognizability, and not-skewed toward tech:

**Design** — Design Foundations, Color Theory, Typography, Figma, Brand Identity, UX Research, Editorial Layout, Generative Art, Photography, Risograph
**Code** — HTML/CSS, JavaScript, TypeScript, React, Python, SQL, Swift, Rust, A11y Patterns, Build Tools
**Music** — Guitar, Piano, Singing, Music Theory, Songwriting, Production, Modular Synth, DJing, Reading Charts, Mixing
**Cooking** — Sourdough, Knife Skills, Pasta, Fermentation, Sushi, Vegan, Bread, Cake Decorating, Spice Blends, Meal Prep
**Language** — Spanish, Japanese, Korean, Mandarin, French, Arabic, Portuguese, German, Italian, Swahili
**Movement** — Yoga, Pilates, Climbing, Strength, Running Form, Mobility, Bouldering, Contemporary Dance, Capoeira, Tai Chi
**Writing** — Long-form, Editing, Poetry, Screenwriting, Journaling, Technical Docs, Copy, Worldbuilding, Translation, Memoir
**Craft** — Pottery, Bookbinding, Embroidery, Woodworking, Knitting, Block Print, Mending, Soapmaking, Beadwork, Leather

---

## 5. Profile Roster (20 fictional-but-real profiles)

A diverse, international set with believable cross-skill interests. All use plausible first names, real locations, short bios, and *cross-domain* teach/learn pairs (so the bipartite match is non-trivial).

Examples (full list in `src/data/profiles.ts`):

| Name | Location | Teaches | Learns |
|---|---|---|---|
| Aria Mendes | Mexico City | Sourdough, Knife Skills | Generative Art, Pottery |
| Mateo Reyes | Buenos Aires | Generative Art, Risograph | Sourdough, Coffee |
| Joon Park | Seoul | Korean, Photography | Climbing, Bouldering |
| Hafsah Diallo | Lagos | Songwriting, Singing | Piano, Music Theory |
| Yuki Tanaka | Osaka | Pottery, Mending | Japanese (for Joon's students), Knitting |
| Omar El-Sayed | Cairo | Arabic, Calligraphy | Strength, Mobility |
| Ines Costa | Lisbon | Portuguese, Cooking (Fish) | Worldbuilding, Memoir |
| Lena Brand | Berlin | Editorial Layout, Type | Pottery, Block Print |
| Theo Nilsen | Stockholm | Build Tools, Rust | Climbing, Yoga |
| Priya Iyer | Bangalore | Python, SQL | Embroidery, Soapmaking |
| Kwame Asante | Accra | DJing, Modular Synth | Capoeira, Drumming |
| Saoirse Walsh | Dublin | Long-form, Editing | Sourdough, Gardening |
| Diego Soto | Lima | Climbing, Mobility | Cooking (Ceviche), Coffee |
| Naomi Lev | Tel Aviv | Photography, Editing | Pottery, Long-form |
| Ravi Anand | Mumbai | Film Photography, Yoga | Python, A11y Patterns |
| Freya Olafsdottir | Reykjavik | Knitting, Embroidery | Strength, Running Form |
| Cam Whitfield | Auckland | Pottery, Wheel Throwing | Generative Art, Bookbinding |
| Maya Bishara | Beirut | Arabic Poetry, Memoir | Pasta, Fermentation |
| Tomi Adekoya | Abuja | Coaching, Mending | Figma, UX Research |
| Yuri Sasaki | Sapporo | A11y Patterns, Build Tools | Sourdough, Miso-making |

(20 profiles. Many cross-links. Enough to feel like a network.)

---

## 6. Animation System

### Lenis + GSAP integration (single instance, mounted in `App.tsx`)

```ts
// src/lib/lenis.ts
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const initLenis = () => {
  const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
};
```

### Reduced-motion handling (single source of truth)

```ts
// src/lib/motion.ts
export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// All GSAP timelines guard:
if (prefersReducedMotion()) return; // do not animate, set end state
```

### Section reveals (FadeUp pattern)

```ts
// One pattern, used everywhere
gsap.from('.fade-up', {
  y: 24, opacity: 0, duration: 0.8, ease: 'power2.out',
  scrollTrigger: { trigger: '.fade-up', start: 'top 85%' }
});
```

### R3F camera animation (the one 3D moment)

```tsx
// src/routes/Home/scene/Camera.tsx
const scroll = useScroll();
useFrame((state) => {
  const t = scroll.offset; // 0 → 1
  state.camera.position.z = 4 - t * 8;
  state.camera.position.y = 1 + t * 2;
  state.camera.lookAt(0, 0, 0);
});
```

---

## 7. The 3D Scene (Architecture)

### Topology

- **80 nodes** (one per skill, OR one per profile). *Decision: 1 node per profile = 20 nodes, but each profile broadcasts the skills it teaches via labels. This makes the network feel small enough to read.*
- **Edges**: directed graph. `from = A.teaches ∩ B.learns`, `to = B.teaches ∩ A.learns`. ~30 edges at 20 profiles. ~100 edges at full launch. We render the small version.
- **Camera**: a 3-keyframe cinematic: (close, on one node) → (mid, two nodes + line) → (far, full network). Driven by `useScroll().offset`.

### Render order

1. `<Canvas>` (dpr capped via `useDetectGPU`, no antialias on mobile)
2. `<Atmosphere />` — back-side sphere with fresnel shader, additive blend
3. `<Nodes />` — `<Instances>` of small spheres, colored by hue
4. `<Connections />` — `Line2` per edge, with `linkDirectionalParticles` for energy flow
5. `<Camera />` — scroll-driven, no OrbitControls (this is a film, not a toy)
6. `useReducedMotion()` → static composition, no animation

### WebGL tier logic (`useDetectGPU`)

| Tier | dpr | Particles per edge | Fog |
|---|---|---|---|
| WebGPU desktop | 2 | 12 | full |
| WebGL2 modern | 1.5 | 6 | full |
| WebGL2 low | 1 | 2 | reduced |
| No WebGL | DOM fallback: static SVG force graph | — | — |

### DOM fallback

If no WebGL, render the same data as a static SVG with `d3-force` for layout. The DOM version *also works* for screen readers and keyboard nav. We get accessibility for free.

---

## 8. Mobile Strategy (Apple-style, intentional)

| Aspect | Decision |
|---|---|
| 3D | Same Canvas, but `dpr={[1, 1.5]}` cap, particles/2, fog reduced |
| 3D disable | On small + low-end, fall back to a static composition (single frame) |
| Pinning | 1 pinned scene (the homepage 3D). All other routes are normal scroll. |
| Section count | Same 5 acts, but acts 3–4 may collapse on small screens |
| Nav | Bottom-fixed (Apple pattern), 3 icons + menu |
| Font scale | Display caps at 56px on small (vs 144 desktop); hierarchy preserved |
| Touch | All scroll-driven animations respond to touch; no hover-only moments |
| Reduced motion | Static composition; no fade-up, no kinetic type, no particles |

---

## 9. Accessibility (non-negotiable)

- All interactive elements keyboard-reachable
- All images have `alt`; SVG icons have `aria-label` or `aria-hidden`
- Focus-visible outlines on all interactive elements
- `prefers-reduced-motion: reduce` → static composition, no GSAP, no R3F animation
- Color contrast: ink (#1A1A1A) on Cloud Dancer (#F4F1EB) = 14.5:1 (AAA)
- Terracotta accent (#C66E4F) on Cloud Dancer = 4.7:1 (AA-large); use only on body+ sizes
- All 3D content has a DOM/SVG equivalent visible to screen readers (a `<ul>` of profiles)
- Form errors are announced via `aria-live="polite"`
- Skip link at top of page

---

## 10. Performance (non-negotiable)

- Self-hosted woff2 fonts; preload `<link rel="preload" as="font" crossorigin>` for the display face
- `font-display: swap`
- No external CDNs at runtime (we want the site to be self-contained for the demo)
- No images except a few small SVGs (avatars are SVG initials)
- No third-party scripts
- Code-split routes via `React.lazy`; 3D scene in its own chunk
- Manual chunking in Vite: `react-three-fiber`, `three`, `drei`, `gsap`, app code
- The 3D Canvas only mounts when the user scrolls into Act 1 (~`IntersectionObserver`)
- Atmosphere shader is a single pass; no postprocessing
- 60fps on a throttled 4G mid-tier Android (Mali-G57) — our floor

---

## 11. Open Decisions Resolved

| Question | Decision |
|---|---|
| Skill taxonomy | 80 hand-picked, 8 categories (above) |
| Backend | None. In-memory Zustand + localStorage persistence |
| Auth | Fake. Email + display name. No real auth. |
| Real users | 20 fictional profiles, hand-written, real-feeling |
| Real photos | None. SVG initials avatars. We control the look. |
| Hosting | Static. `dist/` deployable to any static host. |
| Build target | ES2022, modern browsers (Chrome/Edge/Safari/Firefox last 2) |
| TypeScript | strict: true, noUncheckedIndexedAccess: true |
| Testing | Manual via Playwright at three breakpoints. No unit tests for the demo. |

---

## 12. Implementation Order (build sequence)

1. **Scaffold** — Vite + React 19 + TS strict + base config
2. **Design system** — tokens, typography, grain, primitives (Button, Card, Chip, Field, Container, Stack)
3. **Layout shell** — Nav, Footer, Router setup, route shells (empty pages)
4. **Data** — profiles.ts, skills.ts, exchanges.ts, graph.ts
5. **Homepage sections 0, 5** — Masthead + BeOneOfThem (DOM, form)
6. **3D Scene** — Scene.tsx, Nodes, Connections, Camera, Atmosphere
7. **Homepage sections 1–4** — KnowsSomething, WantsToLearn, Exchange, Community
8. **Discover page** — Multi-facet filters, profile cards
9. **Profile page** — Single profile view
10. **Exchange flow** — Propose form, validation, state
11. **Inbox / Me** — Activity feed, user dashboard
12. **Onboarding** — 3 screens, "I teach / I want to learn" chips
13. **Mobile pass** — Test every page at 375px
14. **Performance pass** — Lighthouse, bundle audit
15. **Playwright inspection** — Visual critique
16. **Iteration** — Fix and refine

Each step is followed by a self-critique. We do not proceed to the next step if the current step looks generic.
