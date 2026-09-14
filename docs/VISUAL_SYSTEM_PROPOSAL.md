# Skill Swap — Visual System Proposal & Design Tokens

> **Architectural Minimalism & Editorial Typography**  
> Complete design token specifications, surface hierarchy, typographic scale, and tactile aesthetic guidelines for the Skill Swap platform revamp.

---

## 1. Aesthetic Vision & Design Philosophy

The redesigned Skill Swap aesthetic is defined as **Architectural Minimalism with Editorial Typography**. 

It rejects both the generic modern SaaS "blue-button dashboard" look and the gimmicky "crypto neon glass" trend. Instead, it draws inspiration from high-end architectural monographs, Swiss typography, and physical editorial publications:
1. **Warm Organic Ivory Foundation:** Light surfaces are not sterile `#ffffff` or cold `#f0f2f5`. They are tactile, warm linen, cream, and ivory tones (`#f7f4ef`, `#faf8f5`, `#fdfcfb`) that feel human, comfortable, and timeless.
2. **Deep Ink Typography:** Text is rendered in deep forest ink (`#141514` and `#18220e`), producing maximum legibility and an authoritative, bespoke feel.
3. **Precision Hairline Borders:** Layout boundaries are established with delicate, disciplined 1px strokes (`#dfddd8`, `#e5e3dc`) rather than loud backgrounds.
4. **Restrained Depth & Tactile Grain:** Zero heavy drop shadows. Depth is created through surface contrast, fine optical corner radii, inset light catches, and an ambient micro-grain texture.
5. **Living Product Realism:** Every module showcases genuine, functional artifacts (active learning pathways, interactive task boards, live meeting stages, and rich profile portfolios).

---

## 2. Comprehensive Token Architecture

### A. Color Palette & Surface Tokens

All tokens are organized hierarchically and mapped to CSS custom properties:

```css
:root {
  /* ==========================================================================
     1. Core Canvas & Background Surfaces
     ========================================================================== */
  --sw-canvas-base:        #f7f4ef; /* Primary warm ivory canvas */
  --sw-canvas-subtle:      #faf8f5; /* Secondary elevated background */
  --sw-canvas-card:        #fdfcfb; /* Pristine card surface */
  --sw-canvas-inset:       #edeae3; /* Recessed inputs, search bars, code wells */
  --sw-canvas-overlay:     rgba(20, 21, 20, 0.45); /* Modal & dialog scrim */

  /* ==========================================================================
     2. Dark Focal Surfaces (Cinematic & Stage Environments)
     ========================================================================== */
  --sw-dark-canvas:        #0d0e0d; /* Deepest black obsidian */
  --sw-dark-surface:       #141514; /* Standard dark card & topbar backdrop */
  --sw-dark-surface-elev:  #1b1d1b; /* Elevated dark cards */
  --sw-dark-line:          rgba(255, 255, 255, 0.08); /* Dark mode hairline border */
  --sw-dark-ink-primary:   #fafafa; /* Crisp light text */
  --sw-dark-ink-muted:     #9e9f9c; /* Secondary light text */

  /* ==========================================================================
     3. Ink & Typographic Contrast
     ========================================================================== */
  --sw-ink-primary:        #141514; /* Dense black ink for titles & headings */
  --sw-ink-forest:         #18220e; /* Subtle organic dark ink for branding */
  --sw-ink-secondary:      #4a4e46; /* High-legibility body text */
  --sw-ink-muted:          #767972; /* Micro-copy, metadata, placeholders */
  --sw-ink-faint:          #a6a8a1; /* Inactive icons, disabled controls */

  /* ==========================================================================
     4. Hairline Borders & Dividers
     ========================================================================== */
  --sw-line-subtle:        #e7e4dc; /* Delicate table rows & nested borders */
  --sw-line-standard:      #dfddd8; /* Standard card, panel & sidebar borders */
  --sw-line-strong:        #c8c5bc; /* Active input strokes, focused cards */
  --sw-line-emphasis:      #141514; /* Active tab markers, high-contrast borders */

  /* ==========================================================================
     5. Curated Editorial Accents (Organic, Non-Neon)
     ========================================================================== */
  --sw-accent-terra:       #b85d34; /* Warm terracotta (action callouts, milestones) */
  --sw-accent-sage:        #3b6b55; /* Forest sage (verified badges, progress fills) */
  --sw-accent-ochre:       #b58932; /* Golden ochre (trending tags, active ratings) */
  --sw-accent-indigo:      #2b4865; /* Academic indigo (technical tracks, certifications) */

  /* ==========================================================================
     6. State Tokens
     ========================================================================== */
  --sw-state-success:      #2b6e4e;
  --sw-state-warning:      #b57620;
  --sw-state-danger:       #a3322d;
  --sw-state-info:         #2d5b88;
}
```

---

### B. Typographic Hierarchy & Proportions

Skill Swap standardizes on **`@fontsource-variable/manrope`** as the primary typographic engine. To achieve the editorial density observed in Linear and Prolibu, we apply custom negative letter-spacing ratios and strict line-height multipliers.

```
┌─────────────────┬──────────┬────────┬─────────────┬────────────────┬───────────────────────────┐
│ Token           │ Size     │ Weight │ Line Height │ Letter Spacing │ Typical Usage             │
├─────────────────┼──────────┼────────┼─────────────┼────────────────┼───────────────────────────┤
│ --sw-font-disp  │ 52–64px  │ 500    │ 1.05        │ -0.030em       │ Hero statements & portals │
│ --sw-font-h1    │ 38–44px  │ 500    │ 1.10        │ -0.024em       │ Primary Core headers      │
│ --sw-font-h2    │ 26–30px  │ 500    │ 1.18        │ -0.018em       │ Section titles, dashboards│
│ --sw-font-h3    │ 20–22px  │ 500    │ 1.25        │ -0.012em       │ Card titles, panel heads  │
│ --sw-font-h4    │ 16–17px  │ 600    │ 1.35        │ -0.008em       │ Module sub-headers, tasks │
│ --sw-font-body  │ 14–15px  │ 400    │ 1.60        │ -0.004em       │ Narrative descriptions    │
│ --sw-font-small │ 12–13px  │ 400/500│ 1.45        │ +0.005em       │ Metadata, timestamps      │
│ --sw-font-micro │ 10–11px  │ 600    │ 1.30        │ +0.060em       │ Uppercase badges, pills   │
│ --sw-font-mono  │ 12–13px  │ 500    │ 1.50        │ +0.020em       │ IDs, timecodes, keyboard  │
└─────────────────┴──────────┴────────┴─────────────┴────────────────┴───────────────────────────┘
```

#### Exact CSS Typographic Scale:

```css
/* Typography Tokens */
--sw-type-display: clamp(3.25rem, 2.5rem + 2vw, 4rem) / 1.05 var(--sw-font-family);
--sw-type-h1:      clamp(2.35rem, 1.9rem + 1.2vw, 2.75rem) / 1.10 var(--sw-font-family);
--sw-type-h2:      clamp(1.65rem, 1.4rem + 0.6vw, 1.875rem) / 1.18 var(--sw-font-family);
--sw-type-h3:      1.3125rem / 1.25 var(--sw-font-family);
--sw-type-h4:      1.0625rem / 1.35 var(--sw-font-family);
--sw-type-body:    0.9375rem / 1.60 var(--sw-font-family);
--sw-type-small:   0.8125rem / 1.45 var(--sw-font-family);
--sw-type-micro:   0.6875rem / 1.30 var(--sw-font-family);
```

---

### C. Spacing System & Layout Baseline

Skill Swap follows an **8-point geometric baseline** with 4px sub-intervals:

```css
/* Spacing Scale */
--sw-space-1:   4px;
--sw-space-2:   8px;
--sw-space-3:   12px;
--sw-space-4:   16px;
--sw-space-5:   20px;
--sw-space-6:   24px;
--sw-space-7:   32px;
--sw-space-8:   40px;
--sw-space-9:   48px;
--sw-space-10:  64px;
--sw-space-11:  80px;
--sw-space-12:  120px;

/* Grid & Layout Dimensions */
--sw-sidebar-width:     240px;
--sw-topbar-height:     64px;
--sw-content-max-width: 1400px;
--sw-gutter-desktop:    40px;
--sw-gutter-compact:    24px;
```

---

### D. Geometry, Borders & Nested Curvature Ratios

To ensure visual harmony, all concentric components adhere strictly to the **Concentric Corner Formula**:
$$\text{BorderRadius}_{\text{inner}} = \text{BorderRadius}_{\text{outer}} - \text{Padding}$$

```css
/* Curvature Tokens */
--sw-radius-sharp:   4px;   /* Micro-buttons, keyboard shortcuts, code tags */
--sw-radius-sm:      6px;   /* Inputs, dropdown items, tooltips */
--sw-radius-md:      10px;  /* Small cards, media thumbnails, inner card assets */
--sw-radius-lg:      16px;  /* Standard container cards, panel wrappers */
--sw-radius-xl:      24px;  /* Modal dialogs, workspace floating sheets */
--sw-radius-pill:    9999px;/* Category chips, status badges, avatar frames */
```

*Example: A card with `border-radius: 16px` and `padding: 12px` has inner image `border-radius: 4px` ($16px - 12px = 4px$).*

---

### E. Restrained Depth, Shadows & Inset Highlights

Gaudy, colorful drop shadows are eliminated. Depth is defined by subtle surface shifts and fine specular highlights inspired by Grainient and Reflect:

```css
/* Elevation & Shadow System */
/* Level 0: Flat on canvas */
--sw-shadow-flat: none;

/* Level 1: Standard Card Elevation */
--sw-shadow-card: 
  0 1px 2px rgba(20, 21, 20, 0.03),
  0 2px 6px rgba(20, 21, 20, 0.02);

/* Level 2: Interactive Hover Lift */
--sw-shadow-hover: 
  0 3px 8px rgba(20, 21, 20, 0.04),
  0 8px 24px rgba(20, 21, 20, 0.06);

/* Level 3: Floating Panels & Menus */
--sw-shadow-floating: 
  0 4px 12px rgba(20, 21, 20, 0.05),
  0 16px 36px rgba(20, 21, 20, 0.08);

/* Level 4: Modal Dialogs & Full Scrim Windows */
--sw-shadow-modal: 
  0 12px 32px rgba(20, 21, 20, 0.12),
  0 32px 64px rgba(20, 21, 20, 0.14);

/* Tactile Inset Specular Highlights (Physical Glass/Pill Feel) */
--sw-shadow-pill-inset: 
  inset 0 1px 1px rgba(255, 255, 255, 0.75),
  inset 0 -1px 1px rgba(20, 21, 20, 0.05);

--sw-shadow-input-recessed:
  inset 0 1px 2px rgba(20, 21, 20, 0.06);
```

---

### F. Tactile Micro-Grain Specification (Zero WebGL)

To provide tactile friction without GPU memory overhead, an ultra-lightweight inline SVG noise filter is placed on the base application shell:

```css
/* Ambient Grain Overlay */
.application-shell::before {
  content: '';
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 999;
  opacity: 0.035; /* Subtle organic friction */
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  mix-blend-mode: multiply;
}
```

*Performance profile: 0MB GPU VRAM allocation, 0 FPS impact, perfectly static rasterization.*

---

### G. Iconography Guidelines

1. **Grid & Size:** Standard bounding box `18px × 18px` (micro), `20px × 20px` (standard), and `24px × 24px` (hero/panel headers).
2. **Stroke Weight:** Consistent `1.5px` stroke with round caps (`stroke-linecap="round"` and `stroke-linejoin="round"`).
3. **Geometry:** Minimalist geometric iconography with zero fill, harmonizing with `@fontsource-variable/manrope`.
4. **Color Coupling:** Icons inherit `currentColor` directly from parent text tokens, ensuring flawless state synchronization on hover and focus.
