import { prisma } from "@/lib/prisma";

/**
 * Returns aggregate counts for the overview dashboard.
 * - drafts: brand's posts with status DRAFT
 * - scheduled: brand's posts with status SCHEDULED
 * - published7d: brand's posts with status PUBLISHED in last 7 days
 * - pillars: brand's pillars count
 * - windows: brand's posting windows count
 */
export async function GET() {
  try {
    // get the first (only) brand for Phase 1
    const brand = await prisma.brand.findFirst();

    if (!brand) {
      // no brand yet -> all zeros
      return Response.json({
        ok: true,
        stats: { drafts: 0, scheduled: 0, published7d: 0, pillars: 0, windows: 0 },
      });
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [drafts, scheduled, published7d, pillars, windows] = await Promise.all([
      prisma.post.count({ where: { brandId: brand.id, status: "DRAFT" } }),
      prisma.post.count({ where: { brandId: brand.id, status: "SCHEDULED" } }),
      prisma.post.count({
        where: { brandId: brand.id, status: "PUBLISHED", createdAt: { gte: sevenDaysAgo } },
      }),
      prisma.pillar.count({ where: { brandId: brand.id } }),
      prisma.window.count({ where: { brandId: brand.id } }),
    ]);

    return Response.json({
      ok: true,
      stats: { drafts, scheduled, published7d, pillars, windows },
    });
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message || "Stats failed" }, { status: 500 });
  }
}