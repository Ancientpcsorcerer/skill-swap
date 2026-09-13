# Skill Swap — Technical Architecture & Codex Handover Guide

> **Confidential & Operational Manual**  
> This guide outlines the system architecture, deployed infrastructure, credentials usage, and operational guidelines for future engineering handovers on the Skill Swap platform.

---

## 1. System Architecture & Live Deployments

The Skill Swap platform is fully deployed across high-performance managed cloud providers:

| Component | Platform | URL / Host | Status |
| :--- | :--- | :--- | :--- |
| **Frontend** | Vercel (Auto-deploy on `main`) | `https://skill-swap-jbif0x27y-ancientpcsorcerer.vercel.app` | ✅ Deployed & Live |
| **Backend API** | Render Web Service | `https://skill-swap-api-0jym.onrender.com` | ✅ Deployed & Live |
| **Database** | TigerData PostgreSQL 18 (16 GB RAM) | `mg991ew53x.okedja2mr8.tsdb.cloud.timescale.com:35991/tsdb` | ✅ Connected & Seeded |
| **Keep-Alive Cron** | Cron-job.org (Job #`8441541`) | Pings `/health` every 7 mins | ✅ Active |
| **Source Repo** | GitHub (Public) | `https://github.com/Ancientpcsorcerer/skill-swap` | ✅ Synchronized |

---

## 2. Credentials Directory (`.secrets/`)

All credentials and API tokens are stored in the local `.secrets/` directory. **This directory is strictly ignored by Git and must NEVER be committed to any repository.**

```
.secrets/
├── ancient.json      # GitHub Personal Access Token (PAT) for pushing code
├── tigerdata.json    # TigerData PostgreSQL service credentials & connection URL
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
   - Format: `{"api-key": "..."}`
   - Used for `@vineethnkrishnan/vercel-mcp` or Vercel CLI.
   - Can be generated at [Vercel Account Tokens](https://vercel.com/account/tokens).

6. **TestSprite (`.secrets/testsprite.json`)**
   - Format: `{"api_key": "sk-user-..."}`
   - Used for cloud automated testing of backend and frontend flows.

---

## 3. Preservation & Quality Guardrails

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

## 4. Operational Workflow for Codex

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
