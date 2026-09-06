# Skill Swap Platform

> A network where everyone knows something, and everyone wants to learn something.

A competition-grade Skill Swap platform. The product: a living constellation of human knowledge where people trade an hour of what they know for an hour of what they want to learn. The website: a cinematic scrollytelling experience that opens with a single point of light, introduces a second, draws a line between them, then reveals the wider network.

## The story

A scroll-driven homepage that tells a five-act story:

1. **Masthead** — A confident paper-feeling wordmark, an editorial headline ("Everyone knows something."), and a one-line lede.
2. **A person in the network** — A single node in a 3D constellation, with a sidebar that names the person and their first skill.
3. **The want** — The same person, now on the right, with the list of what they want to learn hanging like satellites.
4. **An exchange** — Two people find each other, a line draws between them, an hour of sourdough for an hour of generative art.
5. **A community** — The camera pulls back. The full constellation. Twenty people. Twenty-five trades.
6. **Be one of them** — A three-step onboarding: name + email, what you teach, what you want to learn.

After the homepage, the product is DOM/CSS — fast, accessible, content-first. Discover (browse 20 real-feeling profiles), Profile (single person with skills + trades), Exchange (propose a trade), Inbox (your active + completed trades), Me (your profile + hours), Onboard (the same three steps as a standalone flow).

## Stack

- **Vite** + **React 19** + **strict TypeScript**
- **three.js 0.185** + **@react-three/fiber 9.7** + **@react-three/drei 10.7** for the 3D scene
- **GSAP 3.13** (now free) + **Lenis** for smooth scroll
- **Zustand** for state (user, graph, trades)
- **React Router 7** for routing
- **Vanilla CSS** + CSS Modules (no Tailwind — we need editorial control, not utility soup)
- **Zod** for form validation
- **Playwright** for visual inspection

## Visual identity (anti-AI-slop)

- **Palette:** Cloud Dancer (warm off-white #F4F1EB) + ink (#1A1A1A) + a single accent (terracotta #C66E4F)
- **Typography:** Fraunces (variable display serif) + Inter (body grotesque) + JetBrains Mono (labels)
- **Texture:** A subtle SVG paper grain on the body
- **No:** purple/blue gradients, glassmorphism, glow blobs, neon effects, generic SaaS cards, three-column "feature" rows, "Trusted by 10,000+" walls, "AI-powered" copy, decorative 3D

## Documentation

The research, concept, architecture, and iteration decisions are documented in `docs/`:

- `docs/research/` — 8 deep research threads (web design trends, Apple storytelling, skill swap landscape, GitHub landscape, Three.js/R3F, GSAP/scroll choreography, scrollytelling references, UX/competition strategy)
- `docs/concept/00-synthesis.md` — the creative direction, narrative arc, visual identity, and product surface
- `docs/architecture/00-tech-stack.md` — the stack, directory structure, data model, animation system, and 3D scene architecture
- `docs/iteration/` — visual critiques after each major round, with screenshots

## Running locally

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # production build
npm run preview      # preview the build
```

## Inspecting the rendered result

```bash
# Make sure dev server is running
node scripts/inspect.js
```

Captures screenshots at desktop (1440×900), tablet (820×1180), and mobile (390×844) viewports. Outputs to `docs/iteration/screens/`.

## Performance

- 3D scene is the only WebGL content; everything else is DOM/CSS
- Sphere count capped at 20; the `<Canvas>` dpr is capped per-device
- `prefers-reduced-motion: reduce` disables the 3D orbit drift and locks the camera at a mid-shot static composition
- DOM/SVG fallback for no-WebGL clients (via `detectGPUTier` and the `DomFallback` component)
- Routes are lazy-loaded via `React.lazy`; the three chunk is split out manually
- Self-hosted Google Fonts; preconnect + `font-display: swap`

## License

AGPL-3.0. See `LICENSE`.
