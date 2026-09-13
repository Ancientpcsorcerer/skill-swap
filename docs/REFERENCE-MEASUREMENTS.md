> Historical TASK-001 measurements. TASK-002 supersedes the partner strip, full-source looping playback, and separate Frame scene. See [TASK-002 report](TASK-002-REPORT.md).

# TASK-001 source inspection

Both original files were read before implementation, and remain untouched in the project root.

- reference_0.webp: actual decoded dimensions **1280 × 956**.
- prompt.txt: complete 14,330-byte MotionSites specification; design coordinate system **1487 × 1058**.
- No application, package manager manifest, Git repository, configuration, assets directory, or ancestor AGENTS.md existed.
- The source video is 1664 × 1248 H.264, approximately 10.04 seconds, 5,361,462 bytes.

## Precedence

TASK-001 overrides the older prompt's single-file architecture, hidden document overflow, original headline, subtitle, extra navigation, and secondary CTA. The delivered application uses separate components and native document scrolling. The only hero title is Skill Swap. About us and Contact are deliberately inactive buttons, confirmed by the CEO during implementation.

## Measured desktop implementation

| Element | Reference units |
| --- | --- |
| Height unit | 100dvh / 1058; 100vh fallback |
| Width unit | 100vw / 1487 |
| Type interpolation | clamp(u, .65u + .35uw, 1.16u) |
| Brand | left 75; top 27; 31.5 × 48.5 |
| Navigation | centered; top 51; 19px-equivalent; gap 24.5 |
| Header CTA | right 75.4; top 27; 175 × 49; type 20.6 |
| Hero title | left 75.5; top 230.5; type 71.6h / 80.5h; weight 400 |
| Hero CTA | left 74.9; top 230.5u + 264.5h; 175.6h × 50h |
| Video | centered; top 1; 1492 × 1054; translateX(-50% - .5u); cover |
| Logo strip | width 741; center +20; mark tops 994.7 / 995.7 / 996.7 / 998.7 |

All desktop bottom-fade stops and side-fade positions are transcribed from prompt.txt. All seven color tokens and the exact brand path, gradient stops, and bright rectangles are retained.

## Responsive and accessibility adaptations

The portrait breakpoint remains aspect ratio 11/10. Phone unit is min(100vw/430, 1.34px); tablet ≥600 uses min(100vw/860, 100vh/760, 1.25px). Portrait layouts use normal flow, safe-area padding, a full-screen menu, the specified crop positions (43% / 44%) and separate gradient stops. Logos become a two-column grid on phones and a row on tablets. A short-landscape rule keeps navigation and CTAs usable instead of shrinking touch targets.

The CTA's desktop top remains at its specified coordinate even though the original paragraph is removed. No additional hero content fills that space.

Reduced motion disables entrances and Frame scaling, pauses native video, and shows an independently extracted poster. A subtle pause control is revealed on keyboard focus/hover and visible on touch devices so continuous background motion can be stopped.

## Assets and allowed approximations

The approved CloudFront URL is the first native video source. An identical local MP4 is the second source for failure fallback. The poster is a new file extracted at one second; neither original reference is used or modified as a runtime asset.

Manrope is self-hosted through Fontsource. No IpsumMark font binary or exact partner SVG paths were supplied; the permitted Manrope bold fallback and hand-authored silhouette approximations are used. The brand SVG is exact.

The Frame uses the approved video poster as its replaceable scene, magnified with CSS according to native scroll position. A neutral title/mark shell is the application extension point; no internal product design or backend has been invented.
