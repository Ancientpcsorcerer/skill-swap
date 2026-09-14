# Skill Swap — Core Transition & Cross-Core Continuity Specification

> **Architectural Motion Across All 6 Cores & The Signature Interaction**  
> Detailed redesign recommendations for Profile, Connect, Create, Learn, Discover, and Chat; spatial state transitions; cross-core contextual handoffs; and the defining Skill Swap Signature Interaction.

---

## 1. Redesign Recommendations Across All 6 Cores

Skill Swap is composed of 6 dedicated Core modules unified under the `ApplicationShell`:

```
                    ┌─────────────────────────┐
                    │    APPLICATION SHELL    │
                    │   Global Topbar & Nav   │
                    └────────────┬────────────┘
                                 │
     ┌───────────┬───────────┬───┴───────┬───────────┬───────────┐
     ▼           ▼           ▼           ▼           ▼           ▼
  CONNECT      CREATE     DISCOVER     LEARN       CHAT       PROFILE
```

---

### Core 1: MY PROFILE / PUBLIC PROFILE (`#/app/profile` & `?user=<id>`)

#### Current State
- Basic 2-column layout with text lists of connections, projects, and posts. Simple tab switching between tabs.
#### Redesigned Architectural Experience
- **Editorial Portfolio Hero:**
  - Full-width architectural profile banner featuring tactile warm ivory background, enlarged high-definition avatar (`96px`), verified badge, and clean metadata line (Location, Joined date, Collaboration status beacon).
  - Quick action cluster: **[Connect]** / **[Message via Chat]** / **[Share Profile]**.
- **Interactive Multi-Deck Layout:**
  - **Deck 1: Projects Showcase:** Grid of active & completed initiatives with role tags, team member avatar stacks, and live GitHub/demo links.
  - **Deck 2: Knowledge & Skills Matrix:** Visual taxonomy of Verified Skills, Teaching Strengths, and Active Learning Tracks.
  - **Deck 3: Feed & Community Posts:** Chronological stream of technical insights and milestones published by the user.
  - **Deck 4: Connection Network:** Visual grid of accepted collaborators with 1-click message shortcuts.
- **Self vs. Public Profile Continuity:** When viewing another member (`?user=<id>`), private edit controls smoothly transition into connection/messaging controls with zero layout jolt.

---

### Core 2: CONNECT (`#/app/connect`)

#### Current State
- Utilitarian directory of cards with "Connect" or "Pending" buttons.
#### Redesigned Architectural Experience
- **Living Human Graph & Collaboration Radar:**
  - Real-time search with multi-dimensional filtering (`Role`, `Skills`, `Availability`, `Interests`).
  - **Person Card Redesign:** Elevates from a plain list row to a tactile card featuring reciprocal skill badges (*"Teaches Python"* $\leftrightarrow$ *"Wants Rust"*).
  - **Connection Lifecycle Micro-Motion:**
    - Clicking **[Connect]** transforms the button into a fluid pending state over 140ms (`cubic-bezier(0.25, 0.46, 0.45, 0.94)`).
    - Accepting a connection triggers an ambient green pulse ring (`--sw-beacon-pulse`) and prompts: *"Start a conversation in Chat →"*.

---

### Core 3: CREATE (`#/app/create`)

#### Current State
- Segmented button for Projects vs Posts, with basic form fields and instant local submission.
#### Redesigned Architectural Experience
- **Studio Workbench Interface:**
  - **Split Workbench Canvas:** Left-side high-density composer; right-side live interactive preview card rendering exactly what other users will see in DISCOVER.
  - **Project Template Picker:** Architectural blueprint cards (*"Open Source AI Tool"*, *"Design System Collective"*, *"Hardware Hack"*) that pre-populate tags and roles with 1 click.
  - **Tag Chips with Keyboard Autocomplete:** Typing `#` opens an inline suggestion pillbox.
  - **Publishing Choreography:** Clicking **[Publish Project]** triggers an upward launch motion: the card visually glides from the composer into the project showcase stream.

---

### Core 4: LEARN (`#/app/learn`)

#### Current State
- Static 5-card list with standard modal popup dialog.
#### Redesigned Architectural Experience
- **Dual-Pillar Ecosystem (Explore Skills vs. My Progress):**
  - Instant fluid switching between catalog discovery and personal active progress.
  - **Card-to-Environment FLIP Morph:** Clicking a learning path expands the card into a full-width workspace containing sequential milestone nodes, mentor roster, scheduled sessions, and notes scratchpad.
  - *(Full details in [LEARN_REDESIGN_SPEC.md](file:///e:/DATA%2025%2011%202022/Videos/Skill%20swap%20platform/docs/LEARN_REDESIGN_SPEC.md))*

---

### Core 5: DISCOVER (`#/app/discover`)

#### Current State
- Tab list alternating between community projects and posts.
#### Redesigned Architectural Experience
- **Editorial Stream & Community Pulse:**
  - Masonry-inspired balanced column layout showcasing active projects, technical deep-dives, and peer requests.
  - **Interactive Filter Bar:** Sliding category pills with subtle active indicator.
  - **Engagement Micro-Transitions:** Bookmark and like counters animate with sub-pixel bounce (`scale(1.15) -> scale(1.0)` over 160ms).

---

### Core 6: CHAT (`#/app/chat`)

#### Current State
- Two-column chat interface with message bubbles and conversation list.
#### Redesigned Architectural Experience
- **Real-Time Collaboration Terminal:**
  - Deep-link synchronization (`#/app/chat?user=<id>`) with zero-latency thread activation.
  - **Collapsible Context Drawer:** Right-side slide-over panel displaying the active partner's verified skills, mutual connections, shared projects, and proposed learning sessions.
  - **Message Bubble Physics:** Sent messages slide up with `translateY(8px)` and settle with `var(--sw-ease-decel)`. Message grouping collapses redundant avatar icons for consecutive messages within 5 minutes.
  - **Interactive Link Cards:** Pasting a Skill Swap project or learning path link automatically unfurls a rich interactive widget directly in the chat stream.

---

## 2. Cross-Core Continuity Matrix

Cross-core navigation in Skill Swap must never feel like loading disconnected web pages. Visual and semantic context must carry over smoothly between Cores:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          CROSS-CORE CONTINUITY MAP                                     │
├───────────────────┬───────────────────┬────────────────────────────────────────────────┤
│ Source Core       │ Target Core       │ Contextual Transition & Shared Element         │
├───────────────────┼───────────────────┼────────────────────────────────────────────────┤
│ **CREATE**        │ **DISCOVER**      │ Newly published project card flies from bottom │
│                   │                   │ right into top of Discover feed.               │
├───────────────────┼───────────────────┼────────────────────────────────────────────────┤
│ **DISCOVER**      │ **CONNECT**       │ Clicking author avatar retains avatar position │
│                   │                   │ and morphs card into full Connection profile.  │
├───────────────────┼───────────────────┼────────────────────────────────────────────────┤
│ **CONNECT**       │ **CHAT**          │ Clicking "Message" retains user name & avatar  │
│                   │                   │ as conversation thread slides into focus.      │
├───────────────────┼───────────────────┼────────────────────────────────────────────────┤
│ **LEARN**         │ **CHAT**          │ "Ask Mentor" carries path title as pinned      │
│                   │                   │ context banner at top of chat thread.          │
├───────────────────┼───────────────────┼────────────────────────────────────────────────┤
│ **LEARN**         │ **CREATE**        │ "Build Capstone" opens Create with skills      │
│                   │                   │ pre-filled in required tags.                   │
├───────────────────┼───────────────────┼────────────────────────────────────────────────┤
│ **PROFILE**       │ **CHAT**          │ "Message" button smoothly transitions into     │
│                   │                   │ active conversation with that user.            │
└───────────────────┴───────────────────┴────────────────────────────────────────────────┘
```

---

## 3. The Skill Swap Signature Interaction: "The Contextual Loom"

Every iconic application possesses an unmistakable, proprietary interaction signature (e.g. Linear's command palette, Slack's channel switcher, Stripe's fluid navigation glow).

For Skill Swap, we introduce: **The Contextual Loom (Exchange Weaver)**.

### Conceptual Definition
Skill Swap is fundamentally about **reciprocal exchange** (giving a skill, gaining a skill; sharing a project, finding a teammate; learning from a mentor, giving feedback).

**The Contextual Loom** is an interactive, non-WebGL persistent ribbon at the base of the viewport that visualizes active exchanges:
1. **The Dual-Pill Weaver:** A floating, tactile glassmorphism pill (`background: rgba(20, 21, 20, 0.92); backdrop-filter: blur(16px); color: #fafafa; border-radius: 9999px;`) anchored at the bottom-center of the desktop workspace.
2. **Dynamic State Presentation:**
   - On **LEARN**: Shows *"Currently Mastering: Python for Robotics (44%)"* $\longleftrightarrow$ *"Ready to Teach: UI Systems"*.
   - On **CHAT**: Shows *"Active Session with Elena Rostova: Next Milestone in 2 Days"*.
   - On **CREATE**: Shows *"Looking for: Rust Systems Engineer"*.
3. **The Quick-Weave Interaction:**
   - Tapping the Loom expands a lightweight 3-column quick-exchange panel (`transform: translateY(-8px) scale(0.98 -> 1.0)` over 220ms):
     - **Column 1:** My Active Offers (Skills I teach).
     - **Column 2:** My Active Pursuits (Skills I am learning).
     - **Column 3:** Mutual Matches (Peers who want what I have and have what I want).
4. **Zero-WebGL Architectural Execution:**
   - Executed purely with CSS Flexbox, SVG bezier curves for reciprocal arrows, and standard React state subscriptions via `WorkspaceProvider`.
   - Guaranteed 60 FPS performance budget with zero GPU memory overhead.
