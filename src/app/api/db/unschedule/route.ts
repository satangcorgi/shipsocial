import { prisma } from "@/lib/prisma";

function json(data: any, status = 200) {
  const body = JSON.stringify(data, (_k, v) => (typeof v === "bigint" ? Number(v) : v));
  return new Response(body, {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

// POST /api/db/unschedule
// Body: { postId: string }
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const postId = String(body?.postId || "").trim();
    if (!postId) return json({ ok: false, error: "postId is required" }, 400);

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, status: true },
    });
    if (!post) return json({ ok: false, error: "post not found" }, 404);
    if (post.status !== "SCHEDULED") {
      return json({ ok: false, error: "only SCHEDULED posts can be unscheduled" }, 400);
    }

    const updated = await prisma.post.update({
      where: { id: postId },
      data: { status: "DRAFT", scheduledAt: null },
      select: {
        id: true,
        status: true,
        scheduledAt: true,
        updatedAt: true,
      },
    });

    return json({ ok: true, post: updated });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "unschedule failed" }, 500);
  }
}