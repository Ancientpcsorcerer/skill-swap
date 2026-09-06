# GSAP, ScrollTrigger, Lenis & Modern Scroll Choreography (August 2026)

A research brief for choreographing cinematic scroll narratives. All recommendations reflect the state of the web as of August 2026.

---

## 1. GSAP in 2026: Free, Owned by Webflow

**Current stable line: GSAP 3.13+** (released January 2025; 3.13.x patches since). On 29 April 2025 Webflow acquired GreenSock and made the **entire library 100% free for all uses, including commercial**, under a "no-charge" license. The previously gated "Club GSAP" bonus plugins (SplitText, MorphSVG, DrawSVG, ScrollSmoother, Inertia, Physics2D, PhysicsProps, ScrambleText, CustomBounce, CustomWiggle) are now in the public repo and distributed via the `gsap` npm package. There is no longer a paid tier. GSAP remains an independent team inside Webflow.

Notable 3.13 changes:

- **SplitText rewritten**: ~50% smaller bundle, 14 new features, supports animating `var(--my-token)` CSS values.
- **ScrollTrigger regression fix**: animations with `immediateRender: false` inside `from`/`fromTo` tweens now initialize correctly; matters for `invalidateOnRefresh: true` timelines.
- Pixi v8 multi-filter crash fixed; Flip fixes for `shadowRoot` and CSS-rule-only transforms; drawSVG jitter fix; `gsap.utils.mapRange` typo fix.

Install: `npm i gsap` and `import { gsap } from 'gsap'; import { ScrollTrigger } from 'gsap/ScrollTrigger'; gsap.registerPlugin(ScrollTrigger);`

References: [Webflow announcement](https://webflow.com/blog/webflow-acquires-gsap), [GSAP 3.13 blog post](https://gsap.com/blog/3-13/), [CSS-Tricks coverage](https://css-tricks.com/gsap-is-now-completely-free-even-for-commercial-use/).

---

## 2. ScrollTrigger vs Native CSS Scroll-Driven Animations

**Recommendation in 2026: a hybrid, with ScrollTrigger as the spine and CSS `animation-timeline` as the fast path for simple effects.**

CSS scroll-driven animations (`animation-timeline: scroll()` / `view()`, `@scroll-timeline`) are supported in **Chrome/Edge, Safari (including iOS)** as of 2025-2026. **Firefox is the holdout** as of mid-2026 — it is the only major browser without default support (a long-standing feature request at connect.mozilla.org). That gap alone keeps ScrollTrigger in the toolbox for anything that must run uniformly everywhere.

Use CSS scroll-driven when:

- A single element animates on a single timeline (revelation, parallax-y translate, opacity progress).
- You want zero JS on the main thread, or a paint-only transform.

Use ScrollTrigger when:

- You need pinning, horizontal scroll, snapping, batching, nested `containerAnimation`, `matchMedia`, scrub linked to a master timeline, or callbacks.

Example hybrid — a card that reveals via CSS, while the surrounding choreography is GSAP-driven:

```css
.card { animation: rise linear both; animation-timeline: view(); animation-range: entry 0% cover 40%; }
@keyframes rise { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: none; } }
```

References: [MDN: CSS scroll-driven animations](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll-driven_animations), [web.dev case studies](https://developer.chrome.com/blog/css-ui-ecommerce-sda), [Josh W. Comeau, Apr 2026](https://www.joshwcomeau.com/animation/scroll-driven-animations/), [Can I use: animation-timeline scroll()](https://caniuse.com/mdn-css_properties_animation-timeline_scroll).

---

## 3. Lenis: Current State & Integrations

**Lenis** (by darkroom.engineering, [lenis.dev](https://lenis.dev/)) is the de facto smooth-scroll library in 2026. It is actively maintained (~4 KB, RAF-driven, supports touch, pointer, and wheel). **Locomotive Scroll v5 is not a competitor — it is built on Lenis**, so go straight to Lenis if you want the modern API. Lenis does **not** support CSS `scroll-snap`; if you need snap, build it on top via `ScrollTrigger.snap` and a normal scroll container, or use native `scroll-snap-type` on a non-smoothed region.

Integration with GSAP (the canonical pattern, now also packaged at `lenis/gsap`):

```js
import Lenis from 'lenis';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { gsap } from 'gsap';

const lenis = new Lenis({ smoothWheel: true, lerp: 0.1 });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
```

For R3F, wrap `<Canvas>` in a fixed-position stack and feed Lenis's scroll into Drei's `ScrollControls` *or* drive the camera from a `useScroll` hook synced to Lenis. The GSAP forum thread ["Performance Issues on Desktop and Mobile Devices Using GSAP with React Three Fiber"](https://gsap.com/community/forums/topic/43299-performance-issues-on-desktop-and-mobile-devices-using-gsap-with-react-three-fiber/) (Dec 2024) is the most current debugging reference for this stack.

Alternatives: GSAP's **ScrollSmoother** (now free, tightest ST integration but heavier) or plain CSS `scroll-behavior: smooth` + `overscroll-behavior` for simple cases.

---

## 4. Patterns & Code

**Pinned section with horizontal scrub + snap + per-slide parallax (the canonical 2026 pattern):**

```js
gsap.registerPlugin(ScrollTrigger);
const section = document.querySelector('.h-section');
const wrap    = document.querySelector('.h-wrap');
const slides  = gsap.utils.toArray('.slide');

const tween = gsap.to(wrap, {
  x: () => -(wrap.scrollWidth - innerWidth),
  ease: 'none',
  scrollTrigger: {
    trigger: section, pin: true, scrub: 1,
    snap: { snapTo: 1 / (slides.length - 1), duration: 0.3, ease: 'power1.inOut' },
    end: () => '+=' + (wrap.scrollWidth - innerWidth),
    invalidateOnRefresh: true,
    anticipatePin: 1
  }
});

slides.forEach((s) => {
  gsap.fromTo(s.querySelector('.bg'), { x: -50 }, {
    x: 50, ease: 'none',
    scrollTrigger: { trigger: s, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true }
  });
});
```

**`containerAnimation`** is the key flag for any nested trigger that should read progress from a horizontal/scrubbed timeline rather than page scroll.

**Pinned timeline with many animated children (the "Apple Choreography" pattern):**

```js
const tl = gsap.timeline({
  scrollTrigger: { trigger: stage, start: 'top top', end: '+=4000', pin: true, scrub: 1 }
});
tl.to(camera.position, { z: 5 }, 0)
  .to(material,        { roughness: 0 }, 0)
  .from('.copy-1',     { opacity: 0, y: 40 }, 0.1)
  .to('.copy-1',       { opacity: 0, y: -40 }, 0.4)
  .from('.copy-2',     { opacity: 0, y: 40 }, 0.5)
  /* ... */
  .to(stage,           { backgroundColor: '#000' }, 1);
```

This is the Lusion Labs–style "Choreography" pattern behind the iPhone 15 Pro product page ([Apple iPhone 15 Pro](https://www.apple.com/iphone-15-pro/), analyzed at [abhishekbhardwaj971 on Medium](https://medium.com/@abhishekbhardwaj971/the-brand-new-choreography-in-the-iphone-15-pro-product-page-92e9a87c4d04)). The same pattern appears on [Active Theory v4 (Awwwards SOTD)](https://www.awwwards.com/sites/active-theory-v4), with WebGL/Three.js for the 3D and a scrubbed master timeline for synchronization.

**Progress-based animation tied to viewport (no timeline):** use `ScrollTrigger` with a `scrub: true` tween inside `onUpdate(self => ...)`, or read `self.progress` directly when wiring shaders, Three.js uniforms, or canvas drawing.

**Responsive choreography (the right way in 2026):**

```js
const mm = gsap.matchMedia();
mm.add({ isDesktop: '(min-width: 800px)', isMobile: '(max-width: 799px)' }, (ctx) => {
  const cards = gsap.utils.toArray('.card', ctx.selector);
  ScrollTrigger.batch(cards, {
    start: 'top bottom', onEnter: (b) => gsap.to(b, { y: 0, stagger: 0.1 }),
    invalidateOnRefresh: true
  });
  return () => { /* auto-cleanup */ };
});
```

Always set `invalidateOnRefresh: true` on any batch/trigger whose start/end depends on layout, and let `matchMedia` handle breakpoint swaps.

**Scroll-jacking, tasteful vs. poor:** Tasteful scroll narratives (Apple, Lusion, Active Theory) obey four rules: (1) signal entry/exit of the pinned region visually, (2) keep the pinned region to 2–5 viewport heights, (3) preserve user control — fast scroll still escapes the pin, (4) provide a `prefers-reduced-motion` static fallback. Poor scroll-jacking hijacks the wheel, traps the user, ignores the back button, breaks on mobile, and offers no skip. See [smashingmagazine.com/2025/02/scrolltrigger-performance](https://www.smashingmagazine.com/2025/02/scrolltrigger-performance/) for a measured treatment.

**SplitText, now free:** A scroll-pinned hero with character/word reveal:

```js
import { SplitText } from 'gsap/SplitText';
const split = new SplitText('.headline', { type: 'chars,words,lines' });
gsap.from(split.chars, {
  yPercent: 120, opacity: 0, stagger: 0.02,
  scrollTrigger: { trigger: '.headline', start: 'top 80%' }
});
```

---

## 5. CSS Scroll-Driven Animation Support in 2026

Chrome/Edge and Safari (desktop + iOS) ship `animation-timeline: scroll()` and `view()` (with `animation-range`). Firefox is the lone holdout. Use `@supports (animation-timeline: scroll())` to gate. When the support is universal, the planning heuristic: prefer CSS for stateless, single-element, transform-only reveals; use ScrollTrigger for any sequence that pins, branches, or depends on JS state.

---

## 6. View Transitions API: When to Use

Same-document View Transitions have been in Chrome since v111 (2023) and Safari 18.2+; **cross-document (MPA) transitions became shippable in mid-2026** across Chrome and Safari, with Firefox still partial. Use them for: SPA route changes, hero-to-detail morphs, and theme/mode changes. Use ScrollTrigger instead when the visual progression is *coupled to scroll progress* — VT is not a scrub engine. Reference: [CSS-Tricks: Cross-Document View Transitions](https://css-tricks.com/cross-document-view-transitions-part-1/).

---

## 7. Web Animations API vs GSAP

**WAAPI** (`element.animate()`) is now genuinely fast: WAAPI animations are composited on the renderer thread in modern browsers and avoid the main-thread cost that JS-tween libraries incur per frame. For *one-shot* CSS-style effects, transitions, and short keyframe sequences, WAAPI is smaller and free. **GSAP wins** when you need timelines, sequencing, pause/resume/seek, ScrollTrigger, SplitText, MorphSVG, complex easing, or physics. Bench notes: GSAP's per-frame work runs on the JS thread, so a scrubbed timeline with dozens of properties will be heavier than a single WAAPI keyframe animation doing the same visual work. Prefer WAAPI when a single element animates a single compositable property; prefer GSAP when you have choreography.

---

## 8. Award-Winning Sites & Techniques

- **Apple iPhone 15 Pro "Titanium"** ([apple.com/iphone-15-pro](https://www.apple.com/iphone-15-pro/)) — pinned scrub timeline, WebGL/Titanium material transitions, Lusion Labs credits.
- **Active Theory v4** ([awwwards.com/sites/active-theory-v4](https://www.awwwards.com/sites/active-theory-v4)) — WebGPU/WebGL portfolio, scroll-locked 3D stage.
- **Cassie Codes workshop** ([cassie.codes/workshop](https://www.cassie.codes/workshop/)) — current best-practice ScrollTrigger patterns from a Stripe staff engineer; the de facto modern curriculum.
- **Codrops** ([tympanus.net/codrops/2025/05/14/from-splittext-to-morphsvg-5-creative-demos-using-free-gsap-plugins](https://tympanus.net/codrops/2025/05/14/from-splittext-to-morphsvg-5-creative-demos-using-free-gsap-plugins/)) — production demos of the now-free bonus plugins.

---

## 9. Hitting 60fps with Heavy Scroll Animation

1. Animate **only `transform` and `opacity`** — these are the sole properties reliably promoted to the compositor in every browser.
2. Apply `will-change: transform` *only on elements that are about to animate*, and remove it when the animation ends. Over-application blows VRAM and hurts performance.
3. Set `ScrollTrigger.scrub: 1` (or higher) rather than `true` — smoothing happens on a frame interval, decoupling scrub from the wheel event flood.
4. Use `gsap.ticker.lagSmoothing(0)` whenever you integrate Lenis/RAF manually to avoid double-smoothing hitches.
5. Batch DOM reads/writes; never measure layout inside a scrub callback. Recalculate with `ScrollTrigger.refresh()` after fonts and images load.
6. Prefer `ScrollTrigger.batch` over many individual triggers when staggering many elements — it consolidates work and reduces refresh cost.
7. For 3D, animate uniforms (`material.uniforms.uProgress.value = self.progress`) rather than re-rendering geometry; cap DPR with `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))`.

---

## 10. Reduced-Motion Handling

Honor `prefers-reduced-motion: reduce` at the top of the script. The standard 2026 pattern:

```js
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduce) {
  gsap.globalTimeline.timeScale(0); // freeze all tweens
  document.documentElement.classList.add('reduced-motion');
}
```

Then style any CSS scroll-driven effects with `@media (prefers-reduced-motion: reduce) { .card { animation: none; } }`. For ScrollTrigger, either skip registration entirely under reduce, or replace `scrub` tweens with `toggleActions: 'play none none reverse'` once-off reveals. Listening for the media query changing mid-session and calling `ScrollTrigger.refresh()` (and killing/restoring tweens) is the polished version. Reference: [web.dev: prefers-reduced-motion](https://web.dev/articles/prefers-reduced-motion).

---

## TL;DR Stack Recommendation (August 2026)

- **Animation core:** GSAP 3.13+ with ScrollTrigger (free, commercial OK).
- **Smooth scroll:** Lenis + the `lenis/gsap` integration; consider GSAP ScrollSmoother if you need parallax tightly coupled to smooth scroll.
- **3D:** Three.js / R3F + Drei `ScrollControls` or a custom Lenis-driven `useScroll`.
- **Page transitions:** View Transitions API for route changes; ScrollTrigger for scroll-bound sequences.
- **Native CSS scroll-driven animations:** for simple stateless reveals, gated on `@supports`.
- **Accessibility:** always ship a `prefers-reduced-motion` path.

---
**Sources**
- [Webflow acquires GSAP](https://webflow.com/blog/webflow-acquires-gsap)
- [GSAP 3.13 release notes](https://gsap.com/blog/3-13/)
- [GSAP is now completely free (CSS-Tricks)](https://css-tricks.com/gsap-is-now-completely-free-even-for-commercial-use/)
- [Cassie Codes Scroll Animation Workshop](https://www.cassie.codes/workshop/)
- [Lenis](https://lenis.dev/)
- [Locomotive v4→v5 migration](https://scroll.locomotive.ca/docs/extras/migration-guide)
- [MDN: CSS scroll-driven animations](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll-driven_animations)
- [web.dev scroll-driven case studies](https://developer.chrome.com/blog/css-ui-ecommerce-sda)
- [Can I use: animation-timeline scroll()](https://caniuse.com/mdn-css_properties_animation-timeline_scroll)
- [CSS-Tricks: Cross-Document View Transitions](https://css-tricks.com/cross-document-view-transitions-part-1/)
- [Active Theory v4 — Awwwards SOTD](https://www.awwwards.com/sites/active-theory-v4)
- [Apple iPhone 15 Pro "Choreography" reverse-engineering](https://medium.com/@abhishekbhardwaj971/the-brand-new-choreography-in-the-iphone-15-pro-product-page-92e9a87c4d04)
- [Codrops: 5 Creative Demos Using Free GSAP Plugins](https://tympanus.net/codrops/2025/05/14/from-splittext-to-morphsvg-5-creative-demos-using-free-gsap-plugins/)
- [Smashing Magazine: ScrollTrigger Performance](https://www.smashingmagazine.com/2025/02/scrolltrigger-performance/)
- [web.dev: prefers-reduced-motion](https://web.dev/articles/prefers-reduced-motion)
- [GSAP forum: Lenis + R3F performance](https://gsap.com/community/forums/topic/43299-performance-issues-on-desktop-and-mobile-devices-using-gsap-with-react-three-fiber/)
