# Skill Swap — Technical Architecture & Codex Handover Guide

> **Confidential & Operational Manual**  
> This guide outlines the system architecture, deployed infrastructure, credentials usage, authentication options (Email, Google, GitHub OAuth), and operational guidelines for future engineering handovers on the Skill Swap platform.

---

## 1. System Architecture & Live Deployments

The Skill Swap platform is fully deployed across high-performance managed cloud providers:

| Component | Platform | URL / Host | Status |
| :--- | :--- | :--- | :--- |
| **Frontend** | Vercel (Auto-deploy on `main`) | `https://skill-swap-xi-lake.vercel.app` | ✅ Deployed & Live |
| **Backend API** | Render Web Service (`skill-swap-api`) | `https://skill-swap-api-0jym.onrender.com` | ✅ Deployed & Live |
| **Database** | TigerData PostgreSQL 18 (16 GB RAM) | `mg991ew53x.okedja2mr8.tsdb.cloud.timescale.com:35991/tsdb` | ✅ Connected & Seeded |
| **Keep-Alive Cron** | Cron-job.org (Job #`8441541`) | Pings `/health` every 7 mins | ✅ Active |
| **Source Repo** | GitHub (Public) | `https://github.com/Ancientpcsorcerer/skill-swap` | ✅ Synchronized |

---

## 2. Credentials Directory (`.secrets/`)

All credentials and API tokens are stored in the local `.secrets/` directory. **This directory is strictly ignored by Git and must NEVER be committed to any repository.**

```
.secrets/
├── ancient.json      # GitHub Personal Access Token (PAT) for pushing code
├── tigerdata.json    # TigerData PostgreSQL service credentials & connection URL (JSON)
├── render.json       # Render REST API key for managing backend services
├── cron-job.json     # Cron-job.org REST API key for keep-alive monitoring
├── vercel.json       # Vercel Personal Access Token for Vercel MCP / CLI
└── testsprite.json   # TestSprite API Key for automated E2E testing
```

### Credential Details & Usage

1. **GitHub PAT (`.secrets/ancient.json`)**
   - Format: `{"pat": "ghp_..."}`
   - **Usage**: Used for pushing commits to the GitHub repository without relying on local credential managers or interactive prompts.
   - Command pattern:
     ```powershell
     $pat = (Get-Content ".secrets\ancient.json" | ConvertFrom-Json).pat
     git push "https://x-access-token:${pat}@github.com/Ancientpcsorcerer/skill-swap.git" main
     ```

2. **TigerData PostgreSQL (`.secrets/tigerdata.json`)**
   - Host: `mg991ew53x.okedja2mr8.tsdb.cloud.timescale.com`
   - Port: `35991`
   - Database: `tsdb`
   - User: `tsdbadmin`
   - Connection URL: `postgres://tsdbadmin:<password>@mg991ew53x.okedja2mr8.tsdb.cloud.timescale.com:35991/tsdb?sslmode=require`
   - **SSL Requirement**: Remote connections must use SSL with `{ rejectUnauthorized: false }`. Native `gen_random_uuid()` is supported.

3. **Render Web Service (`.secrets/render.json`)**
   - Key: `{"api-key": "rnd_..."}`
   - Service ID: `srv-dajchjrm8hqs73fopd30` (Name: `skill-swap-api`)
   - Region: `oregon` (Free plan)
   - Health check endpoint: `/health`
   - Build Command: `npm install --include=dev && npm run build`
   - Start Command: `npm run start`
   - Root Directory: `backend`

4. **Cron-job.org (`.secrets/cron-job.json`)**
   - Key: `{"api-key": "..."}`
   - Active Job ID: `8441541`
   - Target: `https://skill-swap-api-0jym.onrender.com/health`
   - Schedule: Minutes `[0, 7, 14, 21, 28, 35, 42, 49, 56]` (Every 7 minutes). Prevents Render free instances from sleeping.

5. **Vercel Token (`.secrets/vercel.json`)**
   - Format: `{"api-key": "vcp_..."}`
   - Used for `@vineethnkrishnan/vercel-mcp` or Vercel CLI.
   - Project ID: `prj_8jHVP4FlqRYrc8abzzeAzm7GOpj2` (`skill-swap`)

6. **TestSprite (`.secrets/testsprite.json`)**
   - Format: `{"api_key": "sk-user-..."}`
   - Used for cloud automated testing of backend and frontend flows.

---

## 3. Strict Backend Security & CORS Lockdown

To guarantee that the backend API **only accepts requests from authorized Skill Swap frontend clients**, the following protections are active:

1. **Strict CORS Whitelist**:
   - Authorized origins:
     - `https://skill-swap-xi-lake.vercel.app` (Production)
     - `https://skill-swap.vercel.app` (Custom domain)
     - `https://skill-swap-git-main-ancientpcsorcerer.vercel.app` (Branch preview)
     - `http://localhost:5173` & `http://localhost:3000` (Local development)
   - Any external origin is rejected with HTTP 403 Forbidden (`Origin not allowed by CORS security policy`).
   - Wildcard `*` is strictly disallowed in production when `credentials: true` is enabled.

---

## 4. Authentication Architecture: Email, Google & GitHub OAuth

Skill Swap supports both traditional password authentication and social OAuth (Google & GitHub).

### A. Email & Password Authentication (Active)
- **Password Hashing**: `bcrypt` with 12 salt rounds.
- **Tokens**:
  - Access Token: Short-lived JWT (15 minutes), payload `{ userId, email, role }`. Sent via `Authorization: Bearer <token>`.
  - Refresh Token: Long-lived cryptographically secure random token (30 days), stored as SHA-256 hash in PostgreSQL `refresh_tokens` table.
- **Rotation**: `/api/v1/auth/refresh` automatically rotates tokens on 401 response in `src/lib/api.ts`.

### B. Google OAuth 2.0 Integration Guide
When enabling Google OAuth for production:
1. **Google Cloud Console Setup**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
   - Create an **OAuth 2.0 Client ID** (Application type: Web application).
   - **Authorized JavaScript origins**:
     - `https://skill-swap-xi-lake.vercel.app`
     - `http://localhost:5173`
   - **Authorized redirect URIs**:
     - `https://skill-swap-api-0jym.onrender.com/api/v1/auth/oauth/google/callback`
     - `http://localhost:3001/api/v1/auth/oauth/google/callback`
2. **Environment Variables**:
   - Add to Render environment variables:
     - `GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com`
     - `GOOGLE_CLIENT_SECRET=your-google-client-secret`
3. **Database Schema Mapping**:
   - In `users` table: link `google_id VARCHAR(100) UNIQUE NULL`.
   - On OAuth callback: query or create user record by `email` and issue Skill Swap JWT access token.

### C. GitHub OAuth Integration Guide
When enabling GitHub OAuth for production:
1. **GitHub Developer Settings**:
   - Go to [GitHub Settings -> Developer settings -> OAuth Apps](https://github.com/settings/developers).
   - Register a new OAuth application:
     - Application name: `Skill Swap`
     - Homepage URL: `https://skill-swap-xi-lake.vercel.app`
     - Authorization callback URL: `https://skill-swap-api-0jym.onrender.com/api/v1/auth/oauth/github/callback`
2. **Environment Variables**:
   - Add to Render environment variables:
     - `GITHUB_CLIENT_ID=your-github-client-id`
     - `GITHUB_CLIENT_SECRET=your-github-client-secret`
3. **Flow**:
   - User clicks **Continue with GitHub** -> redirects to `https://github.com/login/oauth/authorize?client_id=...&scope=read:user,user:email`.
   - GitHub redirects back to backend callback with `?code=...`.
   - Backend exchanges `code` for GitHub access token, retrieves profile from `https://api.github.com/user`, creates/updates user in TigerData PostgreSQL, and redirects to frontend with JWT token.

---

## 5. Modern Dynamic UI & Animations

The frontend is styled with rich, modern glassmorphism and fluid micro-animations:
1. **Glassmorphic Auth Panels**:
   - Segmented pill tabs (`Create Account` / `Sign In`) with smooth state transitions.
   - Dual social auth buttons (`Continue with Google` / `Continue with GitHub`) with official SVGs and hover lift.
   - Animated alert notifications (`form-error-alert` and `form-notice-alert`).
   - Quick Demo Account selector (`Aarav`, `Ishita`, `Rohan`) for 1-click preview testing.
2. **CSS Keyframe Animations**:
   - `@keyframes authFadeInUp`: Smooth entrance animation for modals and auth card.
   - `@keyframes glowPulse`: Ambient micro-glow on active inputs.
   - Global card elevation (`transform: translateY(-4px); box-shadow: ...`) on project cards and connection rows.

---

## 6. Preservation & Quality Guardrails

The Skill Swap codebase includes strict architectural protection boundaries:

1. **Cinematic Landing Canvas (2,056 Asset Frames)**:
   - Asset directories (`Cores/Connect_start`, `Cores/Learn_start`, `Cores/Discover_start`, etc.) must **NEVER** be modified, deleted, or converted.
   - Always run the verification check before pushing:
     ```bash
     node scripts/check-core-preservation.mjs
     node scripts/check-ui-foundation-preservation.mjs
     ```

2. **Frontend Production Base URL**:
   - `src/lib/api.ts` automatically switches between `http://localhost:3001/api/v1` (for local development) and `https://skill-swap-api-0jym.onrender.com/api/v1` (when running on Vercel or any non-localhost domain).
   - `.env.production` defines `VITE_API_BASE_URL=https://skill-swap-api-0jym.onrender.com/api/v1`.

3. **Backend Database Migrations & Seeds**:
   - Migration script: `backend/src/db/migrate.ts` (executes `backend/src/db/schema.sql`).
   - Seed script: `backend/scripts/seed.ts` (seeds 12 mock personas matching frontend data models).
   - Commands:
     ```bash
     cd backend
     npm run db:migrate
     npm run db:seed
     ```

---

## 7. Operational Workflow for Codex

Whenever Codex makes updates to the codebase, follow these rules:

1. **Verify Builds & Tests**:
   ```powershell
   # 1. Check frontend
   npm.cmd run build
   node scripts/check-core-preservation.mjs

   # 2. Check backend
   cd backend
   npm.cmd run typecheck
   npm.cmd test
   cd ..
   ```

2. **Commit & Push using GitHub PAT**:
   ```powershell
   git add <modified-files>
   git commit -m "<type>(<scope>): <clear description of change>"
   $pat = (Get-Content ".secrets\ancient.json" | ConvertFrom-Json).pat
   git push "https://x-access-token:${pat}@github.com/Ancientpcsorcerer/skill-swap.git" main
   ```

3. **Deployment Tracking**:
   - **Vercel** automatically rebuilds and deploys the frontend upon git push to `main`.
   - **Render** automatically rebuilds and restarts the backend API upon git push to `main`.
   - Monitor backend health: `curl https://skill-swap-api-0jym.onrender.com/health`.

---

## 8. Automated Full-Stack Testing Suite (TestSprite)

The platform is continuously verified end-to-end using TestSprite cloud test runners across both backend and frontend layers:

### A. Backend Live API & Database Suite
- **Project ID**: `766833db-83f4-4ae2-b503-f33d6b1b611a` ("Skill Swap API")
- **Target URL**: `https://skill-swap-api-0jym.onrender.com`
- **Key Test**: `f4907526-76f4-439a-be58-7d6ac96d47bf` (`Live Full Stack E2E: TigerData DB, Auth, Projects and CORS Security`)
- **Verified Run**: `e0fab55e-ca24-46f5-8375-fcebf75bd12e` — **Status: Passed**
- **Dashboard**: [TestSprite Backend Dashboard](https://www.testsprite.com/dashboard/tests/766833db-83f4-4ae2-b503-f33d6b1b611a/test/f4907526-76f4-439a-be58-7d6ac96d47bf)
- **Coverage**:
  - Live server health & TigerData PostgreSQL connection check.
  - User authentication & JWT access token issuance.
  - Authenticated `/api/v1/auth/me` user profile retrieval.
  - Multi-table database queries (seeded personas, communities, and projects).
  - Strict CORS lockdown (validates accepted Vercel origin and rejected unauthorized origins).

### B. Frontend E2E Journey Suite
- **Project ID**: `87583064-c96c-4a0b-a466-6a0f7a690975` ("Skill Swap Frontend")
- **Target URL**: `https://skill-swap-xi-lake.vercel.app`
- **Key Test**: `3a661186-e42f-41aa-8048-0be401778348` (`User can authenticate via modern auth module and access the Skill Swap platform`)
- **Verified Run**: `885c26f9-4c63-49bc-96a1-64a4d82512d2` — **27/27 Steps Passed**
- **Dashboard**: [TestSprite Frontend Dashboard](https://www.testsprite.com/dashboard/tests/87583064-c96c-4a0b-a466-6a0f7a690975/test/3a661186-e42f-41aa-8048-0be401778348)
- **Coverage**:
  - Landing page navigation & visual readiness.
  - Authentication modal & tab switching (`Create Account` / `Sign In`).
  - Google and GitHub social OAuth UI buttons and accessibility labels.
  - Demo profile credentials loading via quick-login pills.
  - Form submission, JWT storage, and seamless transition to the Connect workspace module.

### C. CLI Execution Command
To re-run the TestSprite suites locally:
```powershell
$key = (Get-Content ".secrets\testsprite.json" | ConvertFrom-Json).api_key
$env:TESTSPRITE_API_KEY = $key

# Run backend suite:
npx.cmd -y @testsprite/testsprite-cli test run f4907526-76f4-439a-be58-7d6ac96d47bf --wait

# Run frontend suite:
npx.cmd -y @testsprite/testsprite-cli test run 3a661186-e42f-41aa-8048-0be401778348 --wait
```

