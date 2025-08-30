// /api/db/credits — DB-free stub for Phase 1 build stability.
// Later (Phase 2) we can store usage in Postgres. For now, this just returns a fixed quota.

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

// Fixed daily allowance for UI display
const DAILY_LIMIT = 20;

export async function GET() {
  // naive midnight reset (UTC) — good enough for MVP; real impl will use user tz
  const now = new Date();
  const reset = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
  return json({
    ok: true,
    daily: DAILY_LIMIT,
    used: 0,
    left: DAILY_LIMIT,
    resetsAt: reset.toISOString(),
  });
}

// Optional POST to mimic “consume 1 credit”; still stubbed
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const amt = Number(body?.amount ?? 1) || 1;
  const left = Math.max(0, DAILY_LIMIT - amt);
  const now = new Date();
  const reset = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
  return json({
    ok: true,
    daily: DAILY_LIMIT,
    used: DAILY_LIMIT - left,
    left,
    resetsAt: reset.toISOString(),
  });
}