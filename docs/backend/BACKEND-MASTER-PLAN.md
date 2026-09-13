# SKILL SWAP — BACKEND MASTER PLAN

**Version:** 1.0 — Architecture & Discovery Phase  
**Date:** September 2026  
**Author:** Backend Technical Lead / Systems Architect  
**Status:** AWAITING ARCHITECT/CEO APPROVAL BEFORE IMPLEMENTATION

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Current Project Status](#2-current-project-status)
3. [Current Frontend Architecture](#3-current-frontend-architecture)
4. [Codex Implementation Audit](#4-codex-implementation-audit)
5. [Current Local / Mock Systems](#5-current-local--mock-systems)
6. [Backend Gap Analysis](#6-backend-gap-analysis)
7. [Proposed Backend Architecture](#7-proposed-backend-architecture)
8. [Technology Choices + Rationale](#8-technology-choices--rationale)
9. [PostgreSQL Architecture](#9-postgresql-architecture)
10. [Database Entity Model](#10-database-entity-model)
11. [Entity Relationship Diagram](#11-entity-relationship-diagram)
12. [Authentication Architecture](#12-authentication-architecture)
13. [Authorization Model](#13-authorization-model)
14. [API Architecture](#14-api-architecture)
15. [API Endpoint Inventory](#15-api-endpoint-inventory)
16. [Search Architecture](#16-search-architecture)
17. [File Storage Architecture](#17-file-storage-architecture)
18. [Connect Architecture](#18-connect-architecture)
19. [Project Architecture](#19-project-architecture)
20. [Learn Architecture](#20-learn-architecture)
21. [Discover Architecture](#21-discover-architecture)
22. [Profile Architecture](#22-profile-architecture)
23. [Community Architecture](#23-community-architecture)
24. [Event Architecture](#24-event-architecture)
25. [Current vs Future Real-Time Requirements](#25-current-vs-future-real-time-requirements)
26. [Redis Decision](#26-redis-decision)
27. [Frontend Integration Plan](#27-frontend-integration-plan)
28. [Deployment Architecture](#28-deployment-architecture)
29. [Environment Configuration](#29-environment-configuration)
30. [Migration Strategy](#30-migration-strategy)
31. [Testing Strategy](#31-testing-strategy)
32. [Security Architecture](#32-security-architecture)
33. [Performance Considerations](#33-performance-considerations)
34. [Future Messaging Architecture Boundary](#34-future-messaging-architecture-boundary)
35. [Cinematic System Protection Boundary](#35-cinematic-system-protection-boundary)
36. [Implementation Phases](#36-implementation-phases)
37. [Dependencies / Blockers](#37-dependencies--blockers)
38. [Risks](#38-risks)
39. [Open Architectural Decisions](#39-open-architectural-decisions)

---

## 1. EXECUTIVE SUMMARY

Skill Swap is a collaborative platform built around four core experiences — **Connect**, **Create**, **Learn**, and **Discover** — that together form a creative ecosystem for builders, learners, and makers.

The frontend UI foundation is substantially implemented in React + TypeScript + Vite. All data is currently stored in browser `localStorage`, all authentication is device-local, and no shared backend infrastructure exists.

This document establishes the complete architecture plan for the production backend. It is the result of a full codebase audit and must be approved before any backend implementation begins.

**Proposed backend stack:**
- **API server:** Node.js + Express, TypeScript, modular monolith pattern
- **Database:** PostgreSQL (16 GB RAM, 4 vCPU — production)
- **Auth:** JWT access tokens + httpOnly refresh cookies
- **File storage:** Presigned uploads to Cloudflare R2 (or AWS S3)
- **Backend hosting:** Render
- **Frontend hosting:** Vercel (unchanged)
- **Search:** PostgreSQL full-text search + `pg_trgm` extension
- **Redis:** NOT required for V1

**Overall completion estimate:**
- Frontend UI foundation: ~28% complete (of total product)
- Backend: 0% complete
- Integration: 0% complete
- Testing/hardening: ~5% complete (Playwright baseline exists)
- **True total: approximately 20% complete**

---

## 2. CURRENT PROJECT STATUS

### Verified completion breakdown

| Area | Status | Notes |
|---|---|---|
| Cinematic landing experience | COMPLETE | Protected, do not touch |
| Application shell + routing | COMPLETE | Hash router, 5 routes |
| Profile UI | COMPLETE | Local state only |
| Connect UI | COMPLETE | Local state only |
| Create UI | COMPLETE | Local state only |
| Learn UI | COMPLETE | Local state only |
| Discover UI | COMPLETE | Local state only |
| Auth UI (sign-up / login) | COMPLETE | Device-local only |
| Local authentication | COMPLETE | PBKDF2, not server-backed |
| Local persistence | COMPLETE | localStorage per user |
| Typed data models | COMPLETE | See Section 4 |
| Playwright test baseline | 47 tests passing | Desktop/Edge |
| Backend API | NOT STARTED | |
| PostgreSQL database | NOT STARTED | |
| Server authentication | NOT STARTED | |
| File uploads | NOT STARTED | |
| Cross-user data sharing | NOT STARTED | |
| Frontend API integration | NOT STARTED | |
| Deployment (backend) | NOT STARTED | |

### Claim vs reality check (Codex report vs actual code)

The Codex engineering report accurately describes the implementation. No discrepancies found. Code is the authority; no silent trust extended.

---

## 3. CURRENT FRONTEND ARCHITECTURE

### Tech stack (verified)
- **Framework:** React 19 (with strict mode)
- **Language:** TypeScript 7
- **Build:** Vite 8 + custom asset plugins (`coreAssets`, `connectAssets`)
- **Styling:** Vanilla CSS (scoped to `.application-shell`, `.auth-screen`)
- **Typography:** Manrope variable font (`@fontsource-variable/manrope`)
- **Testing:** Playwright 1.63 + axe-core accessibility audits
- **Node requirement:** >=22.12

### Routing
Hash-based router (`useSyncExternalStore` + `hashchange` + `popstate`). No React Router or other dependency.

Routes:
```
/              → Cinematic landing (App.tsx)
/#/signup      → Sign-up form
/#/login       → Login form  
/#/app/profile → Profile module
/#/app/connect → Connect module
/#/app/create  → Create module
/#/app/learn   → Learn module
/#/app/discover → Discover module
```

### State management
- **Session:** `SessionProvider` (React Context) — delegates to `AuthProvider` interface
- **Workspace:** `WorkspaceProvider` (React Context) — per-user localStorage
- **Connect:** `ConnectProvider` (React Context) — wraps `ConnectRepository` interface
- No Redux, Zustand, or external state library

### Current abstraction boundaries (critical for integration)

```
AuthProvider interface           ← Replace with API-backed implementation
ConnectRepository interface      ← Replace with API-backed implementation
WorkspaceProvider                ← Replace with API calls
```

These boundaries are the integration seams. The backend API client will implement these same contracts.

---

## 4. CODEX IMPLEMENTATION AUDIT

### Files audited

**Session/auth layer:**
- `src/app/session/auth.ts` — `localAuth: AuthProvider` implementation
  - Uses `crypto.subtle` PBKDF2 (SHA-256, 150,000 iterations, 256-bit key)
  - Stores accounts in `skill-swap.accounts.v1` (localStorage)
  - Stores active user ID in `skill-swap.active-account.v1`
  - Passwords are NOT stored in plaintext
  - `AuthProvider` interface is properly replaceable
  
- `src/app/session/SessionProvider.tsx` — React context around `AuthProvider`
  - Session mode is hardcoded as `'local'` — must become `'server'` post-integration
  - `updateProfile` delegates to `provider.update()`

**Data models (`src/app/data/models.ts`):**
```typescript
User        { id, name, username, email, bio, location, skills[], interests[], projectInterests[] }
Project     { id, title, description, vision, type, requiredSkills[], creatorId, collaboratorIds[], status, art, tags[], members, rating?, files[] }
LearningPath { id, title, description, category, topics[], art, mentorIds[], resources }
Community   { id, name, description, category, members, art }
Activity    { id, title, description, kind }
LearningRecord { pathId, status, progress }
ExplorationItem { id, kind, title, description, tags[], art }
```

**Person model (`src/modules/connect/types.ts`):**
```typescript
Person      { id, name, username?, skills[], interests[], projectInterests[], description }
ConnectionRequest { id, personId, direction, status }
```

**Workspace state (`src/app/data/WorkspaceProvider.tsx`):**
- Per-user key: `skill-swap.workspace.v1.{userId}`
- Stores: `projects[]`, `learning[]`, `goals[]`, `savedProjects[]`, `savedItems[]`, `communities[]`, `activity[]`
- `joinProject` clones sample project into user workspace — must become a server-side join operation

**Connect repository (`src/modules/connect/repository.ts`):**
- `ConnectRepository` interface: `listPeople()`, `listRequests()`, `sendRequest()`, `respondToRequest()`
- `createLocalConnectRepository()` — current in-memory + localStorage adapter
- This is the primary seam for Connect backend integration

**Catalog data (`src/app/data/catalog.ts`):**
- `projectTypes[]` — 9 types (static enum, keep on frontend)
- `sampleProjects[]` — 8 example projects (static, keep as inspiration catalog)
- `learningPaths[]` — 10 paths (static catalog, keep for V1)
- `communities[]` — 3 communities (static, will become database records)
- `explorationItems[]` — 4 ideas/events (static, will become database records)

**Connect fixtures (`src/modules/connect/data.ts`):**
- 12 fictional people (become real User records in production)
- Pre-seeded incoming/outgoing requests (become real DB records)

**Selectors (`src/modules/connect/selectors.ts`):**
- `matchesPerson()` — multi-token local search
- `suggestPeople()` — scoring: shared skill (3pts), project interest (2pts), shared interest (1pt)
- `connectionFor()` — returns non-declined request for a person

These algorithms inform the backend search/suggestion API design.

### Codex report accuracy
Report is accurate. No discrepancies found. All five modules have complete UI. All 47 Playwright tests pass.

---

## 5. CURRENT LOCAL / MOCK SYSTEMS

| System | Current Implementation | Backend Requirement |
|---|---|---|
| Authentication | Device-local PBKDF2 + localStorage | JWT + bcrypt + PostgreSQL |
| User identity | localStorage `accounts.v1` | `users` + `credentials` tables |
| Profile edits | `provider.update()` to localStorage | `PUT /api/v1/profile` to DB |
| Projects | `WorkspaceProvider.projects` in localStorage | `projects` table + API |
| Learning records | `WorkspaceProvider.learning` in localStorage | `learning_records` table + API |
| Learning goals | `WorkspaceProvider.goals[]` in localStorage | `learning_goals` table + API |
| Saved items | `WorkspaceProvider.savedItems[]` in localStorage | `saved_items` table + API |
| Community selections | `WorkspaceProvider.communities[]` in localStorage | `community_memberships` table + API |
| Activity | `WorkspaceProvider.activity[]` in localStorage | `activity` table + API |
| Connection requests | `ConnectRepository` local adapter + localStorage | `connections` table + API |
| People directory | 12 hardcoded fictional people | Real user profiles from `users` table |
| Sample projects | 8 hardcoded in `catalog.ts` | Real projects from `projects` table |
| Learning paths | 10 hardcoded in `catalog.ts` | Keep static for V1; serve from backend |
| Communities | 3 hardcoded in `catalog.ts` | `communities` table + API |
| Exploration items | 4 hardcoded | `ideas` + `events` tables |
| File uploads | Name + size metadata only | Presigned upload + `project_files` table |
| Cross-user data sharing | None — fully isolated | Shared PostgreSQL |

---

## 6. BACKEND GAP ANALYSIS

### Critical gaps (product is non-functional without these)

1. **No shared database** — User A cannot see User B. Connection requests do not persist across devices/sessions. Projects cannot be discovered by others.
2. **No server authentication** — Accounts exist only on the device that created them. Cross-device login is impossible. Password reset is impossible.
3. **No file storage** — Files exist as name/size metadata only. No binary bytes are persisted or served.
4. **No cross-user connection delivery** — Sending a request writes to local state. The recipient never receives it.
5. **No real project discovery** — Discover shows only local workspace projects + hardcoded samples.

### Important gaps (significantly limit product value)

6. **No persistent user profiles** — Profile edits are device-specific.
7. **No real community membership** — Joining a community is a local boolean toggle.
8. **No persistent learning records** — Learning progress is device-specific.
9. **No API layer** — Frontend has zero network calls to a shared backend.

### Architecture gaps (must be solved before implementation)

10. **No CORS policy** — Vercel frontend vs Render backend cross-origin is undefined.
11. **No session/token strategy** — How do authenticated requests work?
12. **No deployment configuration** — No Dockerfile, Render config, or environment templates.
13. **No migration system** — No schema versioning.

---

## 7. PROPOSED BACKEND ARCHITECTURE

### Architecture decision: Modular Monolith

**Decision:** Single Node.js/Express application, TypeScript, modular monolith pattern.

**Rationale:**
- Product is early-stage; premature microservices would add deployment complexity with zero benefit
- All data is highly interconnected (users, projects, connections, learning, communities)
- PostgreSQL handles all required workloads without a distributed query layer
- Render deploys a single service easily
- Team can split modules into separate services later if scale demands it

**Module structure:**
```
backend/
  src/
    app.ts                   # Express app factory
    server.ts                # Entry point
    config/
      env.ts                 # Validated environment config
    db/
      client.ts              # pg Pool
      migrations/            # Versioned SQL migrations
    middleware/
      auth.ts                # JWT verification
      errorHandler.ts        # Global error handler
      validate.ts            # Request validation
      rateLimit.ts           # Rate limiting
    modules/
      auth/                  # Sign-up, login, logout, refresh, me
      profile/               # Get/update own profile, view others
      users/                 # People search, public profiles
      connect/               # Connection requests, connections
      projects/              # CRUD, membership, files
      learning/              # Records, goals, paths (catalog)
      discover/              # Feed, ideas, events, skills
      communities/           # List, join, leave
      search/                # Global search
    lib/
      jwt.ts                 # Token generation/verification
      password.ts            # bcrypt helpers
      storage.ts             # Presigned URL generation
      pagination.ts          # Cursor/offset pagination helpers
    types/
      index.ts               # Shared TypeScript types
  package.json
  tsconfig.json
  render.yaml                # Render deployment config
```

---

## 8. TECHNOLOGY CHOICES + RATIONALE

### Backend runtime: Node.js 22 LTS
Same ecosystem as the frontend (TypeScript, npm). Render supports it natively. No context switching.

**Alternatives rejected:** Python/FastAPI (different ecosystem), Go (no type sharing with frontend), Bun (not production-stable on Render)

### Web framework: Express.js 5
Minimal, well-understood, enormous ecosystem. Modular. Easy to test. No magic.

**Alternatives rejected:** Fastify (Express sufficient), Hono (newer, less tooling), NestJS (too opinionated, heavy DI overhead)

### ORM / query layer: Raw SQL via `pg` (node-postgres)
Direct PostgreSQL control. Full use of PostgreSQL features (CTEs, window functions, FOR UPDATE, pg_trgm, full-text search). Migrations are plain SQL.

**Alternatives rejected:** Prisma (ORM abstraction limits PostgreSQL-native features), Drizzle (adds complexity), Knex (acceptable but raw pg is simpler)

### Authentication: JWT + httpOnly cookies
- Access token: JWT, short-lived (15 minutes), in Authorization header
- Refresh token: opaque random token, long-lived (30 days), in httpOnly cookie, stored in DB for revocation

### Password hashing: bcrypt (cost factor 12)
Resistant to GPU attacks. PBKDF2 already used locally; bcrypt provides equivalent or better security server-side.

### Database: PostgreSQL 16
Specified in requirements. 16 GB RAM / 4 vCPU. Full-text search, `pg_trgm`, LISTEN/NOTIFY available.

### File storage: Cloudflare R2 (preferred) or AWS S3
R2 has no egress fees. Both support presigned URLs for direct browser-to-storage uploads.

### Validation: Zod
TypeScript-first, runtime validation, composable schemas.

### Rate limiting: `express-rate-limit` (in-memory for V1)
No Redis required. Per-process rate limiting sufficient for V1.

---

## 9. POSTGRESQL ARCHITECTURE

### Extensions required

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";
```

### Identifier strategy
UUIDs (v4) for all primary keys. No sequential ID leakage. Consistent with frontend `crypto.randomUUID()`.

### Timestamp convention
All tables include `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()` and `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`.

### Soft deletion
Used only for `users` (account deactivation) and `projects` (archival). Not used for junction tables or ephemeral records.

---

## 10. DATABASE ENTITY MODEL

### Table: `users`

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| name | VARCHAR(80) | NOT NULL |
| username | VARCHAR(30) | NOT NULL, UNIQUE |
| email | VARCHAR(200) | NOT NULL, UNIQUE |
| bio | TEXT | DEFAULT '' |
| location | VARCHAR(100) | DEFAULT '' |
| avatar_url | TEXT | NULL |
| created_at | TIMESTAMPTZ | NOT NULL |
| updated_at | TIMESTAMPTZ | NOT NULL |
| deleted_at | TIMESTAMPTZ | NULL |

### Table: `credentials`

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | NOT NULL, FK users(id) CASCADE, UNIQUE |
| password_hash | TEXT | NOT NULL |
| created_at | TIMESTAMPTZ | NOT NULL |
| updated_at | TIMESTAMPTZ | NOT NULL |

### Table: `refresh_tokens`

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | NOT NULL, FK users(id) CASCADE |
| token_hash | TEXT | NOT NULL, UNIQUE |
| expires_at | TIMESTAMPTZ | NOT NULL |
| revoked_at | TIMESTAMPTZ | NULL |
| user_agent | TEXT | NULL |
| ip_address | INET | NULL |
| created_at | TIMESTAMPTZ | NOT NULL |

### Table: `user_skills`

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | NOT NULL, FK users(id) CASCADE |
| skill | VARCHAR(80) | NOT NULL |
| created_at | TIMESTAMPTZ | NOT NULL |

UNIQUE(user_id, skill). GIN trigram index on skill.

### Table: `user_interests`

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | NOT NULL, FK users(id) CASCADE |
| interest | VARCHAR(80) | NOT NULL |
| created_at | TIMESTAMPTZ | NOT NULL |

UNIQUE(user_id, interest)

### Table: `user_project_interests`

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | NOT NULL, FK users(id) CASCADE |
| topic | VARCHAR(80) | NOT NULL |
| created_at | TIMESTAMPTZ | NOT NULL |

UNIQUE(user_id, topic)

### Table: `connections`

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| requester_id | UUID | NOT NULL, FK users(id) CASCADE |
| addressee_id | UUID | NOT NULL, FK users(id) CASCADE |
| status | VARCHAR(20) | NOT NULL, CHECK IN ('pending', 'accepted', 'declined', 'cancelled') |
| created_at | TIMESTAMPTZ | NOT NULL |
| updated_at | TIMESTAMPTZ | NOT NULL |

UNIQUE(requester_id, addressee_id). CHECK requester_id != addressee_id.

**State machine:**
```
NONE
  → [A sends request] → PENDING (requester=A, addressee=B)
  → [B accepts] → ACCEPTED
  → [B declines] → DECLINED
  → [A cancels] → CANCELLED
  → [either removes accepted] → hard delete
  → [A re-requests after decline] → new PENDING
```

### Table: `projects`

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| creator_id | UUID | NOT NULL, FK users(id) RESTRICT |
| title | VARCHAR(100) | NOT NULL |
| description | TEXT | NOT NULL |
| vision | TEXT | NOT NULL |
| type | VARCHAR(50) | NOT NULL |
| status | VARCHAR(20) | CHECK IN ('Draft', 'Ongoing', 'Completed') |
| art | VARCHAR(50) | NOT NULL DEFAULT 'product' |
| is_discoverable | BOOLEAN | NOT NULL DEFAULT true |
| created_at | TIMESTAMPTZ | NOT NULL |
| updated_at | TIMESTAMPTZ | NOT NULL |
| deleted_at | TIMESTAMPTZ | NULL |

GIN full-text index on (title, description, type)

### Table: `project_tags`

| Column | Type | Constraints |
|---|---|---|
| project_id | UUID | FK projects(id) CASCADE |
| tag | VARCHAR(80) | NOT NULL |

PK(project_id, tag)

### Table: `project_required_skills`

| Column | Type | Constraints |
|---|---|---|
| project_id | UUID | FK projects(id) CASCADE |
| skill | VARCHAR(80) | NOT NULL |

PK(project_id, skill)

### Table: `project_members`

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| project_id | UUID | FK projects(id) CASCADE |
| user_id | UUID | FK users(id) CASCADE |
| role | VARCHAR(30) | CHECK IN ('owner', 'collaborator', 'invited') |
| joined_at | TIMESTAMPTZ | NOT NULL |

UNIQUE(project_id, user_id)

### Table: `project_files`

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| project_id | UUID | FK projects(id) CASCADE |
| uploaded_by | UUID | FK users(id) RESTRICT |
| original_name | VARCHAR(255) | NOT NULL |
| storage_key | TEXT | NOT NULL, UNIQUE |
| mime_type | VARCHAR(100) | NOT NULL |
| size_bytes | BIGINT | NOT NULL |
| created_at | TIMESTAMPTZ | NOT NULL |

### Table: `learning_records`

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK users(id) CASCADE |
| path_id | VARCHAR(50) | NOT NULL (catalog reference) |
| status | VARCHAR(20) | CHECK IN ('In Progress', 'Saved', 'Completed') |
| progress | SMALLINT | NOT NULL DEFAULT 0, CHECK 0-100 |
| updated_at | TIMESTAMPTZ | NOT NULL |

UNIQUE(user_id, path_id)

### Table: `learning_goals`

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK users(id) CASCADE |
| goal | VARCHAR(160) | NOT NULL |
| created_at | TIMESTAMPTZ | NOT NULL |

### Table: `saved_items`

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK users(id) CASCADE |
| item_type | VARCHAR(30) | CHECK IN ('project', 'idea', 'event') |
| item_id | VARCHAR(50) | NOT NULL |
| created_at | TIMESTAMPTZ | NOT NULL |

UNIQUE(user_id, item_type, item_id)

### Table: `communities`

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| name | VARCHAR(100) | NOT NULL, UNIQUE |
| description | TEXT | NOT NULL |
| category | VARCHAR(50) | NOT NULL |
| art | VARCHAR(50) | NOT NULL |
| member_count | INTEGER | NOT NULL DEFAULT 0 |
| created_at | TIMESTAMPTZ | NOT NULL |

### Table: `community_memberships`

| Column | Type | Constraints |
|---|---|---|
| community_id | UUID | FK communities(id) CASCADE |
| user_id | UUID | FK users(id) CASCADE |
| joined_at | TIMESTAMPTZ | NOT NULL |

PK(community_id, user_id)

### Table: `ideas`

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| author_id | UUID | FK users(id) SET NULL, NULL |
| title | VARCHAR(200) | NOT NULL |
| description | TEXT | NOT NULL |
| tags | TEXT[] | NOT NULL DEFAULT '{}' |
| art | VARCHAR(50) | NOT NULL |
| created_at | TIMESTAMPTZ | NOT NULL |

### Table: `events`

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| organizer_id | UUID | FK users(id) SET NULL, NULL |
| title | VARCHAR(200) | NOT NULL |
| description | TEXT | NOT NULL |
| tags | TEXT[] | NOT NULL DEFAULT '{}' |
| art | VARCHAR(50) | NOT NULL |
| event_date | TIMESTAMPTZ | NULL |
| location | VARCHAR(200) | NULL |
| is_online | BOOLEAN | NOT NULL DEFAULT false |
| created_at | TIMESTAMPTZ | NOT NULL |

### Table: `activity`

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK users(id) CASCADE |
| kind | VARCHAR(30) | CHECK IN ('project', 'learning', 'profile', 'connection') |
| title | VARCHAR(200) | NOT NULL |
| description | TEXT | NOT NULL DEFAULT '' |
| reference_id | UUID | NULL |
| created_at | TIMESTAMPTZ | NOT NULL |

Index on (user_id, created_at DESC)

---

## 11. ENTITY RELATIONSHIP DIAGRAM

```
users
 ├── credentials (1:1)
 ├── refresh_tokens (1:many)
 ├── user_skills (1:many)
 ├── user_interests (1:many)
 ├── user_project_interests (1:many)
 ├── connections [as requester] (1:many)
 ├── connections [as addressee] (1:many)
 ├── project_members (many:many) ──→ projects
 ├── projects [as creator] (1:many)
 │    ├── project_tags (1:many)
 │    ├── project_required_skills (1:many)
 │    ├── project_members (1:many) ──→ users
 │    └── project_files (1:many)
 ├── learning_records (1:many)
 ├── learning_goals (1:many)
 ├── saved_items (1:many)
 ├── community_memberships (many:many) ──→ communities
 └── activity (1:many)

communities
 └── community_memberships (1:many) ──→ users

ideas  (standalone, optionally linked to author)
events (standalone, optionally linked to organizer)
```

---

## 12. AUTHENTICATION ARCHITECTURE

### Flow: Sign-up
```
POST /api/v1/auth/signup
  → Validate input (name, email, password)
  → Check email uniqueness
  → Hash password (bcrypt, cost 12)
  → INSERT users + credentials
  → Generate access token (JWT, 15min)
  → Generate refresh token (random, 30 days)
  → Store refresh token hash in refresh_tokens
  → Set refresh token in httpOnly cookie
  → Return: { user, accessToken }
```

### Flow: Login
```
POST /api/v1/auth/login
  → Find user by email
  → Verify password (bcrypt.compare)
  → Generate access + refresh tokens
  → Store refresh token
  → Set cookie + return accessToken
```

### Flow: Token refresh
```
POST /api/v1/auth/refresh (cookie sent automatically)
  → Read refresh token from cookie
  → Hash and look up in refresh_tokens
  → Verify not expired, not revoked
  → Generate new access token
  → Return: { accessToken }
```

### Flow: Logout
```
POST /api/v1/auth/logout
  → Revoke refresh token in DB
  → Clear httpOnly cookie
  → Return: 204
```

### JWT claims
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "iat": 1234567890,
  "exp": 1234568790
}
```

### Cookie settings
```
HttpOnly: true
Secure: true (production)
SameSite: Lax
Path: /api/v1/auth
MaxAge: 30 days
```

### CORS policy
```
Origin: https://{skill-swap-vercel-domain}.vercel.app
Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Headers: Content-Type, Authorization
Credentials: true (required for cookies)
```

---

## 13. AUTHORIZATION MODEL

**Principle: Never trust the frontend.** Every sensitive operation is authorized by the backend.

| Resource | Read | Write | Delete |
|---|---|---|---|
| Own profile | Self | Self only | Self (deactivate) |
| Other's public profile | Any authenticated | No | No |
| Project | Creator + members | Creator only | Creator only |
| Project membership | Members | Creator (invite/remove) | Creator or self (leave) |
| Project files | Members | Members | Creator |
| Connection request | Requester or addressee | Requester | N/A |
| Connection response | Addressee | Addressee | N/A |
| Learning records | Self only | Self only | Self only |
| Communities | Any authenticated | N/A (join/leave) | Admin (future) |
| Ideas / Events | Any authenticated | Author | Author |
| Activity | Self | Self (auto-generated) | Self |

---

## 14. API ARCHITECTURE

### Base URL
```
Production: https://api.skillswap.app/api/v1
Development: http://localhost:3001/api/v1
```

### Versioning
URL versioning (`/api/v1/`). Explicit, no header negotiation.

### Error format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email address is already in use.",
    "details": [{ "field": "email", "message": "Must be unique." }]
  }
}
```

### Pagination format
```json
{
  "data": [],
  "pagination": { "total": 150, "page": 1, "pageSize": 20, "hasNext": true }
}
```

### HTTP status codes

| Code | Usage |
|---|---|
| 200 | Success (GET, PUT) |
| 201 | Created (POST) |
| 204 | No content (DELETE, logout) |
| 400 | Validation error |
| 401 | Not authenticated |
| 403 | Not authorized |
| 404 | Not found |
| 409 | Conflict (duplicate) |
| 429 | Rate limited |
| 500 | Internal error |

---

## 15. API ENDPOINT INVENTORY

All authenticated endpoints require `Authorization: Bearer {accessToken}`.

### AUTH MODULE

| Method | Path | Purpose | Auth |
|---|---|---|---|
| POST | /api/v1/auth/signup | Register new account | None |
| POST | /api/v1/auth/login | Login | None |
| POST | /api/v1/auth/logout | Logout + revoke token | Yes |
| POST | /api/v1/auth/refresh | Refresh access token | Cookie |
| GET | /api/v1/auth/me | Get current user | Yes |

### PROFILE MODULE

| Method | Path | Purpose |
|---|---|---|
| GET | /api/v1/profile | Get own full profile |
| PUT | /api/v1/profile | Update own profile |
| GET | /api/v1/users/:id | View another user's public profile |
| GET | /api/v1/profile/activity | Get own activity feed |

### USERS / PEOPLE MODULE

| Method | Path | Purpose |
|---|---|---|
| GET | /api/v1/users | Search/list people (?q, ?skill, ?page) |
| GET | /api/v1/users/suggested | Get suggested people (scored) |

### CONNECT MODULE

| Method | Path | Purpose |
|---|---|---|
| GET | /api/v1/connections | List own connections (?status) |
| POST | /api/v1/connections | Send connection request { addressee_id } |
| GET | /api/v1/connections/requests | List incoming requests |
| PATCH | /api/v1/connections/:id | Accept or decline { action } |
| DELETE | /api/v1/connections/:id | Remove connection |

### PROJECTS MODULE

| Method | Path | Purpose |
|---|---|---|
| GET | /api/v1/projects | List/search projects (?q, ?type, ?status) |
| POST | /api/v1/projects | Create project |
| GET | /api/v1/projects/:id | Get project details |
| PUT | /api/v1/projects/:id | Update project (owner) |
| PATCH | /api/v1/projects/:id/status | Update project status (owner) |
| DELETE | /api/v1/projects/:id | Soft-delete project (owner) |
| GET | /api/v1/projects/mine | List own projects (?status) |

### PROJECT MEMBERS MODULE

| Method | Path | Purpose |
|---|---|---|
| POST | /api/v1/projects/:id/members | Invite collaborator (owner) |
| DELETE | /api/v1/projects/:id/members/:userId | Remove member or leave |
| POST | /api/v1/projects/:id/join | Request to join |

### PROJECT FILES MODULE

| Method | Path | Purpose |
|---|---|---|
| GET | /api/v1/projects/:id/files | List project files (member) |
| POST | /api/v1/projects/:id/files/presign | Get presigned upload URL (member) |
| POST | /api/v1/projects/:id/files | Record uploaded file metadata (member) |
| DELETE | /api/v1/projects/:id/files/:fileId | Delete file (owner or uploader) |
| GET | /api/v1/projects/:id/files/:fileId/download | Get download URL (member) |

### LEARNING MODULE

| Method | Path | Purpose |
|---|---|---|
| GET | /api/v1/learning/records | Get own learning records (?status) |
| PUT | /api/v1/learning/records/:pathId | Set status + progress |
| DELETE | /api/v1/learning/records/:pathId | Remove learning record |
| GET | /api/v1/learning/goals | Get own learning goals |
| POST | /api/v1/learning/goals | Add learning goal |
| DELETE | /api/v1/learning/goals/:id | Delete learning goal |
| GET | /api/v1/learning/paths | Get learning path catalog (?q, ?category) |

### DISCOVER MODULE

| Method | Path | Purpose |
|---|---|---|
| GET | /api/v1/discover/projects | Discover projects feed (?q, ?type) |
| GET | /api/v1/discover/people | Discover people (?q, ?skill) |
| GET | /api/v1/discover/ideas | List ideas (?q, ?tags) |
| GET | /api/v1/discover/events | List events (?q, ?tags) |
| GET | /api/v1/discover/skills | List discoverable skills (?q) |
| GET | /api/v1/discover/trending | Trending topics + projects |

### SAVED ITEMS MODULE

| Method | Path | Purpose |
|---|---|---|
| GET | /api/v1/saved | List all saved items (?type) |
| POST | /api/v1/saved | Save an item { item_type, item_id } |
| DELETE | /api/v1/saved/:type/:id | Remove saved item |

### COMMUNITIES MODULE

| Method | Path | Purpose |
|---|---|---|
| GET | /api/v1/communities | List communities (?q) |
| POST | /api/v1/communities/:id/join | Join community |
| DELETE | /api/v1/communities/:id/leave | Leave community |

### SEARCH MODULE

| Method | Path | Purpose |
|---|---|---|
| GET | /api/v1/search | Global search (?q, ?type) |

**Total: approximately 58 endpoints**

---

## 16. SEARCH ARCHITECTURE

### Decision: PostgreSQL native search (no Elasticsearch for V1)

Given 16 GB RAM and expected user scale in the thousands, pg_trgm + full-text search is sufficient.

### People search (pg_trgm)

```sql
SELECT u.*, similarity(u.name, $1) AS score
FROM users u
WHERE 
  u.name ILIKE '%' || $1 || '%'
  OR EXISTS (SELECT 1 FROM user_skills WHERE user_id = u.id AND skill ILIKE '%' || $1 || '%')
  OR EXISTS (SELECT 1 FROM user_interests WHERE user_id = u.id AND interest ILIKE '%' || $1 || '%')
  AND u.deleted_at IS NULL
ORDER BY score DESC, u.name
LIMIT 20 OFFSET $2;
```

### Project search (full-text)

```sql
SELECT p.*,
  ts_rank(
    to_tsvector('english', p.title || ' ' || p.description || ' ' || p.type),
    plainto_tsquery('english', $1)
  ) AS rank
FROM projects p
WHERE 
  to_tsvector('english', p.title || ' ' || p.description || ' ' || p.type)
  @@ plainto_tsquery('english', $1)
  AND p.deleted_at IS NULL
  AND p.is_discoverable = true
ORDER BY rank DESC
LIMIT 20;
```

### GIN indexes

```sql
CREATE INDEX idx_projects_fts ON projects
  USING GIN(to_tsvector('english', title || ' ' || description || ' ' || type));

CREATE INDEX idx_users_name_trgm ON users USING GIN(name gin_trgm_ops);
CREATE INDEX idx_user_skills_skill_trgm ON user_skills USING GIN(skill gin_trgm_ops);
```

### Suggestion algorithm (server-side)

Replicates local scoring from `selectors.ts`:
- Shared skill: 3 points
- Shared project interest: 2 points
- Shared interest: 1 point
- Implemented as a scored PostgreSQL query using correlated subqueries

---

## 17. FILE STORAGE ARCHITECTURE

### Architecture: Presigned upload

```
Browser                 Backend                   R2/S3
  │                        │                         │
  │ POST /files/presign     │                         │
  │ ──────────────────────► │                         │
  │                        │ Generate presigned URL   │
  │                        │ ──────────────────────── ►
  │                        │◄────────────────────────│
  │ ◄──────────────────────│                         │
  │ { uploadUrl, key }      │                         │
  │                        │                         │
  │ PUT {uploadUrl} (bytes) │                         │
  │ ─────────────────────────────────────────────────►
  │ ◄─────────────────────────────────────────────────
  │                        │                         │
  │ POST /files { key, ... }│                         │
  │ ──────────────────────► │                         │
  │                        │ INSERT project_files     │
  │ ◄──────────────────────│                         │
  │ { file metadata }       │                         │
```

### Upload policy
- Maximum: 50 MB per file
- Allowed types: PDF, Word, PowerPoint, images, ZIP, text
- Presigned URL expiry: 15 minutes
- Key format: `projects/{projectId}/{uuid}/{filename}`

### Download policy
- Presigned download URL, 1 hour expiry
- Backend verifies user is project member before issuing URL

---

## 18. CONNECT ARCHITECTURE

### Frontend integration point

```typescript
// Current (local):
const repo = createLocalConnectRepository(userId);

// Future (API-backed):
const repo = createApiConnectRepository(httpClient);
```

The `ConnectProvider` and all UI components remain unchanged. Only the repository implementation changes.

### People directory (production)
- `listPeople()` → `GET /api/v1/users`
- `listRequests()` → `GET /api/v1/connections`
- `sendRequest()` → `POST /api/v1/connections`
- `respondToRequest()` → `PATCH /api/v1/connections/:id`

---

## 19. PROJECT ARCHITECTURE

### Lifecycle
```
User creates project (Draft)
  → POST /api/v1/projects
  → Server inserts project + creator as 'owner' in project_members
  → User updates to Ongoing/Completed
  → PATCH /api/v1/projects/:id/status
  → Project becomes discoverable (is_discoverable = true when not Draft)
```

### Authorization
- Only project `owner` can edit, update status, invite/remove members
- Any project `member` can upload files, view files
- Any authenticated user can view discoverable projects

---

## 20. LEARN ARCHITECTURE

### Static catalog vs user state

**Learning paths catalog:** Keep static in `catalog.ts`. Backend serves via `GET /api/v1/learning/paths` (reads from JSON, not DB). No database table needed in V1.

**User state (must be in DB):**
- Learning records (In Progress / Saved / Completed + progress %)
- Learning goals (free text)

### Mentor lookup
Catalog mentorIds map to user usernames. Frontend resolves via `GET /api/v1/users?username={id}`.

---

## 21. DISCOVER ARCHITECTURE

| Tab | Source | Endpoint |
|---|---|---|
| Projects | projects table | GET /api/v1/discover/projects |
| People | users table | GET /api/v1/discover/people |
| Ideas | ideas table (seeded) | GET /api/v1/discover/ideas |
| Events | events table (seeded) | GET /api/v1/discover/events |
| Skills | Aggregated from user_skills | GET /api/v1/discover/skills |
| Communities | communities table | GET /api/v1/communities |

Trending topics: deterministic list served from config for V1.

---

## 22. PROFILE ARCHITECTURE

### Own vs public profile
- `GET /api/v1/profile` — all fields including email (own use only)
- `GET /api/v1/users/:id` — public fields only (name, username, bio, location, skills, interests, projectInterests — NOT email)

### Profile edit
```
PUT /api/v1/profile { name, username, bio, location, skills[], interests[], projectInterests[] }
  → UPDATE users
  → DELETE/INSERT user_skills, user_interests, user_project_interests
  → Return updated user
  → Frontend SessionProvider.updateProfile() updates context
```

---

## 23. COMMUNITY ARCHITECTURE

### V1 model
- Seeded from catalog (3 initial communities)
- Users can join/leave
- Member count updated on join/leave

### V2 (future)
- User-created communities
- Community admin role
- Community content/posts

---

## 24. EVENT ARCHITECTURE

### V1 model
- Events seeded from catalog (2 initial events)
- Users can save events (saved_items table)
- No registration/attendance tracking in V1

### V2 (future)
- User-created events
- Event registration + attendance
- Calendar integration

---

## 25. CURRENT VS FUTURE REAL-TIME REQUIREMENTS

### V1 requirements

| Feature | Real-time needed? | Solution |
|---|---|---|
| Connection request delivery | NO | User refreshes → sees incoming requests |
| Profile updates | NO | Immediate after PUT response |
| Project updates | NO | Immediate after PATCH response |
| Learning state | NO | Immediate after PUT response |
| Community join | NO | Immediate after POST response |

**V1 requires zero WebSocket infrastructure.**

### Future real-time (Phase 12+)

| Feature | Technology |
|---|---|
| Connection request notifications | WebSocket or SSE |
| Chat messages | WebSocket |
| Typing indicators | WebSocket |
| Online presence | WebSocket |
| Video/voice calls | WebRTC + signaling |

---

## 26. REDIS DECISION

### Decision: NO REDIS for V1

| Redis use case | PostgreSQL alternative | Verdict |
|---|---|---|
| Session storage | JWT (stateless) + refresh_tokens table | Not needed |
| Rate limiting | express-rate-limit in-memory | Not needed V1 |
| Caching | PostgreSQL fast enough at this scale | Not needed |
| Job queue | Not needed V1 | Not needed |
| Pub/sub | Not needed until real-time (Phase 12+) | Not needed |

PostgreSQL at 16 GB RAM / 4 vCPU handles all V1 workloads comfortably.

**Introduce Redis in Phase 12 (Messaging) if needed. Not before.**

---

## 27. FRONTEND INTEGRATION PLAN

### Integration seams (in priority order)

**1. AuthProvider → API AuthProvider**
```typescript
// src/app/session/apiAuth.ts
export const apiAuth: AuthProvider = {
  async restore() { /* GET /api/v1/auth/me */ },
  async signUp(input) { /* POST /api/v1/auth/signup */ },
  async login(email, password) { /* POST /api/v1/auth/login */ },
  logout() { /* POST /api/v1/auth/logout */ },
  update(user) { /* PUT /api/v1/profile */ }
};
```

**2. ConnectRepository → API ConnectRepository**
```typescript
// src/modules/connect/apiRepository.ts
export function createApiConnectRepository(client: ApiClient): ConnectRepository {
  return {
    async listPeople() { return client.get('/users'); },
    async listRequests() { return client.get('/connections'); },
    async sendRequest(personId) { return client.post('/connections', { addressee_id: personId }); },
    async respondToRequest(id, response) { return client.patch(`/connections/${id}`, { action: response }); }
  };
}
```

**3. WorkspaceProvider → API calls**
- `addProject` → `POST /api/v1/projects`
- `updateProject` → `PATCH /api/v1/projects/:id/status`
- `setLearning` → `PUT /api/v1/learning/records/:pathId`
- `setGoal` → `POST /api/v1/learning/goals`
- `toggleSavedProject` → `POST/DELETE /api/v1/saved`
- `toggleCommunity` → `POST/DELETE /api/v1/communities/:id/join`

**4. Catalog data sources**
- Connect people → `GET /api/v1/users`
- Discover projects → `GET /api/v1/discover/projects`
- Communities → `GET /api/v1/communities`
- Learning paths → `GET /api/v1/learning/paths`
- Ideas/events → `GET /api/v1/discover/ideas` + `/events`

### API client structure
```
src/api/
  client.ts      # Base fetch wrapper + error handling + token refresh
  auth.ts
  users.ts
  connections.ts
  projects.ts
  learning.ts
  discover.ts
  index.ts
```

### Optimistic updates
- Toggling saved item: optimistic
- Community join/leave: optimistic
- Connection request sent: optimistic

---

## 28. DEPLOYMENT ARCHITECTURE

```
User Browser
     │ HTTPS
     ▼
Vercel (Edge)
  Static Vite build + cinematic assets (CDN-cached)
     │ HTTPS API calls
     ▼
Render (backend)
  Node.js Express API
  Health: GET /health → 200
     │ pg connection pool (SSL)
     ▼
PostgreSQL (16 GB RAM / 4 vCPU)
  pg-pool: max 20 connections
     │
Cloudflare R2 / AWS S3
  Presigned upload/download
  Bucket: skill-swap-files
```

### Environments

| Environment | Frontend | Backend | Database |
|---|---|---|---|
| Development | localhost:5173 | localhost:3001 | Local PostgreSQL |
| Staging | Vercel preview | Render staging | PostgreSQL (staging) |
| Production | Vercel production | Render production | PostgreSQL (production) |

### Render deployment (`render.yaml`)
```yaml
services:
  - type: web
    name: skill-swap-api
    env: node
    region: oregon
    plan: standard
    buildCommand: npm ci && npm run build
    startCommand: npm start
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: skill-swap-db
          property: connectionString
```

---

## 29. ENVIRONMENT CONFIGURATION

### Backend environment variables

| Variable | Description | Required |
|---|---|---|
| NODE_ENV | development or production | Yes |
| PORT | Server port (default 3001) | Yes |
| DATABASE_URL | PostgreSQL connection string | Yes |
| JWT_SECRET | HS256 signing secret (64+ chars) | Yes |
| JWT_EXPIRES_IN | Access token expiry (e.g., 15m) | Yes |
| REFRESH_TOKEN_EXPIRES_DAYS | Refresh token lifetime (e.g., 30) | Yes |
| CORS_ORIGIN | Allowed frontend origin | Yes |
| R2_ACCOUNT_ID | Cloudflare R2 account ID | Yes |
| R2_ACCESS_KEY_ID | R2 access key | Yes |
| R2_SECRET_ACCESS_KEY | R2 secret | Yes |
| R2_BUCKET_NAME | R2 bucket name | Yes |
| BCRYPT_ROUNDS | bcrypt cost factor (default 12) | No |

### Frontend environment variables

| Variable | Description |
|---|---|
| VITE_API_BASE_URL | Backend API base URL |

---

## 30. MIGRATION STRATEGY

### Decision: `node-pg-migrate` with plain SQL

```bash
# Run all pending migrations
npx node-pg-migrate up

# Roll back last migration
npx node-pg-migrate down

# Create new migration
npx node-pg-migrate create create_users
```

### Migration naming
```
20261001000001_create_users.sql
20261001000002_create_credentials.sql
20261001000003_create_refresh_tokens.sql
...
```

### Seed data
```
db/
  migrations/     # Schema migrations (ordered)
  seeds/          # Data seeds
    001_communities.sql
    002_ideas.sql
    003_events.sql
```

---

## 31. TESTING STRATEGY

### Existing baseline
47 Playwright tests (desktop, Microsoft Edge). Must continue passing after backend integration.

### Backend testing layers

**Unit tests (Jest + ts-jest):**
- Password hashing, JWT, input validation, suggestion scoring, pagination

**Integration tests (Jest + real PostgreSQL test DB):**
- Repository functions, auth flows, authorization checks

**API tests (Supertest + Jest):**
- All endpoint behavior, validation errors, auth requirements, authorization, pagination

**Extended E2E (Playwright Phase 10):**
- Sign-up creates server account visible on another device
- Login restores server account cross-device
- Connection request delivered to recipient
- Project discoverable by another user
- Learning records persist across sessions
- File upload and download

### Cinematic regression protection
Run after every change:
```powershell
node scripts/check-core-preservation.mjs
node scripts/check-ui-foundation-preservation.mjs
npm run check:references
```

---

## 32. SECURITY ARCHITECTURE

### Authentication security
- bcrypt cost factor 12 (>250ms on modern hardware)
- JWT secrets: 64+ chars, `crypto.randomBytes(64).toString('hex')`
- Refresh tokens: random 256-bit, stored as SHA-256 hash
- No sensitive data in JWT payload
- Access tokens: 15 minutes

### Transport security
- HTTPS everywhere (Render + Vercel enforce TLS)
- HSTS headers
- CORS restricted to exact Vercel origin
- `SameSite=Lax` on refresh cookie

### Input validation
- All inputs validated with Zod before processing
- Parameterized queries everywhere (no string concatenation)
- File uploads: MIME type checked, 50 MB limit, content-type validated

### Authorization
- Every protected route: authenticate middleware (JWT verification)
- Every owner-required route: ownership check in DB before mutation

### Rate limiting
```
Auth endpoints:   20 requests / 15 minutes per IP
API endpoints:    300 requests / 15 minutes per user
File uploads:     10 uploads / hour per user
```

### Error sanitization
- Production: never expose stack traces or DB errors to clients
- Full errors logged server-side (structured JSON)
- Clients receive: { error: { code, message } }

---

## 33. PERFORMANCE CONSIDERATIONS

| Concern | Strategy |
|---|---|
| People search | pg_trgm GIN index + LIMIT |
| Project search | Full-text GIN index + ts_rank |
| Connection lookup | Compound index on (requester_id, status), (addressee_id, status) |
| Activity feed | Index on (user_id, created_at DESC) |
| N+1 queries | Use JOINs and subqueries; no per-row queries in loops |
| Pagination | OFFSET for small datasets; cursor for large feeds |
| Connection pooling | pg-pool max 20; monitor pool exhaustion |
| File serving | Files served directly from R2/S3 via presigned URLs |
| Learning paths catalog | Served from in-memory JSON, no DB query |

---

## 34. FUTURE MESSAGING ARCHITECTURE BOUNDARY

### Planned but NOT implemented in V1

The messaging schema does not conflict with any current tables:

```
conversations  { id, kind, created_at }
conversation_members  { conversation_id, user_id, joined_at }
messages  { id, conversation_id, sender_id, content, kind, media_url, created_at }
call_sessions  { id, conversation_id, kind, started_at, ended_at }
```

The `users` and `connections` tables are fully compatible with this future system. WebSocket infrastructure can be added to the same Express server without restructuring the module system.

---

## 35. CINEMATIC SYSTEM PROTECTION BOUNDARY

### Protected systems — must not be modified by backend work

| System | Files |
|---|---|
| CoreSystem | src/components/core/CoreSystem.tsx |
| Frame progress | src/hooks/useFrameProgress.ts |
| Frame assets | Cores/ directories |
| Connect sequence | All Connect_start frames |
| Vite asset plugins | build/core-assets.ts, build/connect-assets.ts |
| App.tsx cinematic | Cinematic portions of src/app/App.tsx |
| Cinematic regression tests | tests/core-chain.spec.ts, tests/landing.spec.ts, tests/post-zoom.spec.ts |

### Backend / cinematic relationship
```
CINEMATIC EXPERIENCE (App.tsx)
        │ onEnterConnect callback
        ▼
APPLICATION (ApplicationRoot.tsx)
        │ authenticate() via AuthProvider
        ▼
BACKEND API (Render)
        │
        ▼
PostgreSQL
```

Backend work affects only the application layer and below. Zero cinematic files are touched.

---

## 36. IMPLEMENTATION PHASES

### PHASE 0 — Architecture (CURRENT)
- Repository audit complete
- Architecture decisions documented
- Awaiting CEO/architect approval
- **Deliverable:** This document

### PHASE 1 — Backend Foundation
- backend/ directory structure
- Node.js/Express/TypeScript project
- pg connection pool
- node-pg-migrate setup
- All migrations (all 18 tables)
- Health check endpoint
- Error handler + validation middleware
- Structured logging
- Local development .env
- **Deliverable:** Running API server connected to local PostgreSQL

### PHASE 2 — Authentication
- All /api/v1/auth/* endpoints
- JWT middleware
- bcrypt password hashing
- httpOnly cookie for refresh token
- CORS configuration
- Auth rate limiting
- **Deliverable:** Working server authentication, tokens, cookies

### PHASE 3 — Profiles + Skills + Interests
- GET/PUT /api/v1/profile
- GET /api/v1/users/:id (public profile)
- GET /api/v1/users (people search with pg_trgm)
- GET /api/v1/users/suggested
- Frontend: replace localAuth.update() with apiAuth.update()
- **Deliverable:** Real profile persistence, cross-device login, people search

### PHASE 4 — Connect + Connections
- All /api/v1/connections endpoints
- createApiConnectRepository() implementation
- Replace localAuth with apiAuth in ConnectProvider
- Connection request delivered to recipient
- **Deliverable:** Real cross-user connection requests

### PHASE 5 — Projects + Collaborators
- All /api/v1/projects endpoints
- All /api/v1/projects/:id/members endpoints
- Replace WorkspaceProvider.addProject() with API call
- Projects discoverable across users
- **Deliverable:** Real shared projects

### PHASE 6 — File Storage
- R2/S3 bucket setup
- All /api/v1/projects/:id/files endpoints
- Frontend file upload to presigned URL
- **Deliverable:** Real file uploads and downloads

### PHASE 7 — Learning
- All /api/v1/learning endpoints
- Seed learning path catalog to backend
- Replace WorkspaceProvider.setLearning() with API call
- **Deliverable:** Real persistent learning records across devices

### PHASE 8 — Discover + Communities + Events
- All /api/v1/discover endpoints
- All /api/v1/communities endpoints
- All /api/v1/saved endpoints
- Seed ideas, events, communities to database
- Replace Discover module's static catalog with API
- **Deliverable:** Real cross-user discover, community join, saves

### PHASE 9 — Frontend API Integration Pass
- src/api/client.ts with token refresh logic
- Replace all remaining localStorage state with API calls
- Loading states for all async operations
- Error handling for API failures
- Test all 5 modules end-to-end against real API
- **Deliverable:** Fully integrated frontend to backend

### PHASE 10 — Testing + Security + Deployment
- Backend unit + integration + API tests
- Extended Playwright E2E tests (real backend)
- Security audit: CORS, rate limiting, authorization
- Staging environment deployment
- Production deployment on Render
- **Deliverable:** Deployed to staging + production

### PHASE 11 — Production Hardening
- Database backups policy
- Monitoring + alerting (Render metrics)
- Error tracking (Sentry or similar)
- Performance profiling (slow query log)
- Rollback runbook
- **Deliverable:** Production-hardened, monitored system

### PHASE 12 — Messaging (Future)
- WebSocket infrastructure
- Conversation + Message tables
- Direct message between connected users
- Group chat (project teams)
- Voice/video calls (far future, WebRTC)

---

## 37. DEPENDENCIES / BLOCKERS

| Blocker | Impact | Resolution |
|---|---|---|
| CEO/architect approval of this plan | Cannot begin Phase 1 | Waiting for your review |
| Render account + backend service | Phase 1 deployment | Create Render account |
| Cloudflare R2 or AWS S3 account | Phase 6 | Create account + bucket |
| Production PostgreSQL provisioning | Phase 1 | Provision on Render or managed provider |
| Vercel production env vars | Phase 10 | Set VITE_API_BASE_URL in Vercel |
| TestSprite account authentication | TestSprite setup | CEO handles auth step |

---

## 38. RISKS

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Frontend integration breaks existing UI | Medium | High | Phased integration; preserve Playwright tests |
| Authentication migration breaks local accounts | High | Medium | Local auth remains during transition; users re-register |
| Database schema changes during development | Medium | Medium | Migrations system handles this |
| R2/S3 costs exceed budget | Low | Low | R2 has no egress fees; file size limits enforced |
| Render cold starts (free tier) | High | Medium | Use paid tier; health check keeps service warm |
| CORS misconfiguration | Medium | High | Test CORS locally before deploy; exact origin not wildcard |
| N+1 queries | Medium | Medium | Code review; query analysis before each phase ships |

---

## 39. OPEN ARCHITECTURAL DECISIONS

These require CEO/architect input:

1. **File storage vendor:** Cloudflare R2 vs AWS S3. R2 recommended (no egress fees, S3-compatible). Existing account or preference?

2. **PostgreSQL hosting:** Render Managed vs external (Supabase, Neon). Render Managed simplest for single Render deployment.

3. **Staging environment:** Separate PostgreSQL instance recommended (not shared with production).

4. **Username strategy at launch:** Existing localStorage users must re-register. Acceptable?

5. **Connection re-request after decline:** New PENDING record allowed after a DECLINED connection. Confirm.

6. **Project discoverability toggle:** Projects are discoverable when status is not Draft. Explicit toggle needed?

7. **Community creation:** V1 has 3 seeded communities. Can users create communities in V1?

8. **TestSprite integration timing:** Run against local preview or deployed staging?

9. **Email verification at sign-up:** Not required for V1. Confirm acceptable.

10. **Password reset / account recovery:** Not in V1 scope. Confirm.

---

## APPENDIX: TESTSPRITE SETUP PLAN

TestSprite (https://www.testsprite.com) is an AI-powered testing platform that writes and runs E2E tests against a live application. It has an open-source CLI and an MCP server integration.

### Setup approach for Skill Swap

1. **Install TestSprite CLI:**
   ```bash
   npx -y @testsprite/cli@latest --version
   ```

2. **Authentication:** TestSprite requires account sign-in. At this step, the project owner must authenticate. I will pause and ask you to complete the login.

3. **Target URL for baseline (before backend):**
   - `http://127.0.0.1:4173` (Vite preview server — `npm run preview`)

4. **Baseline test scope:**
   - All 5 application modules (Profile, Connect, Create, Learn, Discover)
   - Sign-up and login flows (local auth)
   - All Playwright test scenarios translated to TestSprite format
   - Clearly marked as LOCAL AUTH tests

5. **Post-backend tests (Phase 9/10):**
   - Real API behavior tests
   - Cross-user scenarios (connection delivery, project discovery, etc.)

**TestSprite setup will proceed as a separate task once you authorize.**

---

*End of BACKEND-MASTER-PLAN.md*  
*Produced after full repository audit. Awaiting architect/CEO approval before Phase 1 begins.*
