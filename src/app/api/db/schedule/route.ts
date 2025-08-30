import { prisma } from "@/lib/prisma";

/** Small JSON helper */
function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

/** DB enum unions */
type StatusDb = "DRAFT" | "SCHEDULED" | "PUBLISHED";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const postId = String(body.postId || "");
    if (!postId) return json({ ok: false, error: "Missing postId" }, 400);

    // Ensure the post exists
    const existing = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, status: true },
    });
    if (!existing) return json({ ok: false, error: "Post not found" }, 404);

    // Simple mock scheduling: +1 hour from now
    const when = new Date(Date.now() + 60 * 60 * 1000);

    const updated = await prisma.post.update({
      where: { id: postId },
      data: {
        status: "SCHEDULED" as StatusDb,
        scheduledAt: when,
      },
      select: {
        id: true,
        platform: true,
        status: true,
        title: true,
        body: true,
        whyNote: true,
        framework: true,
        hashtags: true,
        altText: true,
        pillarId: true,
        scheduledAt: true,
        updatedAt: true,
      },
    });

    return json({ ok: true, post: updated });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "Schedule failed" }, 500);
  }
}