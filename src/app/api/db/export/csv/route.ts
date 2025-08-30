import { prisma } from "@/lib/prisma";

// ---------- small helpers ----------
function esc(v: string | undefined | null) {
  const s = (v ?? "").replace(/"/g, '""');
  return `"${s}"`;
}

function headerLine() {
  return [
    "scheduled_at_iso",
    "platform",
    "status",
    "title",
    "body",
    "alt_text",
    "hashtags",
    "why_note",
    "framework",
    "pillar_id",
    // UTM fields
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_url",
  ].join(",");
}

function todayFilename(prefix: string) {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${prefix}_${y}${m}${d}.csv`;
}

function toLowerPlatform(p: string) {
  return p === "LINKEDIN"
    ? "linkedin"
    : p === "INSTAGRAM"
    ? "instagram"
    : p === "X"
    ? "x"
    : "facebook";
}

function ensureBaseUrl(url: string | undefined | null) {
  const trimmed = (url || "").trim();
  if (!trimmed) return "https://example.com/";
  if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

// ---------- core ----------
async function getBrand() {
  // Use the first brand (Phase 2 demo) — create one if empty
  let b = await prisma.brand.findFirst({ orderBy: { createdAt: "asc" } });
  if (b) return b;
  b = await prisma.brand.create({
    data: {
      name: "DB Demo Brand",
      website: "https://example.com",
      palette: ["#111827", "#6D28D9", "#F3F4F6"],
      voiceCard: {
        brandSummary: "We help small SaaS ship tiny improvements that compound.",
        audience: ["micro-SaaS founders", "indie hackers"],
        do: ["use concrete examples", "be concise", "prefer steps over fluff"],
        dont: ["no hype", "avoid jargon", "no exclamation marks"],
        tone: ["dry", "friendly"],
        phrases: ["ship daily", "tiny wins compound", "show your homework"],
        banned: ["!"],
      },
    },
  });
  return b;
}

function buildUtmForRow(opts: {
  platformLower: string;
  brandName: string;
  brandWebsite: string | null;
  postId: string;
}) {
  const base = ensureBaseUrl(opts.brandWebsite);
  const source = opts.platformLower; // linkedin/instagram/x/facebook
  const medium = "social";
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const campaign = `${opts.brandName.replace(/\s+/g, "_").toLowerCase()}_${y}${m}`;
  const content = opts.postId;

  const url =
    `${base}${base.includes("?") ? "&" : (base.endsWith("/") ? "?" : "/?")}` +
    `utm_source=${encodeURIComponent(source)}` +
    `&utm_medium=${encodeURIComponent(medium)}` +
    `&utm_campaign=${encodeURIComponent(campaign)}` +
    `&utm_content=${encodeURIComponent(content)}`;

  return { source, medium, campaign, content, url };
}

function rowsToCSV(rows: {
  scheduledAt: Date | null;
  platform: string; // DB enum
  status: string;
  title: string | null;
  body: string;
  altText: string | null;
  hashtags: any;
  whyNote: string | null;
  framework: string | null;
  pillarId: string | null;
  id: string;
  brandName: string;
  brandWebsite: string | null;
}[]) {
  const lines: string[] = [headerLine()];
  for (const r of rows) {
    const platformLower = toLowerPlatform(r.platform);
    const utm = buildUtmForRow({
      platformLower,
      brandName: r.brandName,
      brandWebsite: r.brandWebsite,
      postId: r.id,
    });
    lines.push(
      [
        esc(r.scheduledAt ? r.scheduledAt.toISOString() : ""),
        esc(platformLower),
        esc(r.status.toLowerCase()),
        esc(r.title || ""),
        esc(r.body),
        esc(r.altText || ""),
        esc(Array.isArray(r.hashtags) ? (r.hashtags as string[]).join(" ") : ""),
        esc(r.whyNote || ""),
        esc(r.framework || ""),
        esc(r.pillarId || ""),
        esc(utm.source),
        esc(utm.medium),
        esc(utm.campaign),
        esc(utm.content),
        esc(utm.url),
      ].join(",")
    );
  }
  return lines.join("\n");
}

async function fetchScheduled(brandId: string, ids?: string[]) {
  const where: any = { brandId, status: "SCHEDULED", scheduledAt: { not: null } };
  if (Array.isArray(ids) && ids.length > 0) where.id = { in: ids };
  const rows = await prisma.post.findMany({
    where,
    orderBy: [{ scheduledAt: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      platform: true,
      status: true,
      scheduledAt: true,
      title: true,
      body: true,
      altText: true,
      hashtags: true,
      whyNote: true,
      framework: true,
      pillarId: true,
      brand: { select: { name: true, website: true } },
    },
  });
  return rows.map((r) => ({
    ...r,
    brandName: r.brand?.name || "ShipSocial",
    brandWebsite: r.brand?.website || "https://example.com",
  }));
}

// ---------- routes ----------
export async function GET() {
  const brand = await getBrand();
  const rows = await fetchScheduled(brand.id);
  const csv = rowsToCSV(rows);
  const filename = todayFilename("shipsocial_db_scheduled");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));
  const ids = Array.isArray(body?.ids) ? body.ids.map(String) : [];
  if (ids.length === 0) {
    return Response.json(
      { ok: false, error: "Provide { ids: string[] }" },
      { status: 400 }
    );
  }
  const brand = await getBrand();
  const rows = await fetchScheduled(brand.id, ids);
  const csv = rowsToCSV(rows);
  const filename = todayFilename("shipsocial_db_selected");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}