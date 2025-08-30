import { prisma } from "@/lib/prisma";

function csvEscape(v: any) {
  const s = v === null || v === undefined ? "" : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(rows: any[]) {
  const header = [
    "id",
    "platform",
    "status",
    "scheduledAt",
    "title",
    "body",
    "hashtags",
    "alt_text",
    "link",
    "asset"
  ];
  const lines = [header.join(",")];
  for (const r of rows) {
    const line = [
      csvEscape(r.id),
      csvEscape(r.platform),
      csvEscape(r.status),
      csvEscape(r.scheduledAt || ""),
      csvEscape(r.title || ""),
      csvEscape(r.body || ""),
      csvEscape((r.hashtags || []).join(" ")),
      csvEscape(r.altText || ""),
      csvEscape(r.link || ""),
      csvEscape(r.asset || "")
    ].join(",");
    lines.push(line);
  }
  return lines.join("\n");
}

function filename() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const name = `shipsocial_export_${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(
    d.getHours()
  )}${pad(d.getMinutes())}.csv`;
  return name;
}

function toSource(p: "LINKEDIN" | "INSTAGRAM" | "X" | "FACEBOOK") {
  if (p === "X") return "x";
  return p.toLowerCase(); // linkedin, instagram, facebook
}

function stampUtm(
  website?: string | null,
  platform?: "LINKEDIN" | "INSTAGRAM" | "X" | "FACEBOOK",
  postId?: string
) {
  if (!website) return "";
  try {
    // Ensure website has protocol
    const base = website.startsWith("http://") || website.startsWith("https://") ? website : `https://${website}`;
    const u = new URL(base);
    u.searchParams.set("utm_source", toSource(platform || "LINKEDIN"));
    u.searchParams.set("utm_medium", "social");
    u.searchParams.set("utm_campaign", "shipsocial");
    if (postId) u.searchParams.set("utm_content", postId);
    return u.toString();
  } catch {
    return ""; // if invalid URL, skip link
  }
}

// Map platform -> suggested image size
function assetSize(p: "LINKEDIN" | "INSTAGRAM" | "X" | "FACEBOOK") {
  switch (p) {
    case "LINKEDIN":
      return { w: 1200, h: 628 };
    case "INSTAGRAM":
      return { w: 1080, h: 1080 };
    case "X":
      return { w: 1600, h: 900 };
    case "FACEBOOK":
      return { w: 1200, h: 630 };
    default:
      return { w: 1080, h: 1080 };
  }
}

// GET /api/db/export?status=SCHEDULED&limit=1000
// GET /api/db/export?ids=abc,def,ghi
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const idsParam = url.searchParams.get("ids");
    const status = url.searchParams.get("status") as "DRAFT" | "SCHEDULED" | "PUBLISHED" | null;
    const limit = Math.min(Number(url.searchParams.get("limit") || 200), 2000);

    const where: any = {};
    if (idsParam) {
      const ids = idsParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      where.id = { in: ids };
    } else if (status) {
      where.status = status;
    }

    const posts = await prisma.post.findMany({
      where,
      orderBy: [{ scheduledAt: "asc" }, { createdAt: "asc" }],
      take: limit,
      select: {
        id: true,
        platform: true,
        status: true,
        scheduledAt: true,
        title: true,
        body: true,
        hashtags: true,
        altText: true,
        brand: { select: { website: true } }
      }
    });

    // Build absolute origin for asset URLs
    const host = (req.headers.get("x-forwarded-host") || req.headers.get("host") || "").trim();
    const proto = (req.headers.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https")).trim();
    const origin = host ? `${proto}://${host}` : ""; // fallback to relative if host missing

    const rows = posts.map((p) => {
      const scheduledAtIso = p.scheduledAt ? new Date(p.scheduledAt).toISOString() : "";
      const link = stampUtm(p.brand?.website, p.platform, p.id);
      const { w, h } = assetSize(p.platform);
      const assetPath = `/api/db/asset?postId=${encodeURIComponent(p.id)}&w=${w}&h=${h}`;
      const asset = origin ? `${origin}${assetPath}` : assetPath;

      return {
        id: p.id,
        platform: p.platform,
        status: p.status,
        scheduledAt: scheduledAtIso,
        title: p.title ?? "",
        body: p.body,
        hashtags: p.hashtags || [],
        altText: p.altText ?? "",
        link,
        asset
      };
    });

    const csv = toCsv(rows);
    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename()}"`,
        "Cache-Control": "no-store"
      }
    });
  } catch (e: any) {
    const body = JSON.stringify({ ok: false, error: e?.message || "export failed" });
    return new Response(body, { status: 500, headers: { "Content-Type": "application/json" } });
  }
}