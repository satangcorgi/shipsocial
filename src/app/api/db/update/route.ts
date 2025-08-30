import { prisma } from "@/lib/prisma";

function json(data: any, status = 200) {
  const body = JSON.stringify(data, (_k, v) => (typeof v === "bigint" ? Number(v) : v));
  return new Response(body, { status, headers: { "Content-Type": "application/json; charset=utf-8" } });
}

// PATCH /api/db/update
// Body: { postId: string, title?: string, body?: string, whyNote?: string, framework?: string, hashtags?: string[], altText?: string }
export async function PATCH(req: Request) {
  try {
    const input = await req.json().catch(() => ({} as any));
    const postId = String(input?.postId || "").trim();
    if (!postId) return json({ ok: false, error: "postId is required" }, 400);

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, status: true },
    });
    if (!post) return json({ ok: false, error: "post not found" }, 404);
    if (post.status !== "DRAFT") return json({ ok: false, error: "only DRAFT posts can be edited" }, 400);

    const patch: any = {};
    if (typeof input.title === "string") patch.title = input.title.slice(0, 200);
    if (typeof input.body === "string") patch.body = input.body.slice(0, 5000);
    if (typeof input.whyNote === "string") patch.whyNote = input.whyNote.slice(0, 300);
    if (typeof input.framework === "string") patch.framework = input.framework.slice(0, 60);
    if (Array.isArray(input.hashtags)) patch.hashtags = input.hashtags.map((s: any) => String(s).slice(0, 50)).slice(0, 8);
    if (typeof input.altText === "string") patch.altText = input.altText.slice(0, 300); // NEW

    if (Object.keys(patch).length === 0) return json({ ok: false, error: "no fields to update" }, 400);

    const updated = await prisma.post.update({
      where: { id: postId },
      data: patch,
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
        updatedAt: true,
      },
    });

    return json({ ok: true, post: updated });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "update failed" }, 500);
  }
}