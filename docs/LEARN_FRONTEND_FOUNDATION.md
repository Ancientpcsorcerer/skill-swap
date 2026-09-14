# Learn Core Frontend Foundation (Milestone 1)

**Milestone Status:** Implemented & Verified  
**Architecture:** Two-Path Craft Model (`Explore Skills` & `My Progress`)  
**Backend Lock:** Strictly Maintained (Zero backend modifications)  
**Authoritative State:** Server-backed via `/api/v1/learning` (Zero fake `localStorage` persistence)

---

## 1. What Was Implemented

1. **Two-Path Top-Level Architecture:**
   - Transformed the LEARN Core from a single dashboard into two dedicated functional branches:
     - **Explore Skills:** Discover skills, browse curated learning paths, cross-domain editorial search, category filter chips, and practitioner mentor matching.
     - **My Progress:** Active learning paths with genuine server-backed progress percentages, status tabs (`In Progress`, `Saved`, `Completed`), and personal learning goals manager.
   - Structured the landing experience with an editorial `LearnHero` featuring prominent dual-branch triggers (`[ Explore Skills ]` & `[ My Progress ]`), visually and structurally mirroring the dual-action paradigm of `CREATE` (`New Project` / `Explore Projects`).

2. **Server-Authoritative State Management:**
   - Created `useLearnState` hook directly querying and mutating the existing backend learning endpoints (`/api/v1/learning`).
   - Normalizes database field conventions (`path_id` ↔ `pathId`).
   - Strictly rejected client-side `localStorage` workarounds for authoritative learning records and goals.

3. **Explore Skills Mode (`ExploreSkillsView`):**
   - High-fidelity editorial search field with explicit accessible `searchbox` role and accessible naming (`Learning search`).
   - Filter chip buttons for 11 distinct learning categories (`All`, `Programming`, `Design`, `Robotics`, etc.).
   - Interactive learning path grid displaying cover artwork, categories, titles, descriptions, mentor counts, and curated resource numbers.
   - Mentor discovery grid mapping path competencies to real community practitioners via `PersonRow`, `ConnectionAction`, and `ProfilePreview`.
   - Honest empty states when queries or categories yield no matches.

4. **My Progress Mode (`MyProgressView`):**
   - Segmented status selector (`In Progress`, `Saved`, `Completed`).
   - Active learning cards rendering verified progress bars with actual server-persisted percentages (`record.progress%`) — **zero decorative hardcoded percentages**.
   - Direct continuation and progress adjustment actions.
   - Learning Goals panel with real backend-persisted goals, creation form (`label="Learning goal"`), submit button (`"Set Goal"`), live `role="status"` screen-reader feedback, and individual goal deletion.
   - Honest guest authentication state explaining cloud-backed persistence with auth-gated login CTA.

5. **Learning Detail Environment (`LearningDetailModal`):**
   - Accessible modal dialog with focus trapping, ESC key listener, and backdrop dismissal (`useModalDialog`).
   - Card-to-detail continuous transition foundation.
   - Real backend status actions: `Save path` (with active `Saved` state), `Start Learning` / `Resume Learning`, and `Mark completed`.
   - Real interactive progress slider allowing verified updates to the server.
   - Capability-aware quiet placeholders for future mentorship sessions and collaborative notes.

6. **Design System & Motion Primitives:**
   - Dedicated stylesheet `src/styles/learn.css` implementing the approved warm ivory canvas (`#fbf9f5`, `#f6f3ed`), deep ink typography (`#141514`), and hairline borders (`1px solid #dfddd8`).
   - Segmented pill slider with `180ms var(--learn-ease)` transitions.
   - Responsive grid layouts preventing desktop horizontal scrollbars.

---

## 2. Existing Backend Capabilities Used

The frontend foundation consumes the existing backend schema (`learning_records` and `learning_goals` tables):

| Capability | Backend Route / Contract | Description |
| :--- | :--- | :--- |
| **Get Learning State** | `GET /api/v1/learning` | Retrieves user's `records` (`id`, `user_id`, `path_id`, `status`, `progress`, `updated_at`) and `goals` (`id`, `user_id`, `goal`, `created_at`). |
| **Update Learning Record** | `PUT /api/v1/learning/records/:pathId` | Upserts status (`'In Progress' \| 'Saved' \| 'Completed'`) and integer progress percentage (`0–100`). |
| **Create Learning Goal** | `POST /api/v1/learning/goals` | Inserts a new learning goal string for the authenticated user. |
| **Delete Learning Goal** | `DELETE /api/v1/learning/goals/:id` | Deletes the specified learning goal by ID. |

---

## 3. API Endpoints / Contracts Consumed

- `api.learning.getState()`: Consumes `GET /learning`.
- `api.learning.updateRecord(pathId, status, progress)`: Consumes `PUT /learning/records/:pathId`.
- `api.learning.addGoal(goal)`: Consumes `POST /learning/goals`.
- `api.learning.deleteGoal(id)`: Consumes `DELETE /learning/goals/:id`.
- `useConnect().people`: Maps `learningPaths.mentorIds` to active community practitioners.
- `useAuthGate().requireAuth(actionName, callback)`: Triggers centralized auth gate modal before executing protected state modifications.

---

## 4. Features Intentionally NOT Implemented

In strict adherence to milestone boundaries, the following features were **NOT implemented or simulated**:
- **Zero Zoom Integration:** No Zoom SDKs, OAuth flows, meeting IDs, or fake meeting links.
- **Zero Session Scheduling:** No calendar synchronization, time-slot pickers, or recurring booking systems.
- **Zero Fake Milestone Checklists:** No client-side task checklists or local mock task completion storage.
- **Zero Fake Shared Notes:** No unbacked collaborative notes editor or local storage notes workaround.
- **Zero Decorative Progress:** No randomly generated percentages or fake progress values.

Where future features are planned, clean capability-aware architectural placeholders are presented with quiet informational labels (`Future Milestone`), avoiding any disabled or fake interactive buttons.

---

## 5. Backend Capabilities Required for Next Milestone

To support subsequent milestones (Milestones 2 & 3: Sessions, Collaboration, and Real-Time Craft Exchange), the backend will require:
1. **Sessions Table & API:**
   - Schema for mentor-mentee booking slots (`id`, `mentor_id`, `mentee_id`, `path_id`, `scheduled_at`, `duration_minutes`, `status`).
   - Endpoints: `POST /api/v1/learning/sessions`, `GET /api/v1/learning/sessions`, `PUT /api/v1/learning/sessions/:id`.
2. **Zoom / WebRTC Provisioning:**
   - Server-side Zoom API JWT / OAuth app integration for dynamic meeting room creation and webhook lifecycle tracking.
3. **Milestones & Tasks Schema:**
   - Hierarchical task checklist persistence linked to `learning_records` (`id`, `record_id`, `title`, `completed`, `sort_order`).
4. **Shared Collaborative Notes:**
   - Markdown or block-based collaborative note persistence (`id`, `record_id`, `author_id`, `content`, `updated_at`).

---

## 6. State Ownership Rules

1. **Authoritative Learning State (Server):**
   - Belongs strictly to the PostgreSQL database.
   - Sourced via `api.learning` and managed in React memory via `useLearnState`.
   - Never saved to `localStorage` or `sessionStorage` as a persistence workaround.
2. **Ephemeral UI State (Client Component):**
   - Active mode (`'explore'` vs `'progress'`).
   - Active status tab (`'In Progress'`, `'Saved'`, `'Completed'`).
   - Search filter query and category selection.
   - Open / closed state of `LearningDetailModal`.
   - Slider draft values before user clicks "Save Progress".
3. **Route & Navigation State (URL Hash):**
   - Deep-link state managed via hash parameters (`#/app/learn?tab=explore`, `#/app/learn?tab=progress`, `#/app/learn?path=drone`).

---

## 7. Component Architecture

```
src/modules/learn/
├── LearnModule.tsx             # Master orchestrator & deep-linking coordinator
├── useLearnState.ts            # Server state hook (API calls, normalizer, optimistic updates)
├── LearnHero.tsx               # Editorial hero with dual-branch triggers (Explore vs Progress)
├── LearnModeSwitcher.tsx       # Segmented pill mode switcher with ARIA tab roles
├── ExploreSkillsView.tsx       # Search, category chips, path grid, and mentor discovery
├── MyProgressView.tsx          # Real server progress list, status tabs, and goals manager
└── LearningDetailModal.tsx     # Continuous modal dialog, real actions & capability placeholders

src/styles/
└── learn.css                   # Theme tokens, warm ivory palette, hairline borders, progress styles
```

---

## 8. Routing Behavior

- `#/app/learn`: Defaults to `Explore Skills` mode.
- `#/app/learn?tab=explore`: Directly displays `Explore Skills` view.
- `#/app/learn?tab=progress`: Directly displays `My Progress` view.
- `#/app/learn?path=<id>`: Deep links into the specific learning path detail modal.
- Synchronized via `useApplicationRoute()` and `navigate()`.
- Browser Back, Forward, and Refresh buttons accurately preserve the active tab and deep-link query.

---

## 9. Motion Primitives Introduced

- **Branch Button Active Transition:** `all 0.18s cubic-bezier(0.22, 1, 0.36, 1)`.
- **Segmented Pill Selector Snap:** Sliding pill indicator with `cubic-bezier(0.22, 1, 0.36, 1)` easing.
- **Card Hover Elevation:** Subtle `-3px` translation with restrained `rgba(20, 21, 20, 0.06)` shadow.
- **Progress Bar Smooth Value Transition:** `width 0.3s cubic-bezier(0.22, 1, 0.36, 1)`.
- **Accessibility Respect:** Fully obeys `prefers-reduced-motion: reduce` inherited from global tokens.

---

## 10. Testing Performed

1. **Production Build & TypeScript Verification:**
   - `npm.cmd run build`: 0 type errors, successfully built client bundle in 3.71s (`tsc --noEmit && vite build`).
2. **Preservation Checks:**
   - `node scripts/check-references.mjs`: 100% verified (SHA-256 matched, no WebGL/3D dependencies).
   - `node scripts/check-core-preservation.mjs`: 100% verified (all 1,460 protected files and 840 core frames intact).
   - `node scripts/check-ui-foundation-preservation.mjs`: 100% verified (1,545 files inspected, cinematic controllers and styles unchanged).
3. **Interactive Browser Subagent Verification:**
   - Navigated to `http://127.0.0.1:5173/#/app/learn`.
   - Verified LearnHero title and dual-branch triggers.
   - Tested search: searched for "Photography", verified "Photography Foundations" path and mentor "Kabir Mehta" rendered.
   - Filtered by "Robotics" category chip: verified "Drone & UAV Systems" rendered.
   - Opened detail modal for "Drone & UAV Systems": verified real metadata, progress slider, and capability placeholders.
   - Switched to "My Progress": verified URL updated to `?tab=progress`, status tabs rendered, and empty state rendered honestly without fake demo records.
   - Screenshots captured and inspected (`explore_skills_view_1789383612733.png`, `my_progress_view_1789383638301.png`).

---

## 11. Known Limitations

- Real-time mentor video calls, Zoom provisioning, and calendar sync await Milestone 2.
- Checklists and shared notes will be implemented once dedicated backend schemas are introduced in Milestone 3.
- In offline environments where no backend server is running, `useLearnState` maintains in-memory state during the active session without writing fake records to `localStorage`.
