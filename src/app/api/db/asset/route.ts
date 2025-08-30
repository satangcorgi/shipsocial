import { prisma } from "@/lib/prisma";

function textLines(s: string, max = 28) {
  const words = (s || "").replace(/\s+/g, " ").trim().split(" ");
  const out: string[] = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > max) {
      if (line) out.push(line.trim());
      line = w;
    } else {
      line = (line + " " + w).trim();
    }
  }
  if (line) out.push(line.trim());
  return out.slice(0, 5);
}
function esc(x: string) {
  return String(x)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

// GET /api/db/asset?postId=abc&w=1080&h=1080[&download=1]
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const postId = url.searchParams.get("postId") || "";
    const w = Math.max(512, Math.min(1920, Number(url.searchParams.get("w") || 1080)));
    const h = Math.max(512, Math.min(1920, Number(url.searchParams.get("h") || 1080)));
    const download = url.searchParams.get("download") === "1";

    if (!postId) return json({ ok: false, error: "postId is required" }, 400);

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        title: true,
        body: true,
        platform: true,
        altText: true,
        pillar: { select: { name: true } },
        brand: { select: { name: true, palette: true } },
      },
    });
    if (!post) return json({ ok: false, error: "post not found" }, 404);

    const brandName = post.brand?.name || "ShipSocial";
    const pal =
      Array.isArray(post.brand?.palette) && post.brand!.palette.length >= 2
        ? (post.brand!.palette as string[])
        : ["#111827", "#6D28D9", "#F3F4F6"];

    const BG = pal[2] || "#F3F4F6";
    const TEXT = pal[0] || "#111827";
    const ACCENT = pal[1] || "#6D28D9";

    const headline =
      (post.title && post.title.trim()) ||
      (post.pillar?.name ? `${post.pillar.name} — ${post.platform}` : "") ||
      (post.body || "").slice(0, 80) ||
      "On-brand card";

    const lines = textLines(headline, 28);
    const caption = `${brandName}`;
    const alt = post.altText || `On-brand ${post.platform} card for ${brandName}: "${headline}"`;

    const padding = Math.round(w * 0.08);
    const barH = Math.max(8, Math.round(h * 0.02));
    const titleSize = Math.round(Math.min(w, h) * 0.06);
    const leadSize = Math.max(12, Math.round(titleSize * 0.68));

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="title desc">
  <title>${esc(brandName)} — Post Card</title>
  <desc>${esc(alt)}</desc>
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="6" flood-color="${ACCENT}" flood-opacity="0.15"/>
    </filter>
  </defs>

  <rect x="0" y="0" width="${w}" height="${h}" fill="${BG}"/>
  <rect x="0" y="0" width="${w}" height="${barH}" fill="${ACCENT}"/>

  <g transform="translate(${padding}, ${padding + barH})">
    ${lines
      .map(
        (ln, i) =>
          `<text x="0" y="${(i + 1) * (titleSize + 10)}" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial" font-weight="700" font-size="${titleSize}" fill="${TEXT}">${esc(
            ln,
          )}</text>`,
      )
      .join("\n    ")}
    <text x="0" y="${(lines.length + 1) * (titleSize + 10) + leadSize + 8}" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial" font-weight="500" font-size="${leadSize}" fill="${ACCENT}">
      ${esc(caption)}
    </text>
  </g>

  <g filter="url(#shadow)">
    <rect rx="10" ry="10" x="${w - padding - 150}" y="${h - padding - 50}" width="150" height="50" fill="#ffffff" opacity="0.9"/>
    <text x="${w - padding - 75}" y="${h - padding - 18}" text-anchor="middle" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial" font-weight="600" font-size="18" fill="${TEXT}">
      ShipSocial
    </text>
  </g>
</svg>`;

    const headers: Record<string, string> = {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "no-store",
    };

    if (download) {
      const platform = post.platform || "LINKEDIN";
      const filename = `shipsocial_${platform.toLowerCase()}_${post.id}.svg`;
      headers["Content-Disposition"] = `attachment; filename="${filename}"`;
    }

    return new Response(svg, { status: 200, headers });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "asset render failed" }, 500);
  }
}