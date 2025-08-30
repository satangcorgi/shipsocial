import { prisma } from "@/lib/prisma";

function json(data: any, status = 200) {
  const body = JSON.stringify(data, (_k, v) => (typeof v === "bigint" ? Number(v) : v));
  return new Response(body, { status, headers: { "Content-Type": "application/json; charset=utf-8" } });
}

type DbPlatform = "LINKEDIN" | "INSTAGRAM" | "X" | "FACEBOOK";
const PLATFORMS: DbPlatform[] = ["LINKEDIN", "INSTAGRAM", "X", "FACEBOOK"];

async function ensureDemoBrand() {
  const first = await prisma.brand.findFirst({ orderBy: { createdAt: "asc" } });
  if (first) return first;
  return prisma.brand.create({
    data: {
      name: "ShipSocial Demo",
      website: "https://example.com",
      palette: ["#111827", "#6D28D9", "#F3F4F6"],
      voiceCard: {
        brandSummary: "We help small SaaS ship tiny improvements that compound.",
        tone: ["dry", "friendly"],
      },
    },
  });
}

function isValidHHMM(s: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
}

function isValidTZ(tz: string) {
  try {
    // Validate via Intl; throws on invalid tz
    new Intl.DateTimeFormat("en-US", { timeZone: tz }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

// -------- GET: read or seed defaults --------
// Response: { ok: true, tz: string, windows: { LINKEDIN:{start,end}, ... } }
export async function GET() {
  try {
    const brand = await ensureDemoBrand();
    let windows = await prisma.window.findMany({
      where: { brandId: brand.id },
      orderBy: { platform: "asc" },
      select: { platform: true, start: true, end: true, tz: true },
    });

    // Seed defaults if empty
    if (windows.length === 0) {
      const tz = "Asia/Manila";
      await prisma.window.createMany({
        data: PLATFORMS.map((p) => ({
          brandId: brand.id,
          platform: p,
          start: "09:30",
          end: "11:00",
          tz,
        })),
        skipDuplicates: true,
      });
      windows = await prisma.window.findMany({
        where: { brandId: brand.id },
        orderBy: { platform: "asc" },
        select: { platform: true, start: true, end: true, tz: true },
      });
    }

    // Choose a single tz to display in the editor (if mixed, take the first)
    const tz = windows[0]?.tz || "UTC";
    const out: any = { LINKEDIN: null, INSTAGRAM: null, X: null, FACEBOOK: null };
    windows.forEach((w) => (out[w.platform as DbPlatform] = { start: w.start, end: w.end }));
    return json({ ok: true, tz, windows: out });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "failed to fetch windows" }, 500);
  }
}

// -------- PATCH: update tz and windows --------
// Body:
// { tz: string, windows: { LINKEDIN?:{start,end}, INSTAGRAM?:{start,end}, X?:{start,end}, FACEBOOK?:{start,end} } }
export async function PATCH(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const tz = String(body?.tz || "").trim();
    const win = body?.windows || {};

    if (!tz || !isValidTZ(tz)) {
      return json({ ok: false, error: "invalid timezone" }, 400);
    }

    const brand = await ensureDemoBrand();

    for (const p of PLATFORMS) {
      if (!win[p]) continue;
      const { start, end } = win[p] as { start?: string; end?: string };
      const s = String(start || "").trim();
      const e = String(end || "").trim();
      if (!isValidHHMM(s) || !isValidHHMM(e)) {
        return json({ ok: false, error: `invalid HH:MM for ${p}` }, 400);
      }
      // Find-or-create approach to avoid composite upsert typing
      const existing = await prisma.window.findFirst({ where: { brandId: brand.id, platform: p } });
      if (existing) {
        await prisma.window.update({
          where: { id: existing.id },
          data: { start: s, end: e, tz },
        });
      } else {
        await prisma.window.create({
          data: { brandId: brand.id, platform: p, start: s, end: e, tz },
        });
      }
    }

    // Return latest
    const windows = await prisma.window.findMany({
      where: { brandId: brand.id },
      orderBy: { platform: "asc" },
      select: { platform: true, start: true, end: true, tz: true },
    });
    const out: any = { LINKEDIN: null, INSTAGRAM: null, X: null, FACEBOOK: null };
    windows.forEach((w) => (out[w.platform as DbPlatform] = { start: w.start, end: w.end }));
    return json({ ok: true, tz, windows: out });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "failed to update windows" }, 500);
  }
}