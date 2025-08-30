# ShipSocial (Phase 1 MVP)

A tiny “consistency engine” that helps small brands post useful, on-brand content daily and schedule it smartly.

- **Stack:** Next.js 14 App Router (TypeScript) + Tailwind CSS
- **Data:** In-memory singleton (no external services in Phase 1)
- **Status:** Ready to develop locally and deploy to Vercel

---

## Features (Phase 1)

1) **Onboarding** → capture brand voice (tone, do/don’t, phrases, proof points).  
2) **Voice Card** + **3–5 Pillars** auto-derived from onboarding.  
3) **Post Generator** (LinkedIn, Instagram, X, Facebook)  
   - Each post includes exactly one: a **useful fact** _or_ an **example** _or_ a **step to take today**  
   - Adds a one-sentence “why this works” note citing one framework (Carnegie/Cialdini/SUCCES/Hormozi/Atomic/Lean).  
4) **Scheduler**  
   - Per-platform daily window (e.g., `09:30–11:00 Asia/Manila`)  
   - Picks a random time with **±7 minute jitter**; avoids minute collisions with +7 bump  
   - **Dashboard** week view (08:00–20:00) shows scheduled posts  
5) **Drafts → Scheduled → Export CSV**  
   - Export **all scheduled** (GET) or **selected IDs** (POST)  
6) **Credits (mock)** displayed in sidebar; **Regenerate** consumes 1 credit
7) **Settings**: set credits + reset demo data

> Phase 2 (later): Prisma/Postgres, OpenAI (text+images), Stripe, n8n handoff.

---

## Getting Started (Local)

**Requirements**
- Node.js 20+ and npm 10+
- macOS/Linux/Windows

**Install & run**
```bash
npm install
npm run dev

Open: http://localhost:3000/

First visit redirects to /onboarding. After saving, / goes to /dashboard.

⸻

Key Routes
    •    /onboarding — capture brand & voice inputs (saved to in-memory store)
    •    /voice — Voice Card view (dynamic, always fresh)
    •    /pillars — content pillars
    •    /posts — generate drafts per platform, Edit, Regenerate (−1 credit), Schedule
    •    /schedule — per-platform daily windows (Asia/Manila by default)
    •    /dashboard — week calendar (08:00–20:00) with scheduled chips
    •    /exports — download CSV of all scheduled or selected posts
    •    /settings — set credits / reset demo data

⸻

CSV Export

All scheduled
GET /api/mock/export/csv → shipsocial_scheduled_YYYYMMDD.csv

Selected IDs
POST /api/mock/export/csv with body:

{ "ids": ["POST_ID_A", "POST_ID_B"] }

Downloads shipsocial_selected_YYYYMMDD.csv.

⸻

Useful Test Commands

Generate a draft:

curl -s -X POST http://localhost:3000/api/mock/generate \
  -H "Content-Type: application/json" \
  -d '{"platform":"linkedin"}' | jq

Regenerate (consumes 1 credit):

curl -s -X POST http://localhost:3000/api/mock/regenerate \
  -H "Content-Type: application/json" \
  -d '{"postId":"<ID_FROM_GENERATE>"}' | jq

Schedule:

curl -s -X POST http://localhost:3000/api/mock/schedule \
  -H "Content-Type: "application/json" \
  -d '{"postId":"<ID_FROM_GENERATE>"}' | jq

Credits:

curl -s http://localhost:3000/api/mock/credits | jq


⸻

Deploy to Vercel
    1.    Push this repo to GitHub (or GitLab/Bitbucket).
    2.    Go to Vercel → New Project → Import the repo.
    3.    Framework: Next.js (auto-detected).
Build command: next build (default) • Output: .next (default).
    4.    No env vars needed for Phase 1.
    5.    Deploy. Visit the Vercel URL:
    •    / → onboarding on first load, then dashboard thereafter.

Tip: The Phase-1 store is in-memory. Each new deployment or cold start resets data; use /settings → Reset demo data or re-run onboarding.

⸻

Code Map (selected)

src/
  app/
    (app)/
      dashboard/page.tsx
      onboarding/page.tsx
      voice/page.tsx
      pillars/page.tsx
      posts/page.tsx
      schedule/page.tsx
      exports/page.tsx
      settings/page.tsx
    api/
      mock/
        generate/route.ts
        posts/route.ts
        posts/[id]/route.ts
        schedule/route.ts
        windows/route.ts
        export/csv/route.ts
        pillars/route.ts
        credits/route.ts
        reset/route.ts
    page.tsx           # smart redirect
  components/
    CreditsBadge.tsx
  lib/
    mockdb.ts          # global singleton store
    mockgen.ts         # deterministic generator + regenerate
    scheduler.ts       # window pick + jitter + collision bump
    types.ts           # domain types


⸻

License

MIT (tweak as you wish for demo use)
