import { prisma } from "@/lib/prisma";

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export async function GET() {
  try {
    const brand = await prisma.brand.findFirst({
      select: { id: true, name: true, website: true, palette: true, voiceCard: true },
    });
    if (!brand) return json({ ok: true, brand: null, pillars: [] });

    const pillars = await prisma.pillar.findMany({
      where: { brandId: brand.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true, desc: true },
    });

    return json({ ok: true, brand, pillars });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "failed to load brand" }, 500);
  }
}