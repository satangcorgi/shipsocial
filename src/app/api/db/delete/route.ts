import { prisma } from "@/lib/prisma";

function json(data: any, status = 200) {
  const body = JSON.stringify(data, (_k, v) => (typeof v === "bigint" ? Number(v) : v));
  return new Response(body, { status, headers: { "Content-Type": "application/json; charset=utf-8" } });
}

// DELETE /api/db/delete { postId: string }
export async function DELETE(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const postId = String(body?.postId || "").trim();
    if (!postId) return json({ ok: false, error: "postId is required" }, 400);

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, status: true },
    });
    if (!post) return json({ ok: false, error: "post not found" }, 404);
    if (post.status === "PUBLISHED") {
      return json({ ok: false, error: "cannot delete a published post" }, 400);
    }

    await prisma.post.delete({ where: { id: postId } });
    return json({ ok: true });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "delete failed" }, 500);
  }
}