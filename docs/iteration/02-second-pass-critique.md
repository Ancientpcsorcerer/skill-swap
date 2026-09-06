# Second-Pass Critique (after major iteration)

**Date:** 2026-08-26
**Status:** Major progress. Most of the original issues resolved.

---

## What now works

1. **Hero title renders** — "Everyone knows something." is fully visible with the terracotta italic accent.
2. **3D constellation has color** — per-profile hues (pink, green, blue, orange, yellow, purple, cyan) all visible. The network reads as a network of distinct people, not a generic blob.
3. **All 4 act text panels visible** — Act 01 (Everyone knows), Act 02 (Everyone wants to learn), Act 03 (An exchange), Act 04 (The community) all appear at the right scroll positions.
4. **Editorial typography** — Fraunces display + Inter body + JetBrains Mono labels work as designed. The hero, section headlines, and act copy all use the right type.
5. **Mobile layout** — masthead, discover, profile all reflow cleanly. The 3D scene renders on mobile. Acts scale to single column.
6. **Discover page** — 20 people, search, filter chips, sort, profile cards all working. Real-feeling bios.
7. **Profile page** — Aria's profile with avatar, headline, location, bio, stats, recent trades, "Propose an exchange" CTA.
8. **Inbox, Me, Onboard, NotFound** — all on-brand.
9. **Footer** — three columns, editorial, restrained.

## Remaining issues (deferred or "good enough")

### MEDIUM — Center cyan sphere is too big
In the 3D scene, one cyan sphere dominates at mid-progress (the "Ines" sphere, hue 180, hours 19). It looks disproportionate. Need to investigate.

Likely cause: the `scale` prop on a `<mesh>` may be interpreted as a uniform scale, but the visual result is larger than expected. Or there's a camera position issue making the closest sphere appear too large.

**Decision:** Acceptable for the demo. The network still reads as a network. Would tune in a polish pass.

### MEDIUM — Pin is now 500vh (5 viewports)
The scroll distance is long. This is intentional (we have 4 acts to tell), but on a fast scroll the user might miss content.

**Decision:** Acceptable. The acts are paced across the scroll and the user can scroll back. Adding a "scroll progress" indicator would be a future polish.

### LOW — BeOneOfThem section is a bit utilitarian
The form is clear and works, but it could feel more editorial. The step numbers (01, 02, 03) feel a bit generic.

**Decision:** Acceptable. The form's content (skill chips, summary) is the right pattern.

### LOW — Inbox empty state could be richer
The inbox shows an empty state if the user hasn't traded. The "you need to join" message is fine but could be more inviting.

**Decision:** Acceptable for the demo.

## What we did NOT do (and why)

- **No view transitions API** — the navigation between pages is instant. Could add a `View Transitions` polyfill but adds complexity for a 3-route demo.
- **No real backend** — in-memory + localStorage is the documented scope.
- **No real auth** — fake "name + email" form, localStorage-persisted. Documented.
- **No mobile-specific 3D fallback** — the same Canvas runs on mobile, but with reduced dpr/particles via `useDetectGPU`. Could be more aggressive.
- **No virtualized list on Discover** — 20 profiles, not needed.
- **No real matching algorithm** — simple bilateral-match score in the Discover sort. Documented in the concept.

## What we DID do well

- **Anti-AI-slop aesthetic held** — no purple/blue gradients, no glassmorphism, no glow blobs. Paper texture, terracotta accent, Fraunces serif, JetBrains Mono labels.
- **Editorial composition** — hard cuts, generous air, asymmetric layouts.
- **Real-feeling content** — 20 profiles with cross-skill interests, 25 trades with believable blurbs, 80 skills across 8 categories.
- **Story-first 3D** — the constellation isn't decorative; it IS the product (a network of human knowledge). The narrative arc (knows → wants → exchange → community → join) is clear.
- **Performance** — bundle is <400KB gz for the homepage (the heavy 3D chunk), <100KB for the DOM-only routes.
- **Accessibility** — focus-visible outlines, semantic HTML, ARIA labels, prefers-reduced-motion support, DOM fallback for no-WebGL.
- **Documentation** — concept, architecture, and iteration docs are in `docs/`, and the README explains the project.

## What I'd polish in a future pass

1. Fix the cyan sphere size
2. Add a scroll progress indicator on the homepage
3. Better mobile 3D fallback (static composition, not full Canvas)
4. Add View Transitions for route changes
5. Polish the BeOneOfThem typography
6. Add more variety in profile bios (some shorter, some longer)
7. Add a "How it works" page
8. Add subtle kinetic type on the hero (weight axis scrub)
