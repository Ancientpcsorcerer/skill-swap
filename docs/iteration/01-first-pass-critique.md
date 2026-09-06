# First-Pass Visual Critique (after initial build)

**Date:** 2026-08-26
**Verdict:** Strong typography, clean editorial pages, but the hero is broken and the 3D scene needs major work.

---

## What works (don't touch)

- **Discover page** — editorial, restrained, real-feeling profiles, the type scale and category chips look right
- **Profile page** — clean, the trade list reads like a magazine
- **Inbox, Me, Onboard, NotFound** — all on-brand, no fixes needed
- **Footer** — three columns, typographic, restrained
- **Color system** — Cloud Dancer + ink + terracotta is reading as designed
- **Typography hierarchy** — Fraunces + Inter + JetBrains Mono working well

## What's broken (fix in order of severity)

### CRITICAL — Hero is invisible

The masthead shows the topbar (Issue 01 / Vol. I / Network), then a 100vh of pure paper. The headline "Everyone knows something." is **completely invisible**. Same for the lede paragraph.

**Root cause:** the GSAP `gsap.from(...)` on `data-reveal` elements starts them at `opacity: 0`. If the timeline doesn't run, they stay hidden. Looking at the code: `delay: 0.2` and `useEffect` runs after mount, so this should work — but in the screenshots, the headline is not even at low opacity, it's not in the DOM. Most likely: the element exists but the CSS is failing.

Actually — wait — looking again: in the fullpage screenshot, the topbar shows (so the data-reveal attribute is fine), but the title below does not. The issue is the title has `data-reveal` but it's not visible. Need to verify the GSAP timeline is running and the data-reveal element actually animates in.

**Fix:** Either remove the GSAP animation (and let CSS handle it via opacity:1 + a class), or set `visibility: visible` after animation completes. Safer: animate with CSS only, no JS timeline for the masthead.

### CRITICAL — 3D scene is washed out and broken visually

The constellation renders, but it has multiple problems:

1. **Spheres are pure black** — the per-instance `color` prop is not being applied. The `meshStandardMaterial` is dark, and `Instance.color` may not override the material color in v9. Need to verify.
2. **Atmosphere is too pink** — the fresnel atmosphere is making the entire scene look peachy/washed. Need to reduce `uOpacity` significantly and possibly change the color.
3. **One sphere dominates at mid-progress** — at progress ~0.5, one giant black sphere is huge on the left. This is because the camera position is wrong, or the sphere sizes are too big.
4. **At progress 0.7+, almost nothing visible** — the camera has pulled too far back or the field of view is wrong.

**Fix:**
- Verify Instance.color is applied (may need `meshStandardMaterial vertexColors: true` or pass color via shader)
- Reduce atmosphere opacity from 0.15 to 0.05
- Adjust sphere sizes from 0.18–0.42 to 0.10–0.22
- Tune the camera arc to keep more spheres in frame at far position

### HIGH — Act text is barely visible during the pin

In the screenshots, the "Act 01" through "Act 04" copy is faded out. Looking at the act components, they compute opacity based on `progress`. So when progress = 0, Act 01 is at opacity 1. But the act is inside the pin which is `400vh` tall — the sections stack, all at opacity 0 except Act 01.

But wait — Act 01 is positioned inside `.pinInner` which is `z-index: 1` and the canvas is `z-index: 0`. So the act should overlay the canvas. The opacity computation seems right.

The issue: at scroll position 0, progress is 0, so Act 01 is at opacity 1. But the screenshot at scroll 0 shows the masthead, not the pin content. So I never see the act during the actual pin section. The pin section is fully covered by the 3D canvas which is on top of the text!

Wait, let me check the CSS:
- `.pinInner` has `z-index: 1, pointer-events: none` (but children get `pointer-events: auto`)
- `.canvasFixed` has `z-index: 0`

But the canvas has `pointer-events: none`. So the text should be readable. Let me look at this more carefully.

**Looking at the scroll-1vh screenshot:** I see a black "ring" / circle taking up the top half of the page, with no text. The text is hidden behind the canvas. Actually no — the canvas is at z-index 0 and text is z-index 1, so text should be on top. But it's not visible.

Wait, the actual issue: the canvas is `position: sticky; top: 0; height: 100vh; width: 100%`. The pin is `position: relative; height: 400vh`. The pinInner is `position: relative; z-index: 1; pointer-events: none` and contains 4 act sections, each `min-height: 100vh; padding: var(--s-9) var(--gutter)`. So they should stack vertically inside the 400vh pin, with the canvas sticky to the viewport.

But the act sections appear faded — that's because their opacity is computed from progress, and at progress 0.0, only Act 01 has opacity 1. Acts 02, 03, 04 are at opacity 0. Act 01 is at the very top of the pin. So at scroll 1vh, the user has just started scrolling, the canvas has just become sticky, and Act 01 is at full opacity.

But Act 01's text is hidden by the canvas! Because the act has `min-height: 100vh` but no background color, and the canvas is sticky, the canvas overlays the act.

Wait — `.pinInner` has `z-index: 1` but is inside `.pinWrap` which is `position: relative`. The canvas is inside `.canvasFixed` which is inside `.pinWrap` and has `z-index: 0`. So the act (in pinInner, z-index 1) should be ABOVE the canvas. So why is it hidden?

Looking again: `.canvasFixed` has `position: sticky; top: 0`. Sticky positioning doesn't create a new stacking context unless z-index is set. It has z-index: 0. The pinInner has z-index: 1. So pinInner should win.

But the text doesn't show. The text might be there but invisible because of color? Or the parent might be hiding overflow.

Actually, the most likely issue: I'm computing opacity but the `.left` text column doesn't have a background, and the 3D scene with pink wash is bleeding through.

**Fix:** Give the act text panels a `background: var(--paper)` (transparent up to ~95%) or use a `mix-blend-mode: difference` to make text readable over any canvas. Or, more conservative: place the act text in a card with a semi-transparent paper background so the canvas shows through subtly.

### MEDIUM — Masthead section's topbar layout

The topbar shows two short pieces of metadata side-by-side. The right one says "A network of human knowledge". This is fine but feels like it should be more emphatic.

### MEDIUM — 3D spheres need labels

In the screenshots, hovering isn't visible. Need to verify hover state works in the actual browser. In Playwright headless, hover events may not work the same. Labels should also appear on scroll progress, not just hover.

### LOW — Mobile experience

Need to check. Pin should be shorter, hero simplified, or replaced with a static composition on mobile.

---

## Specific fix plan

1. **Fix masthead visibility**
   - Remove GSAP timeline in Masthead
   - Use CSS-only fade-in (animation-name: fade-in) with `prefers-reduced-motion: reduce` respected
   - OR: keep GSAP but ensure the timeline always sets opacity to 1 at the end (use `onComplete` to set `clearProps`)

2. **Fix 3D scene**
   - Verify Instance color: use `meshStandardMaterial` with `vertexColors: true` OR use `meshBasicMaterial` (no lighting, color works directly)
   - Reduce atmosphere `uOpacity` to 0.04
   - Reduce sphere sizes to 0.10–0.20
   - Add subtle wireframe outline or rim-light to make spheres more "node-like"

3. **Fix act text readability over 3D canvas**
   - Add semi-transparent paper background to act panels: `background: rgba(244, 241, 235, 0.92); backdrop-filter: blur(6px)`
   - OR use `mix-blend-mode: multiply` to keep text crisp over any color
   - OR add a left/right margin to text so it sits off the busy center

4. **Polish**
   - Make the 3D scene start a bit smaller (camera further back) so the initial view shows the full network
   - Reduce pink atmosphere aggressively
   - Add a subtle "currently viewing" indicator on the masthead

5. **Mobile**
   - Verify pin works on small screens
   - Reduce sphere count to 12 max
   - Skip orbit drift on mobile

6. **Re-inspect after each fix**
