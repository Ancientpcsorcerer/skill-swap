# Skill Swap — LEARN Core Comprehensive Redesign Specification

> **Architectural Redesign & Learning Journey Environment**  
> Complete technical, interaction, and motion specification for the transformation of the LEARN Core. Covers the dual-pillar landing model, Card-to-Environment FLIP transitions, milestone progress trees, Zoom session coordination lifecycle, shared notes, and a rigorous backend dependency audit.

---

## 1. Executive Summary & Core Identity

In the current application, the `LEARN` core is a basic 2-column layout with a search field, 5 static learning cards, and a primitive dialog modal with three buttons. It does not feel like an empowering, collaborative educational environment.

The redesigned **LEARN Core** elevates learning into a tactile, living workspace inspired by architectural studio work and modern craft tools (Linear, Reflect, Prolibu). It introduces:
1. **The Dual-Pillar Landing Architecture (Mirroring CREATE):**
   - **PRIMARY PILLAR 1: EXPLORE SKILLS** — Dynamic discovery, curated skill roadmaps, mentor rosters, and category chips.
   - **PRIMARY PILLAR 2: MY PROGRESS** — The learner's active operating system: ongoing tracks, interactive milestone trees, upcoming 1-on-1 sessions, and personal notes.
2. **The Signature Card-to-Environment Expansion:** Tapping a learning card (e.g. *"Python for Robotics"*) smoothly morphs the card into a comprehensive, multi-tab **Learning Environment** featuring roadmap milestones, teacher rosters, scheduled sessions, and notes.

---

## 2. Comprehensive Sub-Concept Specifications (A through T)

### A. Primary Landing Structure & Dual-Pillar Hero

The landing view establishes immediate clarity with an editorial hero and a prominent segmented mode controller:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ LEARN HERO                                                                       │
│ "Master craft through human collaboration."                                      │
│                                                                                  │
│ ┌───────────────────────────┬──────────────────────────────────────────────────┐ │
│ │  [✦ EXPLORE SKILLS]       │  [◎ MY PROGRESS (2 Active)]                      │ │
│ └───────────────────────────┴──────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────┘
```

- **Pill Switcher Mechanics:** A tactile sliding pill (`border-radius: var(--sw-radius-pill)`) with `180ms var(--sw-ease-snap)` transition.
- **State Persistence:** Preserved in URL parameters (`#/app/learn?tab=explore` vs `#/app/learn?tab=progress`) to enable deep-linking and browser navigation.

---

### B. Explore Skills Mode

Designed for frictionless discovery and catalog exploration:
- **Search with Intelligent Token Highlighting:** Real-time query parsing with token chips (`category:`, `mentor:`, `topic:`).
- **Categorical Navigation Chips:** Horizontal scrolling pill container with edge gradient masks (`All`, `Design Systems`, `Full Stack Web`, `Robotics & Hardware`, `Creative Code`, `AI & Machine Learning`, `Product Leadership`).
- **Path Discovery Grid:** Responsive 2-to-3 column grid featuring enriched `LearningPathCard` components.
- **Trending Skills Drawer:** Right-rail editorial panel linking trending topics directly to filtered search views.

---

### C. My Progress Mode

The learner's command center:
- **Active Track Cards:** High-contrast summary cards showing current path, active milestone, percentage completion bar, next scheduled session, and a primary **[Continue Learning →]** action.
- **Status Tabs:** Filter tracks by `In Progress`, `Saved`, and `Completed`.
- **Quick Stats Bar:** Visual tally of total hours invested, completed milestones, and connected teachers.
- **Empty State Delight:** For users with no active tracks, presents a curated "Recommended First Steps" rail with 1-click enrollments.

---

### D. Learning Card Architecture

The foundational building block of the catalog:

```
┌────────────────────────────────────────────────────────┐
│ [Artwork Thumbnail: Product / Creative / Code]        │
│ ────────────────────────────────────────────────────── │
│ AI & ROBOTICS                                          │
│ Python for Autonomous Robotics                         │
│ Build embedded robotic controllers from scratch...     │
│ ────────────────────────────────────────────────────── │
│ 👥 4 Mentors  ·  📚 18 Resources  ·  ⏱ 6 Milestones   │
│ [Aarav P.] [Elena R.] +2                               │
│ ────────────────────────────────────────────────────── │
│ [Preview Roadmap]                [Start Learning →]    │
└────────────────────────────────────────────────────────┘
```

- **Card Styling:** `background: var(--sw-canvas-card); border: 1px solid var(--sw-line-standard); border-radius: var(--sw-radius-lg);`.
- **Hover Motion:** Lift `translateY(-3px) scale(1.008)` with `var(--sw-shadow-hover)` over `160ms`.
- **Nested Curvature:** Outer radius `16px`, inner artwork thumbnail radius `10px`.

---

### E. Card-to-Environment Expansion (The Signature Transition)

The defining visual moment of the LEARN core:

```
Step 1: User clicks "Python for Autonomous Robotics" card
   ↓
Step 2: Card bounds captured via getBoundingClientRect()
   ↓
Step 3: Background dim scrim fades in (opacity: 0 -> 1 over 200ms)
   ↓
Step 4: Card bounds morph via FLIP transform into full workspace canvas (420ms quintic-out)
   ↓
Step 5: Card artwork gracefully crossfades into Hero Banner
   ↓
Step 6: Interior sections cascade in with staggered 25ms delay:
        [Milestone Tree] → [Teachers] → [Sessions] → [Notes] → [Tasks]
```

- **Result:** The user never feels jarred by a popup; they feel that the card **opened up into a world**.

---

### F. Learning Journey Conceptual Model

Learning paths are structured hierarchically:
$$\text{Learning Path} \longrightarrow \text{Milestones (3 to 6)} \longrightarrow \text{Tasks, Resources \& Sessions}$$

1. **Path:** High-level mastery domain (e.g. *Full Stack TypeScript*).
2. **Milestone:** Distinct competency checkpoint (e.g. *Milestone 2: Relational Database Architecture with PostgreSQL*).
3. **Tasks:** 3–5 actionable micro-deliverables (e.g. *"Design normalized schema with foreign keys"*).
4. **Sessions:** Peer-to-peer 1-on-1 mentorship or review video meetings.

---

### G. Interactive Milestone Progress Tree

A visual node graph connecting checkpoints in sequence:

```
  [✓ Milestone 1: Foundations]
               │
               ▼ (Solid sage stroke: #3b6b55)
  [◎ Milestone 2: Relational Data] ← Current Active (Pulsing ring indicator)
               │
               ┊ (Dashed hairline stroke: #dfddd8)
  [🔒 Milestone 3: Distributed State]
               │
               ┊
  [🔒 Milestone 4: Production Deployment]
```

- **Node States:**
  - `Completed`: Solid sage `#3b6b55` fill with checkmark icon.
  - `In Progress`: Double ring with active pulse animation (`--sw-beacon-pulse`).
  - `Available`: Interactive ivory card with hairline border.
  - `Locked`: 50% muted opacity with lock glyph.
- **Interaction:** Clicking any milestone navigates the right-side detail inspector to that milestone's specific tasks, reading resources, and mentor review session.

---

### H. Mentor & Teacher Roster Integration

Each learning path explicitly highlights mentors within the community who teach or review this skill:
- **Mentor Card:** Displays avatar, name, verification badge, current rating, and skill tags.
- **Actions:**
  - **[View Profile]:** Opens the mentor's public profile (`#/app/profile?user=<id>`).
  - **[Message Mentor]:** Deep-links directly to CHAT (`#/app/chat?user=<id>`), pre-populating conversation context with the active learning path.
  - **[Request Session]:** Opens the Session Proposal modal.

---

### I. Session Coordination & Zoom Integration Lifecycle

Skill Swap facilitates peer-to-peer video sessions between learners and mentors.

#### The 5-Stage Session Lifecycle:
1. **Drafting:** Learner selects milestone and proposed topic (e.g. *"Code review for Milestone 2"*).
2. **Proposed:** Learner proposes 2–3 time slots and selects meeting platform.
3. **Confirmed:** Mentor accepts a time slot.
4. **Live (Active):** 10 minutes prior to meeting time, the card displays a pulsing green beacon and **[Join Video Session]** button.
5. **Completed:** Post-session feedback and optional milestone sign-off.

#### 🚨 Rigorous Backend Dependency Audit on Zoom:

> [!IMPORTANT]
> **BACKEND DEPENDENCY: Real Zoom meeting provisioning requires backend/provider support.**  
> During this research milestone, the backend schema (`backend/src/db/schema.sql`) was audited in detail.
> - **Current Schema Status:** The existing database supports `learning_records` and `learning_goals`. It does NOT have tables for `mentorship_sessions`, `calendar_slots`, or OAuth token exchanges with the Zoom REST API (`api.zoom.us/v2/users/me/meetings`).
> - **Strict Architectural Rule:** Under zero circumstances will the frontend generate mock or fake Zoom URLs (e.g. `https://zoom.us/j/fake123`).
> - **Specification Requirement:** The UI supports manual link entry (e.g. *"Mentor provided meeting link"*), and flags automated Zoom link creation with:
>   `BACKEND DEPENDENCY: Real Zoom meeting provisioning requires backend/provider support.`

---

### J. Shared Notes & Scratchpad Workspace

Learners need a persistent place to take notes while studying:
- **Rich Markdown Scratchpad:** Clean monospace/sans editor with instant preview toggle.
- **Sync Strategy:** Auto-saves locally to `localStorage` every 500ms (debounced) with optimistic background sync to workspace state.
- **Exporting:** 1-click **[Export Markdown]** button.

---

### K. Micro-Task Checklist System

Each milestone includes actionable micro-tasks:
- **Interaction:** Custom checkbox component with tactile 80ms scale-down tick.
- **Persistence:** Checkbox states persist across browser sessions.
- **Celebration Micro-Motion:** Completing all tasks in a milestone triggers a subtle confetti-free celebratory state: node turns solid sage with a smooth 240ms border stroke transition.

---

### L. Resource Library & External Links

Curated external references (documentation, GitHub repositories, video walkthroughs):
- **Resource Row:** Favicon, title, source domain, reading time estimate, and external link arrow (`↗`).
- **Safety:** All external links open with `rel="noopener noreferrer"` in a new tab.

---

### M. Progress Calculation Logic

Progress percentage ($P$) for a learning path is mathematically derived:

$$P = \left( \frac{\sum_{i=1}^{M} W_i \cdot C_i}{\sum_{i=1}^{M} W_i} \right) \times 100$$

Where:
- $M = \text{Total Milestones in Path}$
- $W_i = \text{Weight of Milestone } i$ (default $1.0$)
- $C_i = \text{Completion coefficient } (0.0 = \text{Unstarted}, 0.5 = \text{In Progress}, 1.0 = \text{Completed})$

*Example:* A path with 4 milestones where Milestone 1 is Completed ($1.0$), Milestone 2 is In Progress with 3 of 4 tasks checked ($0.75$), and Milestones 3 & 4 are unstarted ($0.0$) yields:
$$P = \frac{1.0 + 0.75 + 0.0 + 0.0}{4} \times 100 = 43.75\% \approx 44\%$$

---

### N. Guest vs. Authenticated State Handling

In accordance with Skill Swap's open-access model:
- **Guests can:**
  - Freely browse the entire catalog of learning paths.
  - Search, filter by category, and read roadmaps.
  - View mentor profiles and inspect milestone task breakdowns.
- **Guests are Auth-Gated (via `useAuthGate`) on:**
  - Clicking **[Start Learning]** or **[Save Path]**.
  - Checking off milestone tasks.
  - Saving private learning notes.
  - Proposing a mentor session.
- **UX Behavior:** Gated action triggers the glassmorphic `SignupModal` with a contextual notice (e.g. *"Sign in to track your learning progress across devices"*). Upon successful login, the action completes automatically without losing context.

---

### O. Cross-Core Bridges

The LEARN module acts as an anchor connecting to the entire ecosystem:
1. **Learn $\to$ Chat:** Tapping *"Ask Mentor a Question"* opens CHAT with `?user=<mentorId>` and pre-populates the chat header with the active learning path context.
2. **Learn $\to$ Create:** Finishing a milestone prompts *"Build a Capstone Project"*, opening CREATE with recommended tags and templates pre-filled.
3. **Learn $\to$ Discover:** *"Find projects seeking this skill"* links to DISCOVER with filter applied.
4. **Learn $\to$ Profile:** Completed paths automatically display on the user's public profile as verified skill accomplishments.

---

### P. Layout & Responsive Architecture

- **Desktop Layout:** Split 2-column grid:
  - Left Primary: `minmax(0, 1fr)` (Main catalog or active milestone roadmap).
  - Right Sidebar: `360px` fixed rail (My Progress quick-tracker, mentor recommendations, session schedule).
- **Active Environment Layout:** Expands to full container width (`max-width: 1360px`) with a collapsible 280px left milestone navigator and a 720px center workspace.
- **Scroll Containment:** Uses `scrollbar-gutter: stable;` to avoid layout shifts when lists grow.

---

### Q. State Management & Data Flow

- **Store:** Integrated into `WorkspaceProvider` via React Context and `useSyncExternalStore`.
- **Local Persistence:** Cached in `localStorage` under key `skill-swap:workspace-v2` for zero-latency offline loading.
- **API Synchronization:** Automatically syncs with `POST /api/v1/learning/records` for authenticated users.

---

### R. Backend Dependency Audit Summary

| Feature | Current Backend Status | Future Backend Requirement | Workaround / Mitigation |
| :--- | :--- | :--- | :--- |
| **Path Progress Tracking** | ✅ Supported (`learning_records` table) | None | Direct API sync |
| **Learning Goals** | ✅ Supported (`learning_goals` table) | None | Direct API sync |
| **Milestone Task Checklists** | ⚠️ Frontend Only | Needs `learning_milestone_tasks` table | Persisted in `localStorage` & Workspace state |
| **Shared Learning Notes** | ⚠️ Frontend Only | Needs `learning_notes` table | Persisted in `localStorage` |
| **Live Mentorship Sessions** | ❌ Not Supported | Needs `sessions` & `calendar_slots` tables | Propose via CHAT messages |
| **Zoom Meeting Provisioning** | ❌ Not Supported | Needs Zoom OAuth app & webhook integration | Flagged explicitly as **BACKEND DEPENDENCY** |

---

### S. Animation & Timing Specs for LEARN

- **Pill Tab Slide:** `180ms var(--sw-ease-snap)`.
- **Card-to-Environment Morph:** `420ms var(--sw-ease-smooth)`.
- **Milestone Node Reveal:** `stagger 30ms`, duration `260ms var(--sw-ease-decel)`.
- **Task Check Animation:** `80ms scale(0.92) -> 140ms scale(1.0)`.

---

### T. Accessibility & Keyboard Navigation (a11y)

- **Semantic HTML:** `<nav aria-label="Learning modes">`, `<ol aria-label="Learning milestones">`, `<article className="learning-card">`.
- **Keyboard Navigation:** Full `Tab` and `Shift+Tab` traversal.
- **Milestone Navigation:** Arrow keys (`ArrowUp` / `ArrowDown`) navigate between milestone nodes.
- **Screen Reader Announcements:** Dynamic `aria-live="polite"` region announces milestone completion and filter count changes.
- **Focus Rings:** High-contrast `2px solid var(--sw-ink-primary)` with `2px` offset.
