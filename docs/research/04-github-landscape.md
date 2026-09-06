# GitHub Landscape: Skill Swap, Knowledge Exchange, Mentorship & Skill Marketplace

**Research date:** 2026-08-26
**Purpose:** Survey the strongest existing open-source projects in the skill-swap / peer-learning / mentorship / timebank space to extract architectural patterns, tech-stack conventions, and gap analysis. **No code will be copied — patterns are studied, then re-implemented.**

---

## 1. The Honest Lay of the Land

The single most important finding from this sweep: **"skill swap" is a thin category on GitHub.** Despite there being a real consumer market (Skillshare, Udemy, Superprof, Preply, Studytogether, etc.), the open-source equivalents are sparse and small. Most repos in the `skill-exchange`, `skill-sharing`, `skill-swap`, and `peer-learning` GitHub topic pages have **0–5 stars** and look like hackathon or class projects. The strongest work in adjacent spaces — mentorship matching, time-banking, online learning — lives in different topic namespaces.

What this means for us:
- The bar to produce a **best-in-class** open-source skill-swap platform is achievable. The category is wide open.
- We should learn from **mentorship platforms** (mature, multi-frontend), **online learning platforms** (LMS patterns), and **timebank / barter systems** (matching + currency).
- A polished, modern stack with strong UX, matching, and visualization is genuinely novel in this niche.

---

## 2. The Top 12 Repositories Worth Studying

### Tier 1 — Strongest, Most Relevant

#### 1. `joshi-chinmay-016/SkillSwap` (SkillSwap Arena) — **MIT**
- **Stars / activity:** 1 star, 0 forks, 21 commits — new, but the **engineering depth is the best in the category**.
- **Tech stack:** React 18 + Vite + Tailwind, FastAPI 0.115 (Python 3.12), PostgreSQL 16 + SQLAlchemy 2.0 + Alembic, Redis 7, Jitsi Meet (WebRTC), Google Gemini + FAISS (RAG), Prometheus/Grafana, Docker, Terraform (GCP), GitHub Actions.
- **Architecture:** `Router → Service → Repository` on FastAPI; 37 relational tables; coin-based escrow with idempotency keys; **Redis Pub/Sub for horizontal WebSocket scaling**; document-grounded RAG with prompt-isolation fences; admin RBAC with append-only audit logs.
- **Key insight — role duality:** "Mentor and Learner are not database roles. The same account acts as Mentor in skills where they have completed assessment verification, and as Learner in skills where they are pursuing a roadmap." This is the cleanest mental model I've seen for a two-sided skill economy.
- **Key insight — anti-hallucination fencing:** `<session_data>` prompt isolation prevents the AI from inventing context.
- **What it lacks:** Visual polish, frontend maturity, real users, no skill taxonomy integration.
- **Pattern to adopt:** Idempotency keys for booking, escrow coins, role duality, prompt fences, audit logs.

#### 2. `Enthusiast-AD/Peer-to-peer-Barter-system` (Peersy) — **MIT**
- **Stars / activity:** 0 stars but **modern stack and clean architecture** — student-oriented.
- **Tech stack:** React + Vite, Tailwind v4, Radix UI, Express.js, **PostgreSQL + Prisma**, **Passport.js (Google OAuth) + JWT**, **LiveKit (video sessions)**.
- **Architecture:** Monorepo with `backend/` and `client/`; Express layered structure (controllers / middlewares / models / routes / services).
- **Features:** Auth, skill teach/learn listings, **complementary-skill smart matching**, real-time chat, video, session scheduling, reputation system.
- **Key insight:** Uses **LiveKit** (rather than raw WebRTC) for video — easier to self-host or use their cloud; this is the right pragmatic choice for a new project.
- **What it lacks:** No matching algorithm documentation, no skill taxonomy, very minimal UI, no tests.
- **Pattern to adopt:** LiveKit for video, Passport + JWT for auth, Prisma schema with explicit `teach`/`learn` skill join tables.

#### 3. `Tanay-ErrorCode/lupo-skill` — **No license** (effectively all-rights-reserved; treat as reference only)
- **Stars / activity:** **20 stars, 71 forks, 554 commits** — by far the most active repo in the `skill-sharing` topic. GirlScript Summer of Code 2024 project.
- **Tech stack:** React + TypeScript, React-Bootstrap, **Firebase** (Auth + Firestore RTDB + Storage), deployed at `lupo-skill.web.app`.
- **Features:** Host/join events, user profiles, real-time event updates, microblogging planned.
- **Key insight:** Pure-Firebase architecture — no custom backend. Demonstrates that **you can ship a credible skill-sharing app with zero server ops**. The trade-off is vendor lock-in and limited matching logic.
- **What it lacks:** No matching, no taxonomy, no payments, no video, no admin tools, no tests, no license.
- **Pattern to adopt:** Host/join event mental model for time-bound skill exchanges; Firebase rules structure for data validation.

### Tier 2 — Strong Adjacent Domains (Patterns to Borrow)

#### 4. `anitab-org/mentorship-backend` — **GPL-3.0** (note: copyleft — do not reuse code, study only)
- **Stars / activity:** 200 stars, 450 forks, 376 commits, very active AnitaB.org project.
- **Tech stack:** Python 3, **Flask + Flask-RESTX (Swagger)**, Flask-SQLAlchemy, Flask-JWT-Extended, Flask-Mail, deployed on Heroku + Docker.
- **Architecture:** 1:1 mentorship relations with a **fixed time period**; tasks + comments inside each relation; admin roles; user statistics endpoint.
- **What it does well:** Mature **matching & relation lifecycle**: pending → accepted → completed/cancelled, with task tracking inside relations and a stats endpoint showing recent achievements. This is exactly the lifecycle we need.
- **What it lacks:** No skill taxonomy, no payment/escrow, no video (out of scope), no real-time chat. GPL-3.0 means we cannot derive from it.
- **Pattern to adopt:** Relation entity (mentor_id, mentee_id, status, start, end, notes) as the core domain object; the dashboard stats endpoint.

#### 5. `anitab-org/mentorship-android` — **GPL-3.0**
- **169 stars, 378 forks** — companion mobile client to #4. Kotlin, MVVM, Retrofit, RxJava, LiveData, ViewModel, DataBinding.
- **Key insights:** Onboarding flow; role selector (Mentor / Mentee / Both); member listing with **search + sort (A-Z, date, age) + multi-facet filter (availability, interests, location, skills)**; pull-to-refresh everywhere; dashboard with pending/accepted/rejected/completed counts and recent achievements.
- **Pattern to adopt:** **Multi-facet filter UX** on the member-discovery page — this is the gold standard for "find the right person" in a peer marketplace.

#### 6. `training-center/mentoria` — **MIT**
- **1.4k stars, 148 watchers, 336 forks** — but it's a **documentation-only repo** (no code). A markdown list of volunteer mentors for the Brazilian tech community. Mentees contact mentors directly.
- **What it teaches us:** The **two-month default mentorship duration** is a strong convention; the **"frozen" emoji (❄️) as a no-build status toggle** is a brilliant lightweight pattern for "I'm not available right now"; the **1-week response SLA** is a healthy social contract.

#### 7. `cncf/mentoring` — **Apache-2.0** (likely; not verified, but CNCF standard)
- **3.1k stars, very active.** Documentation & org-coordination repo for CNCF's mentoring, LFX, and Summer of Code programs. Not an app, but a great reference for **how to run a mentorship program at scale** (mentor/mentee intake forms, matching committee workflow, expectations doc).
- **Pattern to adopt:** Intake templates, mentee/mentor application forms, matching-committee review process.

#### 8. `OperationCode/operationcode_old_site` — **MIT** (verify file)
- **231 stars.** Archived hub. Stack: React frontend, Rails backend, Ruby chatbot. Mission: help military veterans learn software development. Multi-repo monorepo with `operationcode_frontend`, `operationcode_backend`, `operationcode_bot`.
- **Pattern to adopt:** **Multi-repo split** (frontend, backend, bot as separate services) when scope grows; charity/mission framing in the README.

### Tier 3 — Hackathon / Student Projects (Use as Pattern Inspiration, Not Code)

#### 9. `JayP2006/Bharat-Skill-Exchange` (ShikshaMudra) — License unspecified
- MERN + Tailwind + shadcn/ui + Framer Motion + Zustand; **MongoDB geospatial queries** (`$geoWithin`, `$centerSphere`) for "Nearby" search; Socket.IO chat; Cloudinary media; Recharts dashboard; JWT + bcrypt auth.
- **Key insight:** **Geospatial matching** ("hyperlocal P2P skill exchange") — a strong differentiator if our target users are physical-world learners.
- **Deployed:** `shiksha-mudraa.onrender.com`.

#### 10. `Wellitsabhi/Skillswap` — **MIT**
- **5 stars, 98 commits, 8 forks** — most active among small "skill swap" repos. MERN (Express + React/Vite), MongoDB Atlas.
- Lists skills/interests, finds users with complementary skills, sessions, feedback.
- **Pattern to adopt:** Clean two-folder split (backend / frontend) with separate `.env` files.

#### 11. `skill-exchange-2025/skill-exchange-front` — **MIT**
- Esprit School of Engineering coursework. React 18 + Vite + Tailwind + shadcn/ui + Framer Motion + TypeScript + Zod; Redux Toolkit + Redux Persist; Axios; Socket.io-client; **separate backend repo** with Node/Express + Postgres/Prisma + JWT.
- Has **Docker + Jenkins + SonarQube + Prometheus + Nginx + Vercel** — full enterprise-grade devops, far beyond what's needed for an MVP but a useful reference for production-readiness checklist.
- **Pattern to adopt:** **Zod for form validation**, Redux Toolkit + Redux Persist for offline-friendly state, shadcn/ui as the component base.

#### 12. `saad2134/skill-sangam` — **MIT**
- Smart India Hackathon 2025 submission (SIH25140, Smart Education theme).
- **Token economy** (earn by teaching, spend to learn), **AI matching**, **verified micro-certifications**, **gamification** (duels, streaks, leaderboards), social feed, peer reviews, online+offline support.
- **Key insight:** The **token economy** framing is explicitly motivated by Indian government policy (NEP 2020, Skill India) — useful framing for any government or education-sector pitch.

### Honorable Mentions (Lower-Value but Pattern-Relevant)

- **`ritup04/skillbarter`** (PHP + HTML/CSS, no DB) — too primitive but proves the **"skill barter"** framing is searchable.
- **`abanoubwagim/SkillSwap`** (Spring MVC + Hibernate + JSP + MySQL) — Java/Spring stack reference.
- **`kundanjan/skillswap`** (TypeScript) and **`grsanudeep42-cmd/skillswap`** (Flutter + Node + Agora) — both very small.
- **`mohamed-dev-404/skillify`** (Flutter, 12 stars) — credit-based system + reputation + real-time chat, useful mobile-stack reference.
- **`HiberNuts/study-match`** (TypeScript) — university student matcher; **peer-learning marketplace** framing.
- **`Aditya-Ranjan1234/AI-Peer-Matcher`** (Python) — **NLP-based student matcher**; rare open-source example of a matching algorithm worth reading.

---

## 3. Cross-Cutting Architectural Patterns Worth Stealing

1. **Relation-as-core-domain-object.** AnitaB's mentorship-backend models everything as a `Relation(mentor, mentee, status, start, end)`. Sessions, tasks, reviews, and stats all hang off this entity. **This is the right shape for a skill-swap platform too** — instead of "session", think "exchange relation".

2. **Role duality, not role row.** SkillSwap Arena's "you are a Mentor in skill X and a Learner in skill Y" is the cleanest data model. Store `verification` and `roadmap_progress` per `(user, skill)`, not per user.

3. **Idempotent coin escrow.** Booking locks 1 coin via an `Idempotency-Key` header, with automated refund on cancel. This is the correct way to model a barter currency without race conditions.

4. **LiveKit over raw WebRTC.** Peersy uses LiveKit for video — a managed WebRTC SFU with self-host option. Far less work than rolling your own Jitsi (SkillSwap Arena) or Twilio (expensive).

5. **Multi-facet filter UX.** The AnitaB Android app's member-discovery screen (search + sort + filter by availability/interests/location/skills) is the reference implementation for "find a person".

6. **Frozen / availability emoji as a status toggle.** training-center/mentoria's ❄️ for "not accepting mentees" is a zero-build availability flag. Adopt this on user profiles.

7. **Geospatial indexing for hyperlocal discovery.** ShikshaMudra's MongoDB `$geoWithin` + `$centerSphere` is the right way to do "skills within 10 km of me".

8. **Zod-validated forms + Redux Toolkit + Redux Persist.** skill-exchange-2025's stack is a pragmatic modern default. Skip the Redux if we go with TanStack Query + Zustand (SkillSwap Arena's choice).

9. **Skill taxonomy — nobody uses one.** None of the surveyed repos use ESCO, O*NET, or any formal skill ontology. They all use free-text tags. **This is a real opportunity**: a curated taxonomy (with a hand-picked subset of ESCO for the top 500 skills) would be a competitive differentiator.

10. **Matching — mostly absent.** The vast majority are manual browse + search. The two that attempt matching (`Aditya-Ranjan1234/AI-Peer-Matcher` via NLP, SkillSwap Arena via Gemini) are the most interesting. **Algorithmic matching is the obvious moat**.

---

## 4. Stack Recommendation Derived from Survey

The convergence of the strongest projects points to:

- **Frontend:** Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui + Framer Motion + TanStack Query + Zustand. (Picks: SkillSwap Arena + skill-exchange-2025 + shadcn ecosystem.)
- **Backend:** Node.js (Fastify or Hono) OR Python (FastAPI) — FastAPI is better if we want to mirror SkillSwap Arena's RAG/AI path. For a pure TS team, Node + Prisma is faster to ship.
- **DB:** PostgreSQL + Prisma (Peersy, skill-exchange-2025) — universal choice, with optional PostGIS for geo.
- **Cache/queue:** Redis (SkillSwap Arena pattern) for sessions, pub/sub, rate limits.
- **Real-time:** Socket.IO for chat, LiveKit for video. (Peersy pattern.)
- **Auth:** NextAuth/Auth.js with Google + email magic link; JWT for API.
- **AI:** Start with embeddings + cosine similarity on `(user_teach_skills, user_learn_skills)`. Add LLM synthesis (Gemini or Claude) only when we have a session-notes corpus.
- **Observability:** Sentry + simple structured logging. Defer Prometheus/Grafana until post-MVP.

---

## 5. Gaps No One Has Closed (Our Opportunity)

1. **Visual / 3D skill-graph exploration.** Zero surveyed repos use Three.js, D3, or any graph/network visualization for skills. Everyone uses lists + tags.
2. **Skill taxonomy integration.** Everyone uses free-text. ESCO / O*NET is untouched here.
3. **Algorithmic matching as a first-class feature.** Mostly manual search.
4. **Polished UX.** Almost every repo is functional but visually rough.
5. **Real-time collaborative tools** (whiteboard, code execution). Only SkillSwap Arena's "real-time coding room" attempts it, and it's basic.
6. **Reputation + verification** beyond simple star ratings. SkillSwap Arena's "verified capabilities" + assessment is the only attempt.

These six gaps are precisely where a well-built Skill Swap Platform can win the open-source category.

---

## 6. License / Compliance Notes

- **MIT (safe to study & re-implement, not copy):** SkillSwap Arena, Peersy, Wellitsabhi/Skillswap, Rishiraj8/SkillSwap, skill-exchange-2025, saad2134/skill-sangam, training-center/mentoria.
- **GPL-3.0 (study patterns, do NOT derive code):** anitab-org/mentorship-backend, anitab-org/mentorship-android. Strong inspiration but copyleft — must not be linked or ported.
- **No license / unclear:** Lupo-skill, Bartex, ShikshaMudra, most others. Default copyright applies — read-only reference, do not lift code.

---

## 7. Bottom Line

There is no open-source "Skillshare + Airbnb for skills" in the wild yet. The closest is **SkillSwap Arena** (best engineering, weak UX) and **Peersy** (clean modern stack, shallow feature set). The mentorship world (AnitaB, CNCF) gives us the relation lifecycle and the member-discovery UX. The online-learning world (frappe/lms) gives us the course / content side. The timebank/barter world gives us the currency mechanics.

We are entering a wide-open category with a clear technology playbook and a clear set of gaps to exploit. The path forward is straightforward: build the polished Next.js + Postgres + LiveKit platform that finally pairs smart matching, a real skill taxonomy, and a beautiful graph-based skill explorer.

---

## Sources

- [GitHub topic: skill-exchange](https://github.com/topics/skill-exchange)
- [GitHub topic: skill-sharing](https://github.com/topics/skill-sharing)
- [GitHub topic: skill-swap](https://github.com/topics/skill-swap)
- [GitHub topic: peer-learning](https://github.com/topics/peer-learning)
- [GitHub topic: mentorship](https://github.com/topics/mentorship)
- [GitHub topic: tutoring-platform](https://github.com/topics/tutoring-platform)
- [joshi-chinmay-016/SkillSwap (SkillSwap Arena)](https://github.com/joshi-chinmay-016/SkillSwap)
- [Enthusiast-AD/Peer-to-peer-Barter-system (Peersy)](https://github.com/Enthusiast-AD/Peer-to-peer-Barter-system)
- [Tanay-ErrorCode/lupo-skill](https://github.com/Tanay-ErrorCode/lupo-skill)
- [anitab-org/mentorship-backend](https://github.com/anitab-org/mentorship-backend)
- [anitab-org/mentorship-android](https://github.com/anitab-org/mentorship-android)
- [training-center/mentoria](https://github.com/training-center/mentoria)
- [cncf/mentoring](https://github.com/cncf/mentoring)
- [OperationCode/operationcode_old_site](https://github.com/OperationCode/operationcode_old_site)
- [JayP2006/Bharat-Skill-Exchange (ShikshaMudra)](https://github.com/JayP2006/Bharat-Skill-Exchange)
- [Wellitsabhi/Skillswap](https://github.com/Wellitsabhi/Skillswap)
- [skill-exchange-2025/skill-exchange-front](https://github.com/skill-exchange-2025/skill-exchange-front)
- [saad2134/skill-sangam](https://github.com/saad2134/skill-sangam)
- [Aditya-Ranjan1234/AI-Peer-Matcher](https://github.com/Aditya-Ranjan1234/AI-Peer-Matcher)
- [HiberNuts/study-match](https://github.com/HiberNuts/study-match)
- [mohamed-dev-404/skillify](https://github.com/mohamed-dev-404/skillify)
- [frappe/lms](https://github.com/frappe/lms)
