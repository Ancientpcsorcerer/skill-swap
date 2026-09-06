# Skill Swap Platform — Creative Concept & Direction

**Date:** 2026-08-26
**Status:** Concept lock. Synthesis of 8 research threads (web design trends, Apple storytelling, product landscape, GitHub landscape, Three.js, GSAP, scrollytelling, UX/competition).

---

## 1. The Single Sentence

> **Skill Swap is the network where everyone knows something, and everyone wants to learn something — and an hour you give becomes an hour you can spend.**

That sentence is the *whole product*, and the website has to make it emotionally clear within five seconds, without a single paragraph of marketing copy.

---

## 2. The Core Concept (Lock)

**A living constellation of human knowledge.** People are stars; skills are the light they emit; exchanges are the lines that connect them. When two stars find each other — one with what the other needs, and vice versa — a connection forms. As more people join, a network emerges. That network is the product. The website's job is to make the user *feel* that network exist, want to be part of it, and understand the exchange mechanic in under a minute.

The brief calls this a "living network of human knowledge." Research confirms it and sharpens it:

- **Why a constellation, not a dashboard?** Because a dashboard reads as a SaaS tool, and a constellation reads as a *world*. The category is wide open; a dashboard will look like every other "skill marketplace" clone on Devpost. A constellation with three people and a line between them is *unforgettable*.
- **Why a constellation, not a city / marketplace / forum?** Because the right metaphor for "everyone has something, everyone needs something, exchanges happen between them" is a *graph*, and a graph in space is a constellation. Cities imply geography. Marketplaces imply commerce. Forums imply writing. Constellations imply *people* and *light*.
- **What 3D actually communicates here:** The product is a network. We render a network. The medium *is* the message. No "WebGL for WebGL's sake." If we used DOM, we'd draw a list of skills. We don't. We draw a graph because *that is what the product is*.

---

## 3. The Visual Identity (Anti-AI-Slop Lock)

| Dimension | Choice | Reason |
|---|---|---|
| **Palette base** | Warm off-white "Cloud Dancer" (#F4F1EB) + ink (#1A1A1A) | Pantone 2026 default; reads as paper, not screen. Avoids dark-mode template. |
| **Accent** | A single living color — Terracotta (sienna, #C66E4F) | Earth tone, warm, human. Single accent only. |
| **Display typeface** | **GT Sectra** (or fallback: **Tiempos Headline**) — serif with strong personality | The single biggest move against AI slop. Generators default to Inter. We don't. |
| **Body typeface** | **Söhne** (or fallback: **Inter**) — clean grotesque, optical sizing | Reads as 2026 modern. Tight tracking on display, open on body. |
| **Mono accent** | **JetBrains Mono** or **GT America Mono** — for labels, micro-text, system markers | Brutalist accent. Labels feel "made by a person". |
| **Texture** | One subtle SVG paper grain (4–6% opacity) on the body background; ink-bleed edges on hero display type | Tactile. Signals authorship. |
| **Layout** | Editorial / magazine — asymmetric, oversized type, generous whitespace, hard cuts | 2026 dominant register. |
| **Motion** | Scroll-tied fade-up reveals, one pinned camera moment, kinetic type weight axis animation, Lenis + GSAP | Disciplined, never decorative. |
| **3D** | Constellation — sphere instances (people/skills), Line2 connections (exchanges), particle flow along edges, dpr cap, `prefers-reduced-motion` static fallback | Communicates the product. |

**What we will NOT do:**
- No purple/blue gradient blobs
- No glassmorphism on dark
- No "Trusted by 10,000+" wall
- No Inter as the only typeface
- No "AI-powered" copy
- No three-column feature row
- No "scroll to discover" hand icon
- No floating SaaS cards as the dominant pattern
- No "Schedule a demo" CTA
- No neon glow on dark
- No mesh-gradient hero

---

## 4. The Narrative Arc (Homepage)

The homepage is a five-act film. Each act is *one viewport* and *one idea*. Scrolling is the camera. Reading order is guaranteed.

| Act | Name | Idea | Composition |
|---|---|---|---|
| 0 | **Wordmark + masthead** | A confident, paper-feeling brand statement. No "Welcome to". | Top-left wordmark, issue label, date, byline. Editorial. |
| 1 | **"Everyone knows something."** | A single node floats in space — a person, a skill. | Pinned 3D canvas. A sphere labeled with a skill ("Portuguese", "Sourdough", "Generative Art"). The camera is close. |
| 2 | **"Everyone wants to learn something."** | The same person is shown wanting to learn a different skill. | Text caption + small text-tag list. The sphere is now paired with a smaller satellite. |
| 3 | **"An exchange."** | A second person appears. They have what the first wants, and want what the first has. A line draws between them. | The camera pulls back. Two nodes. A line. Light travels along it. |
| 4 | **"A community."** | The camera pulls back further. Dozens of nodes. Hundreds of lines. A constellation. | The text "1,284 trades in the last week. Yours is one of them." |
| 5 | **"Be one of them."** | The CTA. Name, email, "I teach X. I want to learn Y." | A single, restrained form. No marketing copy. Submit. |

This is the **cinematic opening** the brief asks for. It is short, deliberate, and uses 3D for the one thing 3D does best: making *a network* feel real.

After the homepage, the rest of the site is **DOM/CSS** — fast, accessible, content-first. The 3D is *only* in Act 1–4 of the homepage, *only* as a scroll-driven camera, *only* to communicate the product.

### The 3D moment, in detail

- **Pinned scroll section**, ~3–4 viewports tall.
- A `<Canvas>` is fixed during the pin. Behind it, scroll progress drives a `useScroll().offset` value.
- A single `<Instances>` group holds all skill nodes (max ~80 on screen at once).
- Each "person" is a sphere; each sphere has an `<Html>` anchor with their name + skill (drei `Html occlude`).
- A `Line2` per exchange; `linkDirectionalParticles` shows a few particles flowing along each.
- A small additive `shaderMaterial` atmosphere shell around the canvas (fresnel, very subtle).
- A short, real skill taxonomy: ~80 skills across 8 categories (Design, Code, Music, Cooking, Languages, Movement, Writing, Craft) — hand-picked, not ESCO.

### Why this works

- **Concept is the product.** The 3D is the network. The network is the product.
- **3D is not decorative.** The user *sees the network exist* and feels the invitation.
- **DOM is everywhere else.** Profile pages, exchange flow, browse, search, settings — all DOM. Fast, accessible.
- **Honest to research.** Apple uses one 3D moment per product page. We do too.

---

## 5. The Product Surface (Beyond the Homepage)

The site is more than a homepage. After the 3D moment, the user enters the application. Here is the section list:

| Route | Purpose | Stack |
|---|---|---|
| `/` | The 5-act homepage. The 3D moment lives here. | R3F + GSAP + Lenis |
| `/discover` | The skill browser. Multi-facet filters (skill, timezone, availability, reciprocity). Real profiles. | DOM + cards |
| `/people/:id` | A person's profile. They teach X. They want Y. Their trades. Their reviews. | DOM |
| `/exchange/new?with=:id` | The propose-exchange flow. "I'll give 1 hr X for 1 hr Y. Pick a time." | DOM + form |
| `/inbox` | Active conversations, scheduled exchanges, calendar. | DOM |
| `/me` | Your profile, your skills, your hours, your trades, your reviews. | DOM |
| `/onboard` | Three-screen onboarding. "I teach / I want to learn" in chips. | DOM |

The data model is **Relation-as-core** (borrowed from AnitaB mentorship, *study only, not derived*): a `Relation(from_user, to_user, status, hours_given, hours_received, started_at, ended_at)` is the spine. Sessions, reviews, and stats hang off it.

The credit mechanic is **1 hour = 1 credit** (timebanking). Credits are **soft, non-financial, social** (Stack Overflow reputation model) — they unlock profile features, badge display, and "Trusted" status, but **cannot be cashed out**. This is critical to avoid the crypto-timebank graveyard.

---

## 6. The Voice & Content

- **No marketing copy.** No "Revolutionize", "Empower", "Unleash", "Reimagine", "Seamlessly".
- **The headline copy is rhythmic, not descriptive.** "Everyone knows something. / Everyone wants to learn something." is two beats with a period-punch. Apple pattern, applied.
- **Real names, real skills, real exchanges.** Twenty fictional but *believable* profiles ship with the demo. Aria teaches Sourdough. Mateo teaches Generative Art. Joon teaches Korean. They all want to learn something they don't yet know.
- **Believable scenarios.** Not "John trades math for English." Instead: "Aria traded 1 hr of sourdough for 1 hr of generative-art fundamentals with Mateo, last Tuesday."
- **No fake statistics.** The one stat we show — "1,284 trades" — is plausible for a *launched* product, not a *saturated* one. It implies momentum without overselling.

---

## 7. The Brand Name & Mark

- **Name:** **Skill Swap** (working title — keep the project name; this is a competition entry, the user picked it)
- **Wordmark:** Set in GT Sectra, lowercase, tight tracking, with one unusual letter ("S" slightly elongated, or a typographic ligature on "ll" — designer decision during build).
- **Tagline lock:** "Everyone knows something. Everyone wants to learn something."

---

## 8. What Winning Looks Like

A juror opens the site on a tired Monday. They see:

1. A confident wordmark and a one-line statement. (3 sec)
2. A single sphere in space, labeled with a real skill. (5 sec)
3. The sphere moves. A second one appears. A line draws between them. (10 sec)
4. The camera pulls back. A constellation of dozens of nodes, hundreds of lines, particles flowing. (15 sec)
5. The text: "1,284 trades in the last week. Yours is one of them." (18 sec)
6. A simple form. Name. Email. "I teach. I want to learn." Submit. (20 sec)

That is **less than thirty seconds** to *feel the product*. Then they scroll: discover, profiles, exchange flow, all DOM, all fast, all readable, all real. They click a profile. They see real names, real skills, real reviews. They click "Propose Exchange." They see a structured form, no friction, no "Schedule a demo."

That is the artifact. That is the win.

---

## 9. Decision Lock Summary

| Decision | Choice | Source |
|---|---|---|
| Product metaphor | Constellation of human knowledge | Brief + research synthesis |
| Palette | Cloud Dancer + ink + terracotta | Pantone 2026, anti-AI-slop |
| Type | GT Sectra display + Söhne body + GT America Mono labels | 2026 editorial anti-AI |
| Stack | Vite + React 19 + strict TS + R3F 9 + drei 10 + GSAP 3.13 + Lenis + Zustand | Research consensus |
| 3D scope | One pinned moment, scroll-driven camera, 80 nodes max, Line2 connections, particles | Apple + Lusion pattern |
| Beyond 3D | DOM/CSS for everything else | Research: 2D-first, 3D-second |
| Exchange mechanic | 1 hour = 1 credit, soft, non-cashable | Timebanking + Stack Overflow |
| Matching | Reciprocal bilateral, plain-language reasons, no percentages | Hinge model |
| Trust | Simultaneous bidirectional reviews, band-level trust | Airbnb model |
| Performance budget | LCP < 1.5s, < 3MB, 60fps on 4G mid-tier | Awwwards 2026 baseline |
| Voice | Editorial, rhythmic, no marketing copy | Apple + Aesop |
| Names | 20 real-feeling fictional profiles | Brief |
| Anti-AI checklist | Full audit at every iteration | Research: every cliché named |

---

## 10. Open Questions to Resolve in Architecture Phase

1. **R3F v9 requires React 19** — confirm the current Vite + React 19 + TypeScript strict path works without issues. (Research says yes; verify in build.)
2. **Skill taxonomy source** — 80 hand-picked skills, or a thin ESCO subset? *Decision: hand-picked for the demo. Document the ESCO path in a follow-up.*
3. **Backend or no backend?** *Decision: a small in-memory data layer (Zustand store) with localStorage persistence. No real backend for the demo; the data model is documented for future implementation.*
4. **Auth?** *Decision: a fake "Sign in with email" flow. No real auth. The point is the experience.*
5. **How many real-feeling profiles to ship?** *Decision: 20 — enough to feel like a community, small enough to author carefully.*

These are answered in the architecture document.
