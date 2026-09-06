# 07 — Scrollytelling & Spatial Web References (2025–2026)

A field guide to world-class work in cinematic scrollytelling, spatial 3D, and editorial interactive design. Curated as **inspiration** and as a list of **patterns to avoid** because everyone copies them. Use this to find a lane for our Skill Swap Platform that doesn't look like every other 2025 portfolio site.

---

## 1. Scrollytelling editorials

The form is mature now — the wins come from restraint, not spectacle.

| Project | URL | Why it's world-class | Techniques to study | What to learn (not copy) |
|---|---|---|---|---|
| NYT Visual Investigations — 10 Best of 2025 | nytimes.com (search "visual investigations 2025") | Geolocated video, satellite imagery stitched into scrollable narrative | Frame-stepped video, map-driven chronology, custom timeline scrubber | Their strength is **journalism**, not animation. Don't bolt a scroll-pin to a story that doesn't earn it. |
| The Pudding — recent essays | pudding.cool | Statistical argument told as conversation, not infographic | SVG line drawing, footnoted assertions inline, opinionated voice in type | Resist "data-dump" intros. They earn each chart with a sentence. |
| Reuters Graphics | reuters.com/graphics | Cadence over flash — published pieces daily, no learning curve | D3 + scrollama, consistent nav, modest transitions | Their consistency is the lesson. Pick 1–2 scroll patterns and use them everywhere. |
| Bloomberg Green / Businessweek features | bloomberg.com/green | Longform with built-in calculators (e.g., climate cost) | Interactive inputs, smooth height morphs, type as the visual | They lead with the *insight*, then the toy. Reverse the order and you get a demo reel. |
| Rest of World — longform | restofworld.org | Reports from places the algorithm doesn't reach | Quiet typography, full-bleed stills, hand-drawn diagrams | "Quiet" reads as premium in 2026. Loud costs trust. |

**Anti-pattern to avoid**: the 2023–2024 "scrollytelling starter pack" — pinned hero + fade-in paragraphs + chart at 60% scroll. If your design agency brief uses the word "pinned", reconsider.

---

## 2. Product launch experiences

The new rule: **motion is the brand voice**. Copy and color are now table stakes.

| Project | URL | What makes it world-class | Specific techniques | Lesson |
|---|---|---|---|---|
| Apple iPhone / Vision Pro pages | apple.com/iphone, apple.com/vision-pro | Product-as-architecture. The page *is* the keynote slide. | Sequenced reveals driven by scroll velocity, color-managed hero photography, no chrome | Don't imitate the chrome-less aesthetic unless your product is also $1,500+. The lesson is **commitment to one voice**. |
| Rivian R1 Configurator | rivian.com/configure | Real-time 3D on commodity hardware, persistence across selections | glTF streaming, color/trim swap without re-fetch, depth-of-field | Configurators need to feel like *play*, not *work*. The 3D has to be instant. |
| Polestar 2/3/4 configure | polestar.com | Editorial brand expression, not e-comm | Cinematic scroll, type as wayfinding, slow-mo transitions | Polestar proves a configurator can carry brand voice. Ours should too. |
| Arc vehicles | arc.com | Boat maker; uses product narrative as the page | Custom WebGL sea/water, scroll-bound narrative | "Small brand, big budget feel" — achievable via narrative focus. |
| Nothing Phone (3) | nothing.tech | Hardware × software parity, OS skin bleeds into marketing site | Lattice/LED motif as UI element, monospace type, intentional jank | *Intentional* jank is the new "brutalism-lite". Read on. |
| Teenage Engineering | teenage.engineering | Products treated as art objects | Grid-as-essay, custom cursors, dry-erase product annotations | Almost no animation. Confidence through absence. |
| Aesop | aesop.com | Luxury restraint, literary voice | Long-form essays, fragrance profiles as scroll essays, no buy-now above the fold | Aesop's lesson: **the page is the marketing**. Don't separate "story" from "shop". |
| Hermès — 2025 campaign site (FWA SOTD, March 2025) | hermes.com (campaign subdomains) | Hand-feel in pixels, tactile color, scroll-as-pacing | Subtle parallax, "film grain" overlays, hand-set type | Hermès' redesign (April 2025) demonstrated scroll-triggered storytelling that *earned* awards by treating scroll as a luxury pacing device, not a gimmick. |

**Anti-pattern**: the "3D hero, then dropdowns" template. If your 3D is only the hero, it's a video. Commit to a 3D grammar or stay 2D.

---

## 3. 3D spatial websites

| Project | URL | Why it's world-class | Innovation | Don't |
|---|---|---|---|---|
| Bruno Simon | bruno-simon-2021 (and 2025 update) | The portal-crasher — a 3D world as a CV | WebGL, physics, car you can drive | Don't make the portfolio a game. Bruno is a 3D engineer; we are not. **Learn from his UX, not his tech.** |
| Active Theory | activetheory.net | Spatial-first shop; the studio that proved the medium | Multiplayer, WebGL + audio, real-time lighting | Avoid if your team can't sustain 6-figure builds. Study their *commitment*, not their *engine choice*. |
| Resn | resn.co.nz | Long-time FWA winners; experiments as portfolio | WebGL + custom physics, micro-detail | Their work is uneven; cherry-pick. |
| Pentagram digital | pentagram.com/work | Index of partners; minimal, almost no motion | Type as image, predictable grid | The Pentagram site *is* the brand. A 3D site would hurt it. **For us: restraint over spectacle.** |
| Studio Feixen | studiofeixen.com | Swiss-poster aesthetic meets web | Bold display type, monospace accents, generous whitespace | Type-driven sites still win awards. Don't assume 3D = innovation. |
| Manuel Bortoletti | manuelbortoletti.com | Editorial portfolio, 3D vignettes | Procedural backgrounds, no UI chrome | The lesson: every page is a vignette. We can do this with cards. |

**Anti-pattern**: loading a Three.js scene for a portfolio with three projects. The medium is heavier than the message.

---

## 4. Interactive brand experiences

| Project | URL | Why world-class | Specific techniques | Lesson |
|---|---|---|---|---|
| Google Chrome Experiments | experiments.withgoogle.com | The benchmark for browser capability | WebGL, WebAudio, ML in-browser | Their curation *is* the value. Don't copy specific demos; copy the *commitment to one idea per piece*. |
| Spotify Wrapped | spotify.com/wrapped | Annual template that resets expectations | Personal data as narrative, shareable frames, gamified reveal | Wrapped is a *story about you*. **Skill Swap should tell a story about the user.** |
| Arcade (arcade.software) | arcade.software | Demo-driven product marketing | Interactive sandbox on every page, type-led hierarchy | Replace "screenshot" with "live demo" wherever possible. |
| Active Theory × Google | various | Brand work for hire, often the most ambitious | Spatial audio, room-scale scenes | Watch for the moment a brand experience stops selling and starts *occupying*. |

**Anti-pattern**: "Look at the cool WebGL I can do" — if removing the WebGL doesn't hurt the message, remove it.

---

## 5. WebGL showcases

| Project | URL | Innovation | Lesson |
|---|---|---|---|
| Codrops | tympanus.net/codrops | Weekly tutorials; the most consistent WebGL reference | Their tutorials ship working code. Use them as starting points, not finals. |
| Three.js Journey demos | threejs-journey.com | Bruno Simon's course; the de-facto training ground | Study the *discipline* — the demos are small, focused, well-commented. |
| Awwwards nominees 2025 | awwwards.com/websites | Daily SOTD; the trend surface | Look for "Developer Award" winners; they tend to be the most innovative. |
| Awwwards SOTD 2025 highlights | Ochi Design, Cara, Côte&Ciel, Molton Brown, Compendium, Loewe Perfumes, Hello Monday, Zajno, Oblivion | Common thread: storytelling-driven design, dark modes, immersive 3D | **Dark mode is dominant** in 2025 SOTD. But every SOTD site looks the same. Avoid the gradient-mesh-on-black cliché. |

**Anti-pattern**: the "Lava lamp" — purple→pink gradient mesh, soft glow, glassmorphism. This is the *exact* AI-slop look. See below.

---

## 6. Award-winning Awwwards Sites of the Day (2025–2026)

Trends to **study**:
- **Storytelling-driven design** — Cara, Compendium
- **Dark modes with vibrant accents** — Oblivion, Molton Brown
- **Smooth animations + micro-interactions** — Loewe, Zajno
- **Tribute/memorial sites** — Nate Dogg x Lady of Rage (January 2025)
- **Immersive 3D + WebGL** — Oblivion

Trends to **avoid** (overused, look like everyone else):
- Mesh-gradient hero on black
- Glassmorphism navigation
- Glowing orb as cursor
- "Pinned section → fade-in cards" template
- "Scroll to discover" with a hand icon

---

## 7. Data-driven interactive storytelling

| Project | URL | Lesson |
|---|---|---|
| The Pudding | pudding.cool | Voice > viz. Type > chart. |
| FiveThirtyEight (now defunct as standalone) | fivethirtyeight.com | Statistical honesty; show your work; uncertainty built-in |
| Bloomberg "The Big Take" features | bloomberg.com | The *insight* leads. The chart supports. |
| Reuters Graphics | reuters.com/graphics | Cadence + consistency > one big hit |
| The Markup | themarkup.org | Investigative data — slow, careful, footnoted |

**Anti-pattern**: chart-first essays. "Look at this chart" essays are easy to forget. The Pudding's model is *claim-first, evidence-after*.

---

## 8. Editorial web magazines

| Project | URL | What to learn |
|---|---|---|
| It's Nice That | itsnicethat.com | Acquired by Mast (2025). The deal itself is the trend: subscription > ad-supported. |
| Eye Magazine | eyemagazine.com | Print-faithful web; the issue is the unit. |
| Wallpaper* | wallpaper.com | Editorial as commerce — design coverage drives design sales. |
| Are.na | are.na | The anti-algorithm: slow curation, no feeds, no metrics. |
| It's Nice That — 2025 editorial trends piece | itsnicethat.com/articles/online-editorial-design-trends-2025 | AI-assisted workflows, interactive layouts, immersive storytelling — but the *winning* trend is still human curation. |

**Anti-pattern**: the "magazine grid" with a giant hero image and three columns of cards. Boring. Pretend it doesn't exist.

---

## 9. Experimental navigation sites

| Project | URL | What they prove |
|---|---|---|
| Active Theory | activetheory.net | Scroll as 3D camera, not just a y-axis |
| Pentagram | pentagram.com | The index IS the navigation |
| Resn | resn.co.nz | Click anywhere; physics carries the rest |
| Studio Feixen | studiofeixen.com | Hover state as the entire experience |
| The Manual (various SOTD) | awwwards.com | Custom cursors can be the brand |
| Postscript sites (e.g. jamesdavis.tv-style) | various | "Post-scroll" sites that reward going past 100% |

**Anti-pattern**: the scroll-jacking that breaks keyboard nav. If `Page Down` doesn't work, the user hates you.

---

## 10. The "anti-AI-slop" aesthetic in 2026

What **doesn't** look generated:

- **Editorial typography** (Söhne, GT America, Editorial New, Söhne Breit, Times Now, Domaine Display, Publico) — set big, set tight, set with *intent*. Generators default to Inter + system fonts.
- **Hand-set type and asymmetry** — slight rotation, varied baseline, ragged-right body text.
- **Texture**: paper grain, ink bleed, halftones, RISO noise, 1-bit dithering. Generators default to flat vectors.
- **Mismatched illustration** — multiple illustrators with different styles on one page reads human.
- **Brutalist accents**: visible grid, monospace labels, exposed `<details>`, raw HTML. The 2025 revival is a *rebellion against the "AI-clean" look*.
- **Color**: avoid the gradient-mesh-on-black default. Try: a single color family + one accent, or duotone.
- **Type as image**: when the headline is the hero, it reads as deliberate. Generators under-use display type.
- **Imperfection**: visible cursor, hand-drawn arrows, paper-fold transitions. Generators default to perfect easing curves.

**Brutalist web examples to study (2025–2026)**:
- brutalistwebsites.com (the canonical list)
- Are.na's interface (anti-feed)
- Pentagram's index (text-only homepage is *brutal* in 2026)
- Studio Feixen's monospace labels
- Various "personal site" SOTDs on Awwwards — search "brutalism" filter

---

## 11. Editorial typography in 2026

Typefaces that read as *intentional* in 2025–2026:

- **Display**: Editorial New, Söhne Breit, GT Sectra, PP Editorial New, PP Mondwest, ABC Diatype Mono, Pangram Pangram (PP Mori, PP Right Serif, PP Neue Machina)
- **Body**: Söhne, GT America, Inter (only if set with personality), Neue Haas Grotesk, Söhne Mono
- **Serif revival**: Tiempos, Publico, Lyon, Domaine Display
- **Experimental**: PP Neue Bit (pixel), PP Editorial Old, Custom/variable axes

Sites that use type as the entire identity:
- **It's Nice That** — uses Pangram Pangram across the masthead
- **Wallpaper\*** — display type as section markers
- **Eye Magazine** — set in custom serif variants
- **Pentagram** — uses proprietary Pentagram Custom (varies per partner)

**Anti-pattern**: Inter Tight set to 400 weight as a body face with no accent. That is the AI default. Don't.

---

## Concrete takeaways for Skill Swap Platform

1. **Pick a typography voice and commit.** Set the masthead in one distinctive display face. This single decision moves us out of "AI slop" faster than any animation choice.
2. **2D-first, 3D-second.** The brand is a *marketplace of skills* — a card grid is the right primitive. We can elevate it with motion, but not with a Three.js hero.
3. **One scroll pattern, used everywhere.** Either Lenis + GSAP ScrollTrigger with consistent easing, or pure CSS scroll-driven animations (`animation-timeline: view()`). Mixing them is a sign of indecision.
4. **Type is the brand.** Invest in Editorial New or PP Editorial New. Generators won't suggest them.
5. **Texture, not glassmorphism.** Subtle paper grain (SVG filter, 4–8% opacity) signals "made by a person" in 2026.
6. **Avoid**: gradient mesh on black, glowing orbs, glass nav, hand-icon scroll prompt, "fade-in on scroll" as the *only* interaction. Every one of these is in the 2024 starter pack.
7. **Borrow from**: Rest of World's quiet restraint, Aesop's "page is the marketing", Pentagram's text-only confidence, Are.na's slow curation. The aesthetic of *not trying to impress* is the most impressive thing in 2026.

---

## Sources

- [Awwwards — 2025 SOTD archive](https://www.awwwards.com/websites)
- [Chrome Experiments — Best of 2024 / 2025](https://experiments.withgoogle.com/collection/best-of-2024)
- [It's Nice That — online editorial design trends 2025](https://www.itsnicethat.com/articles/online-editorial-design-trends-2025)
- [Jing Daily — Inside the new hermes.com experience](https://jingdaily.com/posts/hermes-website-redesign-scroll-storytelling)
- [FWA — Hermes 2025 campaign site (SOTD, March 2025)](https://thefwa.com/cases/hermes-2025-campaign)
- [Reuters Graphics](https://www.reuters.com/graphics)
- [The Pudding](https://pudding.cool)
- [Rest of World — longform](https://restofworld.org)
- [Bloomberg Green](https://www.bloomberg.com/green)
- [Rivian configurator (R1, R2)](https://rivian.com/configure)
- [Polestar configure](https://www.polestar.com)
- [Active Theory](https://activetheory.net)
- [Bruno Simon](https://bruno-simon.com)
- [Resn](https://resn.co.nz)
- [Pentagram](https://pentagram.com)
- [Studio Feixen](https://studiofeixen.com)
- [Aesop](https://www.aesop.com)
- [Are.na](https://are.na)
- [Eye Magazine](https://eyemagazine.com)
- [Wallpaper*](https://www.wallpaper.com)
- [Brutalist Websites](https://brutalistwebsites.com)
- [Codrops](https://tympanus.net/codrops)
- [Three.js Journey](https://threejs-journey.com)
