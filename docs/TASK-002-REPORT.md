# TASK-002 — landing and Frame correction

Completed 12 September 2026, including the CEO's section 27 removal of the bottom partner strip. Preview: http://127.0.0.1:5173/.

## 1. Inspection performed

Read the complete TASK-002 attachment and inspected the existing implementation before modification:

- Root orchestration: `src/app/App.tsx`, `AppExperience.tsx`, `src/main.tsx`.
- Landing: `LandingSection.tsx`, `HeroMedia.tsx`, `Hero.tsx`, `PartnerStrip.tsx`.
- Header, navigation, shared CTA, signup shell, and modal scroll/focus hook.
- Frame: `FrameTransition.tsx`, `useFrameProgress.ts`, `src/lib/frame.ts`, `src/types/experience.ts`.
- Assets and layout: `src/lib/assets.ts`, landing/Frame/global/token styles, and every current public asset.
- Routing/configuration: `index.html`, Vite config, package manifest, entry point, and source-wide route/history/location/link searches.
- Existing acceptance tests, responsive script, and TASK-001 measurement/report documents.

The authoritative references had already been fully read and visually inspected during TASK-001. Their original hashes were checked again before and after this correction.

## 2. Root cause and actual media timing

The original MP4 is **1664 × 1248**, **24 fps**, **241 frames**, **10.041667 seconds**. No separate animated Frame asset existed; the second scene used `portal-poster.webp`.

The original video combines person/fog motion with continuous camera approach. There is no useful stationary walking-only interval followed by a clean transition boundary. Frame measurements show:

| Time | Portal horizontal bounds | Bright interior top/bottom |
| --- | --- | --- |
| 0.000 s | 723–939, width 217 px | 463–967 |
| 0.083 s | 723–939, width 217 px | 462–967 |
| 0.500 s | 722–940, width 219 px | 458–968 |
| 1.000 s | 720–941, width 222 px | 452–970 |
| 5.000 s | 707–956, width 250 px | 395–981 |
| 10.000 s | 680–983, width 304 px | 286–999 |

The source timeline also shows foreground displacement across the opening samples as the camera approaches. Thus a simple late cutoff would retain some camera push.

Two mechanisms produced the reported experience:

1. `HeroMedia` autoplayed the entire source MP4 with native `loop`. The camera movement was baked into the asset, and the loop restarted it at the end. No JavaScript reset routine was needed.
2. `App` rendered a full-screen landing followed by a separate three-viewport `FrameTransition` section. That section displayed a second poster scene and applied its own scroll-based CSS zoom, producing the separate-page impression.

Frame-by-frame measurements and source/derived timeline sheets are in [media-inspection](task-002/media-inspection).

## 3. Files changed

Modified implementation:

- `src/app/App.tsx`: single scroll track and single pinned scene.
- `src/sections/LandingSection.tsx`: header and hero overlay only.
- `src/components/landing/HeroMedia.tsx`: isolated landing clip, play once/end hold, suspension during traversal, preserved manual pause and reduced motion.
- `src/components/frame/FrameTransition.tsx`: one persistent visual with landing/application overlays.
- `src/lib/frame.ts`: quarter-viewport hold, normalized scroll progression, new experience names.
- `src/lib/assets.ts`: runtime references to the derived landing clip and poster only.
- `src/types/experience.ts`: independent auth and updated experience states.
- `src/styles/frame.css`: one sticky scene and its progress-driven transforms/fades.
- `src/styles/landing.css`: removed every partner-strip rule and exclusive spacing.
- `src/styles/tokens.css`: removed the unused strip color token.
- `index.html`: removed the obsolete remote-video preconnect.
- `tests/landing.spec.ts`: updated and expanded acceptance checks.
- `scripts/verify-responsive.mjs`: current viewport screenshots, removed-strip checks, poster fallback and guest traversal on video failure.
- `README.md`: current behavior, run commands, and asset reproduction.
- `docs/REFERENCE-MEASUREMENTS.md`: historical-spec precedence notice.

Deleted `src/components/landing/PartnerStrip.tsx`, including all four inline SVG partner marks. There were no separate partner icon files to delete.

Added:

- `public/video/landing-ambient.mp4`
- `public/images/landing-poster.webp`
- `scripts/build-landing-media.py`
- `scripts/verify-landing-media.py`
- This report and diagnostic JSON/images/screenshots under `docs/task-002/`.

The original reference image, prompt, source MP4, brand geometry, typography, and navigation labels are preserved. The npm manifest and lockfile did not change.

## 4. Separate Frame page/route correction

There was no dedicated Frame route or routing library in this repository. The separate lower page-like section was replaced with this continuous structure:

```text
App
  main
    experience-track (native document scroll)
      frame checkpoint anchor
      FrameTransition (one sticky viewport)
        HeroMedia (one persistent video and fallback poster)
        LandingSection (header + hero overlay)
        AppExperience (future application boundary)
  SignupModal
```

The original lower poster scene, its separate track, duplicate media, and associated CSS were removed. The Frame anchor is an in-page checkpoint. No route switch, navigation controller, wheel listener, or one-shot playback controller is used.

## 5. Landing media separation

The derived clip uses only pixels from the approved source. Its opening environment, portal, and foreground are held. Per-frame inverse affine registration removes the measured camera approach from the original person/fog samples. A soft mask retains motion only around the person and fog beside the door. Registration and compositing happen offline.

The browser plays the finished **10.04-second clip once**, then holds its final frame indefinitely. There is no loop, seek-to-zero, replay on reverse traversal, or playback-end callback that changes experience state. Returning before the clip ends resumes its existing playback position; returning after it ends preserves the held frame.

No person, fog, portal, or environment was generated or replaced. The derived opening poster supplies reduced-motion and failed-media rendering. The full source MP4 remains preserved and is excluded from runtime playback/fallback references.

Offline helpers use NumPy 2.2.6, Pillow 12.3.0, and FFmpeg. NumPy/Pillow are isolated under the ignored `.local/media-tools` directory and are not application dependencies.

## 6. Scroll controls traversal

One `useFrameProgress` instance remains the authoritative scroll observer. It uses a passive document scroll listener, resize observation, and a scheduled measurement per pending animation frame. `measureFrame` computes:

```text
hold = viewportHeight × 0.25
distance = trackHeight − viewportHeight − hold
frameProgress = clamp((-trackTop − hold) / distance, 0, 1)
```

The first quarter viewport keeps the initial composition stable. Continued scrolling fades the landing controls, scales the same scene toward the portal, and reveals the application boundary. The scale is `1 + 11 × progress²`; transforms and opacity have no independent timers.

The media controller pauses ambient playback while progress is positive. It does not control progress, and the Frame controller never plays or seeks media.

## 7. Reverse scroll

Scrolling upward reduces the same normalized value. The same mounted scene retraces the same transform and fades, returning to the same ambient video position. Tests confirm identical transforms at matching forward/reverse scroll positions, a persistent video DOM node, a pinned viewport, and an unchanged URL.

## 8–9. Guest access and renderer constraints

AuthState is `guest | authenticated`. ExperienceState is separately `landing | frame-transition | inside-app`. No Frame logic receives or checks authentication.

Guest traversal passed on desktop, phone, and tablet. Both Get Started controls still open only the signup modal; close/Escape restore scroll and focus.

No WebGL, Three.js, React Three Fiber, Babylon.js, PixiJS, PlayCanvas, canvas renderer, or new npm dependency was introduced. Runtime source contains no wheel handler, reset seek, loop attribute, partner strip, or old second-scene controller.

## 10. Verification results

- **Build passed**, including TypeScript checks.
- **33 browser tests passed; 3 intentionally skipped** because they apply only to another device profile: the mobile-specific test on desktop and wheel-specific test on phone/tablet.
- Tested production build in Edge at 1487 × 1058, Pixel 7 emulation (412 × 839), and tablet (768 × 1024).
- Fresh idle playback was observed through actual media end plus two seconds on all three profiles: no scene zoom, scroll, route change, or reset.
- Forward/reverse guest traversal, matching reverse transforms, same video node, native wheel progress, touch progress and reverse touch gestures passed.
- Both signup triggers, Escape/backdrop/button closing, keyboard wrapping, scroll lock/restoration, and modal independence passed.
- Automated accessibility checks passed on landing, signup modal, and mobile menu. Reduced-motion playback and Frame access passed.
- Console/runtime checks reported no errors.
- Additional 1280 × 956, 320 × 568, 844 × 390, and 3440 × 1440 checks passed. No horizontal overflow or clipped tested headline/CTA was found. The removed strip is absent.
- Simulated landing-video failure preserved the approved poster, signup interaction, and guest traversal.
- Original reference hashes and the original source-video hash remained unchanged.

The shipped MP4 was independently decoded and checked across **all 241 frames**:

| Measurement | Result |
| --- | --- |
| Portal left/right/top/bottom drift | **0 / 0 / 0 / 0 px** |
| Maximum foreground mean pixel difference | 0.00592 on a 0–255 scale |
| Maximum portal mean pixel difference | 0.00525 on a 0–255 scale |
| Person mean pixel change | Up to 17.76; original motion retained |
| Fog mean pixel change | Up to 7.56; original motion retained |

The tiny static-region intensity differences arise after video compression; portal geometry is unchanged. Before encoding, all pixels outside the ambient mask are identical across every frame. [Encoded verification](task-002/media-inspection/encoded-verification.json) and [responsive evidence](task-002/responsive-checks.json) contain the results.

Current screenshots were visually inspected on desktop, phone, and tablet, alongside the source and derived media timelines. Browser testing used Edge and emulated touch input; physical-device, Safari, Firefox, and manual screen-reader testing were not performed.

## Section 27 — bottom content removed

All partner text, four partner SVGs, the strip container, its animations/positions, phone grid/tablet row, strip token, and exclusive padding were removed. The video control no longer reserves the former logo area. No replacement text, logo, footer, or partner content was added. The bottom now shows cinematic negative space.

The TASK-001 reports/screenshots and original prompt remain historical reference material. They are superseded by TASK-002 where behavior or content differs.
