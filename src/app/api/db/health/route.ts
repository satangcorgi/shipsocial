import { prisma } from "@/lib/prisma";

function json(data: any, status = 200) {
  const body = JSON.stringify(
    data,
    (_k, v) => (typeof v === "bigint" ? Number(v) : v)
  );
  return new Response(body, {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export async function GET() {
  try {
    const [brands, pillars, windows, posts] = await Promise.all([
      prisma.brand.count(),
      prisma.pillar.count(),
      prisma.window.count(),
      prisma.post.count(),
    ]);

    // get one brand summary if present
    const brand = await prisma.brand.findFirst({
      select: { id: true, name: true, website: true },
      orderBy: { createdAt: "asc" },
    });

    return json({
      ok: true,
      dbTime: new Date().toISOString(),
      counts: { brands, pillars, windows, posts },
      brand,
    });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "health failed" }, 500);
  }
}